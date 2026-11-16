import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Trash2,
    DollarSign,
    Calendar,
    Briefcase,
    Building,
    FileText,
    Percent,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const CreateQuotationModal = ({ isOpen, onClose, onCreated, clients = [], products = [], rfq = null }) => {
    const [clientId, setClientId] = useState('');
    const [dealId, setDealId] = useState('');
    const [deals, setDeals] = useState([]);
    const [quotationNumber, setQuotationNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState(
        '1. Prices quoted are valid for 30 calendar days from the date of issuance.\n' +
        '2. 50% commitment deposit required upon sign-off, 50% upon milestone deliverables completion.\n' +
        '3. Software intellectual property transfers upon full settlement of invoice.'
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Initial setup on open
    useEffect(() => {
        if (isOpen) {
            setError(null);
            // Default 30-day expiry
            const d = new Date();
            d.setDate(d.getDate() + 30);
            setExpiryDate(d.toISOString().split('T')[0]);

            // Auto-generate a clean quote number
            const rand = Math.floor(1000 + Math.random() * 9000);
            const ym = new Date().toISOString().slice(0, 7).replace('-', '');
            setQuotationNumber(`QUO-${ym}-${rand}`);

            // If RFQ is provided, populate client and notes
            if (rfq) {
                setClientId(rfq.client || rfq.client_id || '');
                setNotes(`Quotation prepared in response to RFQ: ${rfq.subject}\n\nClient Specifications:\n${rfq.description || 'N/A'}`);
            } else {
                setClientId(clients[0]?.id || '');
                setNotes('');
            }

            // Load deals if any
            apiClient.royalsoftwares.deals.list()
                .then(res => setDeals(Array.isArray(res) ? res : res.results || []))
                .catch(() => setDeals([]));

            // Default initial item
            if (products && products.length > 0) {
                const first = products[0];
                setItems([{
                    product: first.id,
                    item_code: first.item_code || '',
                    item_name: first.name,
                    description: first.description || '',
                    unit_price: Number(first.price || 0),
                    quantity: 1,
                    unit_of_measure: first.unit_of_measure || 'Unit',
                    tax_rate: Number(first.tax_rate || 16.0),
                    subtotal: Number(first.price || 0)
                }]);
            } else {
                setItems([{
                    product: null,
                    item_code: 'DEV-01',
                    item_name: 'Custom Software Implementation',
                    description: 'End-to-end requirement analysis, development and QA testing.',
                    unit_price: 150000,
                    quantity: 1,
                    unit_of_measure: 'Milestone',
                    tax_rate: 16.0,
                    subtotal: 150000
                }]);
            }
        }
    }, [isOpen, rfq, clients, products]);

    const handleAddItem = (product = null) => {
        if (product) {
            setItems(prev => [...prev, {
                product: product.id,
                item_code: product.item_code || '',
                item_name: product.name,
                description: product.description || '',
                unit_price: Number(product.price || 0),
                quantity: 1,
                unit_of_measure: product.unit_of_measure || 'Unit',
                tax_rate: Number(product.tax_rate || 16.0),
                subtotal: Number(product.price || 0)
            }]);
        } else {
            setItems(prev => [...prev, {
                product: null,
                item_code: '',
                item_name: 'Custom Deliverable Scope',
                description: '',
                unit_price: 0,
                quantity: 1,
                unit_of_measure: 'Unit',
                tax_rate: 16.0,
                subtotal: 0
            }]);
        }
    };

    const handleUpdateItem = (index, field, value) => {
        setItems(prev => {
            const copy = [...prev];
            const current = { ...copy[index], [field]: value };

            if (field === 'quantity' || field === 'unit_price') {
                const qty = Number(field === 'quantity' ? value : current.quantity) || 0;
                const price = Number(field === 'unit_price' ? value : current.unit_price) || 0;
                current.subtotal = qty * price;
            }

            // If product selected from dropdown
            if (field === 'product') {
                const selectedProd = products.find(p => String(p.id) === String(value));
                if (selectedProd) {
                    current.item_code = selectedProd.item_code || '';
                    current.item_name = selectedProd.name;
                    current.description = selectedProd.description || '';
                    current.unit_price = Number(selectedProd.price || 0);
                    current.unit_of_measure = selectedProd.unit_of_measure || 'Unit';
                    current.tax_rate = Number(selectedProd.tax_rate || 16.0);
                    current.subtotal = current.quantity * current.unit_price;
                }
            }

            copy[index] = current;
            return copy;
        });
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Calculate Totals
    const subtotal = items.reduce((sum, itm) => sum + (Number(itm.subtotal) || 0), 0);
    const taxTotal = items.reduce((sum, itm) => {
        const sub = Number(itm.subtotal) || 0;
        const rate = Number(itm.tax_rate) || 0;
        return sum + (sub * (rate / 100.0));
    }, 0);
    const grandTotal = subtotal + taxTotal;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clientId) {
            setError('Please select a client for this quotation.');
            return;
        }
        if (items.length === 0) {
            setError('Please add at least one line item.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const payload = {
                client: clientId,
                deal: dealId || null,
                rfq: rfq?.id || null,
                quotation_number: quotationNumber,
                expiry_date: expiryDate,
                subtotal_amount: subtotal.toFixed(2),
                tax_amount: taxTotal.toFixed(2),
                total_amount: grandTotal.toFixed(2),
                status: 'DRAFT',
                notes: notes,
                terms_and_conditions: terms,
                items: items.map(itm => ({
                    product: itm.product || null,
                    item_code: itm.item_code,
                    item_name: itm.item_name,
                    description: itm.description,
                    unit_price: Number(itm.unit_price || 0).toFixed(2),
                    quantity: Number(itm.quantity || 1).toFixed(2),
                    unit_of_measure: itm.unit_of_measure || 'Unit',
                    tax_rate: Number(itm.tax_rate || 16.0).toFixed(2),
                    subtotal: Number(itm.subtotal || 0).toFixed(2)
                }))
            };

            const created = await apiClient.royalsoftwares.quotations.create(payload);

            // If created from RFQ, update RFQ status
            if (rfq?.id) {
                try {
                    await apiClient.royalsoftwares.quotationRequests.update(rfq.id, {
                        ...rfq,
                        status: 'RESPONDED'
                    });
                } catch (e) {
                    console.warn('Could not mark RFQ responded:', e);
                }
            }

            if (onCreated) {
                onCreated(created);
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create quotation.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="doc-modal-overlay" onClick={onClose}>
            <div className="doc-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="doc-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            background: '#f0fdfa',
                            color: '#0f766e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                                {rfq ? 'Convert RFQ to Official Quotation' : 'Create New Sales Quotation'}
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                Itemized commercial proposal with automated tax computation and snapshot archiving
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {error && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: '#fef2f2',
                                color: '#b91c1c',
                                borderRadius: 8,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {rfq && (
                            <div style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: 8,
                                padding: '0.75rem 1rem',
                                fontSize: '0.83rem',
                                color: '#1e40af',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Sparkles size={16} />
                                <div>
                                    <strong>Originating RFQ:</strong> {rfq.subject} (Requested on {rfq.date_requested})
                                </div>
                            </div>
                        )}

                        {/* Top Metadata Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                            background: '#f8fafc',
                            padding: '1rem',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0'
                        }}>
                            <div className="prop-form-group">
                                <label>Client / Customer *</label>
                                <select
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="prop-input"
                                    required
                                >
                                    <option value="">-- Select Client --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.company_name ? `(${c.company_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="prop-form-group">
                                <label>Related Deal (Optional)</label>
                                <select
                                    value={dealId}
                                    onChange={(e) => setDealId(e.target.value)}
                                    className="prop-input"
                                >
                                    <option value="">-- None / General --</option>
                                    {deals.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} (KES {Number(d.value).toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="prop-form-group">
                                <label>Quotation Number</label>
                                <input
                                    type="text"
                                    value={quotationNumber}
                                    onChange={(e) => setQuotationNumber(e.target.value)}
                                    className="prop-input"
                                    required
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Validity Expiry Date</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="prop-input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Line Items Section */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>
                                    Commercial Line Items & Deliverables ({items.length})
                                </h4>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleAddItem()}
                                        className="btn-secondary-outline"
                                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                    >
                                        <Plus size={13} /> Add Custom Item
                                    </button>
                                </div>
                            </div>

                            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                                            <th style={{ padding: '8px 10px', width: '28%' }}>Item / Product</th>
                                            <th style={{ padding: '8px 10px', width: '28%' }}>Description / Specification</th>
                                            <th style={{ padding: '8px 10px', width: '12%', textAlign: 'right' }}>Qty</th>
                                            <th style={{ padding: '8px 10px', width: '14%', textAlign: 'right' }}>Unit Price (KES)</th>
                                            <th style={{ padding: '8px 10px', width: '14%', textAlign: 'right' }}>Subtotal (KES)</th>
                                            <th style={{ padding: '8px 6px', width: '4%' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                    {products && products.length > 0 && (
                                                        <select
                                                            value={item.product || ''}
                                                            onChange={(e) => handleUpdateItem(index, 'product', e.target.value)}
                                                            className="prop-input"
                                                            style={{ fontSize: '0.8rem', padding: '0.35rem', marginBottom: '4px' }}
                                                        >
                                                            <option value="">-- Choose Catalogue Item --</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.item_code ? `[${p.item_code}] ` : ''}{p.name} (KES {Number(p.price).toLocaleString()})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <input
                                                        type="text"
                                                        value={item.item_name}
                                                        onChange={(e) => handleUpdateItem(index, 'item_name', e.target.value)}
                                                        placeholder="Deliverable Name"
                                                        className="prop-input"
                                                        style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                                                        required
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                    <textarea
                                                        value={item.description}
                                                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                                        placeholder="Scope specifications & milestones..."
                                                        rows={2}
                                                        className="prop-input"
                                                        style={{ fontSize: '0.78rem', padding: '0.35rem', resize: 'vertical' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                                                        className="prop-input"
                                                        style={{ textAlign: 'right', fontSize: '0.8rem', padding: '0.35rem' }}
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.unit_of_measure}
                                                        onChange={(e) => handleUpdateItem(index, 'unit_of_measure', e.target.value)}
                                                        placeholder="Unit"
                                                        className="prop-input"
                                                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.35rem', marginTop: '2px', textAlign: 'right' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.unit_price}
                                                        onChange={(e) => handleUpdateItem(index, 'unit_price', e.target.value)}
                                                        className="prop-input"
                                                        style={{ textAlign: 'right', fontSize: '0.8rem', padding: '0.35rem' }}
                                                        required
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#0f766e', verticalAlign: 'top', paddingTop: '14px' }}>
                                                    {Number(item.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'top', paddingTop: '12px' }}>
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(index)}
                                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                            title="Delete Item"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals & Financial Breakdown */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            background: '#f8fafc',
                            padding: '1rem',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                    <span>Subtotal (Exclusive of VAT):</span>
                                    <strong>KES {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                    <span>VAT Total (16% Standard):</span>
                                    <span>KES {taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderTop: '2px solid #cbd5e1',
                                    paddingTop: '0.4rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: '#0f766e'
                                }}>
                                    <span>Quotation Total:</span>
                                    <span>KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes and Terms & Conditions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="prop-form-group">
                                <label>Special Scope Notes & Instructions</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Add implementation remarks, deliverables roadmap..."
                                    className="prop-input"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Commercial Terms & Acceptance Conditions</label>
                                <textarea
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    rows={3}
                                    className="prop-input"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="doc-modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary-teal"
                        >
                            {submitting ? 'Creating Quotation...' : 'Save & Prepare Official Quotation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateQuotationModal;

