import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import {
    Briefcase, Users, DollarSign, Headset, TrendingUp, TrendingDown,
    Activity, FileText, AlertCircle, CheckCircle2, Clock,
    FilePlus, UserPlus, Receipt, CreditCard, Video, ExternalLink,
    ChevronRight, ArrowUpRight, CheckSquare, Square, Calendar, Plus,
    Sparkles, Filter, ShieldCheck, UserCheck, Layers, ListTodo, AlertTriangle
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useCompany } from '../services/CompanyContext';
import { canAccessModule, isAdminUser, isStaffUser } from './navigationConfig';

// --- Default Presentation Data & Fallbacks ---
const defaultUser = { name: 'Staff Member', role: 'Staff', is_staff: true };

const defaultTasks = [
    {
        id: 'TSK-101',
        title: 'Review System Module Access & Staff Matrix',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        due_date: 'Today',
        project_name: 'Core Security',
        completed: false
    },
    {
        id: 'TSK-102',
        title: 'Client Document Studio Template Verification',
        priority: 'MEDIUM',
        status: 'NOT_STARTED',
        due_date: 'Tomorrow',
        project_name: 'Client Management',
        completed: false
    },
    {
        id: 'TSK-103',
        title: 'Prepare Weekly Project Milestone Summary',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        due_date: 'Nov 18, 2026',
        project_name: 'Operations Delivery',
        completed: false
    },
    {
        id: 'TSK-104',
        title: 'Customer Success & Support Ticket Follow-up',
        priority: 'LOW',
        status: 'COMPLETED',
        due_date: 'Yesterday',
        project_name: 'Customer Care',
        completed: true
    }
];

const defaultProjects = [
    { id: 'PRJ-01', name: 'ERP Modernization & Platform 16', progress: 85, status: 'In Progress', client: 'Enterprise Core', due: 'Nov 25' },
    { id: 'PRJ-02', name: 'Document Studio Branding Suite', progress: 60, status: 'In Progress', client: 'Royal Software', due: 'Dec 02' },
    { id: 'PRJ-03', name: 'Client Portal & Account Management', progress: 100, status: 'Completed', client: 'SalesForce', due: 'Completed' },
    { id: 'PRJ-04', name: 'Automated Billing & Reporting Gateway', progress: 40, status: 'In Progress', client: 'Finance Team', due: 'Dec 15' }
];

const defaultRevenueData = [
    { label: 'Day 1', total: 0 },
    { label: 'Day 5', total: 0 },
    { label: 'Day 10', total: 0 },
    { label: 'Day 15', total: 0 },
];

// --- Sub-Components ---

/**
 * Modern Welcome Banner with Live Role Badge & Multi-View Switcher for Cleared Users
 */
