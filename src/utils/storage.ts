import { Transaction, TransactionWithBalance, BudgetConfig, DailySummary } from '../types';

const STORAGE_KEY_TRANSACTIONS = 'ledgerday_transactions_v1';
const STORAGE_KEY_CONFIG = 'ledgerday_config_v1';

export const DEFAULT_CONFIG: BudgetConfig = {
  startingBalance: 1200.0,
  currencySymbol: '$',
  currencyCode: 'USD',
  dailyBudgetLimit: 150.0,
};

export const COMMON_CATEGORIES = {
  add: ['Salary', 'Freelance', 'Investment', 'Refund', 'Gift', 'Cash Deposit', 'Other Income'],
  minus: [
    'Groceries',
    'Food & Dining',
    'Transportation',
    'Utilities',
    'Housing / Rent',
    'Shopping',
    'Healthcare',
    'Entertainment',
    'Subscription',
    'Education',
    'Personal Care',
    'Miscellaneous',
  ],
};

export const CURRENCIES = [
  { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen (¥)' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' },
  { symbol: '₨', code: 'PKR', name: 'Pakistani Rupee (₨)' },
  { symbol: 'AED', code: 'AED', name: 'UAE Dirham (AED)' },
  { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar (S$)' },
];

export const INITIAL_SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    sno: 1,
    date: '2026-09-22',
    time: '08:30',
    title: 'Opening Monthly Budget Deposit',
    category: 'Salary',
    type: 'add',
    amount: 1500.0,
    notes: 'Direct deposit bi-weekly allocation',
    createdAt: 1790074200000,
  },
  {
    id: 'tx-2',
    sno: 2,
    date: '2026-09-22',
    time: '12:15',
    title: 'Supermarket Weekly Pantry Restock',
    category: 'Groceries',
    type: 'minus',
    amount: 142.8,
    notes: 'Fresh veggies, dairy, grains',
    createdAt: 1790087700000,
  },
  {
    id: 'tx-3',
    sno: 3,
    date: '2026-09-22',
    time: '18:40',
    title: 'Vehicle Fuel Fill-up',
    category: 'Transportation',
    type: 'minus',
    amount: 55.0,
    notes: 'Shell Station pump 4',
    createdAt: 1790110800000,
  },
  {
    id: 'tx-4',
    sno: 4,
    date: '2026-09-23',
    time: '09:00',
    title: 'Client Web Design Milestone',
    category: 'Freelance',
    type: 'add',
    amount: 450.0,
    notes: 'Invoice #1042 received',
    createdAt: 1790162400000,
  },
  {
    id: 'tx-5',
    sno: 5,
    date: '2026-09-23',
    time: '13:20',
    title: 'Team Working Lunch',
    category: 'Food & Dining',
    type: 'minus',
    amount: 28.5,
    notes: 'Bistro salad & beverage',
    createdAt: 1790178000000,
  },
  {
    id: 'tx-6',
    sno: 6,
    date: '2026-09-23',
    time: '20:10',
    title: 'Internet & Fiber Broadband Bill',
    category: 'Utilities',
    type: 'minus',
    amount: 69.99,
    notes: 'Monthly high-speed subscription',
    createdAt: 1790202600000,
  },
  {
    id: 'tx-7',
    sno: 7,
    date: '2026-09-24',
    time: '10:15',
    title: 'E-commerce Store Cashback Refund',
    category: 'Refund',
    type: 'add',
    amount: 34.25,
    notes: 'Returned monitor stand',
    createdAt: 1790253300000,
  },
  {
    id: 'tx-8',
    sno: 8,
    date: '2026-09-24',
    time: '16:45',
    title: 'Office Stationery & Printer Ink',
    category: 'Shopping',
    type: 'minus',
    amount: 48.6,
    notes: 'Receipt retained for tax',
    createdAt: 1790276700000,
  },
  {
    id: 'tx-9',
    sno: 9,
    date: '2026-09-25',
    time: '11:00',
    title: 'Pharmacy Vitamins & Supplements',
    category: 'Healthcare',
    type: 'minus',
    amount: 32.4,
    notes: 'Monthly wellness care',
    createdAt: 1790342400000,
  },
  {
    id: 'tx-10',
    sno: 10,
    date: '2026-09-25',
    time: '19:30',
    title: 'Weekend Cinema Tickets',
    category: 'Entertainment',
    type: 'minus',
    amount: 24.0,
    notes: 'Evening screening',
    createdAt: 1790373000000,
  },
  {
    id: 'tx-11',
    sno: 11,
    date: '2026-09-26',
    time: '08:45',
    title: 'Consulting Retainer Payment',
    category: 'Freelance',
    type: 'add',
    amount: 300.0,
    notes: 'Weekly retainer payout',
    createdAt: 1790420700000,
  },
  {
    id: 'tx-12',
    sno: 12,
    date: '2026-09-26',
    time: '14:15',
    title: 'Farmer Market Fresh Produce',
    category: 'Groceries',
    type: 'minus',
    amount: 36.5,
    notes: 'Apples, greens, artisanal bread',
    createdAt: 1790440500000,
  },
];

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (!raw) {
      saveTransactions(INITIAL_SAMPLE_TRANSACTIONS);
      return INITIAL_SAMPLE_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_TRANSACTIONS;
  } catch (err) {
    console.error('Failed to load transactions:', err);
    return INITIAL_SAMPLE_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

export function loadConfig(): BudgetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) {
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    console.error('Failed to load config:', err);
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: BudgetConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

/**
 * Computes running balance across all transactions.
 * Transactions must be calculated in chronological sequence (date -> time -> sno).
 */
export function computeRunningBalances(
  transactions: Transaction[],
  startingBalance: number
): TransactionWithBalance[] {
  // Sort strictly in chronological ascending order
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.time && b.time && a.time !== b.time) {
      return a.time.localeCompare(b.time);
    }
    return (a.sno ?? 0) - (b.sno ?? 0);
  });

  let currentBalance = startingBalance;

  return sorted.map((tx, index) => {
    const assignedSno = index + 1;
    if (tx.type === 'add') {
      currentBalance += tx.amount;
    } else {
      currentBalance -= tx.amount;
    }

    return {
      ...tx,
      sno: assignedSno,
      runningBalance: Math.round(currentBalance * 100) / 100,
    };
  });
}

