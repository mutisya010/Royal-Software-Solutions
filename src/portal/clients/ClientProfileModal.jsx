import React, { useState, useEffect } from 'react';
import { 
    X, Building2, User, Mail, Phone, MapPin, 
    CreditCard, FileText, Send, MessageSquare, Edit3, 
    Trash2, RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, 
    Download, Printer, Share2, DollarSign, Calendar, Clock, ChevronRight
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const TEMPLATES = [
    { id: 'custom', name: 'Custom Message', text: '' },
    { id: 'statement_notice', name: 'Account Statement Notification', text: 'Dear {client_name},\n\nPlease find attached your authoritative Statement of Account from Royal Software Solutions. Your current outstanding balance is KES {outstanding_balance}.\n\nKindly review and process payment per the remittance instructions provided.\n\nWarm regards,\nAccounts Team\nRoyal Software Solutions' },
    { id: 'overdue_reminder', name: 'Overdue Balance Reminder', text: 'Dear {client_name},\n\nThis is a friendly reminder that your account currently has an outstanding balance of KES {outstanding_balance}.\n\nPlease ensure settlement at your earliest convenience to maintain continuous service delivery.\n\nThank you for choosing Royal Software Solutions.' },
    { id: 'project_update', name: 'Project Milestone Progress Update', text: 'Hello {client_name},\n\nWe are pleased to provide an update regarding your ongoing project milestones with Royal Software Solutions.\n\nPlease let us know if you require any clarifications or additional documentation.' }
];

const ClientProfileModal = ({ 
    isOpen, 
    onClose, 
    client, 
    onEdit, 
    onDelete, 
    showToast,
    onOpenEmailConfig 
}) => {
    const [activeTab, setActiveTab] = useState('financials'); // 'financials', 'overview', 'communications', 'projects', 'documents'
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loadingFinancials, setLoadingFinancials] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Statement generation state
    const [generatingStatement, setGeneratingStatement] = useState(false);
    const [generatedStatement, setGeneratedStatement] = useState(null);

    // Email composer state
    const [emailSubject, setEmailSubject] = useState('Statement of Account - Royal Software Solutions');
    const [emailMessage, setEmailMessage] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('statement_notice');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [channelType, setChannelType] = useState('EMAIL'); // 'EMAIL', 'SMS', 'CALL', 'WHATSAPP'

    useEffect(() => {
        if (isOpen && client) {
            loadFinancials();
            loadLogs();
            setGeneratedStatement(null);
            handleTemplateChange('statement_notice');
        }
    }, [isOpen, client?.id]);

    const loadFinancials = async () => {
        if (!client) return;
        setLoadingFinancials(true);
        try {
            const allInvoices = await apiClient.accounting.invoices.list().catch(() => []);
            const clientInvoices = (allInvoices || []).filter(inv => inv.client === client.id);
            setInvoices(clientInvoices);

            const allPayments = await apiClient.accounting.payments.list().catch(() => []);
            const invoiceIds = clientInvoices.map(inv => inv.id);
            const clientPayments = (allPayments || []).filter(pmt => invoiceIds.includes(pmt.invoice)).map(pmt => {
                const matchedInv = clientInvoices.find(i => i.id === pmt.invoice);
                return {
                    ...pmt,
                    invoice_number: matchedInv ? matchedInv.invoice_number : 'Direct'
                };
            });
            setPayments(clientPayments);
        } catch (err) {
            console.error('Failed to load client financials:', err);
        } finally {
            setLoadingFinancials(false);
        }
    };

    const loadLogs = async () => {
        if (!client) return;
        setLoadingLogs(true);
        try {
            const data = await apiClient.communications.list(client.id).catch(() => []);
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load communications logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleTemplateChange = (templateId) => {
        setSelectedTemplate(templateId);
        const template = TEMPLATES.find(t => t.id === templateId);
        if (!template || templateId === 'custom') {
            return;
        }
        const name = client ? client.name : '[Client Name]';
        const balance = client ? parseFloat(client.outstanding_balance || client.outstanding_debt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        
        let formattedText = template.text
            .replace(/{client_name}/g, name)
            .replace(/{outstanding_balance}/g, balance);
            
        setEmailMessage(formattedText);
        if (templateId === 'statement_notice') {
            setEmailSubject(`Statement of Account - ${name}`);
        } else if (templateId === 'overdue_reminder') {
            setEmailSubject(`Important: Payment Reminder - ${name}`);
        }
    };

    // Trigger WeasyPrint Document Studio Statement Generator
    const handleGenerateStatement = async () => {
        if (!client) return;
        setGeneratingStatement(true);
        try {
            const payload = {
                document_type: 'statement',
                record_id: client.id
            };
            const response = await apiClient.documents.generateDocument(payload);
            setGeneratedStatement(response);
            if (showToast) showToast('WeasyPrint Statement of Account compiled successfully!', 'success');
        } catch (err) {
            console.error('Statement generation error:', err);
            if (showToast) showToast(err.message || 'Failed to generate statement.', 'error');
        } finally {
            setGeneratingStatement(false);
        }
    };

    // Send Email or Message via Resend / Dispatcher
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!emailMessage.trim()) {
            if (showToast) showToast('Please enter a message.', 'error');
            return;
        }

        setSendingEmail(true);
        try {
            const payload = {
                client: client.id,
                channel: channelType,
                subject: emailSubject,
                message: emailMessage,
                document_id: generatedStatement ? generatedStatement.id : null
            };

            const resp = await apiClient.post('/api/v1/clients_management/communications/send/', payload);
            if (resp && (resp.success || resp.message_id || resp.status === 'success')) {
                if (showToast) {
                    showToast(
                        channelType === 'EMAIL' 
                            ? `Email sent successfully via Resend to ${client.email}!` 
                            : 'Message dispatched successfully!',
                        'success'
                    );
                }
                setEmailMessage('');
                loadLogs();
            } else {
                if (showToast) showToast(resp?.error || 'Failed to dispatch message.', 'error');
            }
        } catch (err) {
            console.error('Send message error:', err);
            if (showToast) showToast(err.message || 'Failed to send communication.', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    if (!isOpen || !client) return null;

    const outstandingBalance = parseFloat(client.outstanding_balance || client.outstanding_debt || 0);
    const creditLimit = parseFloat(client.credit_limit || 0);
    const creditUsedPercent = creditLimit > 0 ? Math.min(100, Math.round((outstandingBalance / creditLimit) * 100)) : 0;
    const totalInvoiced = invoices.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return (
        <div 
            className="doc-modal-overlay" 
            onClick={onClose}
            style={{ 
                position: 'fixed', 
                inset: 0, 
                zIndex: 99999, 
                background: 'rgba(15, 23, 42, 0.65)', 
                backdropFilter: 'blur(4px)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '1.5rem' 
            }}
        >
            <div 
                className="doc-modal-content" 
                onClick={e => e.stopPropagation()} 
                style={{ maxWidth: '980px', width: '100%', maxHeight: '92vh', overflowY: 'auto', position: 'relative', zIndex: 100000 }}
            >
                {/* Hero Header */}
                <div style={{
                    padding: '24px 28px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                            {client.logo ? (
                                <img 
                                    src={client.logo} 
                                    alt={client.name} 
                                    style={{ width: 62, height: 62, borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} 
                                />
                            ) : (
                                <div style={{
                                    width: 62,
                                    height: 62,
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '22px',
                                    fontWeight: 800,
                                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.4)'
                                }}>
                                    {client.abbreviation || client.name.slice(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
                                        {client.name}
                                    </h2>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '3px 8px',
                                        borderRadius: '8px',
                                        background: client.is_active !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: client.is_active !== false ? '#34d399' : '#f87171',
                                        border: client.is_active !== false ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                                    }}>
                                        {client.is_active !== false ? 'Active Account' : 'Inactive'}
                                    </span>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '3px 8px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#cbd5e1'
                                    }}>
                                        {client.client_category || 'Standard'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '13px', color: '#94a3b8' }}>
                                    <span>ID: #{client.id}</span>
                                    {client.email && <span>• {client.email}</span>}
                                    {client.phone && <span>• {client.phone}</span>}
                                    {client.tax_id && <span>• PIN: {client.tax_id}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Top Close & Edit Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => onEdit(client)}
                                className="btn-outline"
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    fontSize: '12.5px',
                                    borderColor: 'rgba(255,255,255,0.25)',
                                    color: '#ffffff',
                                    background: 'rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Edit3 size={14} /> Edit
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Financial Metrics Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Total Invoiced</div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginTop: '3px' }}>
                                KES {totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Total Paid</div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#34d399', marginTop: '3px' }}>
                                KES {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Outstanding Balance</div>
                            <div style={{ fontSize: '16px', fontWeight: 900, color: outstandingBalance > 0 ? '#f87171' : '#34d399', marginTop: '2px' }}>
                                KES {outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Credit Limit</div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginTop: '3px' }}>
                                KES {creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            {creditLimit > 0 && (
                                <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                                    <div style={{ width: `${creditUsedPercent}%`, height: '100%', background: creditUsedPercent > 80 ? '#ef4444' : '#0d9488' }}></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Action Pills */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={handleGenerateStatement}
                            disabled={generatingStatement}
                            className="btn-primary"
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                                border: 'none',
                                fontWeight: 700,
                                boxShadow: '0 4px 10px rgba(15, 118, 110, 0.3)'
                            }}
                        >
                            <FileText size={15} />
                            {generatingStatement ? 'Compiling Statement...' : 'Statement of Account (WeasyPrint)'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('communications');
                                setChannelType('EMAIL');
                            }}
                            className="btn-outline"
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderColor: 'rgba(255,255,255,0.3)',
                                color: '#ffffff',
                                background: 'rgba(255,255,255,0.08)'
                            }}
                        >
                            <Mail size={15} /> Send Resend Email
                        </button>

                        {client.phone && (
                            <a
                                href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-outline"
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    color: '#ffffff',
                                    background: 'rgba(255,255,255,0.08)',
                                    textDecoration: 'none'
                                }}
                            >
                                <MessageSquare size={15} /> WhatsApp
                            </a>
                        )}

                        {onOpenEmailConfig && (
                            <button
                                type="button"
                                onClick={onOpenEmailConfig}
                                style={{
                                    marginLeft: 'auto',
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    background: 'transparent',
                                    border: '1px dashed rgba(255,255,255,0.3)',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                ⚙️ Resend Gateway DB Settings
                            </button>
                        )}
                    </div>
                </div>

                {/* Generated Statement Banner (If freshly generated) */}
                {generatedStatement && (
                    <div style={{
                        background: '#f0fdfa',
                        borderBottom: '1px solid #ccfbf1',
                        padding: '14px 28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CheckCircle2 size={20} style={{ color: '#0f766e' }} />
                            <div>
                                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f766e' }}>
                                    WeasyPrint Statement Compiled: {generatedStatement.reference_number || 'STMT-PDF'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    Pixel-perfect A4 ledger compiled with Document Studio branding profile.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {generatedStatement.file && (
                                <a
                                    href={generatedStatement.file}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-outline"
                                    style={{
                                        padding: '7px 14px',
                                        borderRadius: '8px',
                                        fontSize: '12.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        borderColor: '#0f766e',
                                        color: '#0f766e',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <Download size={14} /> Download PDF
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('communications');
                                    setChannelType('EMAIL');
                                    handleTemplateChange('statement_notice');
                                }}
                                className="btn-primary"
                                style={{
                                    padding: '7px 16px',
                                    borderRadius: '8px',
                                    fontSize: '12.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Send size={14} /> Email via Resend
                            </button>
                        </div>
                    </div>
                )}

                {/* Sub-tabs Navigation */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    padding: '0 28px',
                    gap: '24px'
                }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('financials')}
                        style={{
                            padding: '14px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'financials' ? '2px solid #0f766e' : '2px solid transparent',
                            color: activeTab === 'financials' ? '#0f766e' : '#64748b',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <CreditCard size={16} /> Financials & Ledgers ({invoices.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('communications')}
                        style={{
                            padding: '14px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'communications' ? '2px solid #0f766e' : '2px solid transparent',
                            color: activeTab === 'communications' ? '#0f766e' : '#64748b',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Mail size={16} /> Resend Email & Communications ({logs.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        style={{
                            padding: '14px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'overview' ? '2px solid #0f766e' : '2px solid transparent',
                            color: activeTab === 'overview' ? '#0f766e' : '#64748b',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Building2 size={16} /> Overview & Organization
                    </button>
                </div>

                {/* Tab Content Body */}
                <div style={{ padding: '28px' }}>
                    
                    {/* TAB: Financials & Ledgers */}
                    {activeTab === 'financials' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Invoices Section */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                        Authoritative Invoices Ledger
                                    </h4>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                                        Total Billed: KES {totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {loadingFinancials ? (
                                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading invoices...</div>
                                ) : (
                                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                                    <th style={{ padding: '12px 16px' }}>Invoice #</th>
                                                    <th style={{ padding: '12px 16px' }}>Issue Date</th>
                                                    <th style={{ padding: '12px 16px' }}>Due Date</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total (KES)</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoices.map(inv => (
                                                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f766e' }}>
                                                            {inv.invoice_number || `INV-${inv.id}`}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                                                            {inv.issue_date || 'N/A'}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                                                            {inv.due_date || 'On Receipt'}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                                            {parseFloat(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                fontSize: '11.5px',
                                                                fontWeight: 700,
                                                                background: inv.status === 'paid' ? '#dcfce7' : '#fee2e2',
                                                                color: inv.status === 'paid' ? '#15803d' : '#b91c1c'
                                                            }}>
                                                                {(inv.status || 'UNPAID').toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {invoices.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                                            No invoices registered for this client account.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Payments History */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                        Receipts & Payment Allocations
                                    </h4>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                                        Total Cleared: KES {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                                <th style={{ padding: '12px 16px' }}>Receipt / Ref</th>
                                                <th style={{ padding: '12px 16px' }}>Invoice</th>
                                                <th style={{ padding: '12px 16px' }}>Date</th>
                                                <th style={{ padding: '12px 16px' }}>Method</th>
                                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount Paid (KES)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map(pmt => (
                                                <tr key={pmt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f766e' }}>
                                                        {pmt.transaction_reference || pmt.reference_number || `REC-${pmt.id}`}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                                                        {pmt.invoice_number || 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                                                        {pmt.payment_date || 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                                                        {(pmt.payment_method || 'BANK').toUpperCase()}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                                                        {parseFloat(pmt.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                            {payments.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                                        No payment records found for this account.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: Resend Email & Communications */}
                    {activeTab === 'communications' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px' }}>
                            {/* Message Composer (Left) */}
                            <div style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Send size={16} style={{ color: '#0f766e' }} /> Dispatch Communication
                                    </h4>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {['EMAIL', 'SMS', 'CALL'].map(ch => (
                                            <button
                                                key={ch}
                                                type="button"
                                                onClick={() => setChannelType(ch)}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '11.5px',
                                                    fontWeight: 700,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: channelType === ch ? '#0f766e' : '#f1f5f9',
                                                    color: channelType === ch ? '#ffffff' : '#64748b'
                                                }}
                                            >
                                                {ch}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Channel Info */}
                                <div style={{ fontSize: '12.5px', color: '#64748b', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    Recipient: <strong>{channelType === 'EMAIL' ? (client.email || 'No email configured') : (client.phone || 'No phone configured')}</strong>
                                    {channelType === 'EMAIL' && ' (Powered by Resend REST API)'}
                                </div>

                                {/* Template Selector */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                                        Message Template
                                    </label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => handleTemplateChange(e.target.value)}
                                        style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                                    >
                                        {TEMPLATES.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {channelType === 'EMAIL' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                                            Subject Line
                                        </label>
                                        <input 
                                            type="text"
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            placeholder="Subject..."
                                            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                                        Message Body
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={emailMessage}
                                        onChange={(e) => setEmailMessage(e.target.value)}
                                        placeholder="Type your message here..."
                                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                                    />
                                </div>

                                {generatedStatement && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '12px',
                                        color: '#0f766e',
                                        background: '#f0fdfa',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #99f6e4'
                                    }}>
                                        <FileText size={15} /> Attached: {generatedStatement.reference_number || 'Statement'}.pdf
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    disabled={sendingEmail}
                                    className="btn-primary"
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        fontSize: '13.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        marginTop: '4px'
                                    }}
                                >
                                    <Send size={15} />
                                    {sendingEmail ? 'Dispatching...' : `Send via ${channelType}`}
                                </button>
                            </div>

                            {/* Timeline Log (Right) */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                maxHeight: '480px',
                                overflowY: 'auto'
                            }}>
                                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                                    Communication History
                                </h4>

                                {logs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                                        No communications logged yet.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {logs.map((log, idx) => (
                                            <div 
                                                key={log.id || idx}
                                                style={{
                                                    background: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    padding: '12px 14px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{
                                                        fontSize: '10.5px',
                                                        fontWeight: 700,
                                                        padding: '2px 6px',
                                                        borderRadius: '6px',
                                                        background: log.channel === 'EMAIL' ? '#e0f2fe' : (log.channel === 'SMS' ? '#fef3c7' : '#f1f5f9'),
                                                        color: log.channel === 'EMAIL' ? '#0369a1' : (log.channel === 'SMS' ? '#b45309' : '#475569')
                                                    }}>
                                                        {log.channel || 'COMMUNICATION'}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                        {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Recent'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                                    {log.subject || 'Notice / Update'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden' }}>
                                                    {log.message || log.notes || ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: Overview & Organization */}
                    {activeTab === 'overview' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Card 1: Key Profile */}
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                                    Organization & Location
                                </h4>
                                <div style={{ fontSize: '13.5px', color: '#334155' }}><strong>Client Type:</strong> {client.client_type || 'Corporate'}</div>
                                <div style={{ fontSize: '13.5px', color: '#334155' }}><strong>Industry:</strong> {client.industry || 'General Commercial'}</div>
                                <div style={{ fontSize: '13.5px', color: '#334155' }}><strong>Tax ID / PIN:</strong> {client.tax_id || 'Not registered'}</div>
                                <div style={{ fontSize: '13.5px', color: '#334155' }}><strong>Physical Address:</strong> {client.address || 'N/A'}</div>
                                <div style={{ fontSize: '13.5px', color: '#334155' }}><strong>Account Manager:</strong> {client.manager || 'Unassigned'}</div>
                            </div>

                            {/* Card 2: Contact Representation */}
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                                    Key Representative
                                </h4>
                                <div style={{ fontSize: '13.5px', color: '#334155' }}><strong>Name:</strong> {client.contact_person_name || client.name}</div>
                                <div style={{ fontSize: '13.5px', color: '#334155' }}><strong>Direct Email:</strong> {client.contact_person_email || client.email || 'N/A'}</div>
                                <div style={{ fontSize: '13.5px', color: '#334155' }}><strong>Direct Phone:</strong> {client.contact_person_phone || client.phone || 'N/A'}</div>
                                {client.notes && (
                                    <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#64748b', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <strong>Notes:</strong> {client.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="doc-modal-footer" style={{ padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <button
                        type="button"
                        onClick={() => onDelete(client.id)}
                        className="btn-text"
                        style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Trash2 size={15} /> Delete Account
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-outline"
                        style={{ padding: '8px 22px', borderRadius: '10px', fontSize: '13.5px' }}
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientProfileModal;