const WelcomeSection = ({ user, companyName, activeTab, setActiveTab, hasFinance, hasProjects }) => {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const isSuper = user?.is_superuser || isAdminUser(user);
    const roleLabel = isSuper
        ? 'Executive Administrator'
        : (user?.role || (hasFinance ? 'Finance Team' : 'Team Workspace'));

    return (
        <div className="dashboard-welcome-banner">
            <div className="welcome-banner-main">
                <div className="welcome-banner-left">
                    <div className="welcome-heading-row">
                        <h1 className="welcome-title">
                            Welcome back, {user.first_name || user.username || user.name || 'Team Member'}
                        </h1>
                        <span className="welcome-role-badge">
                            <ShieldCheck size={12} />
                            {roleLabel}
                        </span>
                        <span className="welcome-company-badge">{companyName || 'Royal Software Solutions'}</span>
                    </div>
                    <p className="welcome-date-text">{today} • Enterprise Operations Live</p>
                </div>

                <div className="welcome-banner-right">
                    <div className="connection-telemetry-chip">
                        <span className="telemetry-live-dot" />
                        <span className="telemetry-text">Secure Session Active</span>
                    </div>
                </div>
            </div>

            {/* Segmented View Switcher: Only displayed if user has access to multiple domains (e.g. Exec/Finance) */}
            {hasFinance && (
                <div className="dashboard-view-tabs">
                    <button
                        className={`view-tab-btn ${activeTab === 'executive' ? 'active' : ''}`}
                        onClick={() => setActiveTab('executive')}
                    >
                        <Sparkles size={14} />
                        <span>Executive Overview</span>
                    </button>
                    <button
                        className={`view-tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('finance')}
                    >
                        <DollarSign size={14} />
                        <span>Financial Health</span>
                    </button>
                    <button
                        className={`view-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tasks')}
                    >
                        <ListTodo size={14} />
                        <span>My Tasks & Delivery</span>
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Adaptive KPI Grid (Financial vs Operational KPIs based on clearance)
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
 * Interactive My Tasks Widget (For Staff & Delivery View)
 */
const MyTasksWidget = ({ tasks, onToggleTask, navigate, maxItems = 6 }) => {
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, COMPLETED

    const filteredTasks = useMemo(() => {
        if (filter === 'PENDING') return tasks.filter(t => !t.completed && t.status !== 'COMPLETED');
        if (filter === 'COMPLETED') return tasks.filter(t => t.completed || t.status === 'COMPLETED');
        return tasks;
    }, [tasks, filter]);

    const displayTasks = filteredTasks.slice(0, maxItems);
    const pendingCount = tasks.filter(t => !t.completed && t.status !== 'COMPLETED').length;

    return (
        <div className="portal-content-card workspace-card">
            <div className="workspace-card-header">
                <div>
                    <h3 className="workspace-card-title">My Assigned Tasks</h3>
                    <p className="workspace-card-subtitle">
                        {pendingCount} open deliverable{pendingCount === 1 ? '' : 's'} assigned to you
                    </p>
                </div>
                <div className="task-header-actions">
                    <div className="task-filter-pills">
                        <button
                            className={`task-pill ${filter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setFilter('ALL')}
                        >
                            All ({tasks.length})
                        </button>
                        <button
                            className={`task-pill ${filter === 'PENDING' ? 'active' : ''}`}
                            onClick={() => setFilter('PENDING')}
                        >
                            Pending ({pendingCount})
                        </button>
                        <button
                            className={`task-pill ${filter === 'COMPLETED' ? 'active' : ''}`}
                            onClick={() => setFilter('COMPLETED')}
                        >
                            Done
                        </button>
                    </div>
                    <button
                        className="card-text-link"
                        onClick={() => navigate('/portal/admin/planner?view=tasks')}
                    >
                        Open Planner
                    </button>
                </div>
            </div>

            <div className="tasks-widget-content">
                {displayTasks && displayTasks.length > 0 ? (
                    <div className="tasks-widget-list">
                        {displayTasks.map((task) => {
                            const isDone = task.completed || task.status === 'COMPLETED';
                            const priorityColor =
                                task.priority === 'HIGH' || task.priority === 'URGENT'
                                    ? '#ef4444'
                                    : task.priority === 'MEDIUM'
                                    ? '#f59e0b'
                                    : '#10b981';

                            return (
                                <div
                                    key={task.id}
                                    className={`task-item-row ${isDone ? 'task-done' : ''}`}
                                    onClick={() => onToggleTask(task.id)}
                                >
                                    <button
                                        type="button"
                                        className="task-checkbox-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleTask(task.id);
                                        }}
                                        aria-label={isDone ? 'Mark incomplete' : 'Mark completed'}
                                    >
                                        {isDone ? (
                                            <CheckSquare size={18} color="#10b981" />
                                        ) : (
                                            <Square size={18} color="#94a3b8" />
                                        )}
                                    </button>

                                    <div className="task-row-details">
                                        <span className={`task-row-title ${isDone ? 'line-through text-muted' : ''}`}>
                                            {task.title}
                                        </span>
                                        <div className="task-row-meta">
                                            {task.project_name && (
                                                <span className="task-meta-tag project-tag">
                                                    <Briefcase size={11} />
                                                    {task.project_name}
                                                </span>
                                            )}
                                            {task.due_date && (
                                                <span className="task-meta-tag due-tag">
                                                    <Clock size={11} />
                                                    {task.due_date}
                                                </span>
                                            )}
                                            <span
                                                className="task-meta-tag priority-tag"
                                                style={{ color: priorityColor, backgroundColor: `${priorityColor}15` }}
                                            >
                                                {task.priority || 'NORMAL'}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight size={14} className="task-row-arrow" />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-panel-state">
                        <CheckCircle2 size={24} color="#10b981" />
                        <p>All caught up! No tasks found matching this view.</p>
                    </div>
                )}
            </div>

            <div className="tasks-widget-footer">
                <button
                    className="task-quick-add-btn"
                    onClick={() => navigate('/portal/admin/planner?view=tasks')}
                >
                    <Plus size={14} />
                    <span>Create New Task</span>
                </button>
            </div>
        </div>
    );
};

/**
 * Project Milestones Delivery Panel (For All Roles)
 */
const ProjectMilestonesWidget = ({ projects, navigate }) => {
    return (
        <div className="portal-content-card workspace-card">
            <div className="workspace-card-header">
                <div>
                    <h3 className="workspace-card-title">Project Delivery Milestones</h3>
                    <p className="workspace-card-subtitle">Active initiatives & progress velocity</p>
                </div>
                <button
                    className="card-text-link"
                    onClick={() => navigate('/portal/admin/projects')}
                >
                    All Projects
                </button>
            </div>

            <div className="projects-list-container">
                {projects && projects.length > 0 ? (
                    projects.slice(0, 4).map((p, i) => (
                        <div key={i} className="project-progress-item">
                            <div className="project-progress-header">
                                <div className="project-title-meta">
                                    <span className="project-name">{p.name}</span>
                                    {p.client && <span className="project-client-sub">{p.client}</span>}
                                </div>
                                <span className={`project-pct ${p.progress === 100 ? 'text-green' : ''}`}>
                                    {p.progress}%
                                </span>
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
                        <Briefcase size={22} color="#94a3b8" />
                        <p>No active project initiatives found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Today's Operational Focus & Calendar Sync
 */
const TodayFocusWidget = ({ tasks, navigate }) => {
    const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'COMPLETED');
    const urgentCount = pendingTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length;

    return (
        <div className="portal-content-card workspace-card">
            <div className="workspace-card-header">
                <div>
                    <h3 className="workspace-card-title">Today's Focus & Agenda</h3>
                    <p className="workspace-card-subtitle">Personal productivity briefing</p>
                </div>
                <button
                    className="card-text-link"
                    onClick={() => navigate('/portal/admin/planner?view=my-day')}
                >
                    My Day
                </button>
            </div>

            <div className="today-focus-content">
                <div className="focus-summary-box">
                    <div className="focus-kpi">
                        <span className="focus-val">{pendingTasks.length}</span>
                        <span className="focus-lbl">Tasks Pending</span>
                    </div>
                    <div className="focus-divider" />
                    <div className="focus-kpi">
                        <span className={`focus-val ${urgentCount > 0 ? 'text-red' : 'text-green'}`}>
                            {urgentCount}
                        </span>
                        <span className="focus-lbl">Urgent Items</span>
                    </div>
                </div>

                <div className="focus-action-banner">
                    <Sparkles size={16} color="var(--primary-color)" />
                    <div className="focus-text-block">
                        <span className="focus-bold">Structured Planner Active</span>
                        <span className="focus-sub">Plan time blocks, habits & routines in Hybrid Planner.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Financial Overview Area Chart (Restricted strictly to Finance/Executive users)
 */
const FinancialOverview = ({ revenueData, avgSale, growthPct }) => {
    const hasData = revenueData && revenueData.length > 0 && revenueData.some(d => d.total > 0);

    return (
        <div className="portal-content-card workspace-card">
            <div className="workspace-card-header">
                <div>
                    <h3 className="workspace-card-title">Financial Performance</h3>
                    <p className="workspace-card-subtitle">Daily revenue velocity & sales volume</p>
                </div>
                <div className="workspace-card-badge">
                    <Clock size={12} />
                    <span>Last 15 Days</span>
                </div>
            </div>

            <div className="financial-chart-container">
                <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={260}>
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
                                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
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
                        <span>No sales recorded during this 15-day cycle. Live transactions chart automatically.</span>
                    </div>
                )}
            </div>

            <div className="financial-metrics-footer">
                <div className="footer-metric-col">
                    <span className="footer-metric-label">Average Order Value</span>
                    <span className="footer-metric-val">
                        KES {Number(avgSale || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
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
 * Secondary Chart: Sales by Category (Restricted to Finance/Executive users)
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

            <div style={{ padding: '16px 20px', height: '240px', minHeight: '240px' }}>
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                        <BarChart
                            data={categorySales}
                            layout="vertical"
                            margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#475569' }}
                            />
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
 * Role-Filtered Quick Actions Hub
 */
const QuickActions = ({ navigate, actions }) => (
    <div className="portal-content-card workspace-card">
        <div className="workspace-card-header">
            <div>
                <h3 className="workspace-card-title">Quick Actions</h3>
                <p className="workspace-card-subtitle">Your frequent operational shortcuts</p>
            </div>
        </div>
        <div className="quick-actions-grid">
            {actions.map((action, i) => (
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
 * Recent Financial Transactions (Restricted to Finance/Executive)
 */
const RecentActivity = ({ sales, navigate }) => (
    <div className="portal-content-card workspace-card">
        <div className="workspace-card-header">
            <div>
                <h3 className="workspace-card-title">Recent Transactions</h3>
                <p className="workspace-card-subtitle">Live commercial records</p>
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

// --- Main Role-Oriented Dashboard Component ---

const Dashboard = () => {
    const navigate = useNavigate();
    const { company } = useCompany();

    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState(defaultUser);
    const [activeTab, setActiveTab] = useState('executive'); // 'executive' | 'finance' | 'tasks'

    // Data States
    const [tasks, setTasks] = useState(defaultTasks);
    const [projects, setProjects] = useState(defaultProjects);
    const [stats, setStats] = useState([]);
    const [revenueData, setRevenueData] = useState(defaultRevenueData);
    const [categorySales, setCategorySales] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [kpiMetrics, setKpiMetrics] = useState({ avgSale: 0, growthPct: 0 });

    // --- Role & Clearance Assessment ---
    const isSuper = useMemo(() => !!(user?.is_superuser || isAdminUser(user)), [user]);
    
    const hasFinance = useMemo(() => {
        if (isSuper) return true;
        return canAccessModule(
            {
                id: 'finance',
                roles: ['Finance'],
                permissions: [
                    'accounts.can_view_financials',
                    'accounting.view_invoice',
                    'accounting.view_expense',
                    'accounting.view_ledger',
                    'accounting.can_view_financial_reports'
                ]
            },
            user
        );
    }, [isSuper, user]);

    const hasSales = useMemo(() => {
        if (isSuper) return true;
        return canAccessModule(
            {
                id: 'sales',
                roles: ['Admin', 'Sales'],
                permissions: ['pos.view_sale', 'crm.view_customer', 'pos.view_quotation']
            },
            user
        );
    }, [isSuper, user]);

    const hasProjects = useMemo(() => {
        if (isSuper) return true;
        return (
            canAccessModule({ id: 'projects', roles: ['Admin', 'Staff', 'Operations'] }, user) ||
            isStaffUser(user)
        );
    }, [isSuper, user]);

    // Set initial active tab based on user clearance
    useEffect(() => {
        if (!hasFinance) {
            setActiveTab('tasks');
        } else {
            setActiveTab('executive');
        }
    }, [hasFinance]);

    // Handle toggling task status locally and via API
    const handleToggleTask = useCallback(async (taskId) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed, status: t.completed ? 'IN_PROGRESS' : 'COMPLETED' } : t))
        );

        try {
            if (apiClient.planner?.tasks?.toggleStatus) {
                await apiClient.planner.tasks.toggleStatus(taskId);
            }
        } catch (err) {
            console.warn('API task toggle fallback:', err);
        }
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        setMounted(true);

        // 1. Get logged-in user profile from session
        const activeUser = apiClient.auth.getCurrentUser();
        if (activeUser) {
            setUser(activeUser);
        }

        // 2. Load Tasks (from Planner API or fallback)
        const loadTasksData = async () => {
            try {
                if (apiClient.planner?.tasks?.list) {
                    const fetchedTasks = await apiClient.planner.tasks.list({ view: 'my-tasks' });
                    if (fetchedTasks && fetchedTasks.length > 0) {
                        setTasks(fetchedTasks);
                    }
                }
            } catch (err) {
                console.info('Using local task dataset for dashboard.');
            }
        };

        // 3. Load Projects
        const loadProjectsData = async () => {
            try {
                if (apiClient.planner?.projects?.list) {
                    const fetchedProjects = await apiClient.planner.projects.list();
                    if (fetchedProjects && fetchedProjects.length > 0) {
                        setProjects(fetchedProjects);
                        return;
                    }
                }
                const localProj = apiClient.projects.list();
                if (localProj && localProj.length > 0) {
                    setProjects(localProj);
                }
            } catch (err) {
                console.info('Using local projects dataset for dashboard.');
            }
        };

        // 4. Fetch Financial Stats (ONLY if user has finance access)
        const loadFinancialStats = async () => {
            if (!hasFinance) return;

            try {
                const data = await apiClient.dashboard.getStats();
                if (data && data.kpis) {
                    const kpis = data.kpis;

                    setKpiMetrics({
                        avgSale: kpis.avg_sale_value || 0,
                        growthPct: kpis.sales_growth_pct || 0
                    });

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
                console.warn('Financial stats API skipped or unpopulated.');
            }
        };

        loadTasksData();
        loadProjectsData();
        loadFinancialStats();
    }, [hasFinance]);

    // --- Dynamic KPI Stats Computation ---
    useEffect(() => {
        if (hasFinance && activeTab !== 'tasks') {
            // Financial KPIs
            setStats([
                {
                    title: 'Total Revenue',
                    value: `KES ${Number(kpiMetrics.avgSale * 15 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    trend: `${kpiMetrics.growthPct}% growth`,
                    isUp: (kpiMetrics.growthPct || 0) >= 0,
                    icon: <DollarSign size={22} />,
                    color: 'var(--primary-color)'
                },
                {
                    title: 'Active Projects',
                    value: projects.length.toString(),
                    trend: `${projects.filter(p => p.progress === 100).length} completed`,
                    isUp: true,
                    icon: <Briefcase size={22} />,
                    color: '#10b981'
                },
                {
                    title: 'Team Deliverables',
                    value: tasks.filter(t => !t.completed).length.toString(),
                    trend: 'In progress',
                    isUp: true,
                    icon: <CheckSquare size={22} />,
                    color: '#f59e0b'
                },
                {
                    title: 'Open Tickets',
                    value: (apiClient.tickets?.list() || []).filter(t => t.status === 'Open').length.toString(),
                    trend: 'Active support',
                    isUp: false,
                    icon: <Headset size={22} />,
                    color: '#ef4444'
                }
            ]);
        } else {
            // Staff / Operational KPIs (Strictly non-financial)
            const openTasks = tasks.filter(t => !t.completed && t.status !== 'COMPLETED');
            const urgentTasks = openTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');
            const doneTasks = tasks.filter(t => t.completed || t.status === 'COMPLETED');
            const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 100;

            setStats([
                {
                    title: 'My Open Tasks',
                    value: openTasks.length.toString(),
                    trend: `${urgentTasks.length} urgent`,
                    isUp: urgentTasks.length === 0,
                    icon: <CheckSquare size={22} />,
                    color: 'var(--primary-color)'
                },
                {
                    title: 'Tasks Due Today',
                    value: openTasks.filter(t => t.due_date === 'Today').length.toString(),
                    trend: 'Action required',
                    isUp: false,
                    icon: <Clock size={22} />,
                    color: '#f59e0b'
                },
                {
                    title: 'Assigned Projects',
                    value: projects.length.toString(),
                    trend: 'Active delivery',
                    isUp: true,
                    icon: <Briefcase size={22} />,
                    color: '#10b981'
                },
                {
                    title: 'Completion Rate',
                    value: `${completionRate}%`,
                    trend: `${doneTasks.length} completed`,
                    isUp: completionRate >= 50,
                    icon: <CheckCircle2 size={22} />,
                    color: '#8b5cf6'
                }
            ]);
        }
    }, [hasFinance, activeTab, tasks, projects, kpiMetrics]);

    // Role-filtered quick action items
    const quickActions = useMemo(() => {
        const items = [];

        // Operational actions (available to all logged-in members)
        items.push({
            label: 'New Task',
            icon: <CheckSquare size={16} />,
            path: '/portal/admin/planner?view=tasks',
            color: '#0284c7',
            bg: '#e0f2fe'
        });
        items.push({
            label: 'My Day Planner',
            icon: <Sparkles size={16} />,
            path: '/portal/admin/planner?view=my-day',
            color: '#8b5cf6',
            bg: '#f5f3ff'
        });

        if (hasProjects) {
            items.push({
                label: 'All Projects',
                icon: <Briefcase size={16} />,
                path: '/portal/admin/projects',
                color: '#16657a',
                bg: 'rgba(22, 101, 122, 0.08)'
            });
        }

        if (hasSales) {
            items.push({
                label: 'Sales Pipeline',
                icon: <TrendingUp size={16} />,
                path: '/portal/admin/sales?view=pipeline',
                color: '#10b981',
                bg: '#ecfdf5'
            });
            items.push({
                label: 'Add Client',
                icon: <UserPlus size={16} />,
                path: '/portal/admin/clients',
                color: '#06b6d4',
                bg: '#ecfeff'
            });
        }

        if (hasFinance) {
            items.push({
                label: 'Create Invoice',
                icon: <Receipt size={16} />,
                path: '/portal/admin/finance',
                color: '#6366f1',
                bg: '#e0e7ff'
            });
            items.push({
                label: 'Record Payment',
                icon: <CreditCard size={16} />,
                path: '/portal/admin/finance',
                color: '#f59e0b',
                bg: '#fffbeb'
            });
        }

        items.push({
            label: 'Support Tickets',
            icon: <Headset size={16} />,
            path: '/portal/admin/support-tickets',
            color: '#ef4444',
            bg: '#fef2f2'
        });

        return items;
    }, [hasProjects, hasSales, hasFinance]);

    if (!mounted) {
        return (
            <div className="dashboard-loading-state">
                <Activity size={32} className="spin-slow" style={{ color: 'var(--primary-color)' }} />
                <span>Loading Role Workspace...</span>
            </div>
        );
    }

    return (
        <div className="management-dashboard-workspace">
            {/* Header: Personalized Welcome Banner & View Switcher */}
            <WelcomeSection
                user={user}
                companyName={company.name}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                hasFinance={hasFinance}
                hasProjects={hasProjects}
            />

            {/* KPI Cards Grid */}
            <QuickStats stats={stats} />

            {/* Main Workspace Layout (Conditioned on activeTab & role clearance) */}
            <div className="workspace-main-grid">
                {/* --- 1. NON-FINANCE STAFF VIEW or 'tasks' tab --- */}
                {(!hasFinance || activeTab === 'tasks') && (
                    <>
                        <div className="workspace-column-left">
                            <MyTasksWidget
                                tasks={tasks}
                                onToggleTask={handleToggleTask}
                                navigate={navigate}
                            />

                            <ProjectMilestonesWidget
                                projects={projects}
                                navigate={navigate}
                            />
                        </div>

                        <div className="workspace-column-right">
                            <TodayFocusWidget
                                tasks={tasks}
                                navigate={navigate}
                            />

                            <QuickActions
                                navigate={navigate}
                                actions={quickActions}
                            />
                        </div>
                    </>
                )}

                {/* --- 2. FINANCIAL HEALTH VIEW ('finance' tab) --- */}
                {hasFinance && activeTab === 'finance' && (
                    <>
                        <div className="workspace-column-left">
                            <FinancialOverview
                                revenueData={revenueData}
                                avgSale={kpiMetrics.avgSale}
                                growthPct={kpiMetrics.growthPct}
                            />

                            <SalesPerformance categorySales={categorySales} />
                        </div>

                        <div className="workspace-column-right">
                            <QuickActions
                                navigate={navigate}
                                actions={quickActions}
                            />

                            <RecentActivity
                                sales={recentSales}
                                navigate={navigate}
                            />

                            <ProjectMilestonesWidget
                                projects={projects}
                                navigate={navigate}
                            />
                        </div>
                    </>
                )}

                {/* --- 3. EXECUTIVE COMPREHENSIVE VIEW ('executive' tab) --- */}
                {hasFinance && activeTab === 'executive' && (
                    <>
                        <div className="workspace-column-left">
                            <FinancialOverview
                                revenueData={revenueData}
                                avgSale={kpiMetrics.avgSale}
                                growthPct={kpiMetrics.growthPct}
                            />

                            <MyTasksWidget
                                tasks={tasks}
                                onToggleTask={handleToggleTask}
                                navigate={navigate}
                                maxItems={4}
                            />
                        </div>

                        <div className="workspace-column-right">
                            <QuickActions
                                navigate={navigate}
                                actions={quickActions}
                            />

                            <ProjectMilestonesWidget
                                projects={projects}
                                navigate={navigate}
                            />

                            <RecentActivity
                                sales={recentSales}
                                navigate={navigate}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Scoped CSS Styles */}
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
                    padding: 20px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    box-shadow: 0 4px 12px rgba(22, 101, 122, 0.12);
                }

                .welcome-banner-main {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
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

                .welcome-role-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    background: #10b981;
                    color: #ffffff;
                    padding: 2px 8px;
                    border-radius: 12px;
                    letter-spacing: 0.2px;
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
                    margin: 4px 0 0 0;
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

                /* --- View Switcher Tabs --- */
                .dashboard-view-tabs {
                    display: flex;
                    gap: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.15);
                    padding-top: 12px;
                    flex-wrap: wrap;
                }

                .view-tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #ffffff;
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .view-tab-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .view-tab-btn.active {
                    background: #ffffff;
                    color: var(--primary-color, #16657a);
                    border-color: #ffffff;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
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
                    flex-wrap: wrap;
                    gap: 8px;
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

                /* --- Tasks Widget Styling --- */
                .task-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .task-filter-pills {
                    display: flex;
                    gap: 4px;
                    background: #f1f5f9;
                    padding: 3px;
                    border-radius: 8px;
                }

                .task-pill {
                    border: none;
                    background: transparent;
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748b;
                    padding: 3px 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .task-pill.active {
                    background: #ffffff;
                    color: #0f172a;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                }

                .tasks-widget-content {
                    padding: 8px 12px;
                }

                .tasks-widget-list {
                    display: flex;
                    flex-direction: column;
                }

                .task-item-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 8px;
                    transition: background-color 0.15s ease;
                    cursor: pointer;
                }

                .task-item-row:hover {
                    background-color: #f8fafc;
                }

                .task-item-row.task-done {
                    opacity: 0.65;
                }

                .task-checkbox-btn {
                    border: none;
                    background: none;
                    padding: 0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .task-row-details {
                    flex: 1;
                    min-width: 0;
                }

                .task-row-title {
                    font-size: 13px;
                    font-weight: 500;
                    color: #1e293b;
                    display: block;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .line-through {
                    text-decoration: line-through;
                }

                .text-muted {
                    color: #94a3b8;
                }

                .task-row-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 4px;
                    flex-wrap: wrap;
                }

                .task-meta-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 10px;
                    font-weight: 600;
                    padding: 1px 6px;
                    border-radius: 4px;
                }

                .project-tag {
                    background-color: #f1f5f9;
                    color: #475569;
                }

                .due-tag {
                    background-color: #fffbeb;
                    color: #b45309;
                }

                .task-row-arrow {
                    color: #cbd5e1;
                }

                .tasks-widget-footer {
                    padding: 10px 20px;
                    border-top: 1px solid #f1f5f9;
                    background: #fafbfd;
                }

                .task-quick-add-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    border: none;
                    background: none;
                    color: var(--primary-color, #16657a);
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 4px 0;
                }

                .task-quick-add-btn:hover {
                    text-decoration: underline;
                }

                /* --- Projects Progress --- */
                .projects-list-container {
                    padding: 16px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .project-progress-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .project-progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    font-size: 12px;
                }

                .project-title-meta {
                    display: flex;
                    flex-direction: column;
                }

                .project-name {
                    font-weight: 600;
                    color: #1e293b;
                }

                .project-client-sub {
                    font-size: 11px;
                    color: #64748b;
                }

                .project-pct {
                    color: #64748b;
                    font-weight: 700;
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

                /* --- Today Focus Widget --- */
                .today-focus-content {
                    padding: 16px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .focus-summary-box {
                    display: flex;
                    align-items: center;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 12px;
                }

                .focus-kpi {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .focus-val {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .focus-lbl {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 500;
                }

                .focus-divider {
                    width: 1px;
                    height: 32px;
                    background: #e2e8f0;
                }

                .focus-action-banner {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    padding: 10px 12px;
                    border-radius: 8px;
                }

                .focus-text-block {
                    display: flex;
                    flex-direction: column;
                }

                .focus-bold {
                    font-size: 12px;
                    font-weight: 600;
                    color: #166534;
                }

                .focus-sub {
                    font-size: 11px;
                    color: #15803d;
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

                .empty-panel-state {
                    padding: 30px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 13px;
                }

                .empty-panel-state p {
                    margin: 0;
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
