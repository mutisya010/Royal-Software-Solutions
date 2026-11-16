import { hasAnyPermission, hasPermission, isAdminUser } from '../navigationConfig';

export const formatCurrency = (val) =>
    `KES ${parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (d) => (d ? String(d).slice(0, 10) : '—');

export const STATUS_COLORS = {
    Paid: { bg: '#ecfdf5', fg: '#047857', bd: '#a7f3d0' },
    Approved: { bg: '#ecfdf5', fg: '#047857', bd: '#a7f3d0' },
    Posted: { bg: '#ecfdf5', fg: '#047857', bd: '#a7f3d0' },
    posted: { bg: '#ecfdf5', fg: '#047857', bd: '#a7f3d0' },
    Sent: { bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe' },
    Viewed: { bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe' },
    'Partially Paid': { bg: '#fefce8', fg: '#a16207', bd: '#fde68a' },
    Pending: { bg: '#fffbeb', fg: '#b45309', bd: '#fde68a' },
    Draft: { bg: '#f1f5f9', fg: '#475569', bd: '#cbd5e1' },
    Overdue: { bg: '#fef2f2', fg: '#b91c1c', bd: '#fecaca' },
    Rejected: { bg: '#fef2f2', fg: '#b91c1c', bd: '#fecaca' },
    Void: { bg: '#f1f5f9', fg: '#64748b', bd: '#cbd5e1' },
    void: { bg: '#f1f5f9', fg: '#64748b', bd: '#cbd5e1' },
    Reversed: { bg: '#fef2f2', fg: '#b91c1c', bd: '#fecaca' },
};

export const getStatusStyle = (status) => STATUS_COLORS[status] || STATUS_COLORS.Draft;

/** Derive granular Finance UI permissions from the authenticated Django user's roles/permissions. */
export const getFinancePerms = (user) => {
    const admin = isAdminUser(user);
    return {
        isAdmin: admin,
        canView: admin || hasAnyPermission(user, [
            'accounts.can_view_financials',
            'accounting.view_invoice',
            'accounting.view_expense',
            'accounting.view_ledger',
            'accounting.view_transaction',
            'accounting.can_view_financial_reports',
        ]),
        canAddInvoice: admin || hasPermission(user, 'accounting.add_invoice'),
        canEditInvoice: admin || hasPermission(user, 'accounting.change_invoice'),
        canDeleteInvoice: admin || hasPermission(user, 'accounting.delete_invoice'),
        canIssueInvoice: admin || hasPermission(user, 'accounting.can_issue_invoice'),
        canVoidInvoice: admin || hasPermission(user, 'accounting.can_void_invoice'),
        canApplyDiscount: admin || hasPermission(user, 'accounting.can_apply_discount'),
        canRecordPayment: admin || hasAnyPermission(user, ['accounting.can_record_payment', 'accounting.add_invoicepayment']),
        canReversePayment: admin || hasPermission(user, 'accounting.can_reverse_payment'),
        canAddExpense: admin || hasPermission(user, 'accounting.add_expense'),
        canApproveExpense: admin || hasPermission(user, 'accounting.can_approve_expense'),
        canDeleteExpense: admin || hasPermission(user, 'accounting.delete_expense'),
        canVoidExpense: admin || hasAnyPermission(user, ['accounting.can_approve_expense', 'accounting.can_reverse_journal']),
        canManageCOA: admin || hasPermission(user, 'accounting.can_manage_chart_of_accounts'),
        canPostJournal: admin || hasPermission(user, 'accounting.can_post_journal'),
        canReverseJournal: admin || hasPermission(user, 'accounting.can_reverse_journal'),
        canViewReports: admin || hasAnyPermission(user, [
            'accounting.can_view_financial_reports',
            'accounts.can_view_financials',
            'accounting.view_ledger',
        ]),
    };
};

export const FINANCE_STYLES = `
.fin-wrap { display: flex; flex-direction: column; gap: 20px; max-width: 1320px; }
.fin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.fin-head h2 { margin: 0; font-size: 1.45rem; font-weight: 700; color: #0f172a; }
.fin-head p { margin: 4px 0 0; color: #64748b; font-size: 13.5px; }
.fin-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; }
.fin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; }
.fin-stat { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
.fin-stat-top { display: flex; justify-content: space-between; align-items: center; }
.fin-stat-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.fin-stat-label { font-size: 12.5px; color: #64748b; font-weight: 600; }
.fin-stat-val { font-size: 1.35rem; font-weight: 800; color: #0f172a; }
.fin-stat-sub { font-size: 11.5px; color: #94a3b8; }

.fin-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
.fin-search { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; padding: 8px 12px; min-width: 240px; flex: 1; color: #94a3b8; }
.fin-search input { border: none; outline: none; background: transparent; font-size: 13.5px; width: 100%; color: #0f172a; }
.fin-select, .fin-input, .fin-textarea { border: 1px solid #e2e8f0; border-radius: 9px; padding: 9px 12px; font-size: 13.5px; background: #fff; color: #0f172a; outline: none; font-family: inherit; }
.fin-select:focus, .fin-input:focus, .fin-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

.fin-btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 9px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all .15s; white-space: nowrap; }
.fin-btn.sm { padding: 5px 10px; font-size: 12px; }
.fin-btn.primary { background: #0f172a; color: #fff; }
.fin-btn.primary:hover:not(:disabled) { background: #1e293b; }
.fin-btn.indigo { background: #6366f1; color: #fff; }
.fin-btn.indigo:hover:not(:disabled) { background: #4f46e5; }
.fin-btn.ghost { background: #fff; color: #334155; border-color: #e2e8f0; }
.fin-btn.ghost:hover:not(:disabled) { background: #f8fafc; }
.fin-btn.danger { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.fin-btn.success { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
.fin-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.fin-icon-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #475569; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.fin-icon-btn:hover { background: #f8fafc; color: #0f172a; }
.fin-icon-btn.ok { color: #047857; background: #ecfdf5; border-color: #a7f3d0; }
.fin-icon-btn.warn { color: #b45309; background: #fffbeb; border-color: #fde68a; }
.fin-icon-btn.danger { color: #dc2626; background: #fef2f2; border-color: #fecaca; }

.fin-table-wrap { overflow-x: auto; }
.fin-table { width: 100%; border-collapse: collapse; text-align: left; }
.fin-table th { font-size: 11.5px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; font-weight: 600; padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
.fin-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #334155; vertical-align: middle; }
.fin-table tr:hover td { background: #fcfdfe; }
.fin-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600; border: 1px solid transparent; white-space: nowrap; }
.fin-seg { display: inline-flex; background: #f1f5f9; border-radius: 10px; padding: 3px; gap: 2px; flex-wrap: wrap; }
.fin-seg button { border: none; background: transparent; padding: 7px 13px; border-radius: 8px; font-size: 12.5px; font-weight: 600; color: #64748b; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.fin-seg button.on { background: #fff; color: #0f172a; box-shadow: 0 1px 2px rgba(15,23,42,.08); }
.fin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.fin-charts { display: grid; grid-template-columns: 1.7fr 1fr; gap: 18px; }
.fin-empty { padding: 34px 16px; text-align: center; color: #94a3b8; font-size: 13.5px; }

@media (max-width: 1024px) { .fin-charts, .fin-grid-2 { grid-template-columns: 1fr; } }
`;

