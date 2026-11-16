import React, { useState, useMemo } from 'react';
import {
    Activity,
    Plus,
    Target,
    Users,
    DollarSign,
    CheckCircle2,
    TrendingUp,
    FileText,
    Kanban,
    List,
    Building2,
    Calendar,
    ArrowUpRight,
    X,
    Filter
} from 'lucide-react';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import { apiClient } from '../../services/apiClient';
import '../shared/portalShared.css';

const PIPELINE_STAGES = [
    { id: 'new', key: 'NEW', label: 'New Lead', color: '#64748b', bg: '#f1f5f9' },
    { id: 'contacted', key: 'CONTACTED', label: 'Initial Contact', color: '#3b82f6', bg: '#eff6ff' },
    { id: 'qualified', key: 'QUALIFIED', label: 'Qualified', color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'proposal', key: 'PROPOSAL', label: 'Proposal Sent', color: '#f59e0b', bg: '#fffbeb' },
    { id: 'negotiation', key: 'NEGOTIATION', label: 'Negotiation', color: '#ec4899', bg: '#fdf2f8' },
    { id: 'won', key: 'WON', label: 'Deal Won', color: '#10b981', bg: '#ecfdf5' },
    { id: 'lost', key: 'LOST', label: 'Deal Lost', color: '#ef4444', bg: '#fef2f2' }
];

