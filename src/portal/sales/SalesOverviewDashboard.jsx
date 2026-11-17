import React, { useMemo, useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    Target,
    CheckCircle,
    DollarSign,
    Plus,
    FileText,
    Layers,
    FileCheck,
    Clock,
    ArrowUpRight,
    Briefcase,
    UserPlus
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar
} from 'recharts';
import { apiClient } from '../../services/apiClient';
import '../shared/portalShared.css';

const SalesOverviewDashboard = ({
    leads = [],
    deals = [],
    quotations = [],
    rfqs = [],
    onNavigateView
}) => {
    // Dynamic user & tenant identification
    const [currentUser, setCurrentUser] = useState(() => apiClient.auth.getCurrentUser());

    useEffect(() => {
        let isMounted = true;
        apiClient.auth.getProfile()
            .then(profile => {
                if (isMounted && profile) setCurrentUser(profile);
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    const userDisplayName = useMemo(() => {
        if (!currentUser) return 'Commercial Leader';
        return currentUser.first_name ||
            (currentUser.full_name ? currentUser.full_name.split(' ')[0] : null) ||
            currentUser.username ||
            currentUser.name ||
            'Commercial Leader';
    }, [currentUser]);

    const userRoleBadge = useMemo(() => {
        if (!currentUser) return 'Executive Commercial Workspace';
        if (currentUser.is_superuser) return 'Executive Workspace';
        const primaryRole = (Array.isArray(currentUser.roles) && currentUser.roles.length > 0)
            ? currentUser.roles[0]
            : (currentUser.role || (currentUser.is_staff ? 'Sales Admin' : 'Sales Lead'));
        return `${primaryRole} Workspace`;
    }, [currentUser]);

    const companyName = useMemo(() => {
        return currentUser?.company_name || currentUser?.organization || 'Royal Software Solutions';
    }, [currentUser]);
    // Pipeline stats calculated from real data
    const stats = useMemo(() => {
        const totalLeads = leads.length;
        const activeDeals = deals.filter(d => d.stage !== 'WON' && d.stage !== 'LOST').length;
        const wonDeals = deals.filter(d => d.stage === 'WON').length;
        const lostDeals = deals.filter(d => d.stage === 'LOST').length;
        const closedDeals = wonDeals + lostDeals;
        const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : (wonDeals > 0 ? 100 : 0);
        const totalPipelineValue = deals
            .filter(d => d.stage !== 'LOST')
            .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

        return [
            {
                title: 'Total Leads',
                value: totalLeads,
                trend: totalLeads > 0 ? `${totalLeads} in pipeline` : 'No leads captured',
                icon: <Users size={20} />,
                color: '#16657a',
                bg: '#f0fdfa'
            },
            {
                title: 'Active Deals',
                value: activeDeals,
                trend: activeDeals > 0 ? `${activeDeals} deals in motion` : 'Open new deals',
                icon: <Target size={20} />,
                color: '#7c3aed',
                bg: '#f5f3ff'
            },
            {
                title: 'Won Deals',
                value: wonDeals,
                trend: closedDeals > 0 ? `${winRate}% close rate` : 'Awaiting close',
                icon: <CheckCircle size={20} />,
                color: '#10b981',
                bg: '#ecfdf5'
            },
            {
                title: 'Pipeline Value',
                value: `KES ${totalPipelineValue.toLocaleString()}`,
                trend: quotations.length > 0 ? `${quotations.length} quotes generated` : '0 quotes',
                icon: <DollarSign size={20} />,
                color: '#ec5224',
                bg: '#fff7ed'
            }
        ];
    }, [leads, deals, quotations]);

    // Stage breakdown calculated strictly from real deals
    const stageData = useMemo(() => [
        { stage: 'New', count: deals.filter(d => (d.stage || '').toUpperCase() === 'NEW').length },
        { stage: 'Contacted', count: deals.filter(d => (d.stage || '').toUpperCase() === 'CONTACTED').length },
        { stage: 'Qualified', count: deals.filter(d => (d.stage || '').toUpperCase() === 'QUALIFIED').length },
        { stage: 'Proposal', count: deals.filter(d => (d.stage || '').toUpperCase() === 'PROPOSAL').length },
        { stage: 'Negotiation', count: deals.filter(d => (d.stage || '').toUpperCase() === 'NEGOTIATION').length },
        { stage: 'Won', count: deals.filter(d => (d.stage || '').toUpperCase() === 'WON').length }
    ], [deals]);

    // Live quotation & pipeline chart data
    const chartData = useMemo(() => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const currentMonthIdx = now.getMonth();
        // Last 6 months
        const points = [];
        for (let i = 5; i >= 0; i--) {
            const mIdx = (currentMonthIdx - i + 12) % 12;
            const name = monthNames[mIdx];
            // Filter quotations or deals in this month
            const monthDeals = deals.filter(d => {
                if (!d.created_on) return false;
                const dDate = new Date(d.created_on);
                return dDate.getMonth() === mIdx;
            });
            const pipelineVal = monthDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            const wonVal = monthDeals.filter(d => d.stage === 'WON').reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            points.push({
                month: name,
                pipeline: pipelineVal,
                revenue: wonVal
            });
        }
        return points;
    }, [deals]);

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Executive Welcome Hero (Dynamic Identification) */}
            <div style={{
                background: 'linear-gradient(135deg, #16657a 0%, #0b2b35 100%)',
                color: '#ffffff',
                borderRadius: 20,
                padding: '2rem 2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                boxShadow: '0 8px 24px -4px rgba(11, 43, 53, 0.25)'
            }}>
                <div>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#99f6e4', fontWeight: 700 }}>
                        {userRoleBadge}
                    </span>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.35rem 0 0.5rem 0', color: '#ffffff' }}>
                        Welcome back, {userDisplayName}!
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', maxWidth: '520px', lineHeight: 1.5 }}>
                        Here is your commercial pipeline momentum, active RFQs, and quotation delivery progress for {companyName}.
                    </p>
                </div>

                {/* Quick Action Tiles (Reference Image 1 & 2) */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => onNavigateView && onNavigateView('leads')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#ffffff',
                            padding: '0.75rem 1.15rem',
                            borderRadius: 12,
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <UserPlus size={16} /> Capture Lead
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigateView && onNavigateView('quotations')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.12)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            padding: '0.75rem 1.15rem',
                            borderRadius: 12,
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FileText size={16} /> New Quotation
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigateView && onNavigateView('rfqs')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.12)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            padding: '0.75rem 1.15rem',
                            borderRadius: 12,
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FileCheck size={16} /> Review RFQs
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigateView && onNavigateView('catalogue')}
                        style={{
                            background: '#ec5224',
                            border: 'none',
                            color: '#ffffff',
                            padding: '0.75rem 1.15rem',
                            borderRadius: 12,
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(236, 82, 36, 0.3)'
                        }}
                    >
                        <Layers size={16} /> Catalogue
                    </button>
                </div>
            </div>

            {/* 2. Stat Cards Grid (Reference Image 2 & 3) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
            }}>
                {stats.map((s, idx) => (
                    <div
                        key={idx}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 16,
                            padding: '1.25rem',
                            boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}
                    >
                        <div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                {s.title}
                            </span>
                            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                                {s.value}
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: '#ecfdf5',
                                color: '#10b981',
                                padding: '2px 8px',
                                borderRadius: 6
                            }}>
                                {s.trend}
                            </span>
                        </div>

                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: s.bg,
                            color: s.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {s.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Visual Charts Grid (Reference Image 3) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '1.25rem'
            }}>
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Pipeline & Revenue Trajectory</h3>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>6-month cumulative commercial progress</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16657a', background: '#f0fdfa', padding: '4px 8px', borderRadius: 6 }}>
                            {new Date().getFullYear()} Trend
                        </span>
                    </div>

                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPipe" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16657a" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#16657a" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `${v / 1000}k`} />
                                <Tooltip formatter={val => `KES ${Number(val).toLocaleString()}`} />
                                <Area type="monotone" dataKey="pipeline" stroke="#16657a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPipe)" name="Quoted Pipeline" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Deals by Sales Stage</h3>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Current qualification & proposal distribution</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '4px 8px', borderRadius: 6 }}>
                            Active Distribution
                        </span>
                    </div>

                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stageData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#16657a" radius={[6, 6, 0, 0]} name="Deals Volume" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesOverviewDashboard;

