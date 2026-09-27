import React, { useState } from 'react';
import { TransactionWithBalance, DailySummary, BudgetConfig } from '../types';
import { formatCurrency } from '../utils/storage';
import { BarChart3, TrendingUp, PieChart, Calendar, DollarSign } from 'lucide-react';

interface BudgetAnalyticsProps {
  transactions: TransactionWithBalance[];
  dailySummaries: DailySummary[];
  config: BudgetConfig;
}

export const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({
  transactions,
  dailySummaries,
  config,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    sno: number;
    title: string;
    date: string;
    balance: number;
    x: number;
    y: number;
  } | null>(null);

  // Chronological order for trend line
  const chronological = [...transactions].sort((a, b) => a.sno - b.sno);

  // SVG Chart Geometry
  const svgWidth = 800;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 60 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const balances = chronological.map((t) => t.runningBalance);
  const minBalance = Math.min(0, ...balances);
  const maxBalance = Math.max(config.startingBalance, ...balances, 100);
  const balanceRange = maxBalance - minBalance || 1;

  const points = chronological.map((t, idx) => {
    const x =
      padding.left +
      (chronological.length > 1
        ? (idx / (chronological.length - 1)) * graphWidth
        : graphWidth / 2);
    const y =
      padding.top +
      graphHeight -
      ((t.runningBalance - minBalance) / balanceRange) * graphHeight;
    return { x, y, tx: t };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`
    : '';

  // Category breakdown for Minuses (Expenses)
  const expenseByCategory: { [cat: string]: number } = {};
  transactions
    .filter((t) => t.type === 'minus')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const totalExpense = Object.values(expenseByCategory).reduce((a, b) => a + b, 0) || 1;
  const sortedExpenses = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  // Category breakdown for Adds (Income)
  const incomeByCategory: { [cat: string]: number } = {};
  transactions
    .filter((t) => t.type === 'add')
    .forEach((t) => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    });
  const sortedIncome = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);

  // Max daily amount for bar scaling (latest 10 days)
  const recentDays = [...dailySummaries].slice(0, 10).reverse();
  const maxDayAmount = Math.max(
    ...recentDays.map((d) => Math.max(d.totalAdd, d.totalMinus)),
    50
  );

  return (
    <div className="space-y-6">
      {/* Chart 1: Continuous Running Balance Trajectory */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <span>Running Balance Trajectory (S.No Sequence)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Visualizes budget balance movement across all #{String(chronological.length).padStart(2, '0')} recorded transactions.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
            Min: {formatCurrency(minBalance, config.currencySymbol)} · Max: {formatCurrency(maxBalance, config.currencySymbol)}
          </div>
        </div>

        {chronological.length < 2 ? (
          <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
            Add at least 2 transactions to render the balance trajectory line.
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 select-none"
            >
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const yVal = padding.top + graphHeight * (1 - ratio);
                const labelVal = minBalance + balanceRange * ratio;
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={yVal}
                      x2={svgWidth - padding.right}
                      y2={yVal}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left - 8}
                      y={yVal + 3}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400"
                    >
                      {formatCurrency(labelVal, config.currencySymbol)}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              <path d={areaD} fill="url(#balanceGrad)" />

              {/* Main Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points */}
              {points.map((p) => (
                <circle
                  key={p.tx.id}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.sno === p.tx.sno ? 6 : 3.5}
                  className={`transition-all cursor-pointer ${
                    p.tx.type === 'add'
                      ? 'fill-emerald-500 stroke-white'
                      : 'fill-rose-500 stroke-white'
                  }`}
                  strokeWidth="2"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      sno: p.tx.sno,
                      title: p.tx.title,
                      date: p.tx.date,
                      balance: p.tx.runningBalance,
                      x: p.x,
                      y: p.y,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none bg-slate-900 text-white rounded-lg p-2 text-xs shadow-lg transform -translate-x-1/2 -translate-y-full mb-2 z-10 font-mono"
                style={{
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                }}
              >
                <div className="font-bold text-emerald-400">
                  #{hoveredPoint.sno} · {formatCurrency(hoveredPoint.balance, config.currencySymbol)}
                </div>
                <div className="text-[11px] text-slate-300 font-sans truncate max-w-[160px]">
                  {hoveredPoint.title}
                </div>
                <div className="text-[10px] text-slate-400">{hoveredPoint.date}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid: Daily Comparison Bars & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cashflow (Add vs Minus) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                <span>Daily Budget Cashflow (Add vs Minus)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Recent daily inflow (+) vs outflow (-) comparison.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span> + Add
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs"></span> - Minus
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {recentDays.map((d) => {
              const addPercent = Math.min(100, (d.totalAdd / maxDayAmount) * 100);
              const minusPercent = Math.min(100, (d.totalMinus / maxDayAmount) * 100);

              return (
                <div key={d.date} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {d.displayDate} <span className="text-slate-400 font-normal">({d.dayOfWeek})</span>
                    </span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {d.snoRange}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Add Bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${addPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-emerald-700 w-16 text-right tabular-nums">
                        {d.totalAdd > 0 ? `+${formatCurrency(d.totalAdd, config.currencySymbol)}` : '0'}
                      </span>
                    </div>

                    {/* Minus Bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${minusPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-rose-700 w-16 text-right tabular-nums">
                        {d.totalMinus > 0 ? `-${formatCurrency(d.totalMinus, config.currencySymbol)}` : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Category Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-slate-700" />
                <span>Expenses by Category (Minus)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Where your daily budget is being distributed.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800">
              Total: {formatCurrency(totalExpense, config.currencySymbol)}
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {sortedExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No expenses recorded yet.</p>
            ) : (
              sortedExpenses.slice(0, 6).map(([cat, amt]) => {
                const pct = Math.round((amt / totalExpense) * 100);

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <div className="font-mono text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(amt, config.currencySymbol)}
                        </span>
                        <span className="text-slate-400 ml-1.5">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-slate-800 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
