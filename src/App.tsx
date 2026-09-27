/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Transaction,
  TransactionWithBalance,
  BudgetConfig,
  ViewTab,
  TransactionType,
} from './types';
import {
  loadTransactions,
  saveTransactions,
  loadConfig,
  saveConfig,
  computeRunningBalances,
  computeDailySummaries,
  exportToCSV,
  DEFAULT_CONFIG,
  INITIAL_SAMPLE_TRANSACTIONS,
  formatCurrency,
} from './utils/storage';
import { useAuth } from './context/AuthContext';
import {
  subscribeToTransactions,
  subscribeToBudgetConfig,
  saveTransactionToCloud,
  deleteTransactionFromCloud,
  saveBudgetConfigToCloud,
  uploadLocalTransactionsToCloud,
} from './services/budgetFirestore';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { QuickEntryBar } from './components/QuickEntryBar';
import { LedgerTable } from './components/LedgerTable';
import { DailyAggregationView } from './components/DailyAggregationView';
import { BudgetAnalytics } from './components/BudgetAnalytics';
import { EditTransactionModal } from './components/EditTransactionModal';
import { ConfigModal } from './components/ConfigModal';
import { Cloud, Check, AlertCircle, X, ArrowUpRight, LogIn } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading, login } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [config, setConfig] = useState<BudgetConfig>(() => loadConfig());
  const [activeTab, setActiveTab] = useState<ViewTab>('ledger');
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithBalance | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [showSyncBanner, setShowSyncBanner] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Firestore real-time listener for authenticated users
  useEffect(() => {
    if (!user) {
      // Revert / load local storage if logged out
      const local = loadTransactions();
      setTransactions(local);
      const localCfg = loadConfig();
      setConfig(localCfg);
      return;
    }

    setIsCloudSyncing(true);

    // Subscribe to transactions
    const unsubTxs = subscribeToTransactions(
      user.uid,
      (cloudTxs) => {
        setIsCloudSyncing(false);
        if (cloudTxs.length > 0) {
          setTransactions(cloudTxs);
          saveTransactions(cloudTxs);
        } else {
          // Cloud collection is empty: check if we have local entries to offer migration
          const localTxs = loadTransactions();
          if (localTxs.length > 0 && !bannerDismissed) {
            setShowSyncBanner(true);
          }
        }
      },
      (error) => {
        setIsCloudSyncing(false);
        console.error('Firestore subscription error:', error);
        setCloudError('Cloud sync error. Changes will persist locally.');
      }
    );

    // Subscribe to budget config
    const unsubConfig = subscribeToBudgetConfig(user.uid, (cloudConfig) => {
      setConfig(cloudConfig);
      saveConfig(cloudConfig);
    });

    return () => {
      unsubTxs();
      unsubConfig();
    };
  }, [user, bannerDismissed]);

  // Sync to local storage for offline redundancy
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Compute live continuous running balances in chronological sequence
  const transactionsWithBalance = useMemo(() => {
    return computeRunningBalances(transactions, config.startingBalance);
  }, [transactions, config.startingBalance]);

  // Compute daily summaries
  const dailySummaries = useMemo(() => {
    return computeDailySummaries(transactionsWithBalance);
  }, [transactionsWithBalance]);

  // Metric derivations
  const totalAdd = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'add')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalMinus = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'minus')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const addCount = useMemo(() => transactions.filter((t) => t.type === 'add').length, [transactions]);
  const minusCount = useMemo(() => transactions.filter((t) => t.type === 'minus').length, [transactions]);

  const currentBalance = useMemo(() => {
    if (transactionsWithBalance.length === 0) {
      return config.startingBalance;
    }
    return transactionsWithBalance[transactionsWithBalance.length - 1].runningBalance;
  }, [transactionsWithBalance, config.startingBalance]);

  const nextSno = useMemo(() => {
    return transactions.length + 1;
  }, [transactions]);

  const uniqueDaysCount = useMemo(() => {
    return new Set(transactions.map((t) => t.date)).size || 1;
  }, [transactions]);

  // Handle adding new transaction
  const handleAddTransaction = async (data: {
    date: string;
    time: string;
    title: string;
    category: string;
    type: TransactionType;
    amount: number;
    notes?: string;
  }) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sno: transactions.length + 1,
      createdAt: Date.now(),
      ...data,
    };

    // Optimistic local update
    setTransactions((prev) => [...prev, newTx]);

    // Cloud sync if authenticated
    if (user) {
      try {
        await saveTransactionToCloud(user.uid, newTx);
      } catch (err) {
        console.error('Failed to sync transaction to Firestore:', err);
      }
    }
  };

  // Handle updating an existing transaction
  const handleSaveEditedTransaction = async (updated: TransactionWithBalance) => {
    const cleanedTx: Transaction = {
      id: updated.id,
      sno: updated.sno,
      date: updated.date,
      time: updated.time,
      title: updated.title,
      category: updated.category,
      type: updated.type,
      amount: updated.amount,
      notes: updated.notes,
      createdAt: updated.createdAt,
    };

    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? cleanedTx : t))
    );

    if (user) {
      try {
        await saveTransactionToCloud(user.uid, cleanedTx);
      } catch (err) {
        console.error('Failed to update in Firestore:', err);
      }
    }
  };

  // Handle deleting transaction
  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (user) {
      try {
        await deleteTransactionFromCloud(user.uid, id);
      } catch (err) {
        console.error('Failed to delete from Firestore:', err);
      }
    }
  };

  // Duplicate transaction
  const handleDuplicateTransaction = async (tx: TransactionWithBalance) => {
    const today = new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sno: transactions.length + 1,
      date: tx.date || today,
      time: tx.time,
      title: `${tx.title} (Copy)`,
      category: tx.category,
      type: tx.type,
      amount: tx.amount,
      notes: tx.notes,
      createdAt: Date.now(),
    };

    setTransactions((prev) => [...prev, newTx]);

    if (user) {
      try {
        await saveTransactionToCloud(user.uid, newTx);
      } catch (err) {
        console.error('Failed to sync duplicate to Firestore:', err);
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    exportToCSV(transactionsWithBalance, config);
  };

  // Print ledger report
  const handlePrint = () => {
    window.print();
  };

  // Save budget config (starting balance, limit, currency)
  const handleSaveConfig = async (newConfig: BudgetConfig) => {
    setConfig(newConfig);

    if (user) {
      try {
        await saveBudgetConfigToCloud(user.uid, newConfig);
      } catch (err) {
        console.error('Failed to save config to Firestore:', err);
      }
    }
  };

  // Push local transactions to Firestore
  const handleSyncLocalToCloud = async () => {
    if (!user) return;
    try {
      setIsCloudSyncing(true);
      await uploadLocalTransactionsToCloud(user.uid, transactions);
      await saveBudgetConfigToCloud(user.uid, config);
      setShowSyncBanner(false);
      setSyncMessage(`Successfully synced ${transactions.length} items to Firebase Firestore!`);
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (err) {
      console.error('Sync to cloud error:', err);
      setCloudError('Failed to upload local records to Firestore.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleResetToSample = () => {
    setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
    setConfig(DEFAULT_CONFIG);
  };

  const handleClearAll = async () => {
    setTransactions([]);
    if (user) {
      for (const tx of transactions) {
        await deleteTransactionFromCloud(user.uid, tx.id);
      }
    }
  };

  const handleImportData = (imported: Transaction[], importedConfig?: BudgetConfig) => {
    if (Array.isArray(imported)) {
      setTransactions(imported);
    }
    if (importedConfig) {
      setConfig((prev) => ({ ...prev, ...importedConfig }));
    }
    if (user) {
      uploadLocalTransactionsToCloud(user.uid, imported);
      if (importedConfig) {
        saveBudgetConfigToCloud(user.uid, importedConfig);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsConfigOpen(true)}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        totalTransactionsCount={transactions.length}
        isCloudSyncing={isCloudSyncing}
      />

      {/* Cloud Sync Notifications & Informational Banners */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 no-print space-y-2">
        {/* Success toast */}
        {syncMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
            <button onClick={() => setSyncMessage('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Cloud error alert */}
        {cloudError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{cloudError}</span>
            </div>
            <button onClick={() => setCloudError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Migrate Local Budget to Cloud Banner (when user logs in and cloud is empty) */}
        {user && showSyncBanner && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Sync {transactions.length} local budget entries to Firestore?
                </p>
                <p className="text-[11px] text-slate-500">
                  Your Firestore database for <strong className="text-slate-700">{user.email}</strong> is ready. Upload your current ledger to access it from anywhere.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  setShowSyncBanner(false);
                  setBannerDismissed(true);
                }}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Keep Local Only
              </button>
              <button
                onClick={handleSyncLocalToCloud}
                disabled={isCloudSyncing}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isCloudSyncing ? 'Syncing...' : 'Upload to Cloud'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Unauthenticated Guest Mode Reminder Banner */}
        {!authLoading && !user && (
          <div className="bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>
                <strong>Offline Guest Mode:</strong> Your budget is saved locally in this browser.
              </span>
            </div>

            <button
              onClick={login}
              className="text-xs font-semibold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors self-end sm:self-auto"
            >
              <span>Connect Firebase Firestore via Google</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Printable Report Header (only visible on print) */}
      <div className="hidden print-only p-6 border-b border-slate-300">
        <h1 className="text-xl font-bold">LedgerDay — Daily Budget & Running Balance Statement</h1>
        <p className="text-xs text-slate-600 mt-1">
          Printed on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} · Total Transactions: {transactions.length}
        </p>
        <div className="mt-3 text-xs font-mono grid grid-cols-4 gap-4">
          <div>Starting: {formatCurrency(config.startingBalance, config.currencySymbol)}</div>
          <div>Total Added: +{formatCurrency(totalAdd, config.currencySymbol)}</div>
          <div>Total Minus: -{formatCurrency(totalMinus, config.currencySymbol)}</div>
          <div className="font-bold">Final Balance: {formatCurrency(currentBalance, config.currencySymbol)}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Metric Cards */}
        <section className="no-print">
          <SummaryCards
            currentBalance={currentBalance}
            totalAdd={totalAdd}
            totalMinus={totalMinus}
            addCount={addCount}
            minusCount={minusCount}
            config={config}
            onOpenStartingBalanceEdit={() => setIsConfigOpen(true)}
            nextSno={nextSno}
            uniqueDaysCount={uniqueDaysCount}
          />
        </section>

        {/* Quick Entry Form */}
        <section className="no-print">
          <QuickEntryBar
            onAddTransaction={handleAddTransaction}
            nextSno={nextSno}
            config={config}
          />
        </section>

        {/* Dynamic Views: Ledger Sheet vs Daily Breakdown vs Analytics */}
        <section>
          {activeTab === 'ledger' && (
            <LedgerTable
              transactions={transactionsWithBalance}
              config={config}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
              onDeleteTransaction={handleDeleteTransaction}
              onDuplicateTransaction={handleDuplicateTransaction}
              onClearFilters={() => {}}
            />
          )}

          {activeTab === 'daily' && (
            <DailyAggregationView
              dailySummaries={dailySummaries}
              config={config}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'analytics' && (
            <BudgetAnalytics
              transactions={transactionsWithBalance}
              dailySummaries={dailySummaries}
              config={config}
            />
          )}
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">LedgerDay</span>
            <span>·</span>
            <span>Daily Budget & Sequential Running Balance</span>
          </div>

          <div className="flex items-center gap-4">
            <span>#{transactions.length} total entries</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              <span>{user ? `Cloud synced (${user.email})` : 'Local storage (guest)'}</span>
            </span>
            <span>·</span>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-slate-600 hover:text-slate-900 underline"
            >
              Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleSaveEditedTransaction}
        onDelete={handleDeleteTransaction}
        config={config}
      />

      {/* Settings & Configuration Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onResetToSample={handleResetToSample}
        onClearAll={handleClearAll}
        transactions={transactions}
        onImportData={handleImportData}
        onUploadLocalToCloud={handleSyncLocalToCloud}
      />
    </div>
  );
}
