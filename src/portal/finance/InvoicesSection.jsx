import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Send, Ban, Wallet, Printer, FileCheck, Lock } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { formatCurrency, getStatusStyle } from './financeHelpers';

export const InvoicesSection = ({
    invoices = [],
    clients = [],
    ledgers = [],
    perms,
    showToast,
    onReload,
    onViewInvoice,
    onQuickPay,
}) => {
    const [creating, setCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [busyId, setBusyId] = useState(null);

    if (creating) {
        return (
            <CreateInvoiceForm
                clients={clients}
                ledgers={ledgers}
                perms={perms}
                showToast={showToast}
                onSaved={() => { setCreating(false); onReload(); }}
                onCancel={() => setCreating(false)}
            />
        );
    }

    const filtered = invoices.filter(inv => {
        const q = searchTerm.toLowerCase();
        const matchQ = !q || (inv.client_name || '').toLowerCase().includes(q) || (inv.invoice_number || '').toLowerCase().includes(q) || (inv.project || '').toLowerCase().includes(q);
        const matchS = statusFilter === 'All' || inv.status === statusFilter;
        return matchQ && matchS;
    });

    const handleAction = async (inv, fn, successMsg) => {
        setBusyId(inv.id);
        try {
            await fn();
            showToast(successMsg, 'success');
            onReload();
        } catch (err) {
            showToast(err.message || 'Operation failed.', 'error');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="fin-card animations-fade-in">
            <div className="fin-toolbar">
                <div className="fin-search">
                    <Search size={15} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by invoice #, client or project…"
                    />
                </div>
                <select className="fin-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">All statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent / Open</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                </select>
                {perms.canAddInvoice && (
                    <button className="fin-btn primary" onClick={() => setCreating(true)}>
                        <Plus size={15} /> Create Invoice
                    </button>
                )}
            </div>

            <div className="fin-table-wrap">
                <table className="fin-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Client</th>
                            <th>Dates</th>
                            <th>Total</th>
                            <th>Balance Due</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="fin-empty">No invoices match your filters.</td></tr>
                        )}
                        {filtered.map(inv => {
                            const st = getStatusStyle(inv.status);
                            const bal = inv.balance_due ?? Math.max(0, parseFloat(inv.total || 0) - parseFloat(inv.amount_paid || 0));
                            const isOpen = !['Draft', 'Paid', 'Void'].includes(inv.status) && bal > 0;
                            return (
                                <tr key={inv.id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{inv.invoice_number}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            {inv.project || 'Standard Service'}
                                            {inv.quotation_number ? ` · From ${inv.quotation_number}` : ''}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{inv.client_name || 'Walk-in Client'}</td>
                                    <td>
                                        <div style={{ fontSize: 12.5 }}>Issued: {inv.issue_date}</div>
                                        <div style={{ fontSize: 11.5, color: inv.status === 'Overdue' ? '#dc2626' : '#64748b' }}>Due: {inv.due_date}</div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{formatCurrency(inv.total)}</td>
                                    <td style={{ fontWeight: 700, color: bal > 0 && inv.status !== 'Void' ? '#4f46e5' : '#64748b' }}>
                                        {formatCurrency(bal)}
                                    </td>
                                    <td>
                                        <span className="fin-badge" style={{ background: st.bg, color: st.fg, borderColor: st.bd }}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <button className="fin-icon-btn" title="Preview / Print" onClick={() => onViewInvoice(inv)}>
                                                <Eye size={14} />
                                            </button>
                                            {inv.status === 'Draft' && perms.canIssueInvoice && (
                                                <button
                                                    className="fin-icon-btn ok"
                                                    title="Issue & Post to Ledger"
                                                    disabled={busyId === inv.id}
                                                    onClick={() => handleAction(inv, () => apiClient.accounting.invoices.issue(inv.id), `Invoice ${inv.invoice_number} issued and posted to ledger.`)}
                                                >
                                                    <Send size={14} />
                                                </button>
                                            )}
                                            {isOpen && perms.canRecordPayment && (
                                                <button className="fin-icon-btn ok" title="Record Payment" onClick={() => onQuickPay(inv)}>
                                                    <Wallet size={14} />
                                                </button>
                                            )}
                                            {inv.status !== 'Draft' && inv.status !== 'Void' && perms.canVoidInvoice && (
                                                <button
                                                    className="fin-icon-btn warn"
                                                    title="Void Invoice (Reversing Journal)"
                                                    disabled={busyId === inv.id}
                                                    onClick={() => {
                                                        if (window.confirm(`Void ${inv.invoice_number}? This posts a reversing journal entry.`)) {
                                                            handleAction(inv, () => apiClient.accounting.invoices.void(inv.id), `Invoice ${inv.invoice_number} voided.`);
                                                        }
                                                    }}
                                                >
                                                    <Ban size={14} />
                                                </button>
                                            )}
                                            {inv.status === 'Draft' && perms.canDeleteInvoice && (
                                                <button
                                                    className="fin-icon-btn danger"
                                                    title="Delete Draft"
                                                    disabled={busyId === inv.id}
                                                    onClick={() => {
                                                        if (window.confirm(`Delete draft ${inv.invoice_number}?`)) {
                                                            handleAction(inv, () => apiClient.accounting.invoices.delete(inv.id), `Draft ${inv.invoice_number} deleted.`);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CreateInvoiceForm = ({ clients = [], ledgers = [], perms, showToast, onSaved, onCancel }) => {
    const [quotations, setQuotations] = useState([]);
    const [quotationId, setQuotationId] = useState('');
    const [clientId, setClientId] = useState('');
    const [project, setProject] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
    });
    const [incomeAccountId, setIncomeAccountId] = useState('');
    const [taxRate, setTaxRate] = useState(16);
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ id: 1, name: '', qty: 1, price: 0 }]);
    const [saving, setSaving] = useState(false);

    const revenueLedgers = ledgers.filter(l => (l.account_type_name || '').toLowerCase() === 'revenue');

    useEffect(() => {
        apiClient.royalsoftwares.quotations.list()
            .then(data => setQuotations(Array.isArray(data) ? data : []))
            .catch(() => {});
        const defaultRev = revenueLedgers.find(l => l.code === '4000') || revenueLedgers[0];
        if (defaultRev && !incomeAccountId) setIncomeAccountId(String(defaultRev.id));
    }, []);

    const importQuotation = (qId) => {
        setQuotationId(qId);
        const q = quotations.find(x => String(x.id) === String(qId));
        if (!q) return;
        if (q.client) setClientId(String(q.client));
        setProject(q.deal_name || `Quotation ${q.quotation_number}`);
        if (q.notes) setNotes(q.notes);
        if (Array.isArray(q.items) && q.items.length > 0) {
            setItems(q.items.map((it, idx) => ({
                id: idx + 1,
                name: it.item_name || '',
                qty: parseFloat(it.quantity || 1),
                price: parseFloat(it.unit_price || 0),
            })));
            const sub = parseFloat(q.subtotal_amount || 0);
            const tax = parseFloat(q.tax_amount || 0);
            if (sub > 0) setTaxRate(parseFloat(((tax / sub) * 100).toFixed(2)));
        }
    };

    const addItem = () => setItems([...items, { id: Date.now(), name: '', qty: 1, price: 0 }]);
    const removeItem = (id) => items.length > 1 && setItems(items.filter(i => i.id !== id));
    const changeItem = (id, field, val) => setItems(items.map(i => (i.id === id ? { ...i, [field]: val } : i)));

    const subtotal = items.reduce((s, i) => s + parseFloat(i.qty || 0) * parseFloat(i.price || 0), 0);
    const disc = perms.canApplyDiscount ? parseFloat(discount || 0) : 0;
    const taxAmount = Math.max(0, subtotal - disc) * (parseFloat(taxRate || 0) / 100);
    const total = Math.max(0, subtotal - disc) + taxAmount;

    const saveInvoice = async (targetStatus) => {
        if (!clientId) return showToast('Please select a customer.', 'error');
        if (!dueDate) return showToast('Please select a due date.', 'error');
        if (items.some(i => !i.name.trim() || i.qty <= 0 || i.price <= 0)) {
            return showToast('Please enter a description, quantity and unit price for every line.', 'error');
        }
        setSaving(true);
        try {
            await apiClient.accounting.invoices.create({
                client: clientId,
                quotation: quotationId || undefined,
                project: project.trim() || undefined,
                issue_date: issueDate,
                due_date: dueDate,
                income_account: incomeAccountId || undefined,
                subtotal: subtotal.toFixed(2),
                tax_rate: parseFloat(taxRate || 0).toFixed(2),
                tax_amount: taxAmount.toFixed(2),
                discount: disc.toFixed(2),
                total: total.toFixed(2),
                notes: notes.trim() || undefined,
                status: targetStatus,
                items: items.map(i => ({
                    name: i.name.trim(),
                    quantity: parseFloat(i.qty),
                    unit_price: parseFloat(i.price),
                    subtotal: (parseFloat(i.qty) * parseFloat(i.price)).toFixed(2),
                })),
            });
            showToast(
                targetStatus === 'Draft'
                    ? 'Draft invoice saved (not yet posted to ledger).'
                    : 'Invoice issued and posted to ledger (AR, Revenue & VAT Output).',
                'success'
            );
            onSaved();
        } catch (err) {
            showToast(err.message || 'Failed to save invoice.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fin-card animations-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 17 }}>New Customer Invoice</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                        Drafts stay off the ledger until issued. Issuing posts Dr Accounts Receivable / Cr Revenue + VAT Output.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="fin-btn ghost" onClick={onCancel}>Cancel</button>
                    <button type="button" className="fin-btn ghost" disabled={saving} onClick={() => saveInvoice('Draft')}>
                        Save Draft
                    </button>
                    {perms.canIssueInvoice && (
                        <button type="button" className="fin-btn primary" disabled={saving} onClick={() => saveInvoice('Sent')}>
                            <Send size={14} /> {saving ? 'Posting…' : 'Issue & Post'}
                        </button>
                    )}
                </div>
            </div>

            <div className="fin-grid-2" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {quotations.length > 0 && (
                        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <FileCheck size={17} color="#4f46e5" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#312e81' }}>Import from Quotation:</span>
                            <select className="fin-select" style={{ flex: 1, minWidth: 220 }} value={quotationId} onChange={e => importQuotation(e.target.value)}>
                                <option value="">Select quotation to pre-fill…</option>
                                {quotations.map(q => (
                                    <option key={q.id} value={q.id}>
                                        {q.quotation_number} · {q.client_name} ({formatCurrency(q.total_amount)}) [{q.status}]
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Customer *
                            <select className="fin-select" value={clientId} onChange={e => setClientId(e.target.value)}>
                                <option value="">Select customer…</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Revenue Account (Ledger)
                            <select className="fin-select" value={incomeAccountId} onChange={e => setIncomeAccountId(e.target.value)}>
                                <option value="">Default: Service Revenue (4000)</option>
                                {revenueLedgers.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} · ` : ''}{l.name}</option>)}
                            </select>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Project / Reference
                            <input className="fin-input" value={project} onChange={e => setProject(e.target.value)} placeholder="e.g. Website & ERP Rollout" />
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                                Issue Date
                                <input className="fin-input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                                Due Date
                                <input className="fin-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                            </label>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <strong style={{ fontSize: 14, color: '#0f172a' }}>Line Items</strong>
                            <button type="button" className="fin-btn ghost sm" onClick={addItem}><Plus size={13} /> Add Line</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {items.map(it => (
                                <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2.2fr .6fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                                    <input className="fin-input" placeholder="Description…" value={it.name} onChange={e => changeItem(it.id, 'name', e.target.value)} />
                                    <input className="fin-input" type="number" min="0.01" step="any" value={it.qty} onChange={e => changeItem(it.id, 'qty', e.target.value)} />
                                    <input className="fin-input" type="number" min="0" step="any" value={it.price} onChange={e => changeItem(it.id, 'price', e.target.value)} />
                                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13.5 }}>{formatCurrency(it.qty * it.price)}</div>
                                    <button type="button" className="fin-icon-btn danger" disabled={items.length === 1} onClick={() => removeItem(it.id)}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <strong style={{ fontSize: 14 }}>Summary & Tax</strong>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                            <span style={{ color: '#64748b' }}>Subtotal</span>
                            <strong>{formatCurrency(subtotal)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>
                                Discount (KES) {!perms.canApplyDiscount && <Lock size={11} title="Requires can_apply_discount" />}
                            </span>
                            <input
                                className="fin-input"
                                type="number"
                                min="0"
                                disabled={!perms.canApplyDiscount}
                                value={disc}
                                onChange={e => setDiscount(e.target.value)}
                                style={{ width: 110, textAlign: 'right', padding: '5px 8px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>VAT Rate (%)</span>
                            <input
                                className="fin-input"
                                type="number"
                                min="0"
                                step="any"
                                value={taxRate}
                                onChange={e => setTaxRate(e.target.value)}
                                style={{ width: 80, textAlign: 'right', padding: '5px 8px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                            <span style={{ color: '#64748b' }}>VAT Output (2100)</span>
                            <strong>{formatCurrency(taxAmount)}</strong>
                        </div>
                        <div style={{ height: 1, background: '#e2e8f0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                            <span>Grand Total</span>
                            <span style={{ color: '#4f46e5' }}>{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12 }}>
                        <strong style={{ fontSize: 13.5, display: 'block', marginBottom: 8 }}>Notes & Payment Terms</strong>
                        <textarea className="fin-textarea" rows={4} style={{ width: '100%' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes visible on invoice PDF…" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InvoicePreviewModal = ({ invoice, onClose }) => {
    if (!invoice) return null;
    const paid = parseFloat(invoice.amount_paid || 0);
    const bal = invoice.balance_due ?? Math.max(0, parseFloat(invoice.total || 0) - paid);
    const st = getStatusStyle(invoice.status);

    return (
        <div
            className="invoice-modal-overlay"
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
            onMouseDown={e => e.target === e.currentTarget && onClose()}
        >
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .invoice-print-area, .invoice-print-area * { visibility: visible; }
                    .invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; background: #fff !important; box-shadow: none !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
            <div className="invoice-print-area" style={{ background: '#fff', width: '100%', maxWidth: 820, borderRadius: 16, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,.25)' }}>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="fin-badge" style={{ background: st.bg, color: st.fg, borderColor: st.bd }}>{invoice.status}</span>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Invoice <strong>{invoice.invoice_number}</strong></span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="fin-btn primary sm" onClick={() => window.print()}><Printer size={14} /> Print / PDF</button>
                        <button className="fin-btn ghost sm" onClick={onClose}>Close</button>
                    </div>
                </div>

                <div style={{ padding: 36, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: 24, marginBottom: 24 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <img src="/logo (2).png" alt="Royal Software Solutions" style={{ height: 40 }} onError={e => { e.target.style.display = 'none'; }} />
                                <strong style={{ fontSize: 18, color: '#0f172a' }}>Royal Software Solutions</strong>
                            </div>
                            <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>
                                NextGen Tech Chambers, Mombasa Road<br />
                                P.O Box 12840-00100, Nairobi, Kenya<br />
                                billing@royalsoftwares.co.ke
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#4f46e5', margin: '0 0 8px' }}>INVOICE</h1>
                            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
                                <div>No: <strong>{invoice.invoice_number}</strong></div>
                                <div>Issue Date: <strong>{invoice.issue_date}</strong></div>
                                <div>Due Date: <strong>{invoice.due_date}</strong></div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 28 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', marginBottom: 6 }}>Billed To</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{invoice.client_name || 'Customer'}</div>
                            <div style={{ fontSize: 12.5, color: '#64748b' }}>{invoice.project || 'Software & Technical Services'}</div>
                        </div>
                        <div style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: 16, fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Ledger & Reference</div>
                            <div>Revenue Ledger: {invoice.income_account_name || 'Service Revenue'}</div>
                            {invoice.quotation_number && <div>Quotation: {invoice.quotation_number}</div>}
                        </div>
                    </div>

                    <table className="fin-table" style={{ marginBottom: 28 }}>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style={{ textAlign: 'center' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Unit Price</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(invoice.items?.length ? invoice.items : [{ name: invoice.project || 'Services', quantity: 1, unit_price: invoice.subtotal || invoice.total, subtotal: invoice.subtotal || invoice.total }]).map((item, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                                    <td style={{ textAlign: 'center' }}>{parseFloat(item.quantity).toLocaleString()}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28 }}>
                        <div style={{ fontSize: 12.5, color: '#64748b' }}>
                            {invoice.notes && <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10 }}>{invoice.notes}</div>}
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Subtotal</span><strong>{formatCurrency(invoice.subtotal)}</strong></div>
                            {parseFloat(invoice.discount || 0) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}><span>Discount</span><strong>-{formatCurrency(invoice.discount)}</strong></div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>VAT ({parseFloat(invoice.tax_rate || 0)}%)</span><strong>{formatCurrency(invoice.tax_amount)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                                <span>Total</span><span>{formatCurrency(invoice.total)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}><span>Paid to Date</span><strong>-{formatCurrency(paid)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: '#4f46e5', paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                                <span>Balance Due</span><span>{formatCurrency(bal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

