import * as Yup from 'yup';

export const TASK_CATEGORIES = [
  'WORK', 'PERSONAL', 'LEARNING', 'HEALTH', 'DEEP_WORK', 'SIDE_PROJECT',
];
export const TASK_PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
export const TASK_STATUSES   = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

export const taskSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .required('Title is required'),
  description: Yup.string().max(1000, 'Description too long').optional(),
  category: Yup.string().oneOf(['', ...TASK_CATEGORIES]).optional(),
  priority: Yup.string().oneOf(TASK_PRIORITIES).required('Priority is required'),
  deadline: Yup.string().optional(),
  status: Yup.string().oneOf(TASK_STATUSES).required(),
});

export const TASK_INITIAL_VALUES = {
  title: '',
  description: '',
  category: '',
  priority: 'MEDIUM',
  deadline: '',
  status: 'TODO',
};
