import React, { useState, useMemo } from 'react';
import {
    Target,
    Plus,
    Building2,
    Calendar,
    DollarSign,
    TrendingUp,
    FileText,
    Kanban,
    List,
    Search,
    CheckCircle2,
    X,
    Clock,
    Zap,
    Users
} from 'lucide-react';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';
import { apiClient } from '../../services/apiClient';
import '../shared/portalShared.css';

const STAGE_OPTIONS = [
    { key: 'NEW', label: 'New Lead', color: '#64748b' },
    { key: 'CONTACTED', label: 'Initial Contact', color: '#3b82f6' },
    { key: 'QUALIFIED', label: 'Qualified', color: '#8b5cf6' },
    { key: 'PROPOSAL', label: 'Proposal Sent', color: '#f59e0b' },
    { key: 'NEGOTIATION', label: 'Negotiation', color: '#ec4899' },
    { key: 'WON', label: 'Deal Won', color: '#10b981' },
    { key: 'LOST', label: 'Deal Lost', color: '#ef4444' }
];

const DealsManagementPage = ({
    deals = [],
    clients = [],
    onRefresh,
    onNavigateToQuote,
    onSwitchToKanbanView,
    loading = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [updatingStageId, setUpdatingStageId] = useState(null);

    // Create Modal Form state
    const [name, setName] = useState('');
    const [clientId, setClientId] = useState('');
    const [value, setValue] = useState('');
    const [stage, setStage] = useState('NEW');
    const [probability, setProbability] = useState('20');
    const [submitting, setSubmitting] = useState(false);

    // Auto set probability when stage changes
    const handleStageChange = (newStage) => {
        setStage(newStage);
        if (newStage === 'NEW') setProbability('10');
        else if (newStage === 'CONTACTED') setProbability('25');
        else if (newStage === 'QUALIFIED') setProbability('40');
        else if (newStage === 'PROPOSAL') setProbability('70');
        else if (newStage === 'NEGOTIATION') setProbability('85');
        else if (newStage === 'WON') setProbability('100');
        else if (newStage === 'LOST') setProbability('0');
    };

    // Calculate metrics for Stat Summary Ribbon
    const ribbonStats = useMemo(() => {
        const total = deals.length;
        const activeDeals = deals.filter(d => d.stage !== 'WON' && d.stage !== 'LOST');
        const wonDeals = deals.filter(d => d.stage === 'WON');
        const wonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
        const activeValue = activeDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

        const weightedForecast = activeDeals.reduce((sum, d) => {
            const prob = (Number(d.probability_percentage) || 0) / 100;
            return sum + ((Number(d.value) || 0) * prob);
        }, 0);

        return [
            { 
                label: 'Total Deals', 
                value: total,
                trend: `${activeDeals.length} Active`,
                trendType: 'positive'
            },
            { 
                label: 'Active Pipeline Value', 
                value: `KES ${activeValue.toLocaleString()}`,
                trend: 'In Motion',
                trendType: 'positive'
            },
            { 
                label: 'Weighted Forecast', 
                value: `KES ${Math.round(weightedForecast).toLocaleString()}`,
                trend: 'Expected Rev.',
                trendType: 'neutral'
            },
            { 
                label: 'Closed Revenue', 
                value: `KES ${wonValue.toLocaleString()}`,
                trend: `${wonDeals.length} Won`,
                trendType: wonValue > 0 ? 'positive' : 'neutral'
            }
        ];
    }, [deals]);

    // Stage filter pills
    const filterPills = useMemo(() => {
        return [
            { id: 'ALL', label: 'All Deals', count: deals.length },
            { id: 'NEW', label: 'New', count: deals.filter(d => d.stage === 'NEW').length },
            { id: 'QUALIFIED', label: 'Qualified', count: deals.filter(d => d.stage === 'QUALIFIED').length },
            { id: 'PROPOSAL', label: 'Proposal', count: deals.filter(d => d.stage === 'PROPOSAL').length },
            { id: 'NEGOTIATION', label: 'Negotiation', count: deals.filter(d => d.stage === 'NEGOTIATION').length },
            { id: 'WON', label: 'Won', count: deals.filter(d => d.stage === 'WON').length },
            { id: 'LOST', label: 'Lost', count: deals.filter(d => d.stage === 'LOST').length }
        ];
    }, [deals]);

    // Filtered deals
    const filteredDeals = useMemo(() => {
        return deals.filter(d => {
            const matchesStage = stageFilter === 'ALL' || (d.stage || '').toUpperCase() === stageFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (d.name || '').toLowerCase().includes(q) ||
                (d.client_name || '').toLowerCase().includes(q) ||
                (d.assigned_to_name || '').toLowerCase().includes(q);
            return matchesStage && matchesSearch;
        });
    }, [deals, stageFilter, searchQuery]);

    const handleUpdateStage = async (dealId, newStage) => {
        try {
            setUpdatingStageId(dealId);
            await apiClient.royalsoftwares.deals.updateStage(dealId, newStage);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to update deal stage:', err);
            alert(err?.response?.data?.detail || 'Could not update deal stage.');
        } finally {
            setUpdatingStageId(null);
        }
    };

    const handleCreateDealSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !clientId) {
            alert('Please provide Deal Name and select a Client Account.');
            return;
        }
        try {
            setSubmitting(true);
            await apiClient.royalsoftwares.deals.create({
                name: name.trim(),
                client: clientId,
                value: parseFloat(value) || 0,
                stage,
                probability_percentage: parseInt(probability) || 0
            });
            setIsAddModalOpen(false);
            setName('');
            setValue('');
            setClientId('');
            setStage('NEW');
            setProbability('20');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to create deal:', err);
            alert(err?.response?.data?.detail || 'Could not create deal.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Header with View Switcher */}
            <ListPageHeader
                title="Deals Registry & Forecasting"
                subtitle="Complete commercial transaction ledger, win probability weighting, and pipeline conversion."
                primaryAction={{
                    label: 'Create New Deal',
                    icon: Plus,
                    onClick: () => setIsAddModalOpen(true)
                }}
                secondaryActions={[
                    {
                        label: 'Kanban Board View',
                        icon: Kanban,
                        onClick: onSwitchToKanbanView
                    }
                ]}
            />

            {/* 2. Stat Summary Ribbon */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* 3. Search & Filter Pills */}
            <ListFilterBar
                searchPlaceholder="Search deals by opportunity name, client, or agent..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filterPills={filterPills}
                activeFilter={stageFilter}
                onFilterChange={setStageFilter}
            />

            {/* 4. Table Card */}
            <div className="portal-content-card" style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem', marginTop: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                        <div className="spin-icon" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>⏳</div>
                        <div>Loading deals registry...</div>
                    </div>
                ) : filteredDeals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            color: '#94a3b8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1rem'
                        }}>
                            <Target size={26} />
                        </div>
                        <h4 style={{ margin: '0 0 0.4rem 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 700 }}>
                            {searchQuery || stageFilter !== 'ALL' ? 'No Matching Deals Found' : 'No Sales Deals in Registry'}
                        </h4>
                        <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.88rem', maxWidth: '420px', display: 'inline-block' }}>
                            {searchQuery || stageFilter !== 'ALL'
                                ? 'Try clearing your search query or switching your stage filter.'
                                : 'Qualify a lead or click "+ Create New Deal" to register your first opportunity.'}
                        </p>
                        <br />
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="btn-primary-teal"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                        >
                            <Plus size={16} /> Create First Deal
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="portal-table">
                            <thead>
                                <tr>
                                    <th>Deal Opportunity & Client</th>
                                    <th>Deal Value</th>
                                    <th>Pipeline Stage</th>
                                    <th>Win Probability</th>
                                    <th>Assigned Agent</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeals.map((deal) => {
                                    const prob = Number(deal.probability_percentage) || 0;
                                    const isWon = (deal.stage || '').toUpperCase() === 'WON';
                                    const isUpdating = updatingStageId === deal.id;

                                    return (
                                        <tr key={deal.id} className="hover-bg-light" style={{ opacity: isUpdating ? 0.6 : 1 }}>
                                            <td>
                                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                                    {deal.name}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                                                    <Building2 size={12} />
                                                    <span>{deal.client_name || 'Client Account'}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.95rem' }}>
                                                    KES {Number(deal.value || 0).toLocaleString()}
                                                </div>
                                            </td>

                                            <td>
                                                {/* Inline Stage Switcher Dropdown */}
                                                <select
                                                    value={(deal.stage || '').toUpperCase()}
                                                    onChange={(e) => handleUpdateStage(deal.id, e.target.value)}
                                                    disabled={isUpdating}
                                                    title="Advance or modify pipeline stage"
                                                    style={{
                                                        padding: '5px 10px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        color: isWon ? '#047857' : '#334155',
                                                        background: isWon ? '#ecfdf5' : '#ffffff',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {STAGE_OPTIONS.map(st => (
                                                        <option key={st.key} value={st.key}>
                                                            {st.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                <div style={{ width: '130px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                                                        <span style={{ fontWeight: 700, color: prob >= 70 ? '#047857' : (prob >= 40 ? '#854d0e' : '#475569') }}>
                                                            {prob}%
                                                        </span>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                                            {prob >= 70 ? 'High' : (prob >= 40 ? 'Medium' : 'Low')}
                                                        </span>
                                                    </div>
                                                    <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${prob}%`,
                                                            height: '100%',
                                                            background: prob >= 70 ? '#10b981' : (prob >= 40 ? '#f59e0b' : '#3b82f6'),
                                                            borderRadius: '3px'
                                                        }} />
                                                    </div>
                                                </div>
                                            </td>

                                            <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                                                {deal.assigned_to_name || 'Unassigned'}
                                            </td>

                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => onNavigateToQuote && onNavigateToQuote(deal)}
                                                        className="btn-primary-teal"
                                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                                        title="Generate Quotation for this deal"
                                                    >
                                                        <FileText size={13} /> Quotation
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Deal Modal */}
            {isAddModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Register New Sales Deal</span>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateDealSubmit}>
                            <div className="planner-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Deal Name / Project Opportunity <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Enterprise Cloud ERP Implementation"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Client Account <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                        required
                                    >
                                        <option value="">-- Select Client Account --</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.client_company_name ? `(${c.client_company_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Deal Value (KES)
                                        </label>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="e.g. 1500000"
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Initial Pipeline Stage
                                        </label>
                                        <select
                                            value={stage}
                                            onChange={(e) => handleStageChange(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                        >
                                            {STAGE_OPTIONS.map(st => (
                                                <option key={st.key} value={st.key}>
                                                    {st.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Win Probability (%): <strong>{probability}%</strong>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={probability}
                                        onChange={(e) => setProbability(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-planner-quick primary">
                                    {submitting ? 'Creating...' : 'Register Deal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealsManagementPage;
