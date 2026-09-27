import React, { useState } from 'react';
import { TransactionType, BudgetConfig } from '../types';
import { COMMON_CATEGORIES } from '../utils/storage';
import { PlusCircle, MinusCircle, Check, Sparkles, Tag, FileText } from 'lucide-react';

interface QuickEntryBarProps {
  onAddTransaction: (data: {
    date: string;
    time: string;
    title: string;
    category: string;
    type: TransactionType;
    amount: number;
    notes?: string;
  }) => void;
  nextSno: number;
  config: BudgetConfig;
}

export const QuickEntryBar: React.FC<QuickEntryBarProps> = ({
  onAddTransaction,
  nextSno,
  config,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().substring(0, 5);

  const [type, setType] = useState<TransactionType>('minus'); // default minus since daily spending is common
  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState<string>(currentTime);
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>(COMMON_CATEGORIES.minus[0]);
  const [notes, setNotes] = useState<string>('');
  const [showNotesField, setShowNotesField] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successFlash, setSuccessFlash] = useState<boolean>(false);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'add') {
      setCategory(COMMON_CATEGORIES.add[0]);
    } else {
      setCategory(COMMON_CATEGORIES.minus[0]);
    }
  };

  const handleQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a description for this budget item');
      return;
    }

    onAddTransaction({
      date: date || today,
      time: time || currentTime,
      title: title.trim(),
      category: category || (type === 'add' ? 'Income' : 'General'),
      type,
      amount: numericAmount,
      notes: notes.trim() || undefined,
    });

    // Reset fields for rapid consecutive entries
    setAmount('');
    setTitle('');
    setNotes('');
    setShowNotesField(false);
    setSuccessFlash(true);
    setTimeout(() => setSuccessFlash(false), 1500);
  };

  const currentCategories = type === 'add' ? COMMON_CATEGORIES.add : COMMON_CATEGORIES.minus;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-900 text-white">
            S.No #{String(nextSno).padStart(2, '0')}
          </div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Record Daily Budget Entry
          </h2>
          {successFlash && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Entry recorded!
            </span>
          )}
        </div>

        {/* Action Type Toggle: + Add (Income) vs - Minus (Expense) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => handleTypeChange('add')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              type === 'add'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add (Inflow)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('minus')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              type === 'minus'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>- Minus (Spend)</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Date Field */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Date & Time
            </label>
            <div className="grid grid-cols-3 gap-1">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="col-span-2 w-full text-xs font-mono px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs font-mono px-1.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                title="Time of transaction"
              />
            </div>
          </div>

          {/* Amount Field */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                {type === 'add' ? 'Amount to Add (+)' : 'Amount to Minus (-)'}
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono font-medium text-sm">
                {config.currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-sm font-mono font-semibold tabular-nums border rounded-lg focus:ring-2 outline-none transition-all ${
                  type === 'add'
                    ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 focus:ring-emerald-500'
                    : 'border-rose-300 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
                }`}
              />
            </div>
          </div>

          {/* Title / Description */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Description / Payee
            </label>
            <input
              type="text"
              required
              placeholder={type === 'add' ? 'e.g., Client Payment, Salary, Cashback' : 'e.g., Lunch, Groceries, Metro Card'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-700"
            >
              {currentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Amount presets & optional note toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Quick add:</span>
            {[10, 25, 50, 100, 250].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                +{val}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowNotesField(!showNotesField)}
              className="text-[11px] text-slate-500 hover:text-slate-800 ml-2 inline-flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{showNotesField ? 'Hide Notes' : '+ Add Note'}</span>
            </button>
          </div>

          <button
            type="submit"
            className={`px-5 py-2 text-xs font-bold rounded-lg text-white shadow-xs transition-all flex items-center gap-1.5 ${
              type === 'add'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
                : 'bg-rose-600 hover:bg-rose-700 active:scale-[0.98]'
            }`}
          >
            {type === 'add' ? (
              <>
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record + Add</span>
              </>
            ) : (
              <>
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Record - Minus</span>
              </>
            )}
          </button>
        </div>

        {/* Optional Notes expander */}
        {showNotesField && (
          <div className="pt-2">
            <input
              type="text"
              placeholder="Optional notes, receipt code, or transaction details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        )}
      </form>
    </div>
  );
};
