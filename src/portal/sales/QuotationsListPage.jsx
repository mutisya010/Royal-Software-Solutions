import React, { useState, useMemo } from 'react';
import {
    FileText,
    Plus,
    Download,
    Mail,
    Send,
    Eye,
    MessageSquare,
    DollarSign,
    CheckCircle2,
    Clock,
    Share2,
    Calendar
} from 'lucide-react';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';
import CreateQuotationModal from '../document-studio/CreateQuotationModal';
import GenerateQuotationModal from '../document-studio/GenerateQuotationModal';
import '../shared/portalShared.css';

const QuotationsListPage = ({
    quotations = [],
    clients = [],
    products = [],
    onRefresh,
    loading = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedQuotationForDoc, setSelectedQuotationForDoc] = useState(null);

    // Compute metrics for Stat Summary Ribbon (Reference Image 4 & 3)
    const ribbonStats = useMemo(() => {
        const total = quotations.length;
        const totalVal = quotations.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);
        const accepted = quotations.filter(q => q.status === 'ACCEPTED').length;
        const pending = quotations.filter(q => q.status === 'DRAFT' || q.status === 'SENT').length;

        return [
            { label: 'Total Quotations', value: total },
            { label: 'Total Quoted Value', value: `KES ${totalVal.toLocaleString()}` },
            { label: 'Accepted Proposals', value: accepted, trend: `${Math.round((accepted / (total || 1)) * 100)}% Win Rate`, trendType: accepted > 0 ? 'positive' : 'neutral' },
            { label: 'Active Pipeline', value: pending, trend: `${pending} In Review` }
        ];
    }, [quotations]);

    // Filter pills with count badges
    const filterPills = useMemo(() => {
        return [
            { id: 'ALL', label: 'All Quotations', count: quotations.length },
            { id: 'DRAFT', label: 'Draft', count: quotations.filter(q => q.status === 'DRAFT').length },
            { id: 'SENT', label: 'Sent', count: quotations.filter(q => q.status === 'SENT').length },
            { id: 'ACCEPTED', label: 'Accepted', count: quotations.filter(q => q.status === 'ACCEPTED').length },
            { id: 'REJECTED', label: 'Rejected', count: quotations.filter(q => q.status === 'REJECTED').length }
        ];
    }, [quotations]);

    // Filtered Quotations
    const filteredQuotations = useMemo(() => {
        return quotations.filter(q => {
            const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
            const term = searchQuery.toLowerCase().trim();
            const matchesSearch = !term ||
                (q.quotation_number || '').toLowerCase().includes(term) ||
                (q.client_name || '').toLowerCase().includes(term);

            return matchesStatus && matchesSearch;
        });
    }, [quotations, statusFilter, searchQuery]);

    const handleCreated = (newQuotation) => {
        if (onRefresh) onRefresh();
        if (newQuotation) {
            setSelectedQuotationForDoc(newQuotation);
        }
    };

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Header */}
            <ListPageHeader
                title="Sales Quotations"
                subtitle="Approved commercial proposals, multi-deliverable estimates, and official document dispatches"
                primaryAction={{
                    label: 'Create New Quotation',
                    icon: Plus,
                    onClick: () => setShowCreateModal(true)
                }}
            />

            {/* 2. Stat Summary Ribbon (Reference Image 4) */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* 3. Search and Status Filter Bar */}
            <ListFilterBar
                searchPlaceholder="Search by quotation reference or client name..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filterPills={filterPills}
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
            />

            {/* 4. Clean Table Presentation (Reference Image 3) */}
            <div className="clean-table-card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                        Loading quotation records...
                    </div>
                ) : filteredQuotations.length === 0 ? (
                    <div className="list-empty-state">
                        <div className="list-empty-icon">
                            <FileText size={28} />
                        </div>
                        <h4>No Quotations Found</h4>
                        <p>No quotation records matched your selected criteria.</p>
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary-teal"
                            style={{ marginTop: '0.5rem' }}
                        >
                            <Plus size={15} /> Create Quotation
                        </button>
                    </div>
                ) : (
                    <div className="clean-table-responsive">
                        <table className="clean-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '16%' }}>Quotation #</th>
                                    <th style={{ width: '24%' }}>Client / Enterprise</th>
                                    <th style={{ width: '15%' }}>Issue Date</th>
                                    <th style={{ width: '15%' }}>Validity</th>
                                    <th style={{ width: '15%' }}>Total Value (KES)</th>
                                    <th style={{ width: '10%' }}>Status</th>
                                    <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredQuotations.map((qt) => (
                                    <tr key={qt.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 8,
                                                    background: '#f0fdfa',
                                                    color: '#0f766e',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <FileText size={15} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{qt.quotation_number}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID #{qt.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{qt.client_name}</div>
                                            {qt.deal_name && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{qt.deal_name}</div>
                                            )}
                                        </td>
                                        <td style={{ color: '#475569' }}>
                                            {qt.issue_date || 'N/A'}
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                            {qt.expiry_date || '30 Days from Issue'}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.92rem' }}>
                                                KES {Number(qt.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            {qt.subtotal_amount && (
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                    Excl. VAT: KES {Number(qt.subtotal_amount).toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <StatusPillBadge status={qt.status} />
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedQuotationForDoc(qt)}
                                                    className="btn-primary-teal"
                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                                    title="Generate & View Official PDF"
                                                >
                                                    <FileText size={13} /> PDF
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedQuotationForDoc(qt)}
                                                    className="btn-secondary-outline"
                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                                    title="Dispatch via Email or WhatsApp"
                                                >
                                                    <Send size={13} /> Dispatch
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Create Quotation */}
            <CreateQuotationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleCreated}
                clients={clients}
                products={products}
            />

            {/* Modal: Generate & Dispatch PDF */}
            <GenerateQuotationModal
                quotation={selectedQuotationForDoc}
                isOpen={Boolean(selectedQuotationForDoc)}
                onClose={() => setSelectedQuotationForDoc(null)}
                onGenerated={() => {
                    if (onRefresh) onRefresh();
                }}
            />
        </div>
    );
};

export default QuotationsListPage;

