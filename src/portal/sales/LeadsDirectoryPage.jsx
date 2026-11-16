import React, { useState, useMemo } from 'react';
import {
    Users,
    UserPlus,
    Zap,
    Search,
    Check,
    X,
    Building2,
    Calendar,
    DollarSign,
    ExternalLink,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';
import { apiClient } from '../../services/apiClient';
import '../shared/portalShared.css';

const LeadsDirectoryPage = ({
    leads = [],
    onRefresh,
    loading = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [convertingId, setConvertingId] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [source, setSource] = useState('Website');
    const [estimatedValue, setEstimatedValue] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Compute Stat Ribbon metrics
    const ribbonStats = useMemo(() => {
        const total = leads.length;
        const totalPipelineValue = leads
            .filter(l => l.status !== 'LOST')
            .reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
        const qualified = leads.filter(l => l.status === 'QUALIFIED').length;
        const newLeads = leads.filter(l => l.status === 'NEW').length;
        const qualRate = total > 0 ? Math.round((qualified / total) * 100) : 0;

        return [
            { label: 'Total Prospects', value: total },
            { 
                label: 'Pipeline Value', 
                value: `KES ${totalPipelineValue.toLocaleString()}`,
                trend: `${totalPipelineValue > 0 ? 'Active' : 'Empty'}`,
                trendType: 'positive'
            },
            { 
                label: 'Qualified Leads', 
                value: qualified, 
                trend: `${qualRate}% Conversion`,
                trendType: qualified > 0 ? 'positive' : 'neutral' 
            },
            { 
                label: 'New Inbounds', 
                value: newLeads, 
                trend: `${newLeads} Action Needed`,
                trendType: newLeads > 0 ? 'positive' : 'neutral'
            }
        ];
    }, [leads]);

    // Filter pills with count badges
    const filterPills = useMemo(() => {
        return [
            { id: 'ALL', label: 'All Prospects', count: leads.length },
            { id: 'NEW', label: 'New Leads', count: leads.filter(l => l.status === 'NEW').length },
            { id: 'CONTACTED', label: 'In Contact', count: leads.filter(l => l.status === 'CONTACTED').length },
            { id: 'QUALIFIED', label: 'Qualified', count: leads.filter(l => l.status === 'QUALIFIED').length },
            { id: 'LOST', label: 'Lost', count: leads.filter(l => l.status === 'LOST').length }
        ];
    }, [leads]);

    // Filtered list
    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const matchesStatus = statusFilter === 'ALL' || (l.status || '').toUpperCase() === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (l.name || '').toLowerCase().includes(q) ||
                (l.company_name || '').toLowerCase().includes(q) ||
                (l.source || '').toLowerCase().includes(q) ||
                (l.assigned_to_name || '').toLowerCase().includes(q);
            return matchesStatus && matchesSearch;
        });
    }, [leads, statusFilter, searchQuery]);

    const handleCreateLead = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            setSubmitting(true);
            await apiClient.royalsoftwares.leads.create({
                name: name.trim(),
                company_name: companyName.trim() || undefined,
                source,
                estimated_value: parseFloat(estimatedValue) || 0,
                status: 'NEW'
            });
            setIsAddModalOpen(false);
            setName('');
            setCompanyName('');
            setEstimatedValue('');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to create lead:', err);
            alert(err?.response?.data?.detail || 'Could not save lead.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConvertToDeal = async (lead) => {
        if (!window.confirm(`Convert prospect "${lead.name}" into an active client and pipeline deal?`)) return;
        try {
            setConvertingId(lead.id);
            const deal = await apiClient.royalsoftwares.leads.convertToDeal(lead.id);
            alert(`✅ Lead successfully converted! Deal "${deal?.name || lead.name}" is now in your sales pipeline.`);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to convert lead:', err);
            alert(err?.response?.data?.detail || 'Could not convert lead to deal.');
        } finally {
            setConvertingId(null);
        }
    };

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Header */}
            <ListPageHeader
                title="Leads & Prospects Directory"
                subtitle="Capture inbound commercial leads, qualify prospects, and promote opportunities into active pipeline deals."
                primaryAction={{
                    label: 'Capture New Lead',
                    icon: UserPlus,
                    onClick: () => setIsAddModalOpen(true)
                }}
            />

            {/* 2. Stat Summary Ribbon */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* 3. Filter & Search Bar */}
            <ListFilterBar
                searchPlaceholder="Search leads by contact, organization, agent, or source..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filterPills={filterPills}
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
            />

            {/* 4. Leads Data Table Card */}
            <div className="portal-content-card" style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem', marginTop: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                        <div className="spin-icon" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>⏳</div>
                        <div>Loading prospects directory...</div>
                    </div>
                ) : filteredLeads.length === 0 ? (
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
                            <Users size={26} />
                        </div>
                        <h4 style={{ margin: '0 0 0.4rem 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 700 }}>
                            {searchQuery || statusFilter !== 'ALL' ? 'No Matching Leads Found' : 'No Sales Leads Recorded Yet'}
                        </h4>
                        <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.88rem', maxWidth: '420px', display: 'inline-block' }}>
                            {searchQuery || statusFilter !== 'ALL'
                                ? 'Try adjusting your search keywords or switching the status filter tab.'
                                : 'Begin building your commercial pipeline by recording your first prospect opportunity.'}
                        </p>
                        <br />
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="btn-primary-teal"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                        >
                            <UserPlus size={16} /> Add First Lead
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="portal-table">
                            <thead>
                                <tr>
                                    <th>Prospect / Organization</th>
                                    <th>Acquisition Source</th>
                                    <th>Assigned Agent</th>
                                    <th>Date Logged</th>
                                    <th>Estimated Value</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => {
                                    const isQualified = (lead.status || '').toUpperCase() === 'QUALIFIED';
                                    const initials = (lead.name || 'L')
                                        .split(' ')
                                        .map(w => w[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase();

                                    return (
                                        <tr key={lead.id} className="hover-bg-light">
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 8,
                                                        background: isQualified ? '#ecfdf5' : '#eff6ff',
                                                        color: isQualified ? '#059669' : '#2563eb',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.82rem',
                                                        fontWeight: 700,
                                                        flexShrink: 0
                                                    }}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                                            {lead.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <Building2 size={12} />
                                                            {lead.company_name || 'Individual Prospect'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.78rem',
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    color: '#475569',
                                                    padding: '0.2rem 0.55rem',
                                                    borderRadius: 6,
                                                    fontWeight: 500
                                                }}>
                                                    {lead.source || 'Direct Outreach'}
                                                </span>
                                            </td>
                                            <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                                                {lead.assigned_to_name || 'Unassigned'}
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                                {lead.date_captured || 'Recent'}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.92rem' }}>
                                                    KES {Number(lead.estimated_value || 0).toLocaleString()}
                                                </div>
                                            </td>
                                            <td>
                                                <StatusPillBadge status={lead.status || 'NEW'} />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                    {!isQualified ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleConvertToDeal(lead)}
                                                            disabled={convertingId === lead.id}
                                                            className="btn-secondary-outline"
                                                            style={{
                                                                padding: '0.35rem 0.65rem',
                                                                fontSize: '0.78rem',
                                                                color: '#047857',
                                                                borderColor: '#a7f3d0',
                                                                background: '#ecfdf5',
                                                                fontWeight: 600
                                                            }}
                                                            title="Convert this qualified lead to a pipeline deal & client"
                                                        >
                                                            <Zap size={13} />
                                                            {convertingId === lead.id ? 'Converting...' : 'Convert to Deal'}
                                                        </button>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: '0.78rem',
                                                            color: '#059669',
                                                            fontWeight: 700,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.3rem',
                                                            padding: '0.35rem 0.65rem'
                                                        }}>
                                                            <Check size={14} /> Pipeline Deal
                                                        </span>
                                                    )}
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

            {/* Add Lead Modal */}
            {isAddModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Capture New Sales Lead</span>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLead}>
                            <div className="planner-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Contact / Lead Name <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Dr. Catherine Nduta"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Company or Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g. Apex Health Logistics Ltd"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Lead Source
                                        </label>
                                        <select
                                            value={source}
                                            onChange={(e) => setSource(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                        >
                                            <option value="Website">Website Inbound</option>
                                            <option value="Referral">Client Referral</option>
                                            <option value="LinkedIn">LinkedIn / Social</option>
                                            <option value="Direct Outreach">Direct Call / Outreach</option>
                                            <option value="Conference">Conference / Event</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Estimated Value (KES)
                                        </label>
                                        <input
                                            type="number"
                                            value={estimatedValue}
                                            onChange={(e) => setEstimatedValue(e.target.value)}
                                            placeholder="e.g. 250000"
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-planner-quick primary">
                                    {submitting ? 'Saving...' : 'Add Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsDirectoryPage;

