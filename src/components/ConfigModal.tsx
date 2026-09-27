import React, { useState, useRef } from 'react';
import { BudgetConfig, Transaction } from '../types';
import { CURRENCIES } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Check,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onSaveConfig: (newConfig: BudgetConfig) => void;
  onResetToSample: () => void;
  onClearAll: () => void;
  transactions: Transaction[];
  onImportData: (imported: Transaction[], importedConfig?: BudgetConfig) => void;
  onUploadLocalToCloud?: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetToSample,
  onClearAll,
  transactions,
  onImportData,
  onUploadLocalToCloud,
}) => {
  const { user } = useAuth();
  const [startingBalance, setStartingBalance] = useState<string>(config.startingBalance.toString());
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(config.currencyCode);
  const [dailyBudgetLimit, setDailyBudgetLimit] = useState<string>(config.dailyBudgetLimit.toString());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>('');
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const curr = CURRENCIES.find((c) => c.code === selectedCurrencyCode) || CURRENCIES[0];
    const numericStart = parseFloat(startingBalance) || 0;
    const numericLimit = parseFloat(dailyBudgetLimit) || 100;

    onSaveConfig({
      startingBalance: numericStart,
      currencySymbol: curr.symbol,
      currencyCode: curr.code,
      dailyBudgetLimit: numericLimit,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleExportJSON = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      config,
      transactions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledgerday_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.transactions)) {
          onImportData(parsed.transactions, parsed.config);
          onClose();
        } else if (Array.isArray(parsed)) {
          onImportData(parsed);
          onClose();
        } else {
          setImportError('Invalid JSON format: missing transactions array.');
        }
      } catch (err) {
        setImportError('Failed to parse backup file. Please provide valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleManualSync = async () => {
    if (onUploadLocalToCloud) {
      await onUploadLocalToCloud();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Ledger & Cloud Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Cloud Storage Status Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  Firebase Firestore Cloud
                </span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                user
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {user ? 'Cloud Connected' : 'Guest / Local Storage'}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 space-y-0.5 font-mono">
              <div>Project: <strong className="text-slate-700">{firebaseConfig.projectId}</strong></div>
              <div>Database: <span className="text-slate-600 truncate inline-block max-w-xs align-bottom">{firebaseConfig.firestoreDatabaseId}</span></div>
              {user && (
                <div className="text-emerald-700 font-sans font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Logged in as {user.email}</span>
                </div>
              )}
            </div>

            {user && onUploadLocalToCloud && (
              <button
                type="button"
                onClick={handleManualSync}
                className="w-full mt-2 py-1.5 px-3 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {syncSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Synchronized {transactions.length} items to Cloud!</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Push Current Ledger ({transactions.length} items) to Firestore</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Starting Balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Starting / Opening Balance
            </label>
            <p className="text-xs text-slate-500 mb-1.5">
              The initial balance amount on the ledger before the first recorded transaction (#01).
            </p>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-medium">
                {config.currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Currency Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Currency
            </label>
            <select
              value={selectedCurrencyCode}
              onChange={(e) => setSelectedCurrencyCode(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-slate-800 font-medium"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Budget Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Daily Spending Target / Limit
            </label>
            <p className="text-xs text-slate-500 mb-1.5">
              Used to benchmark your daily burn rate.
            </p>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-medium">
                {config.currencySymbol}
              </span>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={dailyBudgetLimit}
                onChange={(e) => setDailyBudgetLimit(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-mono font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>

          {/* Data Backup & Management */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Offline Backup & Restore
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {importError && (
              <p className="text-xs text-rose-600 font-medium">{importError}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset to sample dataset? Your current entries will be replaced.')) {
                    onResetToSample();
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample Data</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all transactions? This cannot be undone.')) {
                    onClearAll();
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
