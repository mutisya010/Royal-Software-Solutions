import React, { useState, useMemo } from 'react';
import {
    History,
    Plus,
    Building2,
    Calendar,
    DollarSign,
    Package,
    Search,
    CheckCircle2,
    X,
    Clock,
    FileText,
    TrendingUp,
    Users
} from 'lucide-react';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';
import { apiClient } from '../../services/apiClient';
import '../shared/portalShared.css';

const SalesRegistryPage = ({
    sales = [],
    clients = [],
    products = [],
    quotations = [],
    onRefresh,
    loading = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form state
    const [clientId, setClientId] = useState('');
    const [productId, setProductId] = useState('');
    const [quotationId, setQuotationId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState('');
    const [totalPrice, setTotalPrice] = useState('');
    const [saleStatus, setSaleStatus] = useState('COMPLETED');
    const [submitting, setSubmitting] = useState(false);

    // Auto-fill price when product is selected
    const handleProductSelect = (selectedId) => {
        setProductId(selectedId);
        const prod = products.find(p => String(p.id) === String(selectedId));
        if (prod) {
            const price = Number(prod.price || prod.unit_price || 0);
            setUnitPrice(price);
            setTotalPrice(price * (quantity || 1));
        }
    };

    // Auto update total when quantity or unit price changes
    const handleQtyChange = (qty) => {
        const parsed = parseInt(qty) || 1;
        setQuantity(parsed);
        if (unitPrice) {
            setTotalPrice(parsed * Number(unitPrice));
        }
    };

    // Auto update total when unit price changes manually
    const handleUnitPriceChange = (price) => {
        setUnitPrice(price);
        setTotalPrice((quantity || 1) * Number(price || 0));
    };

    // Calculate metrics for Stat Summary Ribbon
    const ribbonStats = useMemo(() => {
        const total = sales.length;
        const totalRevenue = sales
            .filter(s => (s.status || '').toUpperCase() !== 'CANCELLED')
            .reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
        const completed = sales.filter(s => (s.status || '').toUpperCase() === 'COMPLETED').length;
        const pending = sales.filter(s => (s.status || '').toUpperCase() === 'PENDING').length;

        return [
            { 
                label: 'Total Orders', 
                value: total,
                trend: `${completed} Fulfilled`,
                trendType: 'positive'
            },
            { 
                label: 'Gross Revenue', 
                value: `KES ${totalRevenue.toLocaleString()}`,
                trend: 'Commercial Ledger',
                trendType: 'positive'
            },
            { 
                label: 'Completed Sales', 
                value: completed, 
                trend: `${total > 0 ? Math.round((completed / total) * 100) : 0}% Execution`,
                trendType: 'positive'
            },
            { 
                label: 'Pending Fulfillment', 
                value: pending, 
                trend: `${pending} In Progress`,
                trendType: pending > 0 ? 'neutral' : 'positive'
            }
        ];
    }, [sales]);

    // Status filter pills
    const filterPills = useMemo(() => {
        return [
            { id: 'ALL', label: 'All Transactions', count: sales.length },
            { id: 'COMPLETED', label: 'Completed', count: sales.filter(s => (s.status || '').toUpperCase() === 'COMPLETED').length },
            { id: 'PENDING', label: 'Pending', count: sales.filter(s => (s.status || '').toUpperCase() === 'PENDING').length },
            { id: 'CANCELLED', label: 'Cancelled', count: sales.filter(s => (s.status || '').toUpperCase() === 'CANCELLED').length }
        ];
    }, [sales]);

    // Filtered sales
    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchesStatus = statusFilter === 'ALL' || (sale.status || '').toUpperCase() === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (sale.sale_number || '').toLowerCase().includes(q) ||
                (sale.client_name || '').toLowerCase().includes(q) ||
                (sale.product_name || '').toLowerCase().includes(q) ||
                (sale.recorded_by_name || '').toLowerCase().includes(q) ||
                (sale.quotation_number || '').toLowerCase().includes(q);
            return matchesStatus && matchesSearch;
        });
    }, [sales, statusFilter, searchQuery]);

    const handleCreateSaleSubmit = async (e) => {
        e.preventDefault();
        if (!clientId || !productId) {
            alert('Please select a Client Account and Product/Service.');
            return;
        }
        try {
            setSubmitting(true);
            await apiClient.royalsoftwares.sales.create({
                client: clientId,
                product: productId,
                quotation: quotationId || null,
                quantity: parseInt(quantity) || 1,
                total_price: parseFloat(totalPrice) || 0,
                status: saleStatus
            });
            setIsAddModalOpen(false);
            setClientId('');
            setProductId('');
            setQuotationId('');
            setQuantity(1);
            setUnitPrice('');
            setTotalPrice('');
            setSaleStatus('COMPLETED');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to record sale:', err);
            alert(err?.response?.data?.detail || 'Could not record sale.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Header */}
            <ListPageHeader
                title="Sales Registry & Closed Orders"
                subtitle="Live commercial revenue ledger, client order execution, and product delivery tracking."
                primaryAction={{
                    label: 'Record New Sale',
                    icon: Plus,
                    onClick: () => setIsAddModalOpen(true)
                }}
            />

            {/* 2. Stat Summary Ribbon */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* 3. Search & Filter Bar */}
            <ListFilterBar
                searchPlaceholder="Search sales by order #, client, product, or quotation..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filterPills={filterPills}
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
            />

            {/* 4. Table Card */}
            <div className="portal-content-card" style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem', marginTop: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                        <div className="spin-icon" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>⏳</div>
                        <div>Loading sales ledger...</div>
                    </div>
                ) : filteredSales.length === 0 ? (
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
                            <History size={26} />
                        </div>
                        <h4 style={{ margin: '0 0 0.4rem 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 700 }}>
                            {searchQuery || statusFilter !== 'ALL' ? 'No Matching Sales Found' : 'No Recorded Sales in Registry'}
                        </h4>
                        <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.88rem', maxWidth: '420px', display: 'inline-block' }}>
                            {searchQuery || statusFilter !== 'ALL'
                                ? 'Try adjusting your search criteria or switching the filter tab.'
                                : 'Record commercial sales orders directly or convert accepted quotations into orders.'}
                        </p>
                        <br />
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="btn-primary-teal"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                        >
                            <Plus size={16} /> Record First Sale
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="portal-table">
                            <thead>
                                <tr>
                                    <th>Order # & Date</th>
                                    <th>Client / Organization</th>
                                    <th>Product / Service</th>
                                    <th>Qty</th>
                                    <th>Total Price</th>
                                    <th>Status</th>
                                    <th>Quotation Ref</th>
                                    <th>Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover-bg-light">
                                        <td>
                                            <div style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.9rem' }}>
                                                {sale.sale_number}
                                            </div>
                                            <div style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                                                <Calendar size={11} />
                                                <span>{sale.sale_date || 'Recent'}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                                {sale.client_name || 'Client Account'}
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 600, fontSize: '0.88rem' }}>
                                                <Package size={14} color="#64748b" />
                                                <span>{sale.product_name || 'Product / Service'}</span>
                                            </div>
                                        </td>

                                        <td style={{ color: '#475569', fontSize: '0.88rem', fontWeight: 600 }}>
                                            {sale.quantity || 1}
                                        </td>

                                        <td>
                                            <div style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.95rem' }}>
                                                KES {Number(sale.total_price || 0).toLocaleString()}
                                            </div>
                                        </td>

                                        <td>
                                            <StatusPillBadge status={sale.status || 'COMPLETED'} />
                                        </td>

                                        <td>
                                            {sale.quotation_number ? (
                                                <span style={{
                                                    fontSize: '0.78rem',
                                                    color: '#2563eb',
                                                    background: '#eff6ff',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontWeight: 600
                                                }}>
                                                    {sale.quotation_number}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Direct Sale</span>
                                            )}
                                        </td>

                                        <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                            {sale.recorded_by_name || 'Commercial Team'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Record Sale Modal */}
            {isAddModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Record Commercial Sale</span>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSaleSubmit}>
                            <div className="planner-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
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

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Product or Service <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={productId}
                                        onChange={(e) => handleProductSelect(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                        required
                                    >
                                        <option value="">-- Select Product / Service --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (KES {Number(p.price || p.unit_price || 0).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => handleQtyChange(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Unit Price (KES)
                                        </label>
                                        <input
                                            type="number"
                                            value={unitPrice}
                                            onChange={(e) => handleUnitPriceChange(e.target.value)}
                                            placeholder="KES Price"
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Total Price (KES)
                                        </label>
                                        <input
                                            type="number"
                                            value={totalPrice}
                                            onChange={(e) => setTotalPrice(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, color: '#0f766e' }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Order Status
                                        </label>
                                        <select
                                            value={saleStatus}
                                            onChange={(e) => setSaleStatus(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                        >
                                            <option value="COMPLETED">Completed</option>
                                            <option value="PENDING">Pending Delivery</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Link to Quotation (Optional)
                                    </label>
                                    <select
                                        value={quotationId}
                                        onChange={(e) => setQuotationId(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                    >
                                        <option value="">-- No Linked Quotation --</option>
                                        {quotations.map(q => (
                                            <option key={q.id} value={q.id}>
                                                {q.quotation_number} - {q.client_name} (KES {Number(q.total_amount || 0).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-planner-quick primary">
                                    {submitting ? 'Recording...' : 'Save Order to Registry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesRegistryPage;
