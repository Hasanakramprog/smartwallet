'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { CategorySchema, CategoryInput } from '@/lib/validations';

export interface CategoryWithStats {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  transactionCount: number;
  totalSpend: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getCategoriesWithStats(): Promise<CategoryWithStats[]> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => {
      const expenseTxs = cat.transactions.filter((t) => t.type === 'expense');
      const totalSpend = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        transactionCount: cat.transactions.length,
        totalSpend,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });
  } catch (error) {
    console.error('Failed to fetch categories with stats:', error);
    return [];
  }
}

export async function createCategory(rawData: CategoryInput) {
  try {
    const parsed = CategorySchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid category data',
      };
    }

    const { name, color, icon } = parsed.data;

    // Check if name already exists
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      return {
        success: false,
        error: `Category "${name}" already exists.`,
      };
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        icon: icon || 'Tag',
      },
    });

    revalidatePath('/admin/categories');
    revalidatePath('/transactions');
    revalidatePath('/');
    return { success: true, category };
  } catch (error: any) {
    console.error('Failed to create category:', error);
    return {
      success: false,
      error: error.message || 'Failed to create category',
    };
  }
}

export async function updateCategory(id: string, rawData: CategoryInput) {
  try {
    const parsed = CategorySchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid category data',
      };
    }

    const { name, color, icon } = parsed.data;

    // Check if name is taken by another category
    const existing = await prisma.category.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Category "${name}" already exists.`,
      };
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        color,
        icon: icon || 'Tag',
      },
    });

    revalidatePath('/admin/categories');
    revalidatePath('/transactions');
    revalidatePath('/');
    return { success: true, category: updated };
  } catch (error: any) {
    console.error('Failed to update category:', error);
    return {
      success: false,
      error: error.message || 'Failed to update category',
    };
  }
}

export async function deleteCategory(id: string, reassignToId?: string | null) {
  try {
    // Check if category is used by transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      if (!reassignToId) {
        return {
          success: false,
          error: `Cannot delete category: ${transactionCount} transaction(s) are currently assigned to it. Please reassign them first.`,
          hasTransactions: true,
          transactionCount,
        };
      }

      // Reassign transactions to the target category
      await prisma.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignToId },
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath('/admin/categories');
    revalidatePath('/transactions');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete category:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete category',
    };
  }
}