const PipelineBoardPage = ({
    deals = [],
    clients = [],
    onRefresh,
    onNavigateToQuote,
    onSwitchToTableView,
    loading = false
}) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [updatingStageId, setUpdatingStageId] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [clientId, setClientId] = useState('');
    const [value, setValue] = useState('');
    const [stage, setStage] = useState('NEW');
    const [probability, setProbability] = useState('20');
    const [submitting, setSubmitting] = useState(false);

    // Dynamic probability auto-set when stage changes
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
        const lostDeals = deals.filter(d => d.stage === 'LOST');
        const closedCount = wonDeals.length + lostDeals.length;
        const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0;

        const totalActiveValue = activeDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
        const weightedForecast = activeDeals.reduce((sum, d) => {
            const prob = (Number(d.probability_percentage) || 0) / 100;
            return sum + ((Number(d.value) || 0) * prob);
        }, 0);

        return [
            { 
                label: 'Active Deals', 
                value: activeDeals.length,
                trend: `${activeDeals.length} In Motion`,
                trendType: 'positive'
            },
            { 
                label: 'Pipeline Value', 
                value: `KES ${totalActiveValue.toLocaleString()}`,
                trend: 'Active Scope',
                trendType: 'positive'
            },
            { 
                label: 'Weighted Forecast', 
                value: `KES ${Math.round(weightedForecast).toLocaleString()}`,
                trend: 'Probability Adj.',
                trendType: 'neutral'
            },
            { 
                label: 'Win Rate', 
                value: `${winRate}%`,
                trend: `${wonDeals.length} Won`,
                trendType: winRate >= 50 ? 'positive' : 'neutral'
            }
        ];
    }, [deals]);

    const handleUpdateStage = async (dealId, newStage) => {
        try {
            setUpdatingStageId(dealId);
            await apiClient.royalsoftwares.deals.updateStage(dealId, newStage);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to advance deal stage:', err);
            alert(err?.response?.data?.detail || 'Could not update deal stage.');
        } finally {
            setUpdatingStageId(null);
        }
    };

    const handleCreateDealSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !clientId) {
            alert('Please provide Deal Name and select a Client.');
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
            alert(err?.response?.data?.detail || 'Could not save deal.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Header with View Switcher */}
            <ListPageHeader
                title="Commercial Pipeline Board"
                subtitle="Interactive stage movement, probability forecasting, and quotation closing flow."
                primaryAction={{
                    label: 'Create New Deal',
                    icon: Plus,
                    onClick: () => setIsAddModalOpen(true)
                }}
                secondaryActions={[
                    {
                        label: 'Table Registry View',
                        icon: List,
                        onClick: onSwitchToTableView
                    }
                ]}
            />

            {/* 2. Stat Summary Ribbon */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* 3. Kanban Stage Columns Board */}
            <div style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                paddingBottom: '24px',
                minHeight: '620px',
                marginTop: '1.25rem'
            }}>
                {PIPELINE_STAGES.map(stageItem => {
                    const stageDeals = deals.filter(d => (d.stage || '').toUpperCase() === stageItem.key);
                    const stageTotalVal = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

                    return (
                        <div
                            key={stageItem.id}
                            style={{
                                minWidth: '310px',
                                maxWidth: '330px',
                                flex: 1,
                                background: '#f8fafc',
                                padding: '14px',
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Column Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                                paddingBottom: '8px',
                                borderBottom: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: stageItem.color }} />
                                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b' }}>
                                        {stageItem.label}
                                    </h4>
                                </div>
                                <span style={{
                                    background: '#ffffff',
                                    color: '#475569',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    {stageDeals.length}
                                </span>
                            </div>

                            {/* Volume Subtotal */}
                            <div style={{
                                fontSize: '12px',
                                color: '#0f766e',
                                fontWeight: 700,
                                marginBottom: '14px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ color: '#64748b', fontWeight: 500 }}>Stage Volume:</span>
                                <span>KES {stageTotalVal.toLocaleString()}</span>
                            </div>

                            {/* Column Cards Container */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                {stageDeals.length === 0 ? (
                                    <div style={{
                                        padding: '28px 16px',
                                        textAlign: 'center',
                                        fontSize: '12px',
                                        color: '#94a3b8',
                                        fontStyle: 'italic',
                                        border: '1px dashed #cbd5e1',
                                        borderRadius: '10px',
                                        background: '#ffffff'
                                    }}>
                                        No deals in {stageItem.label}
                                    </div>
                                ) : (
                                    stageDeals.map(deal => {
                                        const prob = Number(deal.probability_percentage) || 0;
                                        const isWon = stageItem.key === 'WON';
                                        const isUpdating = updatingStageId === deal.id;

                                        return (
                                            <div
                                                key={deal.id}
                                                className="portal-content-card"
                                                style={{
                                                    padding: '16px',
                                                    borderLeft: `4px solid ${stageItem.color}`,
                                                    borderRadius: '10px',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                                    opacity: isUpdating ? 0.6 : 1,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {/* Header Row */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                                                        DEAL #{deal.id}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: prob >= 70 ? '#047857' : (prob >= 40 ? '#854d0e' : '#475569'),
                                                        fontWeight: 700,
                                                        background: prob >= 70 ? '#ecfdf5' : (prob >= 40 ? '#fefce8' : '#f1f5f9'),
                                                        padding: '2px 7px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        {prob}% Win Prob.
                                                    </span>
                                                </div>

                                                {/* Deal Name */}
                                                <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                                    {deal.name}
                                                </h5>

                                                {/* Client Name */}
                                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Building2 size={13} />
                                                    <span>{deal.client_name || 'Client Account'}</span>
                                                </div>

                                                {/* Probability Progress Bar */}
                                                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${prob}%`, height: '100%', background: stageItem.color, borderRadius: '2px' }} />
                                                </div>

                                                {/* Value & Actions Footer */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    paddingTop: '8px',
                                                    borderTop: '1px solid #f1f5f9'
                                                }}>
                                                    <div>
                                                        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Value</span>
                                                        <span style={{ fontWeight: 800, color: '#0f766e', fontSize: '14px' }}>
                                                            KES {Number(deal.value || 0).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* Stage Selector Dropdown */}
                                                    <select
                                                        value={(deal.stage || '').toUpperCase()}
                                                        onChange={(e) => handleUpdateStage(deal.id, e.target.value)}
                                                        disabled={isUpdating}
                                                        title="Advance or change pipeline stage"
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #cbd5e1',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            color: '#334155',
                                                            background: '#ffffff',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {PIPELINE_STAGES.map(st => (
                                                            <option key={st.key} value={st.key}>
                                                                {st.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Quick Shortcut when WON */}
                                                {isWon && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onNavigateToQuote && onNavigateToQuote(deal)}
                                                        title="Create quotation or bill this closed opportunity"
                                                        style={{
                                                            marginTop: '10px',
                                                            width: '100%',
                                                            background: '#ecfdf5',
                                                            color: '#047857',
                                                            border: '1px solid #a7f3d0',
                                                            borderRadius: '6px',
                                                            padding: '6px 8px',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <FileText size={13} /> 🏆 Generate Quotation
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
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
                                            {PIPELINE_STAGES.map(st => (
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

export default PipelineBoardPage;
