import { findQuoteByDate, createQuote as repoCreateQuote } from '../repositories/quoteRepository.js';
import db from '../models/index.js';

export const STATIC_QUOTES = [
  {
    content: 'Discipline is the bridge between goals and accomplishment.',
    author: 'Jim Rohn',
    category: 'discipline',
  },
  {
    content: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    category: 'productivity',
  },
  {
    content:
      "You don't rise to the level of your goals. You fall to the level of your systems.",
    author: 'James Clear',
    category: 'systems',
  },
  {
    content: 'Focus on being productive instead of being busy.',
    author: 'Tim Ferriss',
    category: 'productivity',
  },
  {
    content: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
    category: 'learning',
  },
  {
    content:
      "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: 'Dr. Seuss',
    category: 'learning',
  },
  {
    content:
      'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
    category: 'consistency',
  },
  {
    content:
      'We are what we repeatedly do. Excellence, then, is not an act but a habit.',
    author: 'Aristotle',
    category: 'habits',
  },
  {
    content: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'motivation',
  },
  {
    content: "Don't watch the clock; do what it does. Keep going.",
    author: 'Sam Levenson',
    category: 'persistence',
  },
  {
    content: "Hard work beats talent when talent doesn't work hard.",
    author: 'Tim Notke',
    category: 'discipline',
  },
  {
    content:
      'The pain of discipline is far less than the pain of regret.',
    author: 'Sarah Bombell',
    category: 'discipline',
  },
  {
    content: 'Your future is created by what you do today, not tomorrow.',
    author: 'Robert Kiyosaki',
    category: 'productivity',
  },
  {
    content: "It always seems impossible until it's done.",
    author: 'Nelson Mandela',
    category: 'motivation',
  },
  {
    content:
      'The difference between ordinary and extraordinary is that little extra.',
    author: 'Jimmy Johnson',
    category: 'excellence',
  },
  {
    content: 'Motivation is what gets you started. Habit is what keeps you going.',
    author: 'Jim Ryun',
    category: 'habits',
  },
  {
    content: 'Either you run the day, or the day runs you.',
    author: 'Jim Rohn',
    category: 'productivity',
  },
  {
    content:
      'Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.',
    author: 'Paul J. Meyer',
    category: 'productivity',
  },
  {
    content:
      'Small daily improvements are the key to staggering long-term results.',
    author: 'Robin Sharma',
    category: 'consistency',
  },
  {
    content:
      'The successful warrior is the average man, with laser-like focus.',
    author: 'Bruce Lee',
    category: 'focus',
  },
  {
    content: "Take care of your body. It's the only place you have to live.",
    author: 'Jim Rohn',
    category: 'health',
  },
  {
    content: 'Learning never exhausts the mind.',
    author: 'Leonardo da Vinci',
    category: 'learning',
  },
  {
    content: 'Push yourself, because no one else is going to do it for you.',
    author: 'Unknown',
    category: 'motivation',
  },
  {
    content: 'The expert in anything was once a beginner.',
    author: 'Helen Hayes',
    category: 'learning',
  },
  {
    content: "Don't count the days; make the days count.",
    author: 'Muhammad Ali',
    category: 'motivation',
  },
];

const toDateUTC = (d = new Date()) => {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getQuoteOfTheDay = async (req, res, next) => {
  try {
    const today = toDateUTC();

    let quote = await findQuoteByDate(today);

    if (!quote) {
      const picked = pickRandom(STATIC_QUOTES);
      quote = await repoCreateQuote({
        content: picked.content,
        author: picked.author,
        category: picked.category,
        date: today,
      });
    }

    return res.status(200).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

const getTodayQuote = getQuoteOfTheDay;

const getAllQuotes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { count: total, rows: quotes } = await db.Quote.findAndCountAll({
      offset: skip,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: {
        quotes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: skip + limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const addQuote = async (req, res, next) => {
  try {
    const { content, author, category } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'content is required and must be a non-empty string.',
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'content must not exceed 1000 characters.',
      });
    }

    const quote = await repoCreateQuote({
      content: content.trim(),
      author: author?.trim() || null,
      category: category?.trim() || null,
      date: toDateUTC(),
    });

    return res.status(201).json({
      success: true,
      message: 'Quote added successfully.',
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

const getRandomQuote = async (req, res, next) => {
  try {
    const total = await db.Quote.count();

    if (total === 0) {
      const picked = pickRandom(STATIC_QUOTES);
      return res.status(200).json({
        success: true,
        data: { ...picked, id: null, date: null, createdAt: null },
      });
    }

    const skip = Math.floor(Math.random() * total);
    const quotes = await db.Quote.findAll({ offset: skip, limit: 1 });
    const quote = quotes[0] ?? (await db.Quote.findOne({ order: [['id', 'ASC']] }));

    return res.status(200).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

export default { getQuoteOfTheDay, getAllQuotes, addQuote, getRandomQuote };
