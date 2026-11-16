import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, Receipt,
    CheckCircle, AlertCircle, Lock, RefreshCw, Landmark, Clock
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiClient } from '../services/apiClient';
import { FINANCE_STYLES, formatCurrency, getFinancePerms } from './finance/financeHelpers';
import { InvoicesSection, InvoicePreviewModal } from './finance/InvoicesSection';
import { PaymentsSection, ExpensesSection } from './finance/PaymentsExpensesSections';
import {
    ChartOfAccountsSection,
    JournalsAndGLSection,
    FinancialReportsSection,
} from './finance/LedgerReportsSections';

const VIEW_META = {
    dashboard: { title: 'Finance & Accounting Overview', desc: 'Live double-entry ledger KPIs, cash position and receivables.' },
    invoices: { title: 'Customer Invoices', desc: 'Draft, issue and manage client billing backed by Accounts Receivable.' },
    payments: { title: 'Payments Received', desc: 'Record client receipts against open invoices and post deposits.' },
    expenses: { title: 'Expenses & Bills', desc: 'Submit, approve and post supplier bills and operating expenses.' },
    'chart-of-accounts': { title: 'Chart of Accounts', desc: 'Manage ledgers across Assets, Liabilities, Equity, Revenue and Expenses.' },
    transactions: { title: 'Journals & General Ledger', desc: 'Double-entry journal register, manual adjustments and account statements.' },
    reports: { title: 'Financial Statements & Reports', desc: 'Trial Balance, Profit & Loss, Balance Sheet, VAT Return and AR Aging.' },
};

