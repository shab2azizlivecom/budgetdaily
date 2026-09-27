import React, { useState } from 'react';
import { DailySummary, BudgetConfig, TransactionWithBalance } from '../types';
import { formatCurrency } from '../utils/storage';
import { Calendar, ChevronRight, ChevronDown, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';

interface DailyAggregationViewProps {
  dailySummaries: DailySummary[];
  config: BudgetConfig;
  onEditTransaction: (tx: TransactionWithBalance) => void;
  onDeleteTransaction: (id: string) => void;
}

export const DailyAggregationView: React.FC<DailyAggregationViewProps> = ({
  dailySummaries,
  config,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [expandedDates, setExpandedDates] = useState<{ [date: string]: boolean }>({
    // Expand the most recent day by default
    ...(dailySummaries.length > 0 ? { [dailySummaries[0].date]: true } : {}),
  });

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const expandAll = () => {
    const all: { [date: string]: boolean } = {};
    dailySummaries.forEach((d) => (all[d.date] = true));
    setExpandedDates(all);
  };

  const collapseAll = () => {
    setExpandedDates({});
  };

  if (dailySummaries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
        <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <p className="font-semibold text-slate-700">No daily data available</p>
        <p className="text-xs text-slate-500 mt-1">
          Add transactions using the entry bar above to view day-by-day budget groups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header controls for Daily breakdown */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Day-by-Day Budget Breakdown
          </h2>
          <p className="text-xs text-slate-500">
            Aggregate Daily Inflows (Add), Outflows (Minus), and End-of-Day Closing Balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* List of daily summary cards */}
      <div className="space-y-3">
        {dailySummaries.map((day) => {
          const isExpanded = !!expandedDates[day.date];
          const isNetPositive = day.netChange >= 0;

          return (
            <div
              key={day.date}
              className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-all"
            >
              {/* Day Header Accordion Row */}
              <div
                onClick={() => toggleExpand(day.date)}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
              >
                {/* Date & S.No info */}
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-slate-700">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {day.displayDate}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {day.dayOfWeek}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-600">
                        {day.snoRange}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {day.count} {day.count === 1 ? 'transaction' : 'transactions'} recorded
                    </div>
                  </div>
                </div>

                {/* Day Financial Summary Stats */}
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-mono text-xs">
                  {/* Daily Added */}
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans">
                      Daily Add (+)
                    </div>
                    <div className="font-bold text-emerald-700 tabular-nums">
                      {day.totalAdd > 0 ? `+${formatCurrency(day.totalAdd, config.currencySymbol)}` : '—'}
                    </div>
                  </div>

                  {/* Daily Minus */}
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans">
                      Daily Minus (-)
                    </div>
                    <div className="font-bold text-rose-700 tabular-nums">
                      {day.totalMinus > 0 ? `-${formatCurrency(day.totalMinus, config.currencySymbol)}` : '—'}
                    </div>
                  </div>

                  {/* Net Day Change */}
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans">
                      Net Flow
                    </div>
                    <div
                      className={`font-bold tabular-nums ${
                        isNetPositive ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isNetPositive ? '+' : ''}
                      {formatCurrency(day.netChange, config.currencySymbol)}
                    </div>
                  </div>

                  {/* Day Closing Balance */}
                  <div className="text-right border-l border-slate-200 pl-4 sm:pl-6">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">
                      Day-End Balance
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm tabular-nums">
                      {formatCurrency(day.closingBalance, config.currencySymbol)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Transaction Ledger for this Day */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="pb-2 w-14 text-center">S.No</th>
                        <th className="pb-2 w-20">Time</th>
                        <th className="pb-2">Description & Category</th>
                        <th className="pb-2 w-28 text-right">Add (+)</th>
                        <th className="pb-2 w-28 text-right">Minus (-)</th>
                        <th className="pb-2 w-32 text-right">Running Balance</th>
                        <th className="pb-2 w-16 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60">
                      {day.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/80 transition-colors">
                          <td className="py-2.5 text-center font-mono font-bold text-slate-500">
                            #{String(tx.sno).padStart(2, '0')}
                          </td>
                          <td className="py-2.5 font-mono text-slate-500">
                            {tx.time || '—'}
                          </td>
                          <td className="py-2.5">
                            <span className="font-semibold text-slate-800">{tx.title}</span>
                            <span className="text-slate-400 ml-2 text-[11px]">· {tx.category}</span>
                            {tx.notes && (
                              <p className="text-[11px] text-slate-400 italic">{tx.notes}</p>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono font-semibold tabular-nums">
                            {tx.type === 'add' ? (
                              <span className="text-emerald-700">
                                +{formatCurrency(tx.amount, config.currencySymbol)}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono font-semibold tabular-nums">
                            {tx.type === 'minus' ? (
                              <span className="text-rose-700">
                                -{formatCurrency(tx.amount, config.currencySymbol)}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold tabular-nums text-slate-900">
                            {formatCurrency(tx.runningBalance, config.currencySymbol)}
                          </td>
                          <td className="py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditTransaction(tx)}
                                title="Edit"
                                className="p-1 text-slate-400 hover:text-slate-700 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDeleteTransaction(tx.id)}
                                title="Delete"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
