export interface InsightItem {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  iconName: string;
  metric?: string;
  actionableTip?: string;
  priority: number;
}

export interface InsightInputData {
  currentPeriod: {
    income: number;
    expenses: number;
    transactionCount: number;
    daysCount: number;
    categoryTotals: {
      id: string;
      name: string;
      color: string;
      amount: number;
    }[];
    largestExpense?: {
      amount: number;
      description?: string | null;
      categoryName?: string;
      date: Date;
    };
  };
  previousPeriod: {
    income: number;
    expenses: number;
    categoryTotals: {
      id: string;
      name: string;
      amount: number;
    }[];
  };
  latestTransactionDate?: Date | null;
  currencySymbol?: string;
}

export function generateInsights(data: InsightInputData): InsightItem[] {
  const insights: InsightItem[] = [];
  const curr = data.currentPeriod;
  const prev = data.previousPeriod;
  const currSymbol = data.currencySymbol || '$';

  // Rule 1: Income vs Expenses & Cash Flow Balance (Deficit / Surplus)
  if (curr.expenses > 0 || curr.income > 0) {
    if (curr.expenses > curr.income && curr.income > 0) {
      const deficit = curr.expenses - curr.income;
      insights.push({
        id: 'spending-deficit',
        type: 'danger',
        title: 'Spending Exceeds Income',
        message: `Your expenses exceed your income by ${currSymbol}${deficit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for this period.`,
        metric: `-${currSymbol}${deficit.toFixed(0)}`,
        iconName: 'AlertTriangle',
        actionableTip: 'Review your non-essential discretionary categories to balance your cash flow.',
        priority: 1,
      });
    } else if (curr.income > 0) {
      const savingsRate = ((curr.income - curr.expenses) / curr.income) * 100;
      const netSavings = curr.income - curr.expenses;

      if (savingsRate >= 30) {
        insights.push({
          id: 'high-savings-rate',
          type: 'success',
          title: 'Strong Savings Rate',
          message: `You are saving ${savingsRate.toFixed(1)}% of your income (${currSymbol}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} surplus).`,
          metric: `${savingsRate.toFixed(0)}% saved`,
          iconName: 'TrendingUp',
          actionableTip: 'Consider allocating a portion of this surplus towards an emergency fund or investments.',
          priority: 3,
        });
      } else if (savingsRate >= 15) {
        insights.push({
          id: 'moderate-savings-rate',
          type: 'info',
          title: 'Healthy Savings Rate',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%, within a healthy personal finance baseline.`,
          metric: `${savingsRate.toFixed(0)}% saved`,
          iconName: 'PiggyBank',
          actionableTip: 'Try aiming for 20% by cutting small recurring subscription costs.',
          priority: 5,
        });
      } else if (savingsRate > 0) {
        insights.push({
          id: 'low-savings-rate',
          type: 'warning',
          title: 'Tight Savings Margin',
          message: `You are saving ${savingsRate.toFixed(1)}% of your income. Your financial buffer is modest.`,
          metric: `${savingsRate.toFixed(0)}% saved`,
          iconName: 'AlertCircle',
          actionableTip: 'Look for one high-impact expense category to reduce this week.',
          priority: 2,
        });
      }
    }
  }

  // Rule 2: Fastest-Growing Expense Category vs Previous Period
  if (prev.categoryTotals.length > 0 && curr.categoryTotals.length > 0) {
    let highestGrowthRate = 0;
    let fastestCategoryName = '';
    let currCatAmount = 0;
    let prevCatAmount = 0;

    for (const currCat of curr.categoryTotals) {
      const prevCat = prev.categoryTotals.find((p) => p.name.toLowerCase() === currCat.name.toLowerCase());
      if (prevCat && prevCat.amount > 30) {
        const growth = ((currCat.amount - prevCat.amount) / prevCat.amount) * 100;
        if (growth > 25 && growth > highestGrowthRate) {
          highestGrowthRate = growth;
          fastestCategoryName = currCat.name;
          currCatAmount = currCat.amount;
          prevCatAmount = prevCat.amount;
        }
      }
    }

    if (highestGrowthRate > 0 && fastestCategoryName) {
      insights.push({
        id: 'fastest-growing-category',
        type: 'warning',
        title: `Spike in ${fastestCategoryName}`,
        message: `Spending in ${fastestCategoryName} surged by +${highestGrowthRate.toFixed(0)}% (${currSymbol}${prevCatAmount.toFixed(0)} ➔ ${currSymbol}${currCatAmount.toFixed(0)}) vs previous period.`,
        metric: `+${highestGrowthRate.toFixed(0)}%`,
        iconName: 'TrendingUp',
        actionableTip: `Check recent ${fastestCategoryName} transactions to see if this was a one-time purchase or ongoing shift.`,
        priority: 2,
      });
    }
  }

  // Rule 3: High Category Concentration (>30% of total expenses)
  if (curr.expenses > 0 && curr.categoryTotals.length > 0) {
    const sortedCats = [...curr.categoryTotals].sort((a, b) => b.amount - a.amount);
    const topCat = sortedCats[0];
    const topPercent = (topCat.amount / curr.expenses) * 100;

    if (topPercent >= 35) {
      insights.push({
        id: 'category-concentration',
        type: topPercent > 50 ? 'warning' : 'info',
        title: `Heavy Spend: ${topCat.name}`,
        message: `${topCat.name} accounts for ${topPercent.toFixed(0)}% of your entire spending (${currSymbol}${topCat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`,
        metric: `${topPercent.toFixed(0)}% of spend`,
        iconName: 'PieChart',
        actionableTip: `Because ${topCat.name} dominates your budget, even small 5-10% efficiencies here will yield huge dollar savings.`,
        priority: 4,
      });
    }
  }

  // Rule 4: Daily Burn Rate & Spending Pace
  if (curr.daysCount > 0 && curr.expenses > 0) {
    const avgDailyExpense = curr.expenses / curr.daysCount;
    const projectedMonthly = avgDailyExpense * 30;

    insights.push({
      id: 'daily-burn-rate',
      type: 'info',
      title: 'Daily Spending Pace',
      message: `You are averaging ${currSymbol}${avgDailyExpense.toFixed(2)} / day. At this pace, monthly expenses project to ~${currSymbol}${projectedMonthly.toFixed(0)}.`,
      metric: `${currSymbol}${avgDailyExpense.toFixed(0)}/day`,
      iconName: 'Zap',
      actionableTip: 'Compare this daily run-rate against your daily earned income baseline.',
      priority: 6,
    });
  }

  // Rule 5: Logging Consistency Reminder
  if (data.latestTransactionDate) {
    const now = new Date();
    const diffMs = now.getTime() - new Date(data.latestTransactionDate).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 4) {
      insights.push({
        id: 'logging-consistency',
        type: 'warning',
        title: 'Activity Reminder',
        message: `No transactions have been logged in the past ${diffDays} days. Keep your records up to date!`,
        metric: `${diffDays}d inactive`,
        iconName: 'Calendar',
        actionableTip: 'Take 60 seconds to log any recent receipts, coffee runs, or cash purchases.',
        priority: 7,
      });
    }
  } else if (curr.transactionCount === 0) {
    insights.push({
      id: 'no-transactions',
      type: 'info',
      title: 'Start Logging Finances',
      message: 'No transactions recorded for this period yet. Add your income and expenses to unlock full insights.',
      iconName: 'PlusCircle',
      actionableTip: 'Click "Add Transaction" in the top bar to record your first entry.',
      priority: 1,
    });
  }

  // Rule 6: High-Ticket Single Transaction
  if (curr.largestExpense && curr.expenses > 0) {
    const singleShare = (curr.largestExpense.amount / curr.expenses) * 100;
    if (singleShare >= 25 && curr.largestExpense.amount >= 200) {
      insights.push({
        id: 'largest-single-expense',
        type: 'info',
        title: 'Largest Single Purchase',
        message: `"${curr.largestExpense.description || curr.largestExpense.categoryName || 'Expense'}" at ${currSymbol}${curr.largestExpense.amount.toFixed(2)} made up ${singleShare.toFixed(0)}% of this period's total spending.`,
        metric: `${currSymbol}${curr.largestExpense.amount.toFixed(0)}`,
        iconName: 'CreditCard',
        priority: 8,
      });
    }
  }

  // Sort by priority ascending (1 = highest urgency)
  return insights.sort((a, b) => a.priority - b.priority);
}
