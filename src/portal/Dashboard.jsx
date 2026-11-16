import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    BarChart, Bar, ResponsiveContainer
} from 'recharts';
import {
    Briefcase, Users, DollarSign, Headset, TrendingUp, TrendingDown,
    Activity, FileText, AlertCircle, CheckCircle2, Clock,
    FilePlus, UserPlus, Receipt, CreditCard, Video, ExternalLink,
    ChevronRight, ArrowUpRight
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useCompany } from '../services/CompanyContext';

// --- Default / Fallback Data ---
const defaultUser = { name: 'Administrator', role: 'Staff', pendingTasks: 3, supportTickets: 2 };

const defaultStats = [
    { title: 'Total Revenue', value: 'KES 0.00', trend: '0%', isUp: true, icon: <DollarSign size={22} />, color: 'var(--primary-color)' },
    { title: 'Transactions', value: '0', trend: '0%', isUp: true, icon: <Users size={22} />, color: '#10b981' },
    { title: 'Stock Value', value: 'KES 0.00', trend: '0 items', isUp: true, icon: <Briefcase size={22} />, color: '#f59e0b' },
    { title: 'Open Tickets', value: '0', trend: '0 pending', isUp: false, icon: <Headset size={22} />, color: '#ef4444' },
];

const defaultRevenueData = [
    { label: 'Day 1', total: 0 },
    { label: 'Day 5', total: 0 },
    { label: 'Day 10', total: 0 },
    { label: 'Day 15', total: 0 },
];

const COLORS = ['#16657a', '#10b981', '#f59e0b', '#8b5cf6', '#ec5224'];

// --- Sub-Components ---

/**
 * Compact, modern executive welcome banner with session & connection telemetry
 */
const WelcomeSection = ({ user, companyName }) => {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return (
        <div className="dashboard-welcome-banner">
            <div className="welcome-banner-left">
                <div className="welcome-heading-row">
                    <h1 className="welcome-title">
                        Welcome back, {user.full_name || user.username || user.name || 'Administrator'}
                    </h1>
                    <span className="welcome-company-badge">{companyName || 'Royal Software Solutions'}</span>
                </div>
                <p className="welcome-date-text">{today}</p>
            </div>

            <div className="welcome-banner-right">
                <div className="connection-telemetry-chip">
                    <span className="telemetry-live-dot" />
                    <span className="telemetry-text">Enterprise Backend • Active Session</span>
                </div>
            </div>
        </div>
    );
};

/**
 * KPI Statistics Cards Grid
 */
