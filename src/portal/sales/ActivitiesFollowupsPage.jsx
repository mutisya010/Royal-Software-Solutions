import React, { useState, useMemo } from 'react';
import {
    Phone,
    Users,
    MessageSquare,
    Mail,
    FileText,
    Plus,
    CheckCircle2,
    Clock,
    Calendar,
    AlertCircle,
    X,
    Check
} from 'lucide-react';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';
import { apiClient } from '../../services/apiClient';
import '../shared/portalShared.css';

const ActivitiesFollowupsPage = ({
    activities = [],
    clients = [],
    deals = [],
    onRefresh,
    loading = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [showLogModal, setShowLogModal] = useState(false);

    // Form state for logging
    const [newType, setNewType] = useState('CALL');
    const [newClient, setNewClient] = useState('');
    const [newDeal, setNewDeal] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newDueDate, setNewDueDate] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    // Stat Ribbon Metrics (Reference Image 1 & 4)
    const ribbonStats = useMemo(() => {
        const total = activities.length;
        const pending = activities.filter(a => (a.status || 'PENDING') !== 'COMPLETED').length;
        const completed = activities.filter(a => a.status === 'COMPLETED').length;
        const callsMeetings = activities.filter(a => a.activity_type === 'CALL' || a.activity_type === 'MEETING').length;

        return [
            { label: 'Total Follow-ups', value: total },
            { label: 'Pending Action', value: pending, trend: `${pending} Due`, trendType: pending > 0 ? 'positive' : 'neutral' },
            { label: 'Completed', value: completed, trend: `${Math.round((completed / (total || 1)) * 100)}% Execution` },
            { label: 'Calls & Meetings', value: callsMeetings }
        ];
    }, [activities]);

    // Pill filters
    const filterPills = useMemo(() => {
        return [
            { id: 'ALL', label: 'All Activities', count: activities.length },
            { id: 'CALL', label: 'Phone Calls', count: activities.filter(a => a.activity_type === 'CALL').length },
            { id: 'MEETING', label: 'Meetings', count: activities.filter(a => a.activity_type === 'MEETING').length },
            { id: 'WHATSAPP', label: 'WhatsApp', count: activities.filter(a => a.activity_type === 'WHATSAPP').length },
            { id: 'EMAIL', label: 'Emails', count: activities.filter(a => a.activity_type === 'EMAIL').length },
            { id: 'NOTE', label: 'Internal Notes', count: activities.filter(a => a.activity_type === 'NOTE').length }
        ];
    }, [activities]);

    // Filtered activities
    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            const matchesType = typeFilter === 'ALL' || act.activity_type === typeFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (act.client_name || '').toLowerCase().includes(q) ||
                (act.notes || '').toLowerCase().includes(q) ||
                (act.agent_name || '').toLowerCase().includes(q);

            return matchesType && matchesSearch;
        });
    }, [activities, typeFilter, searchQuery]);

    const handleToggleStatus = async (actId) => {
        try {
            setTogglingId(actId);
            await apiClient.royalsoftwares.activities.toggleStatus(actId);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to toggle status:', err);
        } finally {
            setTogglingId(null);
        }
    };

    const handleCreateActivity = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                activity_type: newType,
                client: newClient || null,
                deal: newDeal || null,
                date: newDate,
                due_date: newDueDate || null,
                notes: newNotes,
                status: 'PENDING'
            };

            await apiClient.royalsoftwares.activities.create(payload);
            setShowLogModal(false);
            setNewNotes('');
            if (onRefresh) onRefresh();
        } catch (err) {
            alert(err.message || 'Failed to save follow-up activity');
        } finally {
            setSaving(false);
        }
    };

    const getChannelIcon = (type) => {
        switch (type) {
            case 'CALL': return <Phone size={16} color="#2563eb" />;
            case 'MEETING': return <Users size={16} color="#7c3aed" />;
            case 'WHATSAPP': return <MessageSquare size={16} color="#16a34a" />;
            case 'EMAIL': return <Mail size={16} color="#0f766e" />;
            default: return <FileText size={16} color="#d97706" />;
        }
    };

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Header */}
            <ListPageHeader
                title="Sales Activities & Follow-ups"
                subtitle="Track customer interactions, schedule client calls and demos, and resolve commercial action items"
                primaryAction={{
                    label: 'Log New Follow-up',
                    icon: Plus,
                    onClick: () => setShowLogModal(true)
                }}
            />

            {/* 2. Stat Summary Ribbon (Reference Image 1 & 4) */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* 3. Search and Type Filter Bar */}
            <ListFilterBar
                searchPlaceholder="Search follow-ups by client, remarks, or sales agent..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filterPills={filterPills}
                activeFilter={typeFilter}
                onFilterChange={setTypeFilter}
            />

            {/* 4. Activity Cards Feed (Reference Image 1 - Tasks & Scheduling) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                        Loading activities & follow-ups...
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="clean-table-card">
                        <div className="list-empty-state">
                            <div className="list-empty-icon">
                                <Clock size={28} />
                            </div>
                            <h4>No Activities Found</h4>
                            <p>No sales follow-ups or agenda items matched your selected filter.</p>
                            <button
                                type="button"
                                onClick={() => setShowLogModal(true)}
                                className="btn-primary-teal"
                                style={{ marginTop: '0.5rem' }}
                            >
                                <Plus size={15} /> Log First Follow-up
                            </button>
                        </div>
                    </div>
                ) : (
                    filteredActivities.map((act) => {
                        const isDone = act.status === 'COMPLETED';
                        return (
                            <div
                                key={act.id}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 14,
                                    padding: '1.15rem 1.35rem',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start',
                                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px'
                                }}>
                                    {getChannelIcon(act.activity_type)}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                                {act.activity_type}: {act.client_name || 'Client Follow-up'}
                                            </span>
                                            {act.deal_name && (
                                                <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                                                    Deal: {act.deal_name}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <StatusPillBadge status={act.status || 'PENDING'} />
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(act.id)}
                                                disabled={togglingId === act.id}
                                                className="btn-secondary-outline"
                                                style={{
                                                    fontSize: '0.78rem',
                                                    padding: '0.25rem 0.65rem',
                                                    borderColor: isDone ? '#bbf7d0' : '#e2e8f0',
                                                    color: isDone ? '#15803d' : '#475569',
                                                    background: isDone ? '#f0fdf4' : '#ffffff'
                                                }}
                                            >
                                                {isDone ? <Check size={12} /> : <CheckCircle2 size={12} />}
                                                {isDone ? 'Re-open' : 'Mark Done'}
                                            </button>
                                        </div>
                                    </div>

                                    <p style={{ margin: '0.5rem 0', fontSize: '0.86rem', color: '#334155', lineHeight: 1.5 }}>
                                        {act.notes || 'No specific agenda remarks recorded.'}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#94a3b8', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <span>Logged by: <strong>{act.agent_name || 'Staff'}</strong> • Executed: {act.date} {act.time || ''}</span>
                                        {act.due_date && (
                                            <span style={{ color: '#d97706', fontWeight: 700, background: '#fef3c7', padding: '1px 8px', borderRadius: 4 }}>
                                                Follow-up Due: {act.due_date}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal: Log Follow-up Activity */}
            {showLogModal && (
                <div className="doc-modal-overlay" onClick={() => setShowLogModal(false)}>
                    <div className="doc-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                        <div className="doc-modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Log Sales Follow-up Activity</h3>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Schedule a client call, meeting, or milestone action item</span>
                            </div>
                            <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateActivity}>
                            <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                <div className="prop-form-group">
                                    <label>Channel / Activity Type</label>
                                    <select value={newType} onChange={e => setNewType(e.target.value)} className="prop-input">
                                        <option value="CALL">Phone Call</option>
                                        <option value="MEETING">Client Meeting / Demo</option>
                                        <option value="WHATSAPP">WhatsApp Discussion</option>
                                        <option value="EMAIL">Email Dispatch</option>
                                        <option value="NOTE">Internal Milestone Note</option>
                                    </select>
                                </div>

                                <div className="prop-form-group">
                                    <label>Client Organization</label>
                                    <select value={newClient} onChange={e => setNewClient(e.target.value)} className="prop-input">
                                        <option value="">-- Choose Client --</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="prop-form-group">
                                    <label>Related Sales Deal (Optional)</label>
                                    <select value={newDeal} onChange={e => setNewDeal(e.target.value)} className="prop-input">
                                        <option value="">-- None / General --</option>
                                        {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                    <div className="prop-form-group">
                                        <label>Date Conducted</label>
                                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="prop-input" required />
                                    </div>
                                    <div className="prop-form-group">
                                        <label>Follow-up Due Date</label>
                                        <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="prop-input" />
                                    </div>
                                </div>

                                <div className="prop-form-group">
                                    <label>Discussion Remarks & Action Items *</label>
                                    <textarea
                                        rows={3}
                                        value={newNotes}
                                        onChange={e => setNewNotes(e.target.value)}
                                        placeholder="Record meeting decisions, customer feedback, next steps..."
                                        className="prop-input"
                                        style={{ resize: 'vertical' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="doc-modal-footer">
                                <button type="button" onClick={() => setShowLogModal(false)} className="btn-secondary-outline">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-primary-teal">
                                    {saving ? 'Saving...' : 'Save Activity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivitiesFollowupsPage;

