import { Quote } from '../models/index.js';
import { Op } from 'sequelize';

export const findQuoteByDate = (date) => Quote.findOne({ where: { date } });

export const createQuote = (data) => Quote.create(data);

export const findRecentQuotes = (limit = 7) =>
  Quote.findAll({ order: [['date', 'DESC']], limit });