const QuickStats = ({ stats }) => (
    <div className="stats-grid-responsive">
        {stats.map((stat, i) => (
            <div key={i} className="portal-content-card stat-card-modern">
                <div className="stat-card-body">
                    <span className="stat-card-title">{stat.title}</span>
                    <h2 className="stat-card-value">{stat.value}</h2>
                    <div className="stat-card-footer">
                        <span className={`stat-trend-pill ${stat.isUp ? 'trend-up' : 'trend-neutral'}`}>
                            {stat.isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {stat.trend}
                        </span>
                    </div>
                </div>
                <div
                    className="stat-card-icon-bubble"
                    style={{
                        backgroundColor: `${stat.color}15`,
                        color: stat.color || 'var(--primary-color)'
                    }}
                >
                    {stat.icon}
                </div>
            </div>
        ))}
    </div>
);

/**
 * Primary Left Panel: Financial Overview Area Chart
 */
const FinancialOverview = ({ revenueData, avgSale, growthPct }) => {
    const hasData = revenueData && revenueData.length > 0 && revenueData.some(d => d.total > 0);

    return (
        <div className="portal-content-card workspace-card">
            <div className="workspace-card-header">
                <div>
                    <h3 className="workspace-card-title">Financial Overview</h3>
                    <p className="workspace-card-subtitle">Daily sales trend & revenue velocity</p>
                </div>
                <div className="workspace-card-badge">
                    <Clock size={12} />
                    <span>Last 15 Days</span>
                </div>
            </div>

            <div className="financial-chart-container">
                <div style={{ height: '260px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSalesRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                dy={8}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                dx={-5}
                            />
                            <RechartsTooltip
                                formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Daily Sales']}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                                    fontSize: '12px'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="var(--primary-color)"
                                strokeWidth={2.5}
                                fill="url(#colorSalesRevenue)"
                                name="Daily Sales"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {!hasData && (
                    <div className="chart-empty-indicator">
                        <AlertCircle size={14} />
                        <span>No sales recorded during this 15-day cycle. Live transactions will chart automatically.</span>
                    </div>
                )}
            </div>

            <div className="financial-metrics-footer">
                <div className="footer-metric-col">
                    <span className="footer-metric-label">Average Order Value</span>
                    <span className="footer-metric-val">KES {Number(avgSale || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="footer-metric-divider" />
                <div className="footer-metric-col">
                    <span className="footer-metric-label">30-Day Growth Rate</span>
                    <span className={`footer-metric-val ${(growthPct || 0) >= 0 ? 'text-green' : 'text-red'}`}>
                        {(growthPct || 0) >= 0 ? `+${growthPct}%` : `${growthPct}%`}
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * Secondary Chart: Sales by Product/Service Category
 */
const SalesPerformance = ({ categorySales }) => {
    const hasData = categorySales && categorySales.length > 0;

    return (
        <div className="portal-content-card workspace-card">
            <div className="workspace-card-header">
                <div>
                    <h3 className="workspace-card-title">Category Revenue</h3>
                    <p className="workspace-card-subtitle">Contribution across business lines</p>
                </div>
            </div>

            <div style={{ padding: '16px 20px', height: '240px' }}>
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categorySales} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                            <RechartsTooltip
                                formatter={(val) => [`KES ${Number(val).toLocaleString()}`, 'Revenue']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                            />
                            <Bar dataKey="value" fill="var(--primary-color)" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="empty-panel-state">
                        <AlertCircle size={20} color="#94a3b8" />
                        <p>No category transactions recorded in current period.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Operational Right Panel: Quick Actions Hub
 */
const quickActionItems = [
    { label: 'Create Project', icon: <FilePlus size={16} />, path: '/portal/admin/projects', color: '#16657a', bg: 'rgba(22, 101, 122, 0.08)' },
    { label: 'Add Client', icon: <UserPlus size={16} />, path: '/portal/admin/clients', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Create Invoice', icon: <Receipt size={16} />, path: '/portal/admin/finance', color: '#6366f1', bg: '#e0e7ff' },
    { label: 'Record Payment', icon: <CreditCard size={16} />, path: '/portal/admin/finance', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'New Ticket', icon: <Headset size={16} />, path: '/portal/admin/support-tickets', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Sales Deals', icon: <Video size={16} />, path: '/portal/admin/sales?view=deals', color: '#8b5cf6', bg: '#f5f3ff' },
];

const QuickActions = ({ navigate }) => (
    <div className="portal-content-card workspace-card">
        <div className="workspace-card-header">
            <div>
                <h3 className="workspace-card-title">Quick Actions</h3>
                <p className="workspace-card-subtitle">Frequent operational shortcuts</p>
            </div>
        </div>
        <div className="quick-actions-grid">
            {quickActionItems.map((action, i) => (
                <button
                    key={i}
                    className="quick-action-item"
                    onClick={() => navigate(action.path)}
                >
                    <div className="quick-action-icon" style={{ backgroundColor: action.bg, color: action.color }}>
                        {action.icon}
                    </div>
                    <span className="quick-action-label">{action.label}</span>
                    <ArrowUpRight size={14} className="quick-action-arrow" />
                </button>
            ))}
        </div>
    </div>
);

/**
 * Operational Right Panel: Recent Sales Activity from Enterprise Backend
 */
const RecentActivity = ({ sales, navigate }) => (
    <div className="portal-content-card workspace-card">
        <div className="workspace-card-header">
            <div>
                <h3 className="workspace-card-title">Recent Transactions</h3>
                <p className="workspace-card-subtitle">Live transactions from sales registry</p>
            </div>
            <button
                className="card-text-link"
                onClick={() => navigate('/portal/admin/sales?view=sales_registry')}
            >
                View All
            </button>
        </div>

        <div className="activity-list-container">
            {sales && sales.length > 0 ? (
                sales.map((sale, idx) => (
                    <div key={idx} className="activity-list-item">
                        <div className="activity-dot" />
                        <div className="activity-details">
                            <div className="activity-top-row">
                                <span className="activity-sale-number">#{sale.sale_number}</span>
                                <span className="activity-amount">KES {Number(sale.total || 0).toLocaleString()}</span>
                            </div>
                            <div className="activity-meta-row">
                                <span>{sale.payment_method || 'Direct'}</span>
                                <span>•</span>
                                <span>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'Today'}</span>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="empty-panel-state">
                    <p>No recent transactions recorded in this period.</p>
                </div>
            )}
        </div>
    </div>
);

/**
 * Project Milestone Overview Panel
 */
const ProjectOverview = ({ projects, navigate }) => {
    return (
        <div className="portal-content-card workspace-card">
            <div className="workspace-card-header">
                <div>
                    <h3 className="workspace-card-title">Active Projects</h3>
                    <p className="workspace-card-subtitle">Current delivery milestones</p>
                </div>
                <button
                    className="card-text-link"
                    onClick={() => navigate('/portal/admin/projects')}
                >
                    Manage
                </button>
            </div>

            <div className="projects-list-container">
                {projects && projects.length > 0 ? (
                    projects.slice(0, 4).map((p, i) => (
                        <div key={i} className="project-progress-item">
                            <div className="project-progress-header">
                                <span className="project-name">{p.name}</span>
                                <span className="project-pct">{p.progress}%</span>
                            </div>
                            <div className="project-progress-track">
                                <div
                                    className="project-progress-fill"
                                    style={{
                                        width: `${p.progress}%`,
                                        backgroundColor: p.progress === 100 ? '#10b981' : 'var(--primary-color)'
                                    }}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-panel-state">
                        <p>No active project records found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

const Dashboard = () => {
    const navigate = useNavigate();
    const { company } = useCompany();

    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState(defaultUser);
    const [stats, setStats] = useState(defaultStats);
    const [revenueData, setRevenueData] = useState(defaultRevenueData);
    const [categorySales, setCategorySales] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [projects, setProjects] = useState([]);
    const [kpiMetrics, setKpiMetrics] = useState({ avgSale: 0, growthPct: 0 });

    useEffect(() => {
        setMounted(true);

        // 1. Get logged-in user profile from session
        const activeUser = apiClient.auth.getCurrentUser();
        if (activeUser) {
            setUser(activeUser);
        }

        // 2. Load LocalStorage Projects & Tickets (Audited Fallbacks)
        try {
            setProjects(apiClient.projects.list());
        } catch {
            setProjects([]);
        }

        // 3. Fetch Real Stats from Backend API
        const loadDashboardData = async () => {
            try {
                const data = await apiClient.dashboard.getStats();
                if (data && data.kpis) {
                    const kpis = data.kpis;

                    setKpiMetrics({
                        avgSale: kpis.avg_sale_value || 0,
                        growthPct: kpis.sales_growth_pct || 0
                    });

                    // Format 4 Standard KPI Cards
                    const updatedStats = [
                        {
                            title: 'Total Revenue',
                            value: `KES ${Number(kpis.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            trend: `${kpis.sales_growth_pct}% growth`,
                            isUp: (kpis.sales_growth_pct || 0) >= 0,
                            icon: <DollarSign size={22} />,
                            color: 'var(--primary-color)'
                        },
                        {
                            title: 'Transactions',
                            value: Number(kpis.transaction_count || 0).toString(),
                            trend: 'Completed sales',
                            isUp: true,
                            icon: <Users size={22} />,
                            color: '#10b981'
                        },
                        {
                            title: 'Stock Value',
                            value: `KES ${Number(kpis.inventory_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            trend: `${kpis.low_stock_count || 0} low stock items`,
                            isUp: (kpis.low_stock_count || 0) === 0,
                            icon: <Briefcase size={22} />,
                            color: '#f59e0b'
                        },
                        {
                            title: 'Open Tickets',
                            value: apiClient.tickets.list().filter(t => t.status === 'Open').length.toString(),
                            trend: 'Active support',
                            isUp: false,
                            icon: <Headset size={22} />,
                            color: '#ef4444'
                        },
                    ];
                    setStats(updatedStats);

                    // Daily Sales Trend Chart Data
                    if (data.trends && data.trends.daily_sales && data.trends.daily_sales.length > 0) {
                        setRevenueData(data.trends.daily_sales);
                    }

                    // Category Sales Data
                    if (data.trends && data.trends.category_sales) {
                        setCategorySales(data.trends.category_sales);
                    }

                    // Recent Recorded Sales
                    if (data.recent_sales) {
                        setRecentSales(data.recent_sales);
                    }
                }
            } catch (err) {
                console.warn('Dashboard API failed. Falling back to default presentation data.', err);
            }
        };

        loadDashboardData();
    }, []);

    if (!mounted) {
        return (
            <div className="dashboard-loading-state">
                <Activity size={32} className="spin-slow" style={{ color: 'var(--primary-color)' }} />
                <span>Loading Management Workspace...</span>
            </div>
        );
    }

    return (
        <div className="management-dashboard-workspace">
            {/* A & B: Executive Welcome Banner with Telemetry */}
            <WelcomeSection user={user} companyName={company.name} />

            {/* C: 4-Column Responsive KPI Cards */}
            <QuickStats stats={stats} />

            {/* D & E: Structured Two-Column Workspace Grid */}
            <div className="workspace-main-grid">
                {/* Left Column (Primary Financial & Performance Panels) */}
                <div className="workspace-column-left">
                    <FinancialOverview
                        revenueData={revenueData}
                        avgSale={kpiMetrics.avgSale}
                        growthPct={kpiMetrics.growthPct}
                    />

                    <SalesPerformance categorySales={categorySales} />
                </div>

                {/* Right Column (Operational Activity, Quick Actions & Projects) */}
                <div className="workspace-column-right">
                    <QuickActions navigate={navigate} />

                    <RecentActivity sales={recentSales} navigate={navigate} />

                    <ProjectOverview projects={projects} navigate={navigate} />
                </div>
            </div>

            {/* Embedded Responsive Scoped Layout Styles */}
            <style>{`
                .management-dashboard-workspace {
                    padding: 24px;
                    background-color: var(--body-bg, #f8fafc);
                    min-height: 100vh;
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                /* --- Executive Welcome Banner --- */
                .dashboard-welcome-banner {
                    background: linear-gradient(135deg, var(--primary-color, #16657a) 0%, #0d3c49 100%);
                    color: #ffffff;
                    border-radius: 12px;
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 4px 12px rgba(22, 101, 122, 0.12);
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .welcome-heading-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .welcome-title {
                    font-size: 1.35rem;
                    font-weight: 700;
                    margin: 0;
                    color: #ffffff;
                    letter-spacing: -0.2px;
                }

                .welcome-company-badge {
                    font-size: 11px;
                    font-weight: 600;
                    background: rgba(255, 255, 255, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 2px 8px;
                    border-radius: 12px;
                    color: #f1f5f9;
                }

                .welcome-date-text {
                    font-size: 13px;
                    margin: 2px 0 0 0;
                    color: rgba(255, 255, 255, 0.85);
                }

                .connection-telemetry-chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .telemetry-live-dot {
                    width: 8px;
                    height: 8px;
                    background-color: #10b981;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #10b981;
                }

                /* --- KPI Grid --- */
                .stats-grid-responsive {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }

                .stat-card-modern {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 18px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .stat-card-modern:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.05);
                }

                .stat-card-title {
                    font-size: 13px;
                    font-weight: 500;
                    color: #64748b;
                    margin-bottom: 4px;
                    display: block;
                }

                .stat-card-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 6px 0;
                    line-height: 1.2;
                }

                .stat-trend-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 500;
                    padding: 2px 6px;
                    border-radius: 6px;
                }

                .trend-up {
                    background-color: #ecfdf5;
                    color: #10b981;
                }

                .trend-neutral {
                    background-color: #f8fafc;
                    color: #64748b;
                }

                .stat-card-icon-bubble {
                    width: 46px;
                    height: 46px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                /* --- Two-Column Main Workspace Grid --- */
                .workspace-main-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.2fr);
                    gap: 20px;
                    align-items: start;
                }

                .workspace-column-left,
                .workspace-column-right {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                /* --- Workspace Cards --- */
                .workspace-card {
                    background: #ffffff;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    overflow: hidden;
                }

                .workspace-card-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .workspace-card-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0;
                }

                .workspace-card-subtitle {
                    font-size: 12px;
                    color: #64748b;
                    margin: 2px 0 0 0;
                }

                .workspace-card-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 500;
                }

                .card-text-link {
                    background: none;
                    border: none;
                    color: var(--primary-color, #16657a);
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0;
                }

                .card-text-link:hover {
                    text-decoration: underline;
                }

                /* --- Financial Chart Details --- */
                .financial-chart-container {
                    padding: 16px 20px;
                }

                .chart-empty-indicator {
                    margin-top: 10px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #64748b;
                    background: #f8fafc;
                    padding: 8px 12px;
                    border-radius: 8px;
                }

                .financial-metrics-footer {
                    display: flex;
                    border-top: 1px solid #f1f5f9;
                    background: #fafbfd;
                    padding: 12px 20px;
                }

                .footer-metric-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .footer-metric-label {
                    font-size: 11px;
                    color: #64748b;
                    margin-bottom: 2px;
                }

                .footer-metric-val {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e293b;
                }

                .footer-metric-divider {
                    width: 1px;
                    background: #e2e8f0;
                    margin: 0 16px;
                }

                .text-green { color: #10b981; }
                .text-red { color: #ef4444; }

                /* --- Quick Actions Grid --- */
                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    padding: 16px 20px;
                }

                .quick-action-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid #f1f5f9;
                    background: #ffffff;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.15s ease;
                }

                .quick-action-item:hover {
                    border-color: #cbd5e1;
                    background: #f8fafc;
                    transform: translateY(-1px);
                }

                .quick-action-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .quick-action-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #334155;
                    flex: 1;
                }

                .quick-action-arrow {
                    color: #94a3b8;
                    opacity: 0;
                    transition: opacity 0.15s ease;
                }

                .quick-action-item:hover .quick-action-arrow {
                    opacity: 1;
                }

                /* --- Recent Activity List --- */
                .activity-list-container {
                    padding: 12px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .activity-list-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f8fafc;
                }

                .activity-list-item:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }

                .activity-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #10b981;
                    margin-top: 6px;
                    flex-shrink: 0;
                }

                .activity-details {
                    flex: 1;
                }

                .activity-top-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2px;
                }

                .activity-sale-number {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1e293b;
                }

                .activity-amount {
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--primary-color, #16657a);
                }

                .activity-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: #64748b;
                }

                /* --- Projects Progress --- */
                .projects-list-container {
                    padding: 16px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .project-progress-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .project-progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                }

                .project-name {
                    font-weight: 500;
                    color: #334155;
                }

                .project-pct {
                    color: #64748b;
                    font-weight: 600;
                }

                .project-progress-track {
                    height: 6px;
                    background: #f1f5f9;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .project-progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }

                .empty-panel-state {
                    padding: 30px 20px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 13px;
                }

                .dashboard-loading-state {
                    padding: 60px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: #64748b;
                    font-size: 14px;
                }

                /* --- Responsive Breakpoints --- */
                @media (max-width: 1200px) {
                    .stats-grid-responsive {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .workspace-main-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .management-dashboard-workspace {
                        padding: 16px;
                        gap: 16px;
                    }
                    .stats-grid-responsive {
                        grid-template-columns: 1fr;
                    }
                    .quick-actions-grid {
                        grid-template-columns: 1fr;
                    }
                    .welcome-title {
                        font-size: 1.15rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
