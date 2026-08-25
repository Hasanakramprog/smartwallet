'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { TransactionSchema, TransactionInput, TransactionFilters, TransactionFilterSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

export interface TransactionWithCategory {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetTransactionsResponse {
  transactions: TransactionWithCategory[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  summary: {
    incomeTotal: number;
    expenseTotal: number;
    netBalance: number;
  };
}

export async function getTransactions(rawFilters: Partial<TransactionFilters> = {}): Promise<GetTransactionsResponse> {
  try {
    const filters = TransactionFilterSchema.parse(rawFilters);
    const { type, categoryId, search, startDate, endDate, sortBy, sortOrder, page, limit } = filters;

    const where: Prisma.TransactionWhereInput = {};

    // Filter by type
    if (type && type !== 'all') {
      where.type = type;
    }

    // Filter by category
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Search query on description
    if (search && search.trim().length > 0) {
      where.OR = [
        {
          description: {
            contains: search.trim(),
          },
        },
        {
          category: {
            name: {
              contains: search.trim(),
            },
          },
        },
      ];
    }

    // Total count for pagination
    const totalCount = await prisma.transaction.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const skip = (page - 1) * limit;

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Calculate aggregated summary for filtered set
    const allFilteredForSummary = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        amount: true,
      },
    });

    let incomeTotal = 0;
    let expenseTotal = 0;
    for (const item of allFilteredForSummary) {
      if (item.type === 'income') {
        incomeTotal += item.amount;
      } else {
        expenseTotal += item.amount;
      }
    }

    return {
      transactions: transactions as unknown as TransactionWithCategory[],
      totalCount,
      totalPages,
      currentPage: page,
      summary: {
        incomeTotal,
        expenseTotal,
        netBalance: incomeTotal - expenseTotal,
      },
    };
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return {
      transactions: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      summary: { incomeTotal: 0, expenseTotal: 0, netBalance: 0 },
    };
  }
}

export async function createTransaction(rawData: TransactionInput) {
  try {
    const parsed = TransactionSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid transaction data',
      };
    }

    const { type, amount, date, description, categoryId } = parsed.data;

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount,
        date,
        description: description?.trim() || null,
        categoryId: type === 'expense' ? categoryId : null,
      },
      include: {
        category: true,
      },
    });

    revalidatePath('/transactions');
    revalidatePath('/admin/categories');
    revalidatePath('/');
    return { success: true, transaction };
  } catch (error: any) {
    console.error('Failed to create transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to create transaction',
    };
  }
}

export async function updateTransaction(id: string, rawData: TransactionInput) {
  try {
    const parsed = TransactionSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid transaction data',
      };
    }

    const { type, amount, date, description, categoryId } = parsed.data;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount,
        date,
        description: description?.trim() || null,
        categoryId: type === 'expense' ? categoryId : null,
      },
      include: {
        category: true,
      },
    });

    revalidatePath('/transactions');
    revalidatePath('/admin/categories');
    revalidatePath('/');
    return { success: true, transaction: updated };
  } catch (error: any) {
    console.error('Failed to update transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to update transaction',
    };
  }
}

export async function deleteTransaction(id: string) {
  try {
    await prisma.transaction.delete({
      where: { id },
    });

    revalidatePath('/transactions');
    revalidatePath('/admin/categories');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete transaction',
    };
  }
}

export async function getAllTransactionsForExport(rawFilters: Partial<TransactionFilters> = {}) {
  try {
    const filters = TransactionFilterSchema.parse(rawFilters);
    const { type, categoryId, search, startDate, endDate, sortBy, sortOrder } = filters;

    const where: Prisma.TransactionWhereInput = {};

    if (type && type !== 'all') {
      where.type = type;
    }
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }
    if (search && search.trim().length > 0) {
      where.OR = [
        { description: { contains: search.trim() } },
        { category: { name: { contains: search.trim() } } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      type: t.type,
      amount: t.amount,
      category: t.category?.name || (t.type === 'income' ? 'Income' : 'Uncategorized'),
      description: t.description || '',
    }));
  } catch (error) {
    console.error('Failed to export transactions:', error);
    return [];
  }
}
