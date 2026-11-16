import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, BookOpen, RotateCcw, ChevronDown, ChevronRight,
    CheckCircle, AlertTriangle, Lock, X, Layers
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { formatCurrency, getStatusStyle } from './financeHelpers';

/* ------------------------------------------------------------------ */
/* Chart of Accounts                                                   */
/* ------------------------------------------------------------------ */

export const ChartOfAccountsSection = ({ ledgers = [], perms, showToast, onReload, onOpenGL }) => {
    const [accountTypes, setAccountTypes] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [accountType, setAccountType] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiClient.accounting.accountTypes.list()
            .then(data => setAccountTypes(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiClient.accounting.ledgers.create({
                code: code.trim() || undefined,
                name: name.trim(),
                account_type: accountType,
                description: description.trim() || undefined,
            });
            showToast(`Ledger "${name}" created.`, 'success');
            setShowNew(false);
            setCode('');
            setName('');
            setDescription('');
            onReload();
        } catch (err) {
            showToast(err.message || 'Failed to create ledger.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const groups = {};
    ledgers.forEach(l => {
        const key = l.account_type_name || 'Other';
        groups[key] = groups[key] || [];
        groups[key].push(l);
    });
    const order = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'];
    const orderedKeys = Object.keys(groups).sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="fin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Company Chart of Accounts</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                        Balances update atomically whenever invoices, expenses, receipts or manual journals post.
                    </p>
                </div>
                {perms.canManageCOA && (
                    <button className="fin-btn primary" onClick={() => setShowNew(!showNew)}>
                        <Plus size={15} /> New Ledger Account
                    </button>
                )}
            </div>

            {showNew && perms.canManageCOA && (
                <div className="fin-card animations-fade-in" style={{ background: '#f8fafc' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14.5 }}>Add Ledger Account</h4>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.6fr 1.2fr 1.5fr auto', gap: 10, alignItems: 'end' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            Account Code
                            <input className="fin-input" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. 5400" />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            Account Name *
                            <input className="fin-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Office Rent" />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            Account Type *
                            <select className="fin-select" required value={accountType} onChange={e => setAccountType(e.target.value)}>
                                <option value="">Select type…</option>
                                {accountTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                            </select>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            Description
                            <input className="fin-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional purpose…" />
                        </label>
                        <button type="submit" className="fin-btn primary" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
                    </form>
                </div>
            )}

            {orderedKeys.map(typeName => (
                <div key={typeName} className="fin-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Layers size={15} color="#4f46e5" /> {typeName}
                        </strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{groups[typeName].length} accounts</span>
                    </div>
                    <div className="fin-table-wrap">
                        <table className="fin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 90 }}>Code</th>
                                    <th>Ledger Name</th>
                                    <th style={{ textAlign: 'right' }}>Total Debit</th>
                                    <th style={{ textAlign: 'right' }}>Total Credit</th>
                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                    <th style={{ textAlign: 'right', width: 110 }}>Statement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups[typeName].map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 700, color: '#475569' }}>{l.code || '—'}</td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{l.name}</span>
                                            {l.is_system && (
                                                <span className="fin-badge" style={{ marginLeft: 8, background: '#f1f5f9', color: '#64748b', fontSize: 10 }}>
                                                    Control
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', color: '#047857' }}>{formatCurrency(l.total_debit)}</td>
                                        <td style={{ textAlign: 'right', color: '#b91c1c' }}>{formatCurrency(l.total_credit)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(l.balance)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="fin-btn ghost sm" onClick={() => onOpenGL(l.id)}>
                                                <BookOpen size={13} /> View GL
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Double-Entry Journal Register & General Ledger Statement            */
/* ------------------------------------------------------------------ */

export const JournalsAndGLSection = ({
    ledgers = [],
    initialTab = 'journals',
    initialLedgerId = '',
    perms,
    showToast,
    onReload,
}) => {
    const [tab, setTab] = useState(initialTab);
    const [journals, setJournals] = useState([]);
    const [sourceFilter, setSourceFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState({});
    const [showModal, setShowModal] = useState(false);

    // GL state
    const [glLedgerId, setGlLedgerId] = useState(initialLedgerId || '');
    const [glStart, setGlStart] = useState('');
    const [glEnd, setGlEnd] = useState('');
    const [glData, setGlData] = useState(null);
    const [glLoading, setGlLoading] = useState(false);

    useEffect(() => {
        if (initialTab) setTab(initialTab);
        if (initialLedgerId) setGlLedgerId(String(initialLedgerId));
    }, [initialTab, initialLedgerId]);

    const loadJournals = useCallback(async () => {
        try {
            const list = await apiClient.accounting.journals.list({ source_type: sourceFilter, search });
            setJournals(Array.isArray(list) ? list : []);
        } catch (err) {
            showToast(err.message || 'Failed to load journals.', 'error');
        }
    }, [sourceFilter, search]);

    const loadGL = useCallback(async () => {
        setGlLoading(true);
        try {
            const res = await apiClient.accounting.reports.ledger({
                ledger_id: glLedgerId || undefined,
                start_date: glStart || undefined,
                end_date: glEnd || undefined,
            });
            setGlData(res);
        } catch (err) {
            showToast(err.message || 'Failed to load General Ledger.', 'error');
        } finally {
            setGlLoading(false);
        }
    }, [glLedgerId, glStart, glEnd]);

    useEffect(() => {
        if (tab === 'journals') loadJournals();
        else loadGL();
    }, [tab, loadJournals, loadGL]);

    const handleReverse = async (txn) => {
        const reason = window.prompt(`Reason for reversing ${txn.voucher_no || txn.ref_no}?`, 'Correction');
        if (reason === null) return;
        try {
            await apiClient.accounting.journals.reverse(txn.id, reason);
            showToast(`Contra reversal journal posted for ${txn.voucher_no || txn.ref_no}.`, 'success');
            loadJournals();
            onReload();
        } catch (err) {
            showToast(err.message || 'Failed to reverse journal.', 'error');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div className="fin-seg">
                    <button className={tab === 'journals' ? 'on' : ''} onClick={() => setTab('journals')}>Journal Register</button>
                    <button className={tab === 'gl' ? 'on' : ''} onClick={() => setTab('gl')}>General Ledger Statement</button>
                </div>
                {tab === 'journals' && perms.canPostJournal && (
                    <button className="fin-btn primary" onClick={() => setShowModal(true)}>
                        <Plus size={15} /> Post Manual Journal
                    </button>
                )}
            </div>

            {tab === 'journals' ? (
                <div className="fin-card">
                    <div className="fin-toolbar">
                        <div className="fin-search">
                            <Search size={15} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search voucher, reference or memo…" />
                        </div>
                        <select className="fin-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                            <option value="all">All sources</option>
                            <option value="INVOICE">Invoices</option>
                            <option value="PAYMENT">Payments</option>
                            <option value="EXPENSE">Expenses</option>
                            <option value="MANUAL">Manual Journals</option>
                            <option value="REVERSAL">Reversals</option>
                        </select>
                    </div>

                    <div className="fin-table-wrap">
                        <table className="fin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 32 }}></th>
                                    <th>Date</th>
                                    <th>Voucher / Ref</th>
                                    <th>Source</th>
                                    <th>Description</th>
                                    <th style={{ textAlign: 'right' }}>Debit = Credit</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {journals.length === 0 && (
                                    <tr><td colSpan={8} className="fin-empty">No journal entries found.</td></tr>
                                )}
                                {journals.map(j => {
                                    const open = !!expanded[j.id];
                                    const st = getStatusStyle(j.is_reversed ? 'Reversed' : j.post_status);
                                    return (
                                        <React.Fragment key={j.id}>
                                            <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(e => ({ ...e, [j.id]: !open }))}>
                                                <td>{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
                                                <td>{j.entry_date}</td>
                                                <td>
                                                    <div style={{ fontWeight: 700 }}>{j.voucher_no || `JRN-${j.id}`}</div>
                                                    {j.ref_no && <div style={{ fontSize: 11.5, color: '#64748b' }}>Ref: {j.ref_no}</div>}
                                                </td>
                                                <td><span className="fin-badge" style={{ background: '#f1f5f9', color: '#334155' }}>{j.source_type || j.trnsaction_type || 'GENERAL'}</span></td>
                                                <td style={{ fontWeight: 600 }}>{j.subject}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(j.total_debit)}</td>
                                                <td>
                                                    <span className="fin-badge" style={{ background: st.bg, color: st.fg, borderColor: st.bd }}>
                                                        {j.is_reversed ? 'Reversed' : j.post_status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                    {!j.is_reversed && j.post_status === 'posted' && perms.canReverseJournal && (
                                                        <button className="fin-icon-btn danger" title="Reverse Journal" onClick={() => handleReverse(j)}>
                                                            <RotateCcw size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {open && (
                                                <tr>
                                                    <td colSpan={8} style={{ background: '#f8fafc', padding: '10px 46px 14px' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                                            <thead>
                                                                <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                                                    <th style={{ padding: '6px 8px' }}>Ledger</th>
                                                                    <th style={{ padding: '6px 8px' }}>Line Description</th>
                                                                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Debit</th>
                                                                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Credit</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(j.details || []).map(d => (
                                                                    <tr key={d.id}>
                                                                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{d.ledger_code ? `${d.ledger_code} · ` : ''}{d.ledger_name}</td>
                                                                        <td style={{ padding: '6px 8px', color: '#64748b' }}>{d.description}</td>
                                                                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#047857' }}>{parseFloat(d.debit) > 0 ? formatCurrency(d.debit) : '—'}</td>
                                                                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#b91c1c' }}>{parseFloat(d.credit) > 0 ? formatCurrency(d.credit) : '—'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="fin-card">
                    <div className="fin-toolbar">
                        <select className="fin-select" style={{ minWidth: 260 }} value={glLedgerId} onChange={e => setGlLedgerId(e.target.value)}>
                            <option value="">All Accounts (Latest 200 Postings)</option>
                            {ledgers.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} · ` : ''}{l.name} ({l.account_type_name})</option>)}
                        </select>
                        <input className="fin-input" type="date" value={glStart} onChange={e => setGlStart(e.target.value)} />
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
                        <input className="fin-input" type="date" value={glEnd} onChange={e => setGlEnd(e.target.value)} />
                    </div>

                    {glData?.ledger && (
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, fontSize: 13 }}>
                            <span>Account: <strong>{glData.ledger.code} {glData.ledger.name}</strong></span>
                            <span>Opening Balance: <strong>{formatCurrency(glData.opening_balance)}</strong></span>
                            <span>Closing Balance: <strong style={{ color: '#4f46e5' }}>{formatCurrency(glData.closing_balance)}</strong></span>
                        </div>
                    )}

                    <div className="fin-table-wrap">
                        <table className="fin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Voucher / Ref</th>
                                    {!glLedgerId && <th>Account</th>}
                                    <th>Memo</th>
                                    <th style={{ textAlign: 'right' }}>Debit</th>
                                    <th style={{ textAlign: 'right' }}>Credit</th>
                                    {glLedgerId && <th style={{ textAlign: 'right' }}>Running Balance</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {glLoading && <tr><td colSpan={7} className="fin-empty">Loading ledger lines…</td></tr>}
                                {!glLoading && (!glData?.results || glData.results.length === 0) && (
                                    <tr><td colSpan={7} className="fin-empty">No ledger postings in this selection.</td></tr>
                                )}
                                {!glLoading && glData?.results?.map(row => (
                                    <tr key={row.id}>
                                        <td>{row.date}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{row.voucher_no || row.ref_no || '—'}</div>
                                            {row.ref_no && row.voucher_no && <div style={{ fontSize: 11, color: '#64748b' }}>{row.ref_no}</div>}
                                        </td>
                                        {!glLedgerId && <td style={{ fontWeight: 600 }}>{row.ledger_code ? `${row.ledger_code} · ` : ''}{row.ledger}</td>}
                                        <td>{row.description || row.subject}</td>
                                        <td style={{ textAlign: 'right', color: '#047857' }}>{row.debit > 0 ? formatCurrency(row.debit) : '—'}</td>
                                        <td style={{ textAlign: 'right', color: '#b91c1c' }}>{row.credit > 0 ? formatCurrency(row.credit) : '—'}</td>
                                        {glLedgerId && <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(row.running_balance)}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <ManualJournalModal
                    ledgers={ledgers}
                    showToast={showToast}
                    onClose={() => setShowModal(false)}
                    onPosted={() => { setShowModal(false); loadJournals(); onReload(); }}
                />
            )}
        </div>
    );
};

const ManualJournalModal = ({ ledgers, showToast, onClose, onPosted }) => {
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [refNo, setRefNo] = useState('');
    const [subject, setSubject] = useState('');
    const [lines, setLines] = useState([
        { id: 1, ledger: '', description: '', debit: '', credit: '' },
        { id: 2, ledger: '', description: '', debit: '', credit: '' },
    ]);
    const [saving, setSaving] = useState(false);

    const totDebit = lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0);
    const totCredit = lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0);
    const balanced = totDebit > 0 && Math.abs(totDebit - totCredit) < 0.005;

    const update = (id, k, v) => setLines(lines.map(l => (l.id === id ? { ...l, [k]: v } : l)));

    const submit = async (e) => {
        e.preventDefault();
        if (!subject.trim()) return showToast('Enter a journal description.', 'error');
        if (!balanced) return showToast('Debits must equal Credits before posting.', 'error');
        setSaving(true);
        try {
            await apiClient.accounting.journals.create({
                entry_date: entryDate,
                ref_no: refNo.trim(),
                subject: subject.trim(),
                lines: lines
                    .filter(l => l.ledger && (parseFloat(l.debit || 0) > 0 || parseFloat(l.credit || 0) > 0))
                    .map(l => ({
                        ledger: Number(l.ledger),
                        description: l.description.trim() || subject.trim(),
                        debit: parseFloat(l.debit || 0).toFixed(2),
                        credit: parseFloat(l.credit || 0).toFixed(2),
                    })),
            });
            showToast('Manual journal entry posted.', 'success');
            onPosted();
        } catch (err) {
            showToast(err.message || 'Failed to post journal.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>Post Manual Journal Entry</h3>
                        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>Balanced double-entry adjustments, opening balances and accruals.</p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
                </div>
                <form onSubmit={submit} style={{ padding: 22, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '160px 180px 1fr', gap: 12 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
                            Date *
                            <input className="fin-input" type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
                            Reference
                            <input className="fin-input" value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="e.g. CAP-001" />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
                            Subject / Narration *
                            <input className="fin-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Owner capital injection" required />
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {lines.map(l => (
                            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 0.8fr 0.8fr auto', gap: 8, alignItems: 'center' }}>
                                <select className="fin-select" value={l.ledger} onChange={e => update(l.id, 'ledger', e.target.value)} required>
                                    <option value="">Select Ledger…</option>
                                    {ledgers.map(ld => <option key={ld.id} value={ld.id}>{ld.code ? `${ld.code} · ` : ''}{ld.name} ({ld.account_type_name})</option>)}
                                </select>
                                <input className="fin-input" placeholder="Line memo…" value={l.description} onChange={e => update(l.id, 'description', e.target.value)} />
                                <input className="fin-input" type="number" step="0.01" min="0" placeholder="Debit" value={l.debit} onChange={e => update(l.id, 'debit', e.target.value)} />
                                <input className="fin-input" type="number" step="0.01" min="0" placeholder="Credit" value={l.credit} onChange={e => update(l.id, 'credit', e.target.value)} />
                                <button type="button" className="fin-icon-btn danger" disabled={lines.length <= 2} onClick={() => setLines(lines.filter(x => x.id !== l.id))}>✕</button>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
                        <button type="button" className="fin-btn ghost sm" onClick={() => setLines([...lines, { id: Date.now(), ledger: '', description: '', debit: '', credit: '' }])}>
                            <Plus size={13} /> Add Line
                        </button>
                        <div style={{ display: 'flex', gap: 18, fontSize: 13 }}>
                            <span>Debit: <strong>{formatCurrency(totDebit)}</strong></span>
                            <span>Credit: <strong>{formatCurrency(totCredit)}</strong></span>
                            <span style={{ color: balanced ? '#047857' : '#dc2626', fontWeight: 700 }}>
                                {balanced ? 'Balanced' : `Diff: ${formatCurrency(Math.abs(totDebit - totCredit))}`}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button type="button" className="fin-btn ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="fin-btn primary" disabled={!balanced || saving}>{saving ? 'Posting…' : 'Post Journal'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Financial Statements & Statutory Reports                            */
/* ------------------------------------------------------------------ */

export const FinancialReportsSection = ({ perms, showToast }) => {
    const [sub, setSub] = useState('trial-balance');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!perms.canViewReports) return;
        setLoading(true);
        try {
            const p = { start_date: startDate || undefined, end_date: endDate || undefined };
            let res;
            if (sub === 'trial-balance') res = await apiClient.accounting.reports.trialBalance(p);
            else if (sub === 'pnl') res = await apiClient.accounting.reports.profitAndLoss(p);
            else if (sub === 'balance-sheet') res = await apiClient.accounting.reports.balanceSheet(p);
            else if (sub === 'vat') res = await apiClient.accounting.reports.vatSummary(p);
            else res = await apiClient.accounting.reports.aging();
            setReport(res?.report || null);
        } catch (err) {
            showToast(err.message || 'Failed to load financial report.', 'error');
        } finally {
            setLoading(false);
        }
    }, [sub, startDate, endDate, perms.canViewReports]);

    useEffect(() => { load(); }, [load]);

    if (!perms.canViewReports) {
        return (
            <div className="fin-card" style={{ textAlign: 'center', padding: 48 }}>
                <Lock size={28} color="#dc2626" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ margin: '0 0 6px' }}>Reports Restricted</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13.5 }}>
                    Financial statements require the <code>can_view_financial_reports</code> permission.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div className="fin-seg">
                    <button className={sub === 'trial-balance' ? 'on' : ''} onClick={() => setSub('trial-balance')}>Trial Balance</button>
                    <button className={sub === 'pnl' ? 'on' : ''} onClick={() => setSub('pnl')}>Profit &amp; Loss</button>
                    <button className={sub === 'balance-sheet' ? 'on' : ''} onClick={() => setSub('balance-sheet')}>Balance Sheet</button>
                    <button className={sub === 'vat' ? 'on' : ''} onClick={() => setSub('vat')}>VAT Return</button>
                    <button className={sub === 'aging' ? 'on' : ''} onClick={() => setSub('aging')}>AR Aging</button>
                </div>
                {sub !== 'aging' && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input className="fin-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
                        <input className="fin-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                )}
            </div>

            {loading ? (
                <div className="fin-card fin-empty">Generating double-entry report…</div>
            ) : !report ? (
                <div className="fin-card fin-empty">No report data available.</div>
            ) : sub === 'trial-balance' ? (
                <div className="fin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>Trial Balance</h3>
                        <span className="fin-badge" style={report.is_balanced ? { background: '#ecfdf5', color: '#047857' } : { background: '#fef2f2', color: '#b91c1c' }}>
                            {report.is_balanced ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                            {report.is_balanced ? 'Debits = Credits (Balanced)' : 'Out of Balance'}
                        </span>
                    </div>
                    <table className="fin-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Account</th>
                                <th>Type</th>
                                <th style={{ textAlign: 'right' }}>Debit Balance</th>
                                <th style={{ textAlign: 'right' }}>Credit Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(report.rows || []).length === 0 && <tr><td colSpan={5} className="fin-empty">No posted entries yet.</td></tr>}
                            {(report.rows || []).map(r => (
                                <tr key={r.ledger_id}>
                                    <td style={{ fontWeight: 700 }}>{r.code || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>{r.account}</td>
                                    <td>{r.account_type}</td>
                                    <td style={{ textAlign: 'right' }}>{r.debit_balance > 0 ? formatCurrency(r.debit_balance) : '—'}</td>
                                    <td style={{ textAlign: 'right' }}>{r.credit_balance > 0 ? formatCurrency(r.credit_balance) : '—'}</td>
                                </tr>
                            ))}
                            <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                                <td colSpan={3}>TOTAL</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(report.total_debit_balances)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(report.total_credit_balances)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : sub === 'pnl' ? (
                <div className="fin-card">
                    <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Profit &amp; Loss (Income Statement — Accrual Basis)</h3>
                    <div className="fin-grid-2">
                        <div>
                            <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#047857', textTransform: 'uppercase' }}>Revenue</h4>
                            <table className="fin-table">
                                <tbody>
                                    {(report.revenue || []).length === 0 && <tr><td className="fin-empty">No posted revenue.</td></tr>}
                                    {(report.revenue || []).map((r, i) => (
                                        <tr key={i}><td>{r.code} {r.category}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(r.amount)}</td></tr>
                                    ))}
                                    <tr style={{ background: '#ecfdf5', fontWeight: 800 }}>
                                        <td>Total Revenue</td><td style={{ textAlign: 'right' }}>{formatCurrency(report.total_revenue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#b91c1c', textTransform: 'uppercase' }}>Expenses</h4>
                            <table className="fin-table">
                                <tbody>
                                    {(report.expenses || []).length === 0 && <tr><td className="fin-empty">No posted expenses.</td></tr>}
                                    {(report.expenses || []).map((r, i) => (
                                        <tr key={i}><td>{r.code} {r.category}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(r.amount)}</td></tr>
                                    ))}
                                    <tr style={{ background: '#fef2f2', fontWeight: 800 }}>
                                        <td>Total Expenses</td><td style={{ textAlign: 'right' }}>{formatCurrency(report.total_expenses)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div style={{ marginTop: 18, padding: '14px 18px', borderRadius: 12, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                        <span>Net Profit / (Loss)</span>
                        <span style={{ color: report.net_profit >= 0 ? '#047857' : '#dc2626' }}>{formatCurrency(report.net_profit)}</span>
                    </div>
                </div>
            ) : sub === 'balance-sheet' ? (
                <div className="fin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>Balance Sheet</h3>
                        <span className="fin-badge" style={report.is_balanced ? { background: '#ecfdf5', color: '#047857' } : { background: '#fef2f2', color: '#b91c1c' }}>
                            {report.is_balanced ? 'Assets = Liabilities + Equity' : 'Unbalanced'}
                        </span>
                    </div>
                    <div className="fin-grid-2">
                        <div>
                            <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#0f172a', textTransform: 'uppercase' }}>Assets</h4>
                            <table className="fin-table">
                                <tbody>
                                    {(report.assets || []).map((a, i) => (
                                        <tr key={i}><td>{a.code} {a.account}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(a.balance)}</td></tr>
                                    ))}
                                    <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                                        <td>Total Assets</td><td style={{ textAlign: 'right' }}>{formatCurrency(report.total_assets)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#0f172a', textTransform: 'uppercase' }}>Liabilities</h4>
                                <table className="fin-table">
                                    <tbody>
                                        {(report.liabilities || []).map((a, i) => (
                                            <tr key={i}><td>{a.code} {a.account}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(a.balance)}</td></tr>
                                        ))}
                                        <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                                            <td>Total Liabilities</td><td style={{ textAlign: 'right' }}>{formatCurrency(report.total_liabilities)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#0f172a', textTransform: 'uppercase' }}>Equity</h4>
                                <table className="fin-table">
                                    <tbody>
                                        {(report.equity || []).map((a, i) => (
                                            <tr key={i}><td>{a.code} {a.account}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(a.balance)}</td></tr>
                                        ))}
                                        <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                                            <td>Total Liabilities &amp; Equity</td><td style={{ textAlign: 'right' }}>{formatCurrency(report.total_liabilities_and_equity)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : sub === 'vat' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="fin-stats">
                        <div className="fin-stat">
                            <span className="fin-stat-label">VAT Output (2100 · Sales)</span>
                            <span className="fin-stat-val">{formatCurrency(report.vat_output)}</span>
                        </div>
                        <div className="fin-stat">
                            <span className="fin-stat-label">VAT Input (1200 · Purchases)</span>
                            <span className="fin-stat-val" style={{ color: '#047857' }}>{formatCurrency(report.vat_input)}</span>
                        </div>
                        <div className="fin-stat">
                            <span className="fin-stat-label">Net VAT Payable / (Claimable)</span>
                            <span className="fin-stat-val" style={{ color: report.net_vat_payable >= 0 ? '#4f46e5' : '#047857' }}>
                                {formatCurrency(report.net_vat_payable)}
                            </span>
                        </div>
                    </div>
                    <div className="fin-grid-2">
                        <div className="fin-card">
                            <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Taxable Sales Invoices</h4>
                            <table className="fin-table">
                                <thead><tr><th>Invoice</th><th>Client</th><th style={{ textAlign: 'right' }}>VAT</th></tr></thead>
                                <tbody>
                                    {(report.taxable_sales || []).length === 0 && <tr><td colSpan={3} className="fin-empty">None</td></tr>}
                                    {(report.taxable_sales || []).map((s, i) => (
                                        <tr key={i}><td>{s.invoice_number}</td><td>{s.client}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(s.vat)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="fin-card">
                            <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Taxable Expenses (VAT Input)</h4>
                            <table className="fin-table">
                                <thead><tr><th>Expense</th><th>Vendor</th><th style={{ textAlign: 'right' }}>VAT</th></tr></thead>
                                <tbody>
                                    {(report.taxable_purchases || []).length === 0 && <tr><td colSpan={3} className="fin-empty">None</td></tr>}
                                    {(report.taxable_purchases || []).map((p, i) => (
                                        <tr key={i}><td>{p.expense_number}</td><td>{p.vendor}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.vat)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="fin-stats">
                        {[
                            ['Current (Not Due)', report.buckets?.current],
                            ['1 – 30 Days', report.buckets?.days_1_30],
                            ['31 – 60 Days', report.buckets?.days_31_60],
                            ['61 – 90 Days', report.buckets?.days_61_90],
                            ['90+ Days', report.buckets?.over_90],
                        ].map(([lbl, val]) => (
                            <div key={lbl} className="fin-stat">
                                <span className="fin-stat-label">{lbl}</span>
                                <span className="fin-stat-val">{formatCurrency(val)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="fin-card">
                        <h3 style={{ margin: '0 0 12px', fontSize: 15.5 }}>Open Receivables Aging Breakdown</h3>
                        <table className="fin-table">
                            <thead>
                                <tr><th>Invoice</th><th>Client</th><th>Due Date</th><th>Overdue</th><th style={{ textAlign: 'right' }}>Balance Due</th></tr>
                            </thead>
                            <tbody>
                                {(report.invoices || []).length === 0 && <tr><td colSpan={5} className="fin-empty">No open receivables.</td></tr>}
                                {(report.invoices || []).map(inv => (
                                    <tr key={inv.id}>
                                        <td style={{ fontWeight: 700 }}>{inv.invoice_number}</td>
                                        <td>{inv.client || '—'}</td>
                                        <td>{inv.due_date}</td>
                                        <td>{inv.days_overdue > 0 ? `${inv.days_overdue} days` : 'Current'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>{formatCurrency(inv.balance_due)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

