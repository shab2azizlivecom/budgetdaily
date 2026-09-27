import React from 'react';
import { ViewTab } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Table,
  CalendarDays,
  BarChart3,
  Settings,
  Download,
  Printer,
  Cloud,
  LogOut,
  LogIn,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenSettings: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  totalTransactionsCount: number;
  isCloudSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onExportCSV,
  onPrint,
  totalTransactionsCount,
  isCloudSyncing,
}) => {
  const { user, loading: authLoading, login, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
              LD
            </div>
            <div>
              <a href="#" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 hover:text-slate-700">
                LedgerDay
              </a>
              <span className="hidden xl:inline-block text-xs text-slate-500 ml-2">
                Daily Budget & Balance
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Segmented View Control */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100 rounded-lg text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-4 h-4 text-slate-500" />
              <span>Ledger Sheet</span>
              <span className="text-[11px] font-mono text-slate-400">
                ({totalTransactionsCount})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span>Daily Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>Cashflow & Trends</span>
            </button>
          </nav>

          {/* Zone 3: Cloud Sync & User Auth / Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Export & Print */}
            <button
              onClick={onExportCSV}
              title="Export ledger to CSV"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Export</span>
            </button>

            <button
              onClick={onPrint}
              title="Print financial statement"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenSettings}
              title="Budget & Balance Settings"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Cloud User Profile or Sign In with Google */}
            {!authLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                    <div className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}

                      <div className="hidden sm:block text-left">
                        <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                          {user.displayName || user.email}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Firestore Cloud</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={logout}
                      title="Sign Out"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={login}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all active:scale-[0.98]"
                    title="Sign in with Google to sync transactions to Firebase Firestore"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              activeTab === 'ledger'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              activeTab === 'daily'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Daily</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              activeTab === 'analytics'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>
    </header>
  );
};
