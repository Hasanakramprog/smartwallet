'use server';

import { prisma } from '@/lib/db';
import { generateInsights, InsightItem } from '@/lib/insights/engine';
import {
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  startOfYear,
  endOfDay,
  startOfDay,
  differenceInCalendarDays,
  format,
  isSameDay,
  isSameMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfWeek,
} from 'date-fns';

export type TimeRangePreset =
  | 'this_month'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_year'
  | 'all_time'
  | 'custom';

export interface DashboardFilterParams {
  timeRange?: TimeRangePreset;
  startDate?: string;
  endDate?: string;
}

export interface TimeSeriesPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DashboardSummary {
  income: number;
  expenses: number;
  netBalance: number;
  savingsRate: number; // percentage
  incomeDelta: number; // percentage change vs prev period
  expenseDelta: number; // percentage change vs prev period
  netDelta: number; // percentage change vs prev period
  transactionCount: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  timeSeries: TimeSeriesPoint[];
  categoryBreakdown: CategoryBreakdownItem[];
  topCategories: CategoryBreakdownItem[];
  insights: InsightItem[];
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    date: Date;
    description: string | null;
    category: {
      name: string;
      color: string;
      icon: string | null;
    } | null;
  }[];
  dateRange: {
    preset: TimeRangePreset;
    startDate: string;
    endDate: string;
    daysCount: number;
  };
}

