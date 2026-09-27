export type TransactionType = 'add' | 'minus';

export interface Transaction {
  id: string;
  sno: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  category: string;
  type: TransactionType;
  amount: number;
  notes?: string;
  createdAt: number;
}

export interface TransactionWithBalance extends Transaction {
  runningBalance: number;
}

export interface DailySummary {
  date: string;
  displayDate: string;
  dayOfWeek: string;
  snoRange: string;
  count: number;
  totalAdd: number;
  totalMinus: number;
  netChange: number;
  closingBalance: number;
  transactions: TransactionWithBalance[];
}

export interface BudgetConfig {
  startingBalance: number;
  currencySymbol: string;
  currencyCode: string;
  dailyBudgetLimit: number;
}

export type DateFilterType = 'all' | 'today' | 'yesterday' | '7days' | 'this_month' | 'custom';
export type ViewTab = 'ledger' | 'daily' | 'analytics';
