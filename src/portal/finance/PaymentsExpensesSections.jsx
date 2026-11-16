import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Trash2, Check, XCircle, Ban, RotateCcw,
    AlertCircle, Droplet, Zap, Wifi, Lock, Wallet
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { formatCurrency, getStatusStyle } from './financeHelpers';

/* ------------------------------------------------------------------ */
/* Payments Received                                                   */
/* ------------------------------------------------------------------ */

export const PaymentsSection = ({
    invoices = [],
    payments = [],
    ledgers = [],
    initialInvoiceId = '',
    perms,
    showToast,
    onReload,
}) => {
    const [invoiceId, setInvoiceId] = useState(initialInvoiceId ? String(initialInvoiceId) : '');
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [depositAccountId, setDepositAccountId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const depositLedgers = ledgers.filter(l => {
        const t = (l.account_type_name || '').toLowerCase();
        const n = (l.name || '').toLowerCase();
        return t === 'assets' && (['1000', '1010', '1020'].includes(l.code) || n.includes('cash') || n.includes('bank') || n.includes('pesa'));
    });

    const openInvoices = invoices.filter(inv => {
        const bal = inv.balance_due ?? Math.max(0, parseFloat(inv.total || 0) - parseFloat(inv.amount_paid || 0));
        return !['Draft', 'Paid', 'Void'].includes(inv.status) && bal > 0;
    });

    const selectedInv = invoices.find(i => String(i.id) === String(invoiceId));
    const maxRemaining = selectedInv
        ? (selectedInv.balance_due ?? Math.max(0, parseFloat(selectedInv.total || 0) - parseFloat(selectedInv.amount_paid || 0)))
        : 0;

    useEffect(() => {
        if (initialInvoiceId) {
            const inv = invoices.find(i => String(i.id) === String(initialInvoiceId));
            if (inv) {
                setInvoiceId(String(inv.id));
                const bal = inv.balance_due ?? Math.max(0, parseFloat(inv.total || 0) - parseFloat(inv.amount_paid || 0));
                setAmount(String(bal));
            }
        }
    }, [initialInvoiceId, invoices]);

    useEffect(() => {
        if (!depositAccountId && depositLedgers.length > 0) {
            const def = depositLedgers.find(l => l.code === '1010') || depositLedgers[0];
            setDepositAccountId(String(def.id));
        }
    }, [ledgers]);

    const handleInvoiceChange = (id) => {
        setInvoiceId(id);
        const inv = invoices.find(i => String(i.id) === String(id));
        if (inv) {
            const bal = inv.balance_due ?? Math.max(0, parseFloat(inv.total || 0) - parseFloat(inv.amount_paid || 0));
            setAmount(String(bal));
        } else {
            setAmount('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amount || 0);
        if (!invoiceId) return showToast('Select an open invoice.', 'error');
        if (amt <= 0) return showToast('Enter a valid positive amount.', 'error');
        if (amt > maxRemaining + 0.001) return showToast(`Amount cannot exceed balance due (${formatCurrency(maxRemaining)}).`, 'error');

        setSaving(true);
        try {
            await apiClient.accounting.payments.create({
                invoice: invoiceId,
                amount: amt.toFixed(2),
                payment_date: paymentDate,
                deposit_account: depositAccountId || undefined,
                payment_method: paymentMethod,
                reference: reference.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            showToast('Payment recorded and posted (Dr Bank/Cash, Cr Accounts Receivable).', 'success');
            setInvoiceId('');
            setAmount('');
            setReference('');
            setNotes('');
            onReload();
        } catch (err) {
            showToast(err.message || 'Failed to record payment.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReverse = async (pmt) => {
        if (!window.confirm(`Reverse receipt for ${pmt.invoice_number} (${formatCurrency(pmt.amount)})? This creates a contra journal and reopens the invoice balance.`)) return;
        try {
            await apiClient.accounting.payments.reverse(pmt.id);
            showToast('Payment reversed with contra journal entry.', 'success');
            onReload();
        } catch (err) {
            showToast(err.message || 'Failed to reverse payment.', 'error');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="fin-card animations-fade-in">
                <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Record Client Payment Receipt</h3>
                {!perms.canRecordPayment ? (
                    <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#64748b' }}>
                        <Lock size={18} /> Recording payments requires the <code>can_record_payment</code> permission.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="fin-grid-2" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                                Open Invoice *
                                <select className="fin-select" value={invoiceId} onChange={e => handleInvoiceChange(e.target.value)} required>
                                    <option value="">Select unpaid or partially paid invoice…</option>
                                    {openInvoices.map(i => {
                                        const bal = i.balance_due ?? Math.max(0, parseFloat(i.total || 0) - parseFloat(i.amount_paid || 0));
                                        return (
                                            <option key={i.id} value={i.id}>
                                                {i.invoice_number} · {i.client_name || 'Client'} (Balance Due: {formatCurrency(bal)})
                                            </option>
                                        );
                                    })}
                                </select>
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                                Amount Received (KES) *
                                <input className="fin-input" type="number" step="0.01" min="0.01" max={maxRemaining || undefined} value={amount} onChange={e => setAmount(e.target.value)} required />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                                Payment Date *
                                <input className="fin-input" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                                Deposit To (Asset Ledger)
                                <select className="fin-select" value={depositAccountId} onChange={e => setDepositAccountId(e.target.value)}>
                                    {depositLedgers.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} · ` : ''}{l.name}</option>)}
                                </select>
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                                Payment Method
                                <select className="fin-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option>Bank Transfer</option>
                                    <option>M-Pesa</option>
                                    <option>Cash</option>
                                    <option>Cheque</option>
                                    <option>Card</option>
                                </select>
                            </label>
                            <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                                Bank Slip / M-Pesa Transaction Ref
                                <input className="fin-input" value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. MPESA-UBK92A19" />
                            </label>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: '#f8fafc', padding: 18, borderRadius: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Wallet size={15} color="#4f46e5" /> Automated Double-Entry Posting
                                </div>
                                <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.65 }}>
                                    • Debits your selected Cash/Bank/M-Pesa ledger.<br />
                                    • Credits <strong>Accounts Receivable (1100)</strong>.<br />
                                    • Overpayments above remaining balance are blocked.<br />
                                    • Marks invoice as <strong>Partially Paid</strong> or <strong>Paid</strong> automatically.
                                </div>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569', marginTop: 12 }}>
                                    Notes
                                    <textarea className="fin-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional memo…" />
                                </label>
                            </div>
                            <button type="submit" className="fin-btn primary" disabled={saving || !invoiceId}>
                                {saving ? 'Posting Payment…' : 'Record & Post Receipt'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="fin-card">
                <h3 style={{ margin: '0 0 14px', fontSize: 15.5 }}>Payment Receipts Register</h3>
                <div className="fin-table-wrap">
                    <table className="fin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Invoice</th>
                                <th>Client</th>
                                <th>Method & Ref</th>
                                <th>Deposited To</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 && (
                                <tr><td colSpan={8} className="fin-empty">No receipts recorded yet.</td></tr>
                            )}
                            {payments.map(p => {
                                const st = getStatusStyle(p.is_reversed ? 'Reversed' : 'Posted');
                                return (
                                    <tr key={p.id}>
                                        <td>{p.payment_date}</td>
                                        <td style={{ fontWeight: 700 }}>{p.invoice_number}</td>
                                        <td>{p.client_name || '—'}</td>
                                        <td>
                                            <div>{p.payment_method || 'Bank Transfer'}</div>
                                            {p.reference && <div style={{ fontSize: 11.5, color: '#64748b' }}>Ref: {p.reference}</div>}
                                        </td>
                                        <td>{p.deposit_account_name || 'Cash/Bank Account'}</td>
                                        <td style={{ fontWeight: 700, color: p.is_reversed ? '#94a3b8' : '#047857', textDecoration: p.is_reversed ? 'line-through' : 'none' }}>
                                            {formatCurrency(p.amount)}
                                        </td>
                                        <td>
                                            <span className="fin-badge" style={{ background: st.bg, color: st.fg, borderColor: st.bd }}>
                                                {p.is_reversed ? 'Reversed' : 'Posted'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {!p.is_reversed && perms.canReversePayment && (
                                                <button className="fin-icon-btn danger" title="Reverse Payment" onClick={() => handleReverse(p)}>
                                                    <RotateCcw size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Expenses & Bills                                                    */
/* ------------------------------------------------------------------ */

export const ExpensesSection = ({
    expenses = [],
    suppliers = [],
    ledgers = [],
    perms,
    showToast,
    onReload,
}) => {
    const [recording, setRecording] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [busyId, setBusyId] = useState(null);

    if (recording) {
        return (
            <RecordExpenseForm
                suppliers={suppliers}
                ledgers={ledgers}
                perms={perms}
                showToast={showToast}
                onSaved={() => { setRecording(false); onReload(); }}
                onCancel={() => setRecording(false)}
            />
        );
    }

    const filtered = expenses.filter(e => {
        const q = searchTerm.toLowerCase();
        const matchQ = !q || (e.title || '').toLowerCase().includes(q) || (e.expense_number || '').toLowerCase().includes(q) || (e.supplier_name || e.vendor_name || '').toLowerCase().includes(q);
        const matchS = statusFilter === 'All' || e.status === statusFilter;
        return matchQ && matchS;
    });

    const runAction = async (exp, fn, msg) => {
        setBusyId(exp.id);
        try {
            await fn();
            showToast(msg, 'success');
            onReload();
        } catch (err) {
            showToast(err.message || 'Action failed.', 'error');
        } finally {
            setBusyId(null);
        }
    };

    const utilIcon = (t) => {
        if (t === 'water') return <Droplet size={13} color="#0284c7" />;
        if (t === 'electricity') return <Zap size={13} color="#ca8a04" />;
        if (t === 'internet') return <Wifi size={13} color="#7c3aed" />;
        return null;
    };

    return (
        <div className="fin-card animations-fade-in">
            <div className="fin-toolbar">
                <div className="fin-search">
                    <Search size={15} />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search expenses, bills or vendors…" />
                </div>
                <select className="fin-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="Approved">Approved / Posted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Void">Void</option>
                </select>
                {perms.canAddExpense && (
                    <button className="fin-btn primary" onClick={() => setRecording(true)}>
                        <Plus size={15} /> Record Expense / Bill
                    </button>
                )}
            </div>

            <div className="fin-table-wrap">
                <table className="fin-table">
                    <thead>
                        <tr>
                            <th>Ref</th>
                            <th>Title & Date</th>
                            <th>Expense Ledger</th>
                            <th>Paid From / Payable</th>
                            <th>Vendor</th>
                            <th>Total (VAT Input)</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan={8} className="fin-empty">No expenses found.</td></tr>
                        )}
                        {filtered.map(exp => {
                            const st = getStatusStyle(exp.status);
                            return (
                                <tr key={exp.id}>
                                    <td style={{ fontWeight: 700 }}>{exp.expense_number}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            {exp.title} {utilIcon(exp.utility_type)}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{exp.date_incurred}</div>
                                    </td>
                                    <td>{exp.expense_account_name || 'General Business Expense'}</td>
                                    <td>{exp.payment_account_name || 'Accounts Payable (2000)'}</td>
                                    <td>{exp.supplier_name || exp.vendor_name || '—'}</td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(exp.amount)}</div>
                                        {parseFloat(exp.tax_amount || 0) > 0 && (
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Incl. VAT {formatCurrency(exp.tax_amount)}</div>
                                        )}
                                    </td>
                                    <td>
                                        <span className="fin-badge" style={{ background: st.bg, color: st.fg, borderColor: st.bd }}>
                                            {exp.status}
                                        </span>
                                        {exp.approved_by_name && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>By {exp.approved_by_name}</div>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            {exp.status === 'Pending' && perms.canApproveExpense && (
                                                <>
                                                    <button
                                                        className="fin-icon-btn ok"
                                                        title="Approve & Post to Ledger"
                                                        disabled={busyId === exp.id}
                                                        onClick={() => runAction(exp, () => apiClient.accounting.expenses.approve(exp.id), `${exp.expense_number} approved and posted to ledger.`)}
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        className="fin-icon-btn warn"
                                                        title="Reject Expense"
                                                        disabled={busyId === exp.id}
                                                        onClick={() => runAction(exp, () => apiClient.accounting.expenses.reject(exp.id), `${exp.expense_number} rejected.`)}
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </>
                                            )}
                                            {['Approved', 'Paid'].includes(exp.status) && perms.canVoidExpense && (
                                                <button
                                                    className="fin-icon-btn warn"
                                                    title="Void Expense (Reversing Journal)"
                                                    disabled={busyId === exp.id}
                                                    onClick={() => {
                                                        if (window.confirm(`Void ${exp.expense_number}? This posts a reversing journal entry.`)) {
                                                            runAction(exp, () => apiClient.accounting.expenses.void(exp.id), `${exp.expense_number} voided.`);
                                                        }
                                                    }}
                                                >
                                                    <Ban size={14} />
                                                </button>
                                            )}
                                            {['Pending', 'Rejected'].includes(exp.status) && perms.canDeleteExpense && (
                                                <button
                                                    className="fin-icon-btn danger"
                                                    title="Delete Expense"
                                                    disabled={busyId === exp.id}
                                                    onClick={() => {
                                                        if (window.confirm(`Delete ${exp.expense_number}?`)) {
                                                            runAction(exp, () => apiClient.accounting.expenses.delete(exp.id), `${exp.expense_number} deleted.`);
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

const RecordExpenseForm = ({ suppliers = [], ledgers = [], perms, showToast, onSaved, onCancel }) => {
    const [title, setTitle] = useState('');
    const [utilityType, setUtilityType] = useState('none');
    const [amount, setAmount] = useState('');
    const [taxAmount, setTaxAmount] = useState('0');
    const [dateIncurred, setDateIncurred] = useState(new Date().toISOString().split('T')[0]);
    const [supplierId, setSupplierId] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [expenseAccountId, setExpenseAccountId] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const expenseLedgers = ledgers.filter(l => (l.account_type_name || '').toLowerCase() === 'expenses');
    const settlementLedgers = ledgers.filter(l => {
        const t = (l.account_type_name || '').toLowerCase();
        const n = (l.name || '').toLowerCase();
        return (t === 'assets' && (['1000', '1010', '1020'].includes(l.code) || n.includes('cash') || n.includes('bank') || n.includes('pesa')))
            || l.code === '2000' || n.includes('accounts payable');
    });

    const save = async (statusChoice) => {
        const amt = parseFloat(amount || 0);
        const tax = parseFloat(taxAmount || 0);
        if (!title.trim()) return showToast('Enter an expense description.', 'error');
        if (amt <= 0) return showToast('Enter a valid amount.', 'error');
        if (tax < 0 || tax >= amt) return showToast('VAT Input must be non-negative and less than total amount.', 'error');

        setSaving(true);
        try {
            await apiClient.accounting.expenses.create({
                title: title.trim(),
                utility_type: utilityType,
                amount: amt.toFixed(2),
                tax_amount: tax.toFixed(2),
                date_incurred: dateIncurred,
                supplier: supplierId || undefined,
                vendor_name: vendorName.trim() || undefined,
                expense_account: expenseAccountId || undefined,
                payment_account: paymentAccountId || undefined,
                description: description.trim() || undefined,
                status: statusChoice,
            });
            showToast(
                statusChoice === 'Pending'
                    ? 'Expense submitted as Pending (off the ledger until approved).'
                    : 'Expense approved and posted to double-entry ledger.',
                'success'
            );
            onSaved();
        } catch (err) {
            showToast(err.message || 'Failed to record expense.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fin-card animations-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 17 }}>Record Expense or Supplier Bill</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                        Pending expenses wait for approval before touching the general ledger.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="fin-btn ghost" onClick={onCancel}>Cancel</button>
                    <button type="button" className="fin-btn ghost" disabled={saving} onClick={() => save('Pending')}>Submit for Approval</button>
                    {perms.canApproveExpense && (
                        <button type="button" className="fin-btn primary" disabled={saving} onClick={() => save('Approved')}>
                            <Check size={14} /> {saving ? 'Posting…' : 'Approve & Post'}
                        </button>
                    )}
                </div>
            </div>

            <div className="fin-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                        Expense Title *
                        <input className="fin-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AWS Cloud Hosting or KPLC Office Bill" />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Total Amount (KES) *
                            <input className="fin-input" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Recoverable VAT Input (KES)
                            <input className="fin-input" type="number" step="0.01" min="0" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} />
                        </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Date Incurred *
                            <input className="fin-input" type="date" value={dateIncurred} onChange={e => setDateIncurred(e.target.value)} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Utility Tag
                            <select className="fin-select" value={utilityType} onChange={e => setUtilityType(e.target.value)}>
                                <option value="none">None / General</option>
                                <option value="electricity">Electricity</option>
                                <option value="internet">Internet</option>
                                <option value="water">Water</option>
                            </select>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                        Expense Ledger (Debit)
                        <select className="fin-select" value={expenseAccountId} onChange={e => setExpenseAccountId(e.target.value)}>
                            <option value="">Default: General Business Expense (5900)</option>
                            {expenseLedgers.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} · ` : ''}{l.name}</option>)}
                        </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                        Paid From / Payable (Credit)
                        <select className="fin-select" value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)}>
                            <option value="">Unpaid Supplier Bill → Accounts Payable (2000)</option>
                            {settlementLedgers.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} · ` : ''}{l.name}</option>)}
                        </select>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Supplier
                            <select className="fin-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                                <option value="">Optional supplier…</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                            Or Vendor Name
                            <input className="fin-input" value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. Safaricom PLC" />
                        </label>
                    </div>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                        Notes
                        <textarea className="fin-textarea" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
                    </label>
                </div>
            </div>
        </div>
    );
};

