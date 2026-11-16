import React, { useState, useEffect } from 'react';
import { X, Mail, Key, Send, CheckCircle2, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const EmailGatewayConfigModal = ({ isOpen, onClose, showToast }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [config, setConfig] = useState({
        provider: 'RESEND',
        api_key: '',
        from_name: 'Royal Software Solutions',
        from_email: 'onboarding@resend.dev',
        reply_to: '',
        is_active: true
    });

    useEffect(() => {
        if (isOpen) {
            loadConfig();
        }
    }, [isOpen]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await apiClient.emailConfig.get();
            if (data && (data.api_key || data.from_email || data.id)) {
                setConfig({
                    provider: data.provider || 'RESEND',
                    api_key: data.api_key || '',
                    from_name: data.from_name || 'Royal Software Solutions',
                    from_email: data.from_email || 'onboarding@resend.dev',
                    reply_to: data.reply_to || '',
                    is_active: data.is_active !== false
                });
            }
        } catch (err) {
            console.error('Failed to load email integration config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiClient.emailConfig.save(config);
            if (showToast) showToast('Email Gateway configuration saved successfully to database!', 'success');
            onClose();
        } catch (err) {
            console.error('Failed to save email config:', err);
            if (showToast) showToast(err.message || 'Failed to save configuration.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTestSend = async () => {
        if (!testEmail) {
            if (showToast) showToast('Please enter a destination email address for testing.', 'error');
            return;
        }
        setTesting(true);
        try {
            const res = await apiClient.emailConfig.testSend(testEmail);
            if (res && res.success) {
                if (showToast) showToast(`Test email successfully dispatched via Resend to ${testEmail}!`, 'success');
            } else {
                if (showToast) showToast(res?.error || 'Test send failed. Please verify API key.', 'error');
            }
        } catch (err) {
            if (showToast) showToast(err.message || 'Test send failed.', 'error');
        } finally {
            setTesting(false);
        }
    };

    if (!isOpen) return null;

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
                style={{ 
                    maxWidth: '640px', 
                    width: '100%', 
                    maxHeight: '90vh', 
                    overflowY: 'auto',
                    position: 'relative',
                    zIndex: 100000 
                }}
            >
                {/* Header */}
                <div className="doc-modal-header" style={{ padding: '20px 25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: '12px',
                            background: '#f0fdfa',
                            color: '#0f766e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Mail size={22} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                                Resend Email Gateway Configuration
                            </h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                Stored securely in your company database
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
                        <RefreshCw size={24} className="spin-animation" style={{ marginBottom: '10px' }} />
                        <div>Loading database configuration...</div>
                    </div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Security Notice */}
                            <div style={{
                                padding: '12px 16px',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '13px',
                                color: '#334155'
                            }}>
                                <Shield size={18} style={{ color: '#0f766e', flexShrink: 0 }} />
                                <div>
                                    Your <strong>Resend API Key</strong> is saved in PostgreSQL (`email_integration_config`) and loaded directly into memory when dispatching statements and emails.
                                </div>
                            </div>

                            {/* Resend API Key */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Key size={15} style={{ color: '#0f766e' }} /> Resend API Key (re_...)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showKey ? 'text' : 'password'}
                                        placeholder="re_1234567890abcdef..."
                                        value={config.api_key}
                                        onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '11px 45px 11px 15px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '14px',
                                            fontFamily: 'monospace',
                                            background: '#ffffff',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#64748b',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {showKey ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                    Obtain your key from your Resend Dashboard at <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#0f766e', fontWeight: 600 }}>resend.com/api-keys</a>.
                                </span>
                            </div>

                            {/* Sender Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                        From Name
                                    </label>
                                    <input 
                                        type="text"
                                        value={config.from_name}
                                        onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                                        placeholder="Royal Software Solutions"
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                        From Email Address
                                    </label>
                                    <input 
                                        type="email"
                                        value={config.from_email}
                                        onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                                        placeholder="onboarding@resend.dev or info@yourdomain.com"
                                        required
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Reply-To */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                    Reply-To Email (Optional)
                                </label>
                                <input 
                                    type="email"
                                    value={config.reply_to || ''}
                                    onChange={(e) => setConfig({ ...config, reply_to: e.target.value })}
                                    placeholder="support@royalsoftwares.co.ke"
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            {/* Live Verification Box */}
                            <div style={{
                                marginTop: '10px',
                                padding: '16px',
                                background: '#f0fdfa',
                                borderRadius: '12px',
                                border: '1px solid #ccfbf1'
                            }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e', marginBottom: '8px' }}>
                                    Test Live Delivery via Resend
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="email"
                                        placeholder="Enter recipient email (e.g. your email)..."
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #99f6e4',
                                            fontSize: '13px',
                                            background: 'white'
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleTestSend}
                                        disabled={testing}
                                        className="btn-outline"
                                        style={{
                                            padding: '9px 16px',
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            borderColor: '#0f766e',
                                            color: '#0f766e',
                                            fontWeight: 600
                                        }}
                                    >
                                        <Send size={14} />
                                        {testing ? 'Sending...' : 'Send Test'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="doc-modal-footer" style={{ padding: '15px 25px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="btn-outline" 
                                style={{ padding: '10px 20px', borderRadius: '10px' }}
                            >
                                Close
                            </button>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="btn-primary" 
                                style={{ padding: '10px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <CheckCircle2 size={16} />
                                {saving ? 'Saving...' : 'Save to Database'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EmailGatewayConfigModal;

