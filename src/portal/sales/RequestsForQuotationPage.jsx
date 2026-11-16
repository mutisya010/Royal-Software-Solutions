import React, { useState, useMemo } from 'react';
import {
    FileCheck,
    Plus,
    Eye,
    ArrowRight,
    Sparkles,
    Calendar,
    Briefcase,
    DollarSign,
    Clock,
    X,
    Filter
} from 'lucide-react';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';
import CreateRFQModal from './CreateRFQModal';
import CreateQuotationModal from '../document-studio/CreateQuotationModal';
import '../shared/portalShared.css';

const RequestsForQuotationPage = ({
    rfqs = [],
    clients = [],
    products = [],
    onRefresh,
    loading = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showCreateRfqModal, setShowCreateRfqModal] = useState(false);
    const [activeRfqForConvert, setActiveRfqForConvert] = useState(null);
    const [viewingRfq, setViewingRfq] = useState(null);

    // Compute metrics for the Stat Summary Ribbon (Reference Image 4)
    const ribbonStats = useMemo(() => {
        const total = rfqs.length;
        const pending = rfqs.filter(r => r.status === 'PENDING').length;
        const responded = rfqs.filter(r => r.status === 'RESPONDED').length;
        const totalBudget = rfqs.reduce((sum, r) => sum + (Number(r.estimated_budget) || 0), 0);

        return [
            { label: 'Total Inquiries', value: total },
            { label: 'Pending Review', value: pending, trend: `${pending} Actionable`, trendType: pending > 0 ? 'positive' : 'neutral' },
            { label: 'Quoted & Converted', value: responded, trend: `${Math.round((responded / (total || 1)) * 100)}% Conversion` },
            { label: 'Est. Pipeline Value', value: `KES ${totalBudget.toLocaleString()}` }
        ];
    }, [rfqs]);

    // Filter pills with count badges
    const filterPills = useMemo(() => {
        return [
            { id: 'ALL', label: 'All Inquiries', count: rfqs.length },
            { id: 'PENDING', label: 'Pending', count: rfqs.filter(r => r.status === 'PENDING').length },
            { id: 'RESPONDED', label: 'Quoted', count: rfqs.filter(r => r.status === 'RESPONDED').length },
            { id: 'CLOSED', label: 'Closed', count: rfqs.filter(r => r.status === 'CLOSED').length }
        ];
    }, [rfqs]);

    // Filtered RFQs list
    const filteredRfqs = useMemo(() => {
        return rfqs.filter(r => {
            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (r.subject || '').toLowerCase().includes(q) ||
                (r.client_name || '').toLowerCase().includes(q) ||
                (r.description || '').toLowerCase().includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [rfqs, statusFilter, searchQuery]);

    const handleRfqCreated = () => {
        if (onRefresh) onRefresh();
    };

    const handleQuotationCreated = () => {
        setActiveRfqForConvert(null);
        if (onRefresh) onRefresh();
    };

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Header */}
            <ListPageHeader
                title="Requests for Quotation (RFQs)"
                subtitle="Manage inbound customer requirements, review specifications, and convert to verified quotations"
                primaryAction={{
                    label: 'Capture New RFQ',
                    icon: Plus,
                    onClick: () => setShowCreateRfqModal(true)
                }}
            />

            {/* 2. Stat Summary Ribbon (Reference Image 4) */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* 3. Search and Status Filter Bar */}
            <ListFilterBar
                searchPlaceholder="Search by client, subject, or requirements..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filterPills={filterPills}
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
            />

            {/* 4. Table Presentation */}
            <div className="clean-table-card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                        Loading RFQ inquiries from database...
                    </div>
                ) : filteredRfqs.length === 0 ? (
                    <div className="list-empty-state">
                        <div className="list-empty-icon">
                            <FileCheck size={28} />
                        </div>
                        <h4>No RFQ Records Found</h4>
                        <p>No quotation requests matched your search criteria or filter state.</p>
                        <button
                            type="button"
                            onClick={() => setShowCreateRfqModal(true)}
                            className="btn-primary-teal"
                            style={{ marginTop: '0.5rem' }}
                        >
                            <Plus size={15} /> Capture First RFQ
                        </button>
                    </div>
                ) : (
                    <div className="clean-table-responsive">
                        <table className="clean-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '12%' }}>Date</th>
                                    <th style={{ width: '22%' }}>Client / Organization</th>
                                    <th style={{ width: '32%' }}>Scope & Deliverables</th>
                                    <th style={{ width: '14%' }}>Est. Budget</th>
                                    <th style={{ width: '10%' }}>Status</th>
                                    <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRfqs.map((rfq) => (
                                    <tr key={rfq.id}>
                                        <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                            <div style={{ fontWeight: 600, color: '#334155' }}>{rfq.date_requested}</div>
                                            {rfq.preferred_timeline && (
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{rfq.preferred_timeline}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{rfq.client_name || 'Direct Enterprise Client'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID #{rfq.id}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#0f766e', fontSize: '0.88rem' }}>{rfq.subject}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                                                {rfq.description?.length > 80 ? `${rfq.description.substring(0, 80)}...` : rfq.description}
                                            </div>
                                        </td>
                                        <td>
                                            {rfq.estimated_budget ? (
                                                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                                    KES {Number(rfq.estimated_budget).toLocaleString()}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Unspecified</span>
                                            )}
                                        </td>
                                        <td>
                                            <StatusPillBadge
                                                status={rfq.status}
                                                customLabel={rfq.status === 'RESPONDED' ? 'QUOTED' : rfq.status}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingRfq(rfq)}
                                                    className="btn-secondary-outline"
                                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                                                    title="Inspect Scope Details"
                                                >
                                                    <Eye size={13} /> Details
                                                </button>

                                                {rfq.status === 'PENDING' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveRfqForConvert(rfq)}
                                                        className="btn-primary-teal"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                                        title="Convert into Official Quotation"
                                                    >
                                                        Convert <ArrowRight size={13} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveRfqForConvert(rfq)}
                                                        className="btn-secondary-outline"
                                                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: '#0f766e' }}
                                                        title="Re-quote or generate additional proposal"
                                                    >
                                                        Re-quote
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal 1: Create RFQ */}
            <CreateRFQModal
                isOpen={showCreateRfqModal}
                onClose={() => setShowCreateRfqModal(false)}
                onCreated={handleRfqCreated}
                clients={clients}
            />

            {/* Modal 2: Convert to Quotation */}
            {activeRfqForConvert && (
                <CreateQuotationModal
                    isOpen={Boolean(activeRfqForConvert)}
                    onClose={() => setActiveRfqForConvert(null)}
                    onCreated={handleQuotationCreated}
                    clients={clients}
                    products={products}
                    rfq={activeRfqForConvert}
                />
            )}

            {/* Modal 3: View RFQ Scope Detail */}
            {viewingRfq && (
                <div className="doc-modal-overlay" onClick={() => setViewingRfq(null)}>
                    <div className="doc-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
                        <div className="doc-modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>RFQ #{viewingRfq.id}: {viewingRfq.subject}</h3>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Client: {viewingRfq.client_name}</span>
                            </div>
                            <button onClick={() => setViewingRfq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '0.85rem', borderRadius: 8 }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Date Requested:</span>
                                    <div style={{ fontWeight: 600 }}>{viewingRfq.date_requested}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Status:</span>
                                    <div><StatusPillBadge status={viewingRfq.status} /></div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Target Timeline:</span>
                                    <div style={{ fontWeight: 600 }}>{viewingRfq.preferred_timeline || 'Standard'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Estimated Budget:</span>
                                    <div style={{ fontWeight: 700, color: '#0f766e' }}>
                                        {viewingRfq.estimated_budget ? `KES ${Number(viewingRfq.estimated_budget).toLocaleString()}` : 'Unspecified'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Scope & Technical Requirements:</span>
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.85rem', fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-line', marginTop: '0.35rem' }}>
                                    {viewingRfq.description}
                                </div>
                            </div>
                        </div>
                        <div className="doc-modal-footer">
                            <button onClick={() => setViewingRfq(null)} className="btn-secondary-outline">Close</button>
                            {viewingRfq.status === 'PENDING' && (
                                <button
                                    onClick={() => {
                                        const r = viewingRfq;
                                        setViewingRfq(null);
                                        setActiveRfqForConvert(r);
                                    }}
                                    className="btn-primary-teal"
                                >
                                    Convert to Quotation <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestsForQuotationPage;