export async function getDashboardData(params: DashboardFilterParams = {}): Promise<DashboardData> {
  const preset = params.timeRange || 'this_month';
  const now = new Date();

  let start: Date;
  let end: Date = endOfDay(now);

  switch (preset) {
    case 'last_30_days':
      start = startOfDay(subDays(now, 29));
      break;
    case 'last_90_days':
      start = startOfDay(subDays(now, 89));
      break;
    case 'this_year':
      start = startOfYear(now);
      break;
    case 'all_time':
      // Find oldest transaction or default to 1 year ago
      const oldestTx = await prisma.transaction.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true },
      });
      start = oldestTx ? startOfDay(oldestTx.date) : startOfYear(now);
      break;
    case 'custom':
      start = params.startDate ? startOfDay(new Date(params.startDate)) : startOfMonth(now);
      end = params.endDate ? endOfDay(new Date(params.endDate)) : endOfDay(now);
      break;
    case 'this_month':
    default:
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
  }

  const daysCount = Math.max(1, differenceInCalendarDays(end, start) + 1);

  // Compute equivalent previous period for comparison
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, daysCount - 1);

  // 1. Fetch current period transactions
  const currentTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      category: true,
    },
    orderBy: { date: 'asc' },
  });

  // 2. Fetch previous period transactions for delta comparisons
  const prevTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: prevStart,
        lte: prevEnd,
      },
    },
    include: {
      category: true,
    },
  });

  // Summary computations
  let currIncome = 0;
  let currExpense = 0;
  let largestExpenseItem: { amount: number; description?: string | null; categoryName?: string; date: Date } | undefined;

  const currentCategoryMap: Record<string, { id: string; name: string; color: string; icon: string | null; amount: number; count: number }> = {};

  for (const t of currentTransactions) {
    if (t.type === 'income') {
      currIncome += t.amount;
    } else {
      currExpense += t.amount;
      if (!largestExpenseItem || t.amount > largestExpenseItem.amount) {
        largestExpenseItem = {
          amount: t.amount,
          description: t.description,
          categoryName: t.category?.name,
          date: t.date,
        };
      }

      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Uncategorized';
      const catColor = t.category?.color || '#94a3b8';
      const catIcon = t.category?.icon || 'Tag';

      if (!currentCategoryMap[catId]) {
        currentCategoryMap[catId] = {
          id: catId,
          name: catName,
          color: catColor,
          icon: catIcon,
          amount: 0,
          count: 0,
        };
      }
      currentCategoryMap[catId].amount += t.amount;
      currentCategoryMap[catId].count += 1;
    }
  }

  let prevIncome = 0;
  let prevExpense = 0;
  const prevCategoryMap: Record<string, { id: string; name: string; amount: number }> = {};

  for (const t of prevTransactions) {
    if (t.type === 'income') {
      prevIncome += t.amount;
    } else {
      prevExpense += t.amount;
      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Uncategorized';

      if (!prevCategoryMap[catId]) {
        prevCategoryMap[catId] = { id: catId, name: catName, amount: 0 };
      }
      prevCategoryMap[catId].amount += t.amount;
    }
  }

  const currNet = currIncome - currExpense;
  const prevNet = prevIncome - prevExpense;

  const savingsRate = currIncome > 0 ? ((currIncome - currExpense) / currIncome) * 100 : 0;

  const calcDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const incomeDelta = calcDelta(currIncome, prevIncome);
  const expenseDelta = calcDelta(currExpense, prevExpense);
  const netDelta = calcDelta(currNet, prevNet);

  // Category breakdown array sorted descending
  const categoryBreakdown: CategoryBreakdownItem[] = Object.values(currentCategoryMap)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      amount: cat.amount,
      percentage: currExpense > 0 ? (cat.amount / currExpense) * 100 : 0,
      transactionCount: cat.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategories = categoryBreakdown.slice(0, 5);

  // Time-Series chart aggregation
  let timeSeries: TimeSeriesPoint[] = [];

  if (daysCount <= 31) {
    // Daily Granularity
    const days = eachDayOfInterval({ start, end });
    timeSeries = days.map((day) => {
      const dayTxs = currentTransactions.filter((t) => isSameDay(t.date, day));
      let dayIncome = 0;
      let dayExpense = 0;
      for (const t of dayTxs) {
        if (t.type === 'income') dayIncome += t.amount;
        else dayExpense += t.amount;
      }
      return {
        label: format(day, 'MMM d'),
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense,
      };
    });
  } else if (daysCount <= 120) {
    // Weekly Granularity
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    timeSeries = weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekTxs = currentTransactions.filter((t) => t.date >= weekStart && t.date <= weekEnd);
      let wIncome = 0;
      let wExpense = 0;
      for (const t of weekTxs) {
        if (t.type === 'income') wIncome += t.amount;
        else wExpense += t.amount;
      }
      return {
        label: `${format(weekStart, 'MMM d')}`,
        income: wIncome,
        expense: wExpense,
        net: wIncome - wExpense,
      };
    });
  } else {
    // Monthly Granularity
    const months = eachMonthOfInterval({ start, end });
    timeSeries = months.map((m) => {
      const mTxs = currentTransactions.filter((t) => isSameMonth(t.date, m));
      let mIncome = 0;
      let mExpense = 0;
      for (const t of mTxs) {
        if (t.type === 'income') mIncome += t.amount;
        else mExpense += t.amount;
      }
      return {
        label: format(m, 'MMM yyyy'),
        income: mIncome,
        expense: mExpense,
        net: mIncome - mExpense,
      };
    });
  }

  // Get most recent transaction in database for consistency check
  const latestTx = await prisma.transaction.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  // Generate rule-based insights
  const insights = generateInsights({
    currentPeriod: {
      income: currIncome,
      expenses: currExpense,
      transactionCount: currentTransactions.length,
      daysCount,
      categoryTotals: categoryBreakdown.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        amount: c.amount,
      })),
      largestExpense: largestExpenseItem,
    },
    previousPeriod: {
      income: prevIncome,
      expenses: prevExpense,
      categoryTotals: Object.values(prevCategoryMap),
    },
    latestTransactionDate: latestTx?.date,
  });

  // Recent 5 transactions
  const recentTransactions = await prisma.transaction.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: {
      category: {
        select: {
          name: true,
          color: true,
          icon: true,
        },
      },
    },
  });

  return {
    summary: {
      income: currIncome,
      expenses: currExpense,
      netBalance: currNet,
      savingsRate,
      incomeDelta,
      expenseDelta,
      netDelta,
      transactionCount: currentTransactions.length,
    },
    timeSeries,
    categoryBreakdown,
    topCategories,
    insights,
    recentTransactions,
    dateRange: {
      preset,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      daysCount,
    },
  };
}

