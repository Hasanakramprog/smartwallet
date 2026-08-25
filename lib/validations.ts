import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Name must be 50 characters or less'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color (e.g. #3b82f6)'),
  icon: z.string().min(1, 'Icon is required').default('Tag'),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

export const TransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.coerce.date(),
  description: z.string().trim().max(255, 'Description cannot exceed 255 characters').optional().nullable(),
  categoryId: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.type === 'expense') {
      return !!data.categoryId && data.categoryId.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Category is required for expense transactions',
    path: ['categoryId'],
  }
);

export type TransactionInput = z.infer<typeof TransactionSchema>;

export const TransactionFilterSchema = z.object({
  type: z.enum(['all', 'income', 'expense']).optional().default('all'),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type TransactionFilters = z.infer<typeof TransactionFilterSchema>;
