import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle2, Clock, AlertTriangle, Calendar, Flame,
    TrendingUp, Briefcase, Plus, ArrowRight, User, CheckSquare,
    Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import StatusPillBadge from '../shared/StatusPillBadge';

const PlannerDashboard = ({ onNavigateView, onOpenCreateTask }) => {
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.dashboard.get();
            setDashData(data);
        } catch (err) {
            console.error('Failed to load planner dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (taskId) => {
        try {
            await apiClient.planner.tasks.toggleStatus(taskId);
            loadDashboard();
        } catch (err) {
            console.error('Failed to toggle task:', err);
        }
    };

    const handleToggleHabit = async (habitId) => {
        try {
            await apiClient.planner.habits.toggleToday(habitId);
            loadDashboard();
        } catch (err) {
            console.error('Failed to toggle habit:', err);
        }
    };

    const stats = dashData?.stats || {};

    const ribbonStats = useMemo(() => [
        { label: 'My Pending Tasks', value: stats.my_pending_tasks || 0 },
        { label: 'Due Today', value: stats.due_today_count || 0, trend: 'Daily Focus' },
        { label: 'Overdue Warnings', value: stats.overdue_count || 0, trendType: stats.overdue_count > 0 ? 'negative' : 'neutral' },
        { label: 'Active Projects', value: stats.active_projects_count || 0 },
        { label: 'Completed (7 Days)', value: stats.completed_this_week || 0, trendType: 'positive' }
    ], [stats]);

    if (loading) {
        return (
            <div className="planner-container" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                <p>Synthesizing Planner Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="planner-container animations-fade-in">
            {/* Modern SaaS Dashboard Header View (Image 1 & 2 Aesthetic) */}
            <div className="planner-hero-header">
                <div className="planner-hero-main">
                    <div className="planner-hero-badge">
                        <Sparkles size={13} color="#166534" />
                        <span>Hybrid Planner · Strategic Workspace</span>
                    </div>
                    <h1 className="planner-hero-title">
                        Hi, {dashData?.user_name || 'James'}! <br />
                        <span className="planner-hero-subheading">What are your plans for today?</span>
                    </h1>
                    <p className="planner-hero-desc">
                        This platform is designed to revolutionize the way you organize, prioritize, and access your operational deliverables.
                    </p>
                    <div className="planner-hero-quick-meta">
                        <span className="planner-meta-tag">
                            <strong>{stats.my_pending_tasks || 0}</strong> Tasks Pending
                        </span>
                        <span className="planner-meta-tag">
                            <strong>{stats.due_today_count || 0}</strong> Due Today
                        </span>
                        <span className="planner-meta-tag">
                            <strong>{stats.active_projects_count || 0}</strong> Active Projects
                        </span>
                    </div>
                </div>

                {/* 3 Reference Feature Cards (Stay organized, Sync notes/schedule, Collaborate) */}
                <div className="planner-feature-cards">
                    <div
                        className="planner-feature-card cursor-pointer"
                        onClick={() => onNavigateView('tasks')}
                    >
                        <div className="feature-card-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            <CheckSquare size={22} />
                        </div>
                        <h4 className="feature-card-title">Stay organized</h4>
                        <p className="feature-card-desc">A clear structure for tasks, routines and deliverables</p>
                        <div className="feature-card-action">View Tasks →</div>
                    </div>

                    <div
                        className="planner-feature-card cursor-pointer"
                        onClick={() => onNavigateView('calendar')}
                    >
                        <div className="feature-card-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            <Calendar size={22} />
                        </div>
                        <h4 className="feature-card-title">Sync your schedule</h4>
                        <p className="feature-card-desc">Keep calendar deadlines & appointments synced</p>
                        <div className="feature-card-action">Open Calendar →</div>
                    </div>

                    <div
                        className="planner-feature-card cursor-pointer"
                        onClick={() => onNavigateView('projects')}
                    >
                        <div className="feature-card-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                            <Briefcase size={22} />
                        </div>
                        <h4 className="feature-card-title">Collaborate & share</h4>
                        <p className="feature-card-desc">Share project milestones and track team execution</p>
                        <div className="feature-card-action">Manage Work →</div>
                    </div>
                </div>
            </div>

            {/* Quick Action Bar */}
            <div className="planner-quick-bar">
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Quick Planner Actions:
                </span>
                <div className="planner-quick-actions">
                    <button className="btn-planner-quick primary" onClick={onOpenCreateTask}>
                        <CheckSquare size={14} /> New Task
                    </button>
                    <button className="btn-planner-quick" onClick={() => onNavigateView('meetings')}>
                        <Calendar size={14} /> Schedule Meeting
                    </button>
                    <button className="btn-planner-quick" onClick={() => onNavigateView('projects')}>
                        <Briefcase size={14} /> New Project
                    </button>
                    <button className="btn-planner-quick" onClick={() => onNavigateView('habits')}>
                        <Flame size={14} color="#ea580c" /> Track Habit
                    </button>
                    <button className="btn-planner-quick" onClick={() => onNavigateView('goals')}>
                        <TrendingUp size={14} color="#0a9396" /> Strategic Goal
                    </button>
                </div>
            </div>

            {/* Metric Ribbon */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* Grid Layout: Agenda & Overdue */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {/* 1. Today's Agenda */}
                <div className="portal-content-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                                Today's Work Agenda
                            </h3>
                            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                Committed deliverables due before end of day
                            </p>
                        </div>
                        <button onClick={() => onNavigateView('tasks')} className="btn-planner-quick">
                            View All <ArrowRight size={13} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {dashData?.agenda_tasks?.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                                No pending tasks scheduled for today. Great job!
                            </div>
                        ) : (
                            dashData?.agenda_tasks?.map(task => (
                                <div
                                    key={task.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'COMPLETED'}
                                            onChange={() => handleToggleTask(task.id)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                                                {task.title}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                                <span>{task.reference_code || 'TSK'}</span>
                                                {task.project_name && <span>• {task.project_name}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusPillBadge status={task.priority} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Overdue Tasks & Warnings */}
                <div className="portal-content-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={18} color="#dc2626" /> Critical & Overdue Items
                            </h3>
                            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                Items requiring immediate attention or rescheduling
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {dashData?.overdue_tasks?.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#10b981', fontSize: '0.88rem' }}>
                                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                                Zero overdue deliverables across your workspace.
                            </div>
                        ) : (
                            dashData?.overdue_tasks?.map(task => (
                                <div
                                    key={task.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        background: '#fef2f2',
                                        borderRadius: '10px',
                                        border: '1px solid #fecaca'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b' }}>
                                            {task.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '2px' }}>
                                            Due: {task.due_date} ({task.reference_code})
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleTask(task.id)}
                                        className="btn-planner-quick"
                                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                    >
                                        Mark Done
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Habits & Strategic Goals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {/* Daily Habits Streak */}
                <div className="portal-content-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Flame size={18} color="#ea580c" /> Habits & Consistency
                            </h3>
                            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                Daily performance and routine streak tracker
                            </p>
                        </div>
                        <button onClick={() => onNavigateView('habits')} className="btn-planner-quick">
                            View All
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {dashData?.habits?.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                No habits tracked yet. Click "Track Habit" to start building your routine!
                            </div>
                        ) : (
                            dashData?.habits?.slice(0, 4).map(h => (
                                <div
                                    key={h.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        background: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="checkbox"
                                            checked={h.completed_today}
                                            onChange={() => handleToggleHabit(h.id)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                                                {h.title}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                                {h.frequency}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="habit-streak-pill">
                                        <Flame size={13} color="#ea580c" /> {h.current_streak} days
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Active Goals */}
                <div className="portal-content-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <TrendingUp size={18} color="#0a9396" /> Strategic Goals & OKRs
                            </h3>
                            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                Measurable milestone and target progress
                            </p>
                        </div>
                        <button onClick={() => onNavigateView('goals')} className="btn-planner-quick">
                            View All
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {dashData?.goals?.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                No active goals recorded.
                            </div>
                        ) : (
                            dashData?.goals?.map(g => (
                                <div key={g.id} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{g.title}</span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#005f73' }}>{g.progress_pct}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${g.progress_pct}%`, height: '100%', background: '#0a9396', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlannerDashboard;