export async function resetDatabaseWithSeedData() {
  try {
    // Re-seed logic
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();

    const categoriesData = [
      { name: 'Housing & Rent', color: '#6366f1', icon: 'Home' },
      { name: 'Groceries & Food', color: '#10b981', icon: 'ShoppingCart' },
      { name: 'Dining & Drinks', color: '#f59e0b', icon: 'Utensils' },
      { name: 'Transportation', color: '#3b82f6', icon: 'Car' },
      { name: 'Utilities & Bills', color: '#8b5cf6', icon: 'Zap' },
      { name: 'Entertainment & Leisure', color: '#ec4899', icon: 'Film' },
      { name: 'Health & Wellness', color: '#06b6d4', icon: 'HeartPulse' },
      { name: 'Shopping & Apparel', color: '#f97316', icon: 'ShoppingBag' },
      { name: 'Tech & Software', color: '#14b8a6', icon: 'Laptop' },
      { name: 'Travel & Vacations', color: '#a855f7', icon: 'Plane' },
      { name: 'Personal Care', color: '#e11d48', icon: 'Sparkles' },
      { name: 'Education & Books', color: '#0284c7', icon: 'BookOpen' },
    ];

    const categoriesMap: Record<string, string> = {};
    for (const cat of categoriesData) {
      const created = await prisma.category.create({ data: cat });
      categoriesMap[cat.name] = created.id;
    }

    const now = new Date();
    const daysAgo = (d: number, hours = 12) => {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(hours, 0, 0, 0);
      return date;
    };

    const sampleTransactions = [
      { type: 'income', amount: 4850.0, date: daysAgo(1), description: 'Bi-Weekly Primary Salary', categoryId: null },
      { type: 'income', amount: 650.0, date: daysAgo(6), description: 'Freelance UI/UX Consultation', categoryId: null },
      { type: 'income', amount: 120.0, date: daysAgo(12), description: 'Dividend Distribution (Index Fund)', categoryId: null },
      { type: 'income', amount: 4850.0, date: daysAgo(15), description: 'Bi-Weekly Primary Salary', categoryId: null },
      { type: 'income', amount: 320.0, date: daysAgo(20), description: 'Sold Old Monitor on Marketplace', categoryId: null },
      { type: 'income', amount: 4850.0, date: daysAgo(31), description: 'Bi-Weekly Primary Salary', categoryId: null },
      { type: 'income', amount: 780.0, date: daysAgo(37), description: 'Web Development Project Deliverable', categoryId: null },
      { type: 'income', amount: 4850.0, date: daysAgo(46), description: 'Bi-Weekly Primary Salary', categoryId: null },
      { type: 'income', amount: 95.0, date: daysAgo(52), description: 'Cashback Rewards Bonus', categoryId: null },
      { type: 'expense', amount: 1850.0, date: daysAgo(3), description: 'Monthly Apartment Rent', categoryId: categoriesMap['Housing & Rent'] },
      { type: 'expense', amount: 142.8, date: daysAgo(1), description: 'Whole Foods Market Weekly Stock', categoryId: categoriesMap['Groceries & Food'] },
      { type: 'expense', amount: 68.5, date: daysAgo(2), description: 'Italian Bistro Dinner with Friends', categoryId: categoriesMap['Dining & Drinks'] },
      { type: 'expense', amount: 45.0, date: daysAgo(4), description: 'Electric & Gas Utility Bill', categoryId: categoriesMap['Utilities & Bills'] },
      { type: 'expense', amount: 52.3, date: daysAgo(5), description: 'Gas Station Fuel Refill', categoryId: categoriesMap['Transportation'] },
      { type: 'expense', amount: 18.99, date: daysAgo(7), description: 'Netflix & Spotify Family Subscriptions', categoryId: categoriesMap['Entertainment & Leisure'] },
      { type: 'expense', amount: 89.4, date: daysAgo(8), description: 'Organic Supermarket Groceries', categoryId: categoriesMap['Groceries & Food'] },
      { type: 'expense', amount: 32.5, date: daysAgo(9), description: 'Sushi Lunch Special', categoryId: categoriesMap['Dining & Drinks'] },
      { type: 'expense', amount: 75.0, date: daysAgo(10), description: 'Monthly Gym Membership', categoryId: categoriesMap['Health & Wellness'] },
      { type: 'expense', amount: 129.99, date: daysAgo(11), description: 'Autumn Running Shoes & Socks', categoryId: categoriesMap['Shopping & Apparel'] },
      { type: 'expense', amount: 24.0, date: daysAgo(13), description: 'Claude & AI Cloud Tool Subscription', categoryId: categoriesMap['Tech & Software'] },
      { type: 'expense', amount: 165.2, date: daysAgo(14), description: 'Trader Joe\'s Bulk Groceries', categoryId: categoriesMap['Groceries & Food'] },
      { type: 'expense', amount: 42.0, date: daysAgo(16), description: 'Uber Ride to Downtown Event', categoryId: categoriesMap['Transportation'] },
      { type: 'expense', amount: 55.0, date: daysAgo(17), description: 'Haircut & Styling', categoryId: categoriesMap['Personal Care'] },
      { type: 'expense', amount: 34.9, date: daysAgo(18), description: 'Design Systems & TypeScript Hardcover', categoryId: categoriesMap['Education & Books'] },
      { type: 'expense', amount: 98.0, date: daysAgo(19), description: 'Cocktail Bar Social Evening', categoryId: categoriesMap['Dining & Drinks'] },
      { type: 'expense', amount: 110.0, date: daysAgo(21), description: 'Fiber Optic High-Speed Internet', categoryId: categoriesMap['Utilities & Bills'] },
      { type: 'expense', amount: 135.6, date: daysAgo(23), description: 'Costco Wholesale Pantry Fill', categoryId: categoriesMap['Groceries & Food'] },
      { type: 'expense', amount: 28.5, date: daysAgo(25), description: 'Specialty Coffee Beans & Pastries', categoryId: categoriesMap['Dining & Drinks'] },
      { type: 'expense', amount: 1850.0, date: daysAgo(33), description: 'Monthly Apartment Rent', categoryId: categoriesMap['Housing & Rent'] },
      { type: 'expense', amount: 175.4, date: daysAgo(32), description: 'Monthly Supermarket Run', categoryId: categoriesMap['Groceries & Food'] },
      { type: 'expense', amount: 115.0, date: daysAgo(35), description: 'Electric & Heating Bill', categoryId: categoriesMap['Utilities & Bills'] },
      { type: 'expense', amount: 410.0, date: daysAgo(38), description: 'Weekend Getaway Boutique Hotel', categoryId: categoriesMap['Travel & Vacations'] },
      { type: 'expense', amount: 75.0, date: daysAgo(40), description: 'Monthly Gym Membership', categoryId: categoriesMap['Health & Wellness'] },
      { type: 'expense', amount: 145.0, date: daysAgo(42), description: 'Seafood Restaurant Dinner', categoryId: categoriesMap['Dining & Drinks'] },
      { type: 'expense', amount: 180.0, date: daysAgo(45), description: 'Winter Jacket & Gloves', categoryId: categoriesMap['Shopping & Apparel'] },
      { type: 'expense', amount: 120.0, date: daysAgo(49), description: 'Dental Cleaning & Checkup Co-pay', categoryId: categoriesMap['Health & Wellness'] },
      { type: 'expense', amount: 155.0, date: daysAgo(54), description: 'Weekly Groceries & Household Essentials', categoryId: categoriesMap['Groceries & Food'] },
      { type: 'expense', amount: 62.0, date: daysAgo(58), description: 'Fuel Refill & Car Wash', categoryId: categoriesMap['Transportation'] },
    ];

    for (const tx of sampleTransactions) {
      await prisma.transaction.create({ data: tx });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to reset database:', error);
    return { success: false, error: error.message };
  }
}

export async function clearAllData() {
  try {
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
    return { success: true };
  } catch (error: any) {
    console.error('Failed to clear data:', error);
    return { success: false, error: error.message };
  }
}

