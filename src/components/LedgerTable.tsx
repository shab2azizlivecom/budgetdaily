import React, { useState, useMemo } from 'react';
import { TransactionWithBalance, DateFilterType, BudgetConfig, Transaction } from '../types';
import { formatCurrency, COMMON_CATEGORIES } from '../utils/storage';
import {
  Search,
  ArrowUpDown,
  Filter,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  ChevronDown,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface LedgerTableProps {
  transactions: TransactionWithBalance[];
  config: BudgetConfig;
  onEditTransaction: (tx: TransactionWithBalance) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction: (tx: TransactionWithBalance) => void;
  onClearFilters: () => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  transactions,
  config,
  onEditTransaction,
  onDeleteTransaction,
  onDuplicateTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'add' | 'minus'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // default latest first

  const todayStr = new Date().toISOString().split('T')[0];

  // Unique categories in existing transactions
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(q);
        const matchesCategory = tx.category.toLowerCase().includes(q);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        const matchesSno = `#${tx.sno}`.includes(q) || String(tx.sno) === q;
        const matchesDate = tx.date.includes(q);
        if (!matchesTitle && !matchesCategory && !matchesNotes && !matchesSno && !matchesDate) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // Date range filter
      if (dateFilter === 'today') {
        if (tx.date !== todayStr) return false;
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        if (tx.date !== yStr) return false;
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenStr = sevenDaysAgo.toISOString().split('T')[0];
        if (tx.date < sevenStr || tx.date > todayStr) return false;
      } else if (dateFilter === 'this_month') {
        const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
        if (!tx.date.startsWith(currentMonthPrefix)) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      return true;
    });
  }, [
    transactions,
    searchQuery,
    typeFilter,
    categoryFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    todayStr,
  ]);

  // Sorted transactions for display
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.sno - b.sno;
      } else {
        return b.sno - a.sno;
      }
    });
  }, [filteredTransactions, sortDirection]);

  // Aggregate totals for the filtered subset
  const filteredTotalAdd = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'add')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const filteredTotalMinus = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'minus')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const latestBalance = useMemo(() => {
    if (filteredTransactions.length === 0) return 0;
    // Get the transaction with the highest S.No in the filtered set
    const highest = filteredTransactions.reduce(
      (prev, curr) => (curr.sno > prev.sno ? curr : prev),
      filteredTransactions[0]
    );
    return highest.runningBalance;
  }, [filteredTransactions]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    dateFilter !== 'all';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Control Bar: Search & Filter Tools */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description, S.No, note, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('add')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  typeFilter === 'add'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Add
              </button>
              <button
                onClick={() => setTypeFilter('minus')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  typeFilter === 'minus'
                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                - Minus
              </button>
            </div>

            {/* Date Preset Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-slate-900 outline-none text-slate-700 font-medium"
            >
              <option value="all">Date: All Time</option>
              <option value="today">Date: Today</option>
              <option value="yesterday">Date: Yesterday</option>
              <option value="7days">Date: Last 7 Days</option>
              <option value="this_month">Date: This Month</option>
              <option value="custom">Date: Custom Range</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-slate-900 outline-none text-slate-700 font-medium max-w-[150px] truncate"
            >
              <option value="all">Category: All</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors text-slate-700"
              title={sortDirection === 'desc' ? 'Newest first (S.No descending)' : 'Oldest first (S.No ascending)'}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortDirection === 'desc' ? 'Latest S.No' : 'Earliest S.No'}</span>
            </button>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1.5 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Selector (if selected) */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded-md"
            />
            <span className="text-xs text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded-md"
            />
          </div>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4 w-16 text-center">S.No</th>
              <th className="py-3 px-4 w-36">Date</th>
              <th className="py-3 px-4">Description & Category</th>
              <th className="py-3 px-4 w-32 text-right">Added (+)</th>
              <th className="py-3 px-4 w-32 text-right">Minus (-)</th>
              <th className="py-3 px-4 w-36 text-right">Balance</th>
              <th className="py-3 px-4 w-24 text-center no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No ledger entries match</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {hasActiveFilters
                        ? 'Try clearing the search query or adjusting your date filters.'
                        : 'No transactions recorded yet. Use the entry bar above to add one.'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedTransactions.map((tx) => {
                const isAdd = tx.type === 'add';
                const formattedDate = new Date(`${tx.date}T00:00:00`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const weekday = new Date(`${tx.date}T00:00:00`).toLocaleDateString('en-US', {
                  weekday: 'short',
                });

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* S.No */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-500 text-xs">
                      #{String(tx.sno).padStart(2, '0')}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{formattedDate}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span>{weekday}</span>
                        {tx.time && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{tx.time}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Description & Category */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{tx.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600">{tx.category}</span>
                        {tx.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400 italic truncate max-w-xs" title={tx.notes}>
                              {tx.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Add (+) */}
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                      {isAdd ? (
                        <span className="text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded">
                          +{formatCurrency(tx.amount, config.currencySymbol)}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    {/* Minus (-) */}
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                      {!isAdd ? (
                        <span className="text-rose-700 bg-rose-50/60 px-2 py-0.5 rounded">
                          -{formatCurrency(tx.amount, config.currencySymbol)}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    {/* Running Balance */}
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      <span
                        className={
                          tx.runningBalance >= 0
                            ? 'text-slate-900'
                            : 'text-rose-600 font-black'
                        }
                      >
                        {formatCurrency(tx.runningBalance, config.currencySymbol)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          title="Edit transaction"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateTransaction(tx)}
                          title="Duplicate transaction"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          title="Delete entry"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          {sortedTransactions.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-bold text-xs text-slate-800">
                <td className="py-3 px-4 text-center font-mono">
                  {sortedTransactions.length}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {hasActiveFilters ? 'Filtered Totals' : 'All-Time Totals'}
                </td>
                <td className="py-3 px-4 text-slate-500 font-normal">
                  {hasActiveFilters
                    ? `Showing ${sortedTransactions.length} of ${transactions.length} entries`
                    : `Complete Ledger Sequence (#01 to #${String(transactions.length).padStart(2, '0')})`}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 tabular-nums">
                  +{formatCurrency(filteredTotalAdd, config.currencySymbol)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-700 tabular-nums">
                  -{formatCurrency(filteredTotalMinus, config.currencySymbol)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-900 tabular-nums font-extrabold">
                  {formatCurrency(latestBalance, config.currencySymbol)}
                </td>
                <td className="py-3 px-4 no-print"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
