import React, { useState, useEffect } from 'react';
import {
    X,
    FileText,
    FileDown,
    Eye,
    CheckCircle2,
    Layers,
    Clock,
    RefreshCw,
    Download,
    Mail,
    Send,
    MessageSquare,
    AlertCircle,
    ExternalLink,
    Copy,
    Share2,
    Check
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const GenerateQuotationModal = ({ quotation, isOpen, onClose, onGenerated }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [error, setError] = useState(null);
    const [successDoc, setSuccessDoc] = useState(null);

    // Communication state (tabs: 'email' | 'whatsapp')
    const [commTab, setCommTab] = useState('email');
    
    // Email dispatch state
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [emailTo, setEmailTo] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailResult, setEmailResult] = useState(null);

    // WhatsApp dispatch state
    const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
    const [whatsappPhone, setWhatsappPhone] = useState('');
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [whatsappResult, setWhatsappResult] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        if (isOpen && quotation) {
            fetchQuotationTemplates();
            setSuccessDoc(null);
            setError(null);
            setShowEmailForm(false);
            setShowWhatsAppForm(false);
            setEmailResult(null);
            setWhatsappResult(null);

            const quoteNum = quotation.quotation_number || `QUO-${quotation.id}`;
            const totalStr = Number(quotation.total_amount || 0).toLocaleString();

            setEmailTo(quotation.client_email || quotation.email || '');
            setEmailSubject(`Sales Quotation ${quoteNum} - Royal Software Solutions`);
            setEmailMessage(
                `Dear ${quotation.client_name || 'Client'},\n\n` +
                `Please find attached our official sales proposal and quotation (${quoteNum}) for your review.\n\n` +
                `Total Investment: KES ${totalStr}\n\n` +
                `Should you have any inquiries or require customization of this scope, please feel free to reach out to us.\n\n` +
                `Best regards,\nRoyal Software Solutions Commercial Team`
            );

            setWhatsappPhone(quotation.client_phone || quotation.phone || '');
            setWhatsappMessage(
                `Hello ${quotation.client_name || 'Client'},\n\n` +
                `Your official sales quotation *${quoteNum}* for KES *${totalStr}* from Royal Software Solutions has been generated.\n\n` +
                `Please let us know if you have any questions or would like to proceed with this scope!\n\n` +
                `Best regards,\nRoyal Software Solutions`
            );
        }
    }, [isOpen, quotation]);

    const fetchQuotationTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const data = await apiClient.documents.getTemplates({ category: 'quotation', status: 'published' });
            const list = Array.isArray(data) ? data : data.results || [];
            setTemplates(list);
            const defaultTmpl = list.find(t => t.is_default) || list[0];
            if (defaultTmpl) {
                setSelectedTemplateId(defaultTmpl.id);
            }
        } catch (err) {
            console.error('Failed to load quotation templates:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handlePreviewPdf = async () => {
        if (!selectedTemplateId) {
            alert('Please select a template to preview.');
            return;
        }

        try {
            setPreviewing(true);
            setError(null);
            const blob = await apiClient.documents.previewPdf(selectedTemplateId);
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (err) {
            setError(err.message || 'Failed to render quotation preview.');
        } finally {
            setPreviewing(false);
        }
    };

    const handleGeneratePdf = async () => {
        try {
            setGenerating(true);
            setError(null);
            const payload = {
                document_type: 'quotation',
                record_id: quotation.id,
                template_id: selectedTemplateId || undefined
            };

            const response = await apiClient.documents.generateDocument(payload);
            setSuccessDoc(response);
            if (onGenerated) onGenerated(response);
        } catch (err) {
            setError(err.message || 'Failed to generate operational quotation PDF.');
        } finally {
            setGenerating(false);
        }
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        try {
            setSendingEmail(true);
            setEmailResult(null);

            const payload = {
                client: quotation.client || quotation.client_id,
                channel: 'EMAIL',
                recipient_email: emailTo,
                subject: emailSubject,
                message: emailMessage,
                document_id: successDoc?.document?.id
            };

            const resp = await apiClient.post('/api/v1/clients_management/communications/send/', payload);
            setEmailResult({
                type: 'success',
                text: `Quotation PDF dispatched successfully via email! Log ID: #${resp.id}`
            });
        } catch (err) {
            setEmailResult({
                type: 'error',
                text: err.message || 'Failed to dispatch email.'
            });
        } finally {
            setSendingEmail(false);
        }
    };

    const handleOpenMailClient = () => {
        const docUrl = successDoc?.download_url || successDoc?.document?.file || '';
        const fullBody = docUrl ? `${emailMessage}\n\nView Proposal Online: ${window.location.origin}${docUrl}` : emailMessage;
        const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullBody)}`;
        window.open(mailtoUrl, '_blank');
    };

    const handleSendWhatsAppAPI = async (e) => {
        e.preventDefault();
        try {
            setSendingWhatsApp(true);
            setWhatsappResult(null);

            const payload = {
                client: quotation.client || quotation.client_id,
                channel: 'WHATSAPP',
                recipient_phone: whatsappPhone,
                message: whatsappMessage,
                document_id: successDoc?.document?.id
            };

            const resp = await apiClient.post('/api/v1/clients_management/communications/send/', payload);
            setWhatsappResult({
                type: 'success',
                text: `WhatsApp message dispatched via Twilio API! Log ID: #${resp.id}`
            });
        } catch (err) {
            setWhatsappResult({
                type: 'error',
                text: err.message || 'Twilio WhatsApp dispatch failed. You can use direct WhatsApp Web click-to-chat below.'
            });
        } finally {
            setSendingWhatsApp(false);
        }
    };

    const handleOpenWhatsAppWeb = () => {
        let cleanPhone = (whatsappPhone || '').replace(/[^0-9]/g, '');
        // Auto format 07xx / 01xx to Kenyan 2547xx / 2541xx if local format entered
        if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
            cleanPhone = '254' + cleanPhone.substring(1);
        } else if ((cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) && cleanPhone.length === 9) {
            cleanPhone = '254' + cleanPhone;
        }
        const docUrl = successDoc?.download_url || successDoc?.document?.file || '';
        const fullMessage = docUrl ? `${whatsappMessage}\n\nDocument Link: ${window.location.origin}${docUrl}` : whatsappMessage;
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`;
        window.open(url, '_blank');
    };

    const handleCopyDocLink = () => {
        const docUrl = successDoc?.download_url || successDoc?.document?.file || '';
        const fullUrl = `${window.location.origin}${docUrl}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
    };

    if (!isOpen || !quotation) return null;

    return (
        <div className="doc-modal-overlay" onClick={onClose}>
            <div className="doc-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
                <div className="doc-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3>Operational Quotation Document</h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                Ref: {quotation.quotation_number} • {quotation.client_name}
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

                <div className="doc-modal-body">
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            borderRadius: 8,
                            fontSize: '0.85rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {successDoc ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Success Card */}
                            <div style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: 12,
                                padding: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    <div style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: '50%',
                                        background: '#dcfce7',
                                        color: '#15803d',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <CheckCircle2 size={22} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.95rem', color: '#166534', margin: '0 0 0.2rem 0' }}>
                                            Quotation PDF Compiled & Audited
                                        </h4>
                                        <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
                                            SHA-256 Checksum: {successDoc.document?.checksum ? `${successDoc.document.checksum.substring(0, 16)}...` : 'Verified'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleCopyDocLink}
                                        className="btn-secondary-outline"
                                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                                        title="Copy document URL"
                                    >
                                        {copiedLink ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
                                        {copiedLink ? 'Copied' : 'Copy Link'}
                                    </button>
                                    <a
                                        href={successDoc.download_url || successDoc.document?.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary-teal"
                                        style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', textDecoration: 'none' }}
                                    >
                                        <Download size={14} />
                                        Download PDF
                                    </a>
                                </div>
                            </div>

                            {/* Communication Dispatch Hub */}
                            <div style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                padding: '1.25rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setCommTab('email')}
                                            style={{
                                                background: commTab === 'email' ? '#eff6ff' : 'transparent',
                                                color: commTab === 'email' ? '#1d4ed8' : '#64748b',
                                                border: commTab === 'email' ? '1px solid #bfdbfe' : '1px solid transparent',
                                                borderRadius: 8,
                                                padding: '0.4rem 0.8rem',
                                                fontSize: '0.82rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            <Mail size={14} /> Email Dispatch
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCommTab('whatsapp')}
                                            style={{
                                                background: commTab === 'whatsapp' ? '#f0fdf4' : 'transparent',
                                                color: commTab === 'whatsapp' ? '#15803d' : '#64748b',
                                                border: commTab === 'whatsapp' ? '1px solid #bbf7d0' : '1px solid transparent',
                                                borderRadius: 8,
                                                padding: '0.4rem 0.8rem',
                                                fontSize: '0.82rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            <MessageSquare size={14} /> WhatsApp Share
                                        </button>
                                    </div>
                                </div>

                                {commTab === 'email' && (
                                    <div>
                                        {emailResult && (
                                            <div style={{
                                                padding: '0.65rem 0.9rem',
                                                borderRadius: 8,
                                                fontSize: '0.82rem',
                                                marginBottom: '1rem',
                                                background: emailResult.type === 'success' ? '#dcfce7' : '#fee2e2',
                                                color: emailResult.type === 'success' ? '#15803d' : '#b91c1c'
                                            }}>
                                                {emailResult.text}
                                            </div>
                                        )}

                                        <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                            <div className="prop-form-group">
                                                <label>Recipient Email Address</label>
                                                <input
                                                    type="email"
                                                    value={emailTo}
                                                    onChange={(e) => setEmailTo(e.target.value)}
                                                    placeholder="client@example.com"
                                                    className="prop-input"
                                                    required
                                                />
                                            </div>

                                            <div className="prop-form-group">
                                                <label>Email Subject</label>
                                                <input
                                                    type="text"
                                                    value={emailSubject}
                                                    onChange={(e) => setEmailSubject(e.target.value)}
                                                    className="prop-input"
                                                    required
                                                />
                                            </div>

                                            <div className="prop-form-group">
                                                <label>Email Body</label>
                                                <textarea
                                                    value={emailMessage}
                                                    onChange={(e) => setEmailMessage(e.target.value)}
                                                    rows={4}
                                                    className="prop-input"
                                                    style={{ resize: 'vertical' }}
                                                    required
                                                />
                                            </div>

                                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                Attachment: <strong>{quotation.quotation_number}.pdf</strong> will be attached automatically.
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={handleOpenMailClient}
                                                    className="btn-secondary-outline"
                                                    style={{ fontSize: '0.8rem', color: '#2563eb', borderColor: '#bfdbfe' }}
                                                >
                                                    <ExternalLink size={13} />
                                                    Open in Mail Client (mailto)
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={sendingEmail}
                                                    className="btn-primary-teal"
                                                    style={{ fontSize: '0.8rem' }}
                                                >
                                                    {sendingEmail ? <RefreshCw size={13} className="spin-icon" /> : <Send size={13} />}
                                                    {sendingEmail ? 'Dispatching...' : 'Send Email with Attachment'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {commTab === 'whatsapp' && (
                                    <div>
                                        {whatsappResult && (
                                            <div style={{
                                                padding: '0.65rem 0.9rem',
                                                borderRadius: 8,
                                                fontSize: '0.82rem',
                                                marginBottom: '1rem',
                                                background: whatsappResult.type === 'success' ? '#dcfce7' : '#fee2e2',
                                                color: whatsappResult.type === 'success' ? '#15803d' : '#b91c1c'
                                            }}>
                                                {whatsappResult.text}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                            <div className="prop-form-group">
                                                <label>Recipient WhatsApp Number (e.g. +254712345678)</label>
                                                <input
                                                    type="text"
                                                    value={whatsappPhone}
                                                    onChange={(e) => setWhatsappPhone(e.target.value)}
                                                    placeholder="+254..."
                                                    className="prop-input"
                                                />
                                            </div>

                                            <div className="prop-form-group">
                                                <label>WhatsApp Message</label>
                                                <textarea
                                                    value={whatsappMessage}
                                                    onChange={(e) => setWhatsappMessage(e.target.value)}
                                                    rows={4}
                                                    className="prop-input"
                                                    style={{ resize: 'vertical' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={handleOpenWhatsAppWeb}
                                                    className="btn-secondary-outline"
                                                    style={{ fontSize: '0.8rem', color: '#16a34a', borderColor: '#86efac' }}
                                                >
                                                    <ExternalLink size={13} />
                                                    Open in WhatsApp Web / App
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleSendWhatsAppAPI}
                                                    disabled={sendingWhatsApp}
                                                    className="btn-primary-teal"
                                                    style={{ fontSize: '0.8rem', background: '#16a34a', borderColor: '#15803d' }}
                                                >
                                                    {sendingWhatsApp ? <RefreshCw size={13} className="spin-icon" /> : <Send size={13} />}
                                                    {sendingWhatsApp ? 'Dispatching...' : 'Dispatch via Twilio WhatsApp'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Summary Card */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 10,
                                padding: '1rem 1.25rem'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Client:</span>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{quotation.client_name}</div>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Total Amount:</span>
                                        <div style={{ fontWeight: 700, color: '#0f766e' }}>KES {Number(quotation.total_amount || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Issue Date:</span>
                                        <div style={{ color: '#334155' }}>{quotation.issue_date || 'Today'}</div>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Validity:</span>
                                        <div style={{ color: '#334155' }}>{quotation.expiry_date || '30 Days'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Template Selector */}
                            <div className="prop-form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Select Published Quotation Template</span>
                                    {templates.length === 0 && !loadingTemplates && (
                                        <span style={{ color: '#0f766e', fontSize: '0.75rem' }}>Using default standard</span>
                                    )}
                                </label>
                                {loadingTemplates ? (
                                    <div style={{ fontSize: '0.82rem', color: '#64748b', padding: '0.5rem 0' }}>
                                        Loading approved templates...
                                    </div>
                                ) : templates.length > 0 ? (
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        className="prop-input"
                                    >
                                        {templates.map(tmpl => (
                                            <option key={tmpl.id} value={tmpl.id}>
                                                {tmpl.name} (v{tmpl.version_number || 1}.0) {tmpl.is_default ? '★ Default' : ''}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div style={{
                                        padding: '0.75rem',
                                        background: '#f8fafc',
                                        borderRadius: 8,
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.8rem',
                                        color: '#475569'
                                    }}>
                                        Standard Royal Software Solutions Quotation Template (Default)
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="doc-modal-footer">
                    {!successDoc ? (
                        <>
                            <button
                                type="button"
                                onClick={handlePreviewPdf}
                                disabled={previewing || generating}
                                className="btn-secondary-outline"
                            >
                                <Eye size={14} />
                                {previewing ? 'Rendering...' : 'Live Preview'}
                            </button>

                            <button
                                type="button"
                                onClick={handleGeneratePdf}
                                disabled={generating}
                                className="btn-primary-teal"
                            >
                                {generating ? <RefreshCw size={14} className="spin-icon" /> : <FileDown size={14} />}
                                {generating ? 'Compiling Official PDF...' : 'Generate Official PDF'}
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="btn-secondary-outline">
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerateQuotationModal;
