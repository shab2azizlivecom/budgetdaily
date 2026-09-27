import React from 'react';
import { BudgetConfig } from '../types';
import { formatCurrency } from '../utils/storage';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react';

interface SummaryCardsProps {
  currentBalance: number;
  totalAdd: number;
  totalMinus: number;
  addCount: number;
  minusCount: number;
  config: BudgetConfig;
  onOpenStartingBalanceEdit: () => void;
  nextSno: number;
  uniqueDaysCount: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  currentBalance,
  totalAdd,
  totalMinus,
  addCount,
  minusCount,
  config,
  onOpenStartingBalanceEdit,
  nextSno,
  uniqueDaysCount,
}) => {
  const netChange = totalAdd - totalMinus;
  const isBalancePositive = currentBalance >= 0;
  const dailyAverageSpent = uniqueDaysCount > 0 ? totalMinus / uniqueDaysCount : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Live Running Balance */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Wallet className="w-4 h-4 text-slate-700" />
            <span>Current Balance</span>
          </div>
          <button
            onClick={onOpenStartingBalanceEdit}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5"
            title="Edit Opening/Starting Balance"
          >
            <span>Start: {formatCurrency(config.startingBalance, config.currencySymbol)}</span>
            <Edit2 className="w-2.5 h-2.5 text-slate-400" />
          </button>
        </div>

        <div className="my-1">
          <div
            className={`text-2xl lg:text-3xl font-bold font-mono tabular-nums ${
              isBalancePositive ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(currentBalance, config.currencySymbol)}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
          <span>Ledger S.No: <strong className="font-mono text-slate-700 font-medium">#{String(nextSno - 1).padStart(2, '0')}</strong></span>
          <span className={netChange >= 0 ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
            Net {netChange >= 0 ? '+' : ''}{formatCurrency(netChange, config.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Card 2: Total Added (+) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Total Added (+)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5">
            {addCount} entries
          </span>
        </div>

        <div className="my-1">
          <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            <span>{formatCurrency(totalAdd, config.currencySymbol)}</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Income & Inflows</span>
          <span className="text-slate-600">Credits to budget</span>
        </div>
      </div>

      {/* Card 3: Total Minus (-) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-700">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Total Minus (-)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-rose-50 text-rose-800 border border-rose-200 rounded px-1.5 py-0.5">
            {minusCount} entries
          </span>
        </div>

        <div className="my-1">
          <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-rose-600 flex items-center gap-1">
            <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            <span>{formatCurrency(totalMinus, config.currencySymbol)}</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Expenses & Debits</span>
          <span className="text-slate-600">Spent from budget</span>
        </div>
      </div>

      {/* Card 4: Daily Average & Budget Limit */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <span>Daily Burn Rate</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Across {uniqueDaysCount} {uniqueDaysCount === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div className="my-1">
          <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(dailyAverageSpent, config.currencySymbol)}
            <span className="text-xs font-normal text-slate-500 font-sans ml-1">/day avg</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Daily Limit: <strong>{formatCurrency(config.dailyBudgetLimit, config.currencySymbol)}</strong></span>
          <span className={dailyAverageSpent <= config.dailyBudgetLimit ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
            {dailyAverageSpent <= config.dailyBudgetLimit ? 'Within Target' : 'Above Target'}
          </span>
        </div>
      </div>
    </div>
  );
};