const FinanceAccounting = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawView = searchParams.get('view') || 'dashboard';
    const view = VIEW_META[rawView] ? rawView : 'dashboard';

    const currentUser = apiClient.auth.getCurrentUser();
    const perms = getFinancePerms(currentUser);

    const [summary, setSummary] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [ledgers, setLedgers] = useState([]);
    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [recentJournals, setRecentJournals] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
    }, []);

    useEffect(() => {
        if (!toast.show) return;
        const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
        return () => clearTimeout(t);
    }, [toast.show]);

    const loadAllData = useCallback(async () => {
        if (!perms.canView) return;
        setLoading(true);
        try {
            const [sumRes, invData, pmtData, expData, ledgerData, clientData, supplierData, jrnData] = await Promise.all([
                apiClient.accounting.reports.summary().catch(() => null),
                apiClient.accounting.invoices.list().catch(() => []),
                apiClient.accounting.payments.list().catch(() => []),
                apiClient.accounting.expenses.list().catch(() => []),
                apiClient.accounting.ledgers.list().catch(() => []),
                apiClient.clients.list().catch(() => []),
                apiClient.accounting.suppliers.list().catch(() => []),
                apiClient.accounting.journals.list().catch(() => []),
            ]);
            setSummary(sumRes?.report || null);
            setInvoices(Array.isArray(invData) ? invData : []);
            setPayments(Array.isArray(pmtData) ? pmtData : []);
            setExpenses(Array.isArray(expData) ? expData : []);
            setLedgers(Array.isArray(ledgerData) ? ledgerData : []);
            setClients(Array.isArray(clientData) ? clientData : []);
            setSuppliers(Array.isArray(supplierData) ? supplierData : []);
            setRecentJournals(Array.isArray(jrnData) ? jrnData.slice(0, 5) : []);
        } catch (err) {
            showToast(err.message || 'Failed to load financial records.', 'error');
        } finally {
            setLoading(false);
        }
    }, [perms.canView, showToast]);

    useEffect(() => { loadAllData(); }, [loadAllData]);

    if (!perms.canView) {
        return (
            <div className="fin-card" style={{ maxWidth: 480, margin: '60px auto', padding: '40px 32px', textAlign: 'center' }}>
                <style>{FINANCE_STYLES}</style>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Lock size={24} />
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Finance Access Restricted</h2>
                <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>
                    Your role does not grant access to Finance &amp; Accounting. Ask an administrator to assign finance permissions under <strong>Users &amp; Roles</strong>.
                </p>
            </div>
        );
    }

    const meta = VIEW_META[view];
    const invStatusPie = summary ? [
        { name: 'Paid', value: summary.invoice_counts?.paid || 0, color: '#10b981' },
        { name: 'Open', value: summary.invoice_counts?.open || 0, color: '#4f46e5' },
        { name: 'Draft', value: summary.invoice_counts?.draft || 0, color: '#94a3b8' },
    ].filter(x => x.value > 0) : [];

    return (
        <div className="fin-wrap animations-fade-in">
            <style>{FINANCE_STYLES}</style>

            <div className="fin-head">
                <div>
                    <h2>{meta.title}</h2>
                    <p>{meta.desc}</p>
                </div>
                <button className="fin-btn ghost sm" onClick={loadAllData} disabled={loading} title="Refresh live ledger data">
                    <RefreshCw size={14} /> {loading ? 'Syncing…' : 'Refresh'}
                </button>
            </div>

            {view === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="fin-stats">
                        <StatCard
                            title="Cash & Bank Balance"
                            value={formatCurrency(summary?.cash_balance)}
                            sub="Cash, Bank & M-Pesa ledgers"
                            icon={<Landmark size={18} color="#047857" />}
                            iconBg="#ecfdf5"
                        />
                        <StatCard
                            title="Accounts Receivable"
                            value={formatCurrency(summary?.accounts_receivable)}
                            sub={summary?.overdue_receivables > 0 ? `${formatCurrency(summary.overdue_receivables)} overdue` : 'Open client balances'}
                            icon={<Clock size={18} color="#4f46e5" />}
                            iconBg="#eef2ff"
                        />
                        <StatCard
                            title="Invoiced Revenue"
                            value={formatCurrency(summary?.total_revenue)}
                            sub="Posted revenue ledgers (excl. VAT)"
                            icon={<TrendingUp size={18} color="#0284c7" />}
                            iconBg="#e0f2fe"
                        />
                        <StatCard
                            title="Approved Expenses"
                            value={formatCurrency(summary?.total_expenses)}
                            sub={summary?.pending_expenses_count ? `${summary.pending_expenses_count} pending approval` : 'Posted operating expenses'}
                            icon={<Receipt size={18} color="#dc2626" />}
                            iconBg="#fef2f2"
                        />
                        <StatCard
                            title="Net Profit / (Loss)"
                            value={formatCurrency(summary?.net_profit)}
                            sub={`Net VAT Payable: ${formatCurrency(summary?.net_vat_payable)}`}
                            icon={<Wallet size={18} color={summary?.net_profit >= 0 ? '#047857' : '#dc2626'} />}
                            iconBg={summary?.net_profit >= 0 ? '#ecfdf5' : '#fef2f2'}
                        />
                    </div>

                    <div className="fin-charts">
                        <div className="fin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ margin: 0, fontSize: 15.5 }}>Monthly Revenue vs Expenses</h3>
                                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b' }}>
                                    <span><strong style={{ color: '#4f46e5' }}>●</strong> Revenue</span>
                                    <span><strong style={{ color: '#f43f5e' }}>●</strong> Expenses</span>
                                </div>
                            </div>
                            <div style={{ height: 270 }}>
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart data={summary?.monthly_series || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip formatter={(v) => formatCurrency(v)} />
                                        <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fill="#eef2ff" />
                                        <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5} fill="#fef2f2" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="fin-card">
                            <h3 style={{ margin: '0 0 14px', fontSize: 15.5 }}>Invoice Lifecycle Breakdown</h3>
                            <div style={{ height: 270 }}>
                                {invStatusPie.length === 0 ? (
                                    <div className="fin-empty" style={{ paddingTop: 90 }}>No invoices issued yet.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <PieChart>
                                            <Pie data={invStatusPie} innerRadius={60} outerRadius={84} paddingAngle={5} dataKey="value" stroke="none">
                                                {invStatusPie.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="fin-grid-2">
                        <div className="fin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ margin: 0, fontSize: 15.5 }}>Recent Double-Entry Postings</h3>
                                <button className="fin-btn ghost sm" onClick={() => setSearchParams({ view: 'transactions' })}>View All</button>
                            </div>
                            {recentJournals.length === 0 ? (
                                <div className="fin-empty">No journal postings recorded yet.</div>
                            ) : recentJournals.map(j => (
                                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                            {j.source_type === 'EXPENSE' ? <ArrowDownRight size={16} color="#dc2626" /> : <ArrowUpRight size={16} color="#047857" />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{j.subject}</div>
                                            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{j.entry_date} · {j.voucher_no || j.ref_no}</div>
                                        </div>
                                    </div>
                                    <strong style={{ color: '#0f172a' }}>{formatCurrency(j.total_debit)}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="fin-card">
                            <h3 style={{ margin: '0 0 12px', fontSize: 15.5 }}>Revenue by Ledger Account</h3>
                            <div style={{ height: 240 }}>
                                {!(summary?.revenue_streams?.length) ? (
                                    <div className="fin-empty" style={{ paddingTop: 80 }}>Post invoices to see revenue distribution by ledger.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <BarChart data={summary.revenue_streams} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                                            <Tooltip formatter={(v) => formatCurrency(v)} />
                                            <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'invoices' && (
                <InvoicesSection
                    invoices={invoices}
                    clients={clients}
                    ledgers={ledgers}
                    perms={perms}
                    showToast={showToast}
                    onReload={loadAllData}
                    onViewInvoice={setSelectedInvoice}
                    onQuickPay={(inv) => setSearchParams({ view: 'payments', invoice_id: String(inv.id) })}
                />
            )}

            {view === 'payments' && (
                <PaymentsSection
                    invoices={invoices}
                    payments={payments}
                    ledgers={ledgers}
                    initialInvoiceId={searchParams.get('invoice_id') || ''}
                    perms={perms}
                    showToast={showToast}
                    onReload={loadAllData}
                />
            )}

            {view === 'expenses' && (
                <ExpensesSection
                    expenses={expenses}
                    suppliers={suppliers}
                    ledgers={ledgers}
                    perms={perms}
                    showToast={showToast}
                    onReload={loadAllData}
                />
            )}

            {view === 'chart-of-accounts' && (
                <ChartOfAccountsSection
                    ledgers={ledgers}
                    perms={perms}
                    showToast={showToast}
                    onReload={loadAllData}
                    onOpenGL={(ledgerId) => setSearchParams({ view: 'transactions', tab: 'gl', ledger_id: String(ledgerId) })}
                />
            )}

            {view === 'transactions' && (
                <JournalsAndGLSection
                    ledgers={ledgers}
                    initialTab={searchParams.get('tab') || 'journals'}
                    initialLedgerId={searchParams.get('ledger_id') || ''}
                    perms={perms}
                    showToast={showToast}
                    onReload={loadAllData}
                />
            )}

            {view === 'reports' && (
                <FinancialReportsSection perms={perms} showToast={showToast} />
            )}

            {selectedInvoice && (
                <InvoicePreviewModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
            )}

            {toast.show && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    background: toast.type === 'error' ? '#dc2626' : '#0f172a',
                    color: '#fff', padding: '11px 16px', borderRadius: 10,
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
                    boxShadow: '0 10px 25px rgba(15,23,42,.25)'
                }}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, sub, icon, iconBg }) => (
    <div className="fin-stat">
        <div className="fin-stat-top">
            <span className="fin-stat-label">{title}</span>
            <div className="fin-stat-icon" style={{ background: iconBg }}>{icon}</div>
        </div>
        <div className="fin-stat-val">{value}</div>
        {sub && <div className="fin-stat-sub">{sub}</div>}
    </div>
);

export default FinanceAccounting;
