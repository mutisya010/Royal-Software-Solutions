import React, { useState } from 'react';
import {
    Search,
    Plus,
    Filter,
    Edit3,
    CheckCircle2,
    XCircle,
    Layers,
    Tag,
    DollarSign,
    RefreshCw,
    X
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

const ProductsServicesCatalogue = ({ products, onRefresh, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [form, setForm] = useState({
        item_code: '',
        name: '',
        type: 'SERVICE',
        category: 'Software Development',
        pricing_model: 'FIXED',
        unit_of_measure: 'Deliverable',
        price: '',
        tax_rate: '16.00',
        description: '',
        internal_notes: '',
        is_active: true
    });

    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

    const filtered = products.filter(item => {
        const matchesSearch =
            (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.item_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
        return matchesSearch && matchesType && matchesCategory;
    });

    const openCreateModal = () => {
        setEditingItem(null);
        setForm({
            item_code: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            name: '',
            type: 'SERVICE',
            category: 'Software Development',
            pricing_model: 'FIXED',
            unit_of_measure: 'Deliverable',
            price: '',
            tax_rate: '16.00',
            description: '',
            internal_notes: '',
            is_active: true
        });
        setError(null);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setForm({
            item_code: item.item_code || '',
            name: item.name || '',
            type: item.type || 'SERVICE',
            category: item.category || 'Software Development',
            pricing_model: item.pricing_model || 'FIXED',
            unit_of_measure: item.unit_of_measure || 'Unit',
            price: item.price || '',
            tax_rate: item.tax_rate || '16.00',
            description: item.description || '',
            internal_notes: item.internal_notes || '',
            is_active: item.is_active !== false
        });
        setError(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);

            const payload = {
                ...form,
                price: parseFloat(form.price) || 0,
                tax_rate: parseFloat(form.tax_rate) || 16.0
            };

            if (editingItem) {
                await apiClient.put(`/api/v1/royalsoftwares/products/${editingItem.id}/`, payload);
            } else {
                await apiClient.post('/api/v1/royalsoftwares/products/', payload);
            }

            setShowModal(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(err.message || 'Failed to save catalogue item.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (item) => {
        try {
            await apiClient.put(`/api/v1/royalsoftwares/products/${item.id}/`, {
                is_active: !item.is_active
            });
            if (onRefresh) onRefresh();
        } catch (err) {
            alert(`Failed to update status: ${err.message}`);
        }
    };

    return (
        <div className="portal-content-card animations-fade-in" style={{ padding: '25px' }}>
            {/* Header & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        Product & Service Catalogue
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Official pricing models, service descriptions, and units of measure for Royal Software Solutions.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={openCreateModal}
                        className="btn-primary"
                        style={{ padding: '10px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: '#0f766e', border: 'none', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                    >
                        <Plus size={16} /> New Catalogue Item
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search catalogue..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '6px 12px 6px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '220px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                        {['ALL', 'SERVICE', 'PRODUCT'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    border: '1px solid #e2e8f0',
                                    background: typeFilter === t ? '#0f766e' : '#ffffff',
                                    color: typeFilter === t ? '#ffffff' : '#64748b',
                                    cursor: 'pointer'
                                }}
                            >
                                {t === 'ALL' ? 'All Types' : t}
                            </button>
                        ))}
                    </div>

                    {categories.length > 0 && (
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff', color: '#475569' }}
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {filtered.length} {filtered.length === 1 ? 'item' : 'items'} listed
                </div>
            </div>

            {/* Catalogue Table */}
            <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569', fontWeight: 700 }}>
                            <th style={{ padding: '12px 15px' }}>Code</th>
                            <th style={{ padding: '12px 15px' }}>Item & Description</th>
                            <th style={{ padding: '12px 15px' }}>Type</th>
                            <th style={{ padding: '12px 15px' }}>Category</th>
                            <th style={{ padding: '12px 15px' }}>Pricing Model</th>
                            <th style={{ padding: '12px 15px', textAlign: 'right' }}>Default Rate (KES)</th>
                            <th style={{ padding: '12px 15px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '12px 15px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                                    No catalogue items match your criteria. Click "New Catalogue Item" to register products and services.
                                </td>
                            </tr>
                        ) : (
                            filtered.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-bg-light">
                                    <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontWeight: 600, color: '#0f766e' }}>
                                        {item.item_code || '—'}
                                    </td>
                                    <td style={{ padding: '12px 15px' }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                                        {item.description && (
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', maxWidth: '320px' }}>
                                                {item.description}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 15px' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: item.type === 'SERVICE' ? '#eff6ff' : '#f0fdf4',
                                            color: item.type === 'SERVICE' ? '#2563eb' : '#16a34a'
                                        }}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 15px', color: '#475569', fontSize: '12.5px' }}>
                                        {item.category || 'General'}
                                    </td>
                                    <td style={{ padding: '12px 15px', color: '#64748b', fontSize: '12.5px' }}>
                                        {item.pricing_model || 'FIXED'} / {item.unit_of_measure || 'Unit'}
                                    </td>
                                    <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                        KES {Number(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                        <span
                                            onClick={() => handleToggleActive(item)}
                                            style={{
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: item.is_active ? '#dcfce7' : '#fee2e2',
                                                color: item.is_active ? '#15803d' : '#b91c1c'
                                            }}
                                            title="Click to toggle status"
                                        >
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => openEditModal(item)}
                                            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}
                                            title="Edit Catalogue Item"
                                        >
                                            <Edit3 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Item Modal */}
            {showModal && (
                <div className="doc-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="doc-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="doc-modal-header">
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                                {editingItem ? 'Edit Catalogue Item' : 'New Catalogue Item'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {error && (
                                    <div style={{ padding: '0.65rem 1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem' }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                    <div className="prop-form-group">
                                        <label>Item / SKU Code</label>
                                        <input
                                            type="text"
                                            value={form.item_code}
                                            onChange={(e) => setForm(prev => ({ ...prev, item_code: e.target.value }))}
                                            className="prop-input"
                                            placeholder="e.g. ERP-CORE"
                                        />
                                    </div>
                                    <div className="prop-form-group">
                                        <label>Deliverable / Product Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="prop-input"
                                            required
                                            placeholder="e.g. Custom ERP Architecture"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    <div className="prop-form-group">
                                        <label>Type</label>
                                        <select
                                            value={form.type}
                                            onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                                            className="prop-input"
                                        >
                                            <option value="SERVICE">Service</option>
                                            <option value="PRODUCT">Product</option>
                                        </select>
                                    </div>
                                    <div className="prop-form-group">
                                        <label>Category</label>
                                        <input
                                            type="text"
                                            value={form.category}
                                            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                                            className="prop-input"
                                            placeholder="e.g. Cloud, ERP"
                                        />
                                    </div>
                                    <div className="prop-form-group">
                                        <label>Pricing Model</label>
                                        <select
                                            value={form.pricing_model}
                                            onChange={(e) => setForm(prev => ({ ...prev, pricing_model: e.target.value }))}
                                            className="prop-input"
                                        >
                                            <option value="FIXED">Fixed Price</option>
                                            <option value="HOURLY">Hourly Rate</option>
                                            <option value="MONTHLY">Monthly Subscription</option>
                                            <option value="PROJECT">Project-based</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="prop-form-group">
                                        <label>Default Rate (KES)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.price}
                                            onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                                            className="prop-input"
                                            required
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="prop-form-group">
                                        <label>Unit of Measure</label>
                                        <input
                                            type="text"
                                            value={form.unit_of_measure}
                                            onChange={(e) => setForm(prev => ({ ...prev, unit_of_measure: e.target.value }))}
                                            className="prop-input"
                                            placeholder="e.g. Hour, Month, Deliverable"
                                        />
                                    </div>
                                </div>

                                <div className="prop-form-group">
                                    <label>Scope Description (Appears on Quotations)</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                        className="prop-input"
                                        style={{ resize: 'vertical' }}
                                        placeholder="Clear outline of services and deliverables provided..."
                                    />
                                </div>

                                <div className="prop-form-group">
                                    <label>Internal Notes & Cost Basis (Staff Only)</label>
                                    <textarea
                                        value={form.internal_notes}
                                        onChange={(e) => setForm(prev => ({ ...prev, internal_notes: e.target.value }))}
                                        rows={2}
                                        className="prop-input"
                                        style={{ resize: 'vertical' }}
                                        placeholder="Estimated developer hours, third-party API costs..."
                                    />
                                </div>
                            </div>

                            <div className="doc-modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary-teal"
                                >
                                    {saving ? <RefreshCw size={14} className="spin-icon" /> : null}
                                    {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsServicesCatalogue;

