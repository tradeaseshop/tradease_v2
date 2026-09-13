import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, ShoppingBag, DollarSign, Store, TrendingUp, TrendingDown, 
  ArrowRight, CreditCard, Clock, CheckCircle, AlertTriangle, ArrowUpRight,
  TrendingUp as TrendIcon, Calendar
} from 'lucide-react';
import { Product, Order } from '../types';
import { AdminUser, AdminVendor, Transaction } from './AdminTypes';

interface AdminDashboardViewProps {
  products: Product[];
  orders: Order[];
  users: AdminUser[];
  vendors: AdminVendor[];
  transactions: Transaction[];
  onNavigateTab: (tab: any) => void;
  currencySymbol?: string;
  isDarkMode?: boolean;
}

export default function AdminDashboardView({
  products,
  orders,
  users,
  vendors,
  transactions,
  onNavigateTab,
  currencySymbol = "₦",
  isDarkMode = true
}: AdminDashboardViewProps) {
  // SVG Chart hover states
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  // Math totals
  const safeOrders = orders || [];
  const safeTransactions = transactions || [];
  const safeUsers = users || [];
  const safeVendors = vendors || [];

  const totalRevenue = safeOrders
    .filter(o => o && ((o.status as any) === 'Paid' || o.status === 'Delivered' || o.status === 'Processing'))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0) + 
    safeTransactions.filter(t => t && t.status === 'success').reduce((sum, t) => sum + (t.amount || 0), 0);

  const activeUsersCount = safeUsers.filter(u => u && u.status === 'Active').length;
  const pendingVendorsCount = safeVendors.filter(v => v && v.status === 'Pending').length;
  const approvedVendorsCount = safeVendors.filter(v => v && v.status === 'Approved').length;
  const pendingOrdersCount = safeOrders.filter(o => o && o.status === 'Pending').length;

  // KPI card configuration
  const kpis = [
    {
      title: "Total Revenue",
      value: `${currencySymbol}${totalRevenue.toLocaleString()}`,
      change: "+12.4%",
      isPositive: true,
      icon: DollarSign,
      color: "from-emerald-500/10 to-emerald-500/5 text-emerald-500 border-emerald-500/20",
      tab: "payments"
    },
    {
      title: "Total Orders",
      value: orders.length.toString(),
      change: "+8.2%",
      isPositive: true,
      icon: ShoppingBag,
      color: "from-lime-500/10 to-lime-500/5 text-lime-500 border-lime-500/20",
      tab: "orders"
    },
    {
      title: "Active Users",
      value: activeUsersCount.toString(),
      change: "+15.1%",
      isPositive: true,
      icon: Users,
      color: "from-blue-500/10 to-blue-500/5 text-blue-500 border-blue-500/20",
      tab: "users"
    },
    {
      title: "Trade Vendors",
      value: approvedVendorsCount.toString(),
      change: pendingVendorsCount > 0 ? `${pendingVendorsCount} pending` : "All clear",
      isPositive: pendingVendorsCount === 0,
      icon: Store,
      color: "from-[#95C93D]/10 to-[#95C93D]/5 text-[#95C93D] border-[#95C93D]/20",
      tab: "vendors"
    }
  ];

  // Custom SVG Area Chart Data (Monthly Revenue)
  // Real dates and amounts
  const monthlyRevenueData = [
    { month: "Jan", revenue: 850000 },
    { month: "Feb", revenue: 1200000 },
    { month: "Mar", revenue: 1100000 },
    { month: "Apr", revenue: 1650000 },
    { month: "May", revenue: 2100000 },
    { month: "Jun", revenue: totalRevenue > 2100000 ? totalRevenue : 2450000 }
  ];

  // SVG dimensions for chart
  const chartWidth = 500;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingY = 30;

  const maxRevenue = Math.max(...monthlyRevenueData.map(d => d.revenue)) * 1.15;
  const points = monthlyRevenueData.map((d, i) => {
    const x = paddingX + (i * (chartWidth - paddingX * 2)) / (monthlyRevenueData.length - 1);
    const y = chartHeight - paddingY - (d.revenue * (chartHeight - paddingY * 2)) / maxRevenue;
    return { x, y, month: d.month, revenue: d.revenue };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  // Donut Chart Calculation for statuses
  const orderPositions = {
    Delivered: safeOrders.filter(o => o && o.status === 'Delivered').length,
    Processing: safeOrders.filter(o => o && o.status === 'Processing').length,
    Pending: safeOrders.filter(o => o && o.status === 'Pending').length,
    Cancelled: safeOrders.filter(o => o && o.status === 'Cancelled').length,
  };
  const totalStates = safeOrders.length || 1;
  const donutData = [
    { name: "Delivered", value: orderPositions.Delivered, color: "#95C93D" }, // Lime Brand
    { name: "Processing", value: orderPositions.Processing, color: "#3B82F6" }, // Blue
    { name: "Pending", value: orderPositions.Pending, color: "#F59E0B" }, // Amber
    { name: "Cancelled", value: orderPositions.Cancelled, color: "#EF4444" } // Red
  ];

  // Dynamic status percentages
  const activeLogs = [
    {
      id: "log-1",
      user: "Oluwaseun Adepoju",
      action: "placed new order",
      target: "TE-7894",
      time: "2 mins ago",
      type: "order"
    },
    {
      id: "log-2",
      user: "Kano Spices & Grains",
      action: "submitted vendor application",
      target: "Pending Approval",
      time: "15 mins ago",
      type: "vendor"
    },
    {
      id: "log-3",
      user: "System",
      action: "processed automated payout of ₦450,000",
      target: "Aba Master Crafts",
      time: "1 hour ago",
      type: "payment"
    },
    {
      id: "log-4",
      user: "Oraimo FreePods 4",
      action: "stock level dropped below threshold",
      target: "5 remaining",
      time: "3 hours ago",
      type: "alert"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Overview Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time analytics engine and escrow transactions ledger for TradeEase.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4 text-[#95C93D]" />
          <span className="font-medium">Period: Last 6 Months (Active)</span>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigateTab(kpi.tab)}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 group hover:border-[#95C93D]/30"
              id={`kpi-${index}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2.5 rounded-xl border ${kpi.color} bg-gradient-to-br transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {kpi.value}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {kpi.isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className={`text-xs font-bold ${kpi.isPositive ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {kpi.change}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    vs last month
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Line/Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Revenue Growth Trends
                </h2>
                <p className="text-[11px] text-gray-400">
                  Escrow volume and marketplace commission revenues in Nairaland
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded-lg">
                <TrendIcon className="w-3.5 h-3.5" />
                <span>+24.1% YoY</span>
              </div>
            </div>

            {/* SVG Plot */}
            <div className="relative w-full overflow-x-auto scrollbar-none pb-2">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full min-w-[450px] overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#95C93D" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#95C93D" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = paddingY + ratio * (chartHeight - paddingY * 2);
                  return (
                    <line 
                      key={i} 
                      x1={paddingX} 
                      y1={y} 
                      x2={chartWidth - paddingX} 
                      y2={y} 
                      stroke={isDarkMode ? "#1B4D47" : "#E2E8F0"} 
                      strokeDasharray="4 4" 
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Fill Area with Gradient */}
                <path d={areaD} fill="url(#areaGrad)" />

                {/* Line Path */}
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="#95C93D" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="5" 
                      fill={isDarkMode ? "#003D36" : "#FFFFFF"} 
                      stroke="#95C93D" 
                      strokeWidth="2.5" 
                      className="cursor-pointer transition-all hover:scale-130"
                      onMouseEnter={(e) => {
                        const box = e.currentTarget.getBoundingClientRect();
                        setHoveredPoint({
                          x: p.x,
                          y: p.y - 12,
                          label: p.month,
                          value: p.revenue
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}

                {/* X Axis Labels */}
                {points.map((p, i) => (
                  <text 
                    key={i}
                    x={p.x} 
                    y={chartHeight - 10} 
                    fill={isDarkMode ? "#93aca6" : "#64748B"} 
                    fontSize="10" 
                    textAnchor="middle" 
                    fontWeight="600"
                  >
                    {p.month}
                  </text>
                ))}

                {/* Y Axis Max Label */}
                <text
                  x={paddingX + 6}
                  y={paddingY + 8}
                  fill="#95C93D"
                  fontSize="8"
                  fontWeight="bold"
                >
                  MAX: {currencySymbol}{(maxRevenue / 1000).toFixed(0)}k
                </text>
              </svg>

              {/* HTML Hover Tooltip Inside Canvas absolute coordinate container */}
              {hoveredPoint && (
                <div 
                  className="absolute pointer-events-none bg-slate-950/95 border border-emerald-500/30 shadow-lg rounded-xl px-2.5 py-1.5 text-left z-20"
                  style={{ 
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                    top: `${(hoveredPoint.y / chartHeight) * 100 - 15}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{hoveredPoint.label} Volume</p>
                  <p className="text-xs font-black text-white">{currencySymbol}{hoveredPoint.value.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800/80 pt-4 flex flex-wrap gap-4 items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Commission Yield threshold: <strong className="text-gray-900 dark:text-white">8.5% Flat Escrow</strong></span>
            <button 
              onClick={() => onNavigateTab('reports')} 
              className="text-[#95C93D] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Report Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Order Status Breakdown Pie/Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Order Fulfillment Ratio
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">
              Real-time delivery fulfillment performance states
            </p>

            <div className="flex items-center justify-center my-4 relative">
              {/* Circular SVG Donut */}
              <svg width="140" height="140" viewBox="0 0 40 40" className="transform -rotate-90">
                <circle cx="20" cy="20" r="16" fill="transparent" stroke={isDarkMode ? "#1B4D47" : "#E2E8F0"} strokeWidth="5" />
                
                {/* Dynamically stacked rings */}
                {(() => {
                  let accumulatedPercent = 0;
                  return donutData.map((slice, index) => {
                    const percent = (slice.value / totalStates) * 100;
                    if (percent === 0) return null;
                    const strokeDashArray = `${percent} ${100 - percent}`;
                    const strokeDashOffset = -accumulatedPercent;
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={index}
                        cx="20"
                        cy="20"
                        r="16"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="5"
                        strokeDasharray={strokeDashArray}
                        strokeDashoffset={strokeDashOffset}
                        pathLength="100"
                        className="transition-all hover:stroke-[6px]"
                      />
                    );
                  });
                })()}
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-black text-gray-900 dark:text-white">{orders.length}</span>
                <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-gray-400">Orders</span>
              </div>
            </div>

            {/* Status indicators and metrics list */}
            <div className="space-y-1.5 mt-2">
              {donutData.map((item, index) => {
                const percentage = Math.round((item.value / totalStates) * 100);
                return (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-gray-600 dark:text-gray-305">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{item.value} txn</span>
                      <span className="font-black text-gray-800 dark:text-white">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800/80 pt-4 text-center mt-2">
            <button 
              onClick={() => onNavigateTab('orders')}
              className="text-[#95C93D] font-black text-xs hover:underline flex items-center justify-center gap-1 w-full"
            >
              <span>Manage Store Deliveries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Grid for activity ledger and quick stats list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity Feed */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Live Activity Audit
              </h2>
              <p className="text-[11px] text-gray-400">
                System telemetry, security events, and order transaction updates
              </p>
            </div>
            
            <span className="text-[9px] uppercase tracking-widest font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              ● Active Feed
            </span>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {activeLogs.map((log, logIdx) => {
                let badgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/15";
                let StatusIcon = Clock;

                if (log.type === 'order') {
                  badgeColor = "bg-lime-500/10 text-[#95C93D] border-lime-500/15";
                  StatusIcon = ShoppingBag;
                } else if (log.type === 'payment') {
                  badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/15";
                  StatusIcon = CheckCircle;
                } else if (log.type === 'alert') {
                  badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/15";
                  StatusIcon = AlertTriangle;
                } else if (log.type === 'vendor') {
                  badgeColor = "bg-purple-500/10 text-purple-500 border-purple-500/15";
                  StatusIcon = Store;
                }

                return (
                  <li key={log.id}>
                    <div className="relative pb-6">
                      {logIdx !== activeLogs.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-[1.5px] bg-slate-100 dark:bg-slate-800" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3 items-start">
                        <div>
                          <span className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center ${badgeColor}`}>
                            <StatusIcon className="w-4 h-4 shrink-0" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1 flex justify-between space-x-4">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              <strong className="text-gray-900 dark:text-white font-semibold">{log.user}</strong>{' '}
                              {log.action}{' '}
                              <span className="font-mono bg-gray-100 dark:bg-slate-950 text-gray-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9.5px]">
                                {log.target}
                              </span>
                            </p>
                          </div>
                          <div className="text-right text-[10px] whitespace-nowrap text-gray-400 font-medium pl-2">
                            <time dateTime={log.time}>{log.time}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Quick Platform Reports and Escrow Panel */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Escrow Security Rating
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">
              Fraud mitigation and system clearance health
            </p>

            <div className="space-y-4">
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-500">Logistics Escrow Risk</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 rounded">SECURE</span>
                </div>
                <p className="text-[10.5px] text-gray-500 dark:text-gray-400">
                  98.2% of ordered products are currently assigned to official courier tracking IDs.
                </p>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-400">Paystack Live Status</span>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 rounded">CONNECTED</span>
                </div>
                <p className="text-[10.5px] text-gray-500 dark:text-gray-400">
                  Webhooks are active and transmitting transaction records immediately on state settlement.
                </p>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-500">Unresolved Disputes</span>
                  <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 rounded">1 ACTION REQ</span>
                </div>
                <p className="text-[10.5px] text-gray-500 dark:text-gray-400">
                  One open product compliance ticket requires admin arbitration inside the reports console.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80 mt-4 text-center">
            <button 
              onClick={() => onNavigateTab('reports')}
              className="text-[#95C93D] font-black text-xs hover:underline flex items-center justify-center gap-1 w-full"
            >
              <span>Review Platform Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
