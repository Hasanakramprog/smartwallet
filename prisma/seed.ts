import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();

  // Create standard categories with modern color palette and lucide icon identifiers
  const categoriesData = [
    { name: 'Housing & Rent', color: '#6366f1', icon: 'Home' }, // indigo
    { name: 'Groceries & Food', color: '#10b981', icon: 'ShoppingCart' }, // emerald
    { name: 'Dining & Drinks', color: '#f59e0b', icon: 'Utensils' }, // amber
    { name: 'Transportation', color: '#3b82f6', icon: 'Car' }, // blue
    { name: 'Utilities & Bills', color: '#8b5cf6', icon: 'Zap' }, // violet
    { name: 'Entertainment & Leisure', color: '#ec4899', icon: 'Film' }, // pink
    { name: 'Health & Wellness', color: '#06b6d4', icon: 'HeartPulse' }, // cyan
    { name: 'Shopping & Apparel', color: '#f97316', icon: 'ShoppingBag' }, // orange
    { name: 'Tech & Software', color: '#14b8a6', icon: 'Laptop' }, // teal
    { name: 'Travel & Vacations', color: '#a855f7', icon: 'Plane' }, // purple
    { name: 'Personal Care', color: '#e11d48', icon: 'Sparkles' }, // rose
    { name: 'Education & Books', color: '#0284c7', icon: 'BookOpen' }, // sky
  ];

  const categoriesMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: cat,
    });
    categoriesMap[cat.name] = created.id;
  }

  console.log(`✅ Created ${Object.keys(categoriesMap).length} categories.`);

  // Generate realistic transactions over the last 60 days
  const now = new Date();
  const daysAgo = (d: number, hours = 12) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    date.setHours(hours, 0, 0, 0);
    return date;
  };

  const sampleTransactions = [
    // Current Month Income
    { type: 'income', amount: 4850.00, date: daysAgo(1), description: 'Bi-Weekly Primary Salary', categoryId: null },
    { type: 'income', amount: 650.00, date: daysAgo(6), description: 'Freelance UI/UX Consultation', categoryId: null },
    { type: 'income', amount: 120.00, date: daysAgo(12), description: 'Dividend Distribution (Index Fund)', categoryId: null },
    { type: 'income', amount: 4850.00, date: daysAgo(15), description: 'Bi-Weekly Primary Salary', categoryId: null },
    { type: 'income', amount: 320.00, date: daysAgo(20), description: 'Sold Old Monitor on Marketplace', categoryId: null },

    // Previous Month Income
    { type: 'income', amount: 4850.00, date: daysAgo(31), description: 'Bi-Weekly Primary Salary', categoryId: null },
    { type: 'income', amount: 780.00, date: daysAgo(37), description: 'Web Development Project Deliverable', categoryId: null },
    { type: 'income', amount: 4850.00, date: daysAgo(46), description: 'Bi-Weekly Primary Salary', categoryId: null },
    { type: 'income', amount: 95.00, date: daysAgo(52), description: 'Cashback Rewards Bonus', categoryId: null },

    // Current Month Expenses
    { type: 'expense', amount: 1850.00, date: daysAgo(3), description: 'Monthly Apartment Rent', categoryId: categoriesMap['Housing & Rent'] },
    { type: 'expense', amount: 142.80, date: daysAgo(1), description: 'Whole Foods Market Weekly Stock', categoryId: categoriesMap['Groceries & Food'] },
    { type: 'expense', amount: 68.50, date: daysAgo(2), description: 'Italian Bistro Dinner with Friends', categoryId: categoriesMap['Dining & Drinks'] },
    { type: 'expense', amount: 45.00, date: daysAgo(4), description: 'Electric & Gas Utility Bill', categoryId: categoriesMap['Utilities & Bills'] },
    { type: 'expense', amount: 52.30, date: daysAgo(5), description: 'Gas Station Fuel Refill', categoryId: categoriesMap['Transportation'] },
    { type: 'expense', amount: 18.99, date: daysAgo(7), description: 'Netflix & Spotify Family Subscriptions', categoryId: categoriesMap['Entertainment & Leisure'] },
    { type: 'expense', amount: 89.40, date: daysAgo(8), description: 'Organic Supermarket Groceries', categoryId: categoriesMap['Groceries & Food'] },
    { type: 'expense', amount: 32.50, date: daysAgo(9), description: 'Sushi Lunch Special', categoryId: categoriesMap['Dining & Drinks'] },
    { type: 'expense', amount: 75.00, date: daysAgo(10), description: 'Monthly Gym Membership', categoryId: categoriesMap['Health & Wellness'] },
    { type: 'expense', amount: 129.99, date: daysAgo(11), description: 'Autumn Running Shoes & Socks', categoryId: categoriesMap['Shopping & Apparel'] },
    { type: 'expense', amount: 24.00, date: daysAgo(13), description: 'Claude & AI Cloud Tool Subscription', categoryId: categoriesMap['Tech & Software'] },
    { type: 'expense', amount: 165.20, date: daysAgo(14), description: 'Trader Joe\'s Bulk Groceries', categoryId: categoriesMap['Groceries & Food'] },
    { type: 'expense', amount: 42.00, date: daysAgo(16), description: 'Uber Ride to Downtown Event', categoryId: categoriesMap['Transportation'] },
    { type: 'expense', amount: 55.00, date: daysAgo(17), description: 'Haircut & Styling', categoryId: categoriesMap['Personal Care'] },
    { type: 'expense', amount: 34.90, date: daysAgo(18), description: 'Design Systems & TypeScript Hardcover', categoryId: categoriesMap['Education & Books'] },
    { type: 'expense', amount: 98.00, date: daysAgo(19), description: 'Cocktail Bar Social Evening', categoryId: categoriesMap['Dining & Drinks'] },
    { type: 'expense', amount: 110.00, date: daysAgo(21), description: 'Fiber Optic High-Speed Internet', categoryId: categoriesMap['Utilities & Bills'] },
    { type: 'expense', amount: 135.60, date: daysAgo(23), description: 'Costco Wholesale Pantry Fill', categoryId: categoriesMap['Groceries & Food'] },
    { type: 'expense', amount: 28.50, date: daysAgo(25), description: 'Specialty Coffee Beans & Pastries', categoryId: categoriesMap['Dining & Drinks'] },

    // Previous Month Expenses
    { type: 'expense', amount: 1850.00, date: daysAgo(33), description: 'Monthly Apartment Rent', categoryId: categoriesMap['Housing & Rent'] },
    { type: 'expense', amount: 175.40, date: daysAgo(32), description: 'Monthly Supermarket Run', categoryId: categoriesMap['Groceries & Food'] },
    { type: 'expense', amount: 115.00, date: daysAgo(35), description: 'Electric & Heating Bill', categoryId: categoriesMap['Utilities & Bills'] },
    { type: 'expense', amount: 410.00, date: daysAgo(38), description: 'Weekend Getaway Boutique Hotel', categoryId: categoriesMap['Travel & Vacations'] },
    { type: 'expense', amount: 75.00, date: daysAgo(40), description: 'Monthly Gym Membership', categoryId: categoriesMap['Health & Wellness'] },
    { type: 'expense', amount: 145.00, date: daysAgo(42), description: 'Seafood Restaurant Dinner', categoryId: categoriesMap['Dining & Drinks'] },
    { type: 'expense', amount: 180.00, date: daysAgo(45), description: 'Winter Jacket & Gloves', categoryId: categoriesMap['Shopping & Apparel'] },
    { type: 'expense', amount: 120.00, date: daysAgo(49), description: 'Dental Cleaning & Checkup Co-pay', categoryId: categoriesMap['Health & Wellness'] },
    { type: 'expense', amount: 155.00, date: daysAgo(54), description: 'Weekly Groceries & Household Essentials', categoryId: categoriesMap['Groceries & Food'] },
    { type: 'expense', amount: 62.00, date: daysAgo(58), description: 'Fuel Refill & Car Wash', categoryId: categoriesMap['Transportation'] },
  ];

  for (const tx of sampleTransactions) {
    await prisma.transaction.create({
      data: tx,
    });
  }

  console.log(`✅ Created ${sampleTransactions.length} initial transactions.`);
  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