/**
 * Groups transactions by date for Daily Breakdown view.
 */
export function computeDailySummaries(
  transactionsWithBalance: TransactionWithBalance[]
): DailySummary[] {
  const groups: { [date: string]: TransactionWithBalance[] } = {};

  transactionsWithBalance.forEach((tx) => {
    if (!groups[tx.date]) {
      groups[tx.date] = [];
    }
    groups[tx.date].push(tx);
  });

  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // Newest date first

  return dates.map((dateStr) => {
    const txs = groups[dateStr].sort((a, b) => a.sno - b.sno);
    const totalAdd = txs.filter((t) => t.type === 'add').reduce((sum, t) => sum + t.amount, 0);
    const totalMinus = txs.filter((t) => t.type === 'minus').reduce((sum, t) => sum + t.amount, 0);
    const netChange = totalAdd - totalMinus;
    const closingBalance = txs[txs.length - 1].runningBalance;

    const minSno = txs[0].sno;
    const maxSno = txs[txs.length - 1].sno;
    const snoRange = minSno === maxSno ? `#${String(minSno).padStart(2, '0')}` : `#${String(minSno).padStart(2, '0')} – #${String(maxSno).padStart(2, '0')}`;

    // Format display date
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      date: dateStr,
      displayDate,
      dayOfWeek,
      snoRange,
      count: txs.length,
      totalAdd: Math.round(totalAdd * 100) / 100,
      totalMinus: Math.round(totalMinus * 100) / 100,
      netChange: Math.round(netChange * 100) / 100,
      closingBalance,
      transactions: txs,
    };
  });
}

/**
 * Format currency with symbol and 2 decimals
 */
export function formatCurrency(amount: number, symbol: string = '$'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${absVal}`;
}

/**
 * Export transactions to CSV format
 */
export function exportToCSV(transactions: TransactionWithBalance[], config: BudgetConfig): void {
  const headers = [
    'S.No',
    'Date',
    'Time',
    'Description',
    'Category',
    'Type',
    'Added (+)',
    'Minus (-)',
    'Running Balance',
    'Notes',
  ];

  const rows = transactions.map((tx) => [
    `"${tx.sno}"`,
    `"${tx.date}"`,
    `"${tx.time || ''}"`,
    `"${(tx.title || '').replace(/"/g, '""')}"`,
    `"${tx.category || ''}"`,
    `"${tx.type.toUpperCase()}"`,
    `"${tx.type === 'add' ? tx.amount.toFixed(2) : '0.00'}"`,
    `"${tx.type === 'minus' ? tx.amount.toFixed(2) : '0.00'}"`,
    `"${tx.runningBalance.toFixed(2)}"`,
    `"${(tx.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Daily_Budget_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
