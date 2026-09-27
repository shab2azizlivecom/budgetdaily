import React, { useState, useEffect } from 'react';
import { TransactionWithBalance, TransactionType, BudgetConfig } from '../types';
import { COMMON_CATEGORIES } from '../utils/storage';
import { X, Check, Trash2, PlusCircle, MinusCircle } from 'lucide-react';

interface EditTransactionModalProps {
  transaction: TransactionWithBalance | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TransactionWithBalance) => void;
  onDelete: (id: string) => void;
  config: BudgetConfig;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
  onDelete,
  config,
}) => {
  const [type, setType] = useState<TransactionType>('minus');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDate(transaction.date);
      setTime(transaction.time || '');
      setAmount(transaction.amount.toString());
      setTitle(transaction.title);
      setCategory(transaction.category);
      setNotes(transaction.notes || '');
      setError('');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const currentCategories = type === 'add' ? COMMON_CATEGORIES.add : COMMON_CATEGORIES.minus;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'add' && !COMMON_CATEGORIES.add.includes(category)) {
      setCategory(COMMON_CATEGORIES.add[0]);
    } else if (newType === 'minus' && !COMMON_CATEGORIES.minus.includes(category)) {
      setCategory(COMMON_CATEGORIES.minus[0]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a description');
      return;
    }

    onSave({
      ...transaction,
      type,
      date,
      time,
      amount: numericAmount,
      title: title.trim(),
      category: category || (type === 'add' ? 'Income' : 'General'),
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
              S.No #{String(transaction.sno).padStart(2, '0')}
            </span>
            <h3 className="font-bold text-slate-900 text-base">Edit Ledger Entry</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('add')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                  type === 'add'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add (Inflow)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('minus')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                  type === 'minus'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                <span>- Minus (Spend)</span>
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Amount ({config.currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-medium">
                {config.currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-slate-800"
            >
              {currentCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Receipt details, reference codes, etc."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete entry #${transaction.sno} "${transaction.title}"?`)) {
                  onDelete(transaction.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
