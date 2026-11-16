import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, CheckCircle, Clock,
    AlertTriangle, Users, Layers, RefreshCw
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';

const STATUS_COLORS = {
    'NOT_STARTED': '#94a3b8',
    'IN_PROGRESS': '#005f73',
    'UNDER_REVIEW': '#ca6702',
    'ON_HOLD': '#eab308',
    'COMPLETED': '#10b981',
    'CANCELLED': '#ef4444'
};

const ProductivityAnalyticsView = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.analytics.get();
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const personal = analytics?.personal_metrics || {};
    const org = analytics?.organization_metrics || {};

    const ribbonStats = [
        { label: 'My Assigned Deliverables', value: personal.total_assigned || 0 },
        { label: 'My Completed', value: personal.completed || 0, trendType: 'positive' },
        { label: 'In Progress (Personal)', value: personal.in_progress || 0 },
        { label: 'Total Org Tasks', value: org.total_tasks || 0 },
        { label: 'Total Org Completed', value: org.completed_tasks || 0, trendType: 'positive' }
    ];

    const pieData = (org.status_distribution || []).map(item => ({
        name: item.status.replace('_', ' '),
        value: item.count,
        color: STATUS_COLORS[item.status] || '#005f73'
    }));

    const workloadData = (org.team_workload || []).map(w => ({
        name: w.name,
        Pending: w.pending_tasks,
        Completed: w.completed_tasks
    }));

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Productivity Reports & Workload Analytics"
                subtitle="Operational velocity, category throughput, and balanced resource distribution across Royal Software Solutions"
                secondaryActions={[
                    {
                        label: 'Refresh',
                        icon: RefreshCw,
                        onClick: loadAnalytics
                    }
                ]}
            />

            <StatSummaryRibbon items={ribbonStats} />

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Loading analytics data...
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Status Distribution Pie */}
                    <div className="portal-content-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                            Organization Task Status Breakdown
                        </h3>
                        <div style={{ height: '300px' }}>
                            {pieData.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    No task data available for visualization.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={4}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Team Workload Balance */}
                    <div className="portal-content-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                            Team Workload & Execution Distribution
                        </h3>
                        <div style={{ height: '300px' }}>
                            {workloadData.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    No assigned team member tasks to display.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={workloadData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Pending" fill="#005f73" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductivityAnalyticsView;

