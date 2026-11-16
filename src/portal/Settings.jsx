import { useState, useEffect } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { hasPermission, isAdminUser } from './navigationConfig';
import {
    Settings, Building, Users, Shield, Mail, CreditCard,
    Database, Activity, Lock, Globe, Bell, Save,
    Plus, Edit, Trash2, Key, Download, RefreshCw,
    AlertTriangle, FileText, ChevronRight, Check, X,
    Monitor, Server, Mailbox
} from 'lucide-react';

const systemLogs = [
    { id: 1, user: "Admin (Jane)", action: "Enabled 2FA globally", module: "Security", time: "10 mins ago" },
    { id: 2, user: "System", action: "Automatic Backup completed", module: "Database", time: "1 hour ago" },
    { id: 3, user: "Finance (Bob)", action: "Updated Tax rates", module: "Settings", time: "3 hours ago" },
    { id: 4, user: "Admin (Jane)", action: "Modified 'Client' role permissions", module: "RBAC", time: "Yesterday" }
];

// Section metadata – navigation lives in the secondary sidebar, so the page only renders the active section
const SETTINGS_SECTIONS = {
    general: { title: 'General Configuration', desc: 'Company profile, tax and regional preferences.' },
    security: { title: 'Security & Authentication', desc: 'Password policy, session and account protection.' },
    email: { title: 'Email & Notifications', desc: 'Dispatch engine and sender identity for client communications.' },
    integrations: { title: 'Integrations & API', desc: 'Payment gateways and third-party API connections.' },
    backup: { title: 'Backup & Recovery', desc: 'Database backups and data exports.' },
    logs: { title: 'Audit Logs', desc: 'Security and configuration activity trail.' },
};

const SettingsPage = () => {
    const [searchParams] = useSearchParams();
    const urlView = searchParams.get('view');
    const currentUser = apiClient.auth.getCurrentUser();

    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const canManageSettings = isAdminUser(currentUser) || hasPermission(currentUser, 'accounts.can_manage_settings');

    const loadCompanyInfo = async () => {
        setLoading(true);
        try {
            const data = await apiClient.company.getInfo();
            setCompanyInfo(data);
            setError(null);
        } catch (err) {
            console.error("Failed to load company info:", err);
            setError("Failed to sync company settings with backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canManageSettings) loadCompanyInfo();
    }, []);

    // Legacy deep-link: Roles & Access now lives on its own page
    if (urlView === 'rbac') {
        return <Navigate to="/portal/admin/users-roles?view=roles" replace />;
    }

    if (!canManageSettings) {
        return (
            <div className="portal-content-card" style={{ maxWidth: 480, margin: '60px auto', padding: '40px 32px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Lock size={24} />
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Access restricted</h2>
                <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>
                    System settings require the <code>Can view and modify portal settings</code> permission. Ask an administrator to grant it to your role.
                </p>
            </div>
        );
    }

    const activeTab = SETTINGS_SECTIONS[urlView] ? urlView : 'general';
    const section = SETTINGS_SECTIONS[activeTab];

    const handleSaveCompanyInfo = async (updatedData) => {
        setLoading(true);
        try {
            const data = await apiClient.put('/api/v1/company/', updatedData);
            setCompanyInfo(data);
            setError(null);
            alert("Settings updated successfully!");
        } catch (err) {
            console.error("Failed to update company info:", err);
            setError(err.message || "Failed to update company details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-main-container portal-module animations-fade-in" style={{ maxWidth: 1100 }}>
            <style>{`
                .settings-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                @media (max-width: 768px) {
                    .settings-form-grid { grid-template-columns: 1fr; }
                    .audit-log-row { grid-template-columns: 1fr !important; gap: 5px !important; }
                    .audit-log-time { text-align: left !important; }
                    .integration-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{section.title}</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>{section.desc}</p>
                </div>
                {activeTab === 'general' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: `1px solid ${maintenanceMode ? '#fecaca' : '#e2e8f0'}`, background: maintenanceMode ? '#fef2f2' : '#fff', cursor: 'pointer' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: maintenanceMode ? '#ef4444' : '#475569' }}>Maintenance Mode</span>
                        <span
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            style={{ width: 34, height: 18, borderRadius: 9, background: maintenanceMode ? '#ef4444' : '#e2e8f0', position: 'relative', transition: 'all 0.2s' }}
                        >
                            <span style={{ width: 12, height: 12, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: maintenanceMode ? 19 : 3, transition: 'all 0.2s' }} />
                        </span>
                    </label>
                )}
            </div>

            <div className="settings-content">
                {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Syncing settings...</div>}
                {error && <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

                {activeTab === 'general' && companyInfo && (
                    <GeneralSettings companyInfo={companyInfo} onSave={handleSaveCompanyInfo} />
                )}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'email' && <EmailSettings />}
                {activeTab === 'integrations' && <IntegrationsSettings />}
                {activeTab === 'backup' && <BackupSettings />}
                {activeTab === 'logs' && <LogsSettings />}

                {activeTab === 'security' && (
                    <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Users size={16} /> User accounts, roles and permissions are managed in
                        <Link to="/portal/admin/users-roles?view=users" style={{ fontWeight: 600 }}>Users &amp; Roles</Link>.
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Section components ---

const GeneralSettings = ({ companyInfo, onSave }) => {
    const [name, setName] = useState(companyInfo?.name || '');
    const [email, setEmail] = useState(companyInfo?.email || '');
    const [phone, setPhone] = useState(companyInfo?.phone_number || '');
    const [address, setAddress] = useState(companyInfo?.primary_address || '');
    const [city, setCity] = useState(companyInfo?.city || '');
    const [country, setCountry] = useState(companyInfo?.country || '');
    const [taxId, setTaxId] = useState(companyInfo?.tax_id || '');
    const [taxInclusivePricing, setTaxInclusivePricing] = useState(companyInfo?.tax_inclusive_pricing !== false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...companyInfo,
            name,
            email,
            phone_number: phone,
            primary_address: address,
            city,
            country,
            tax_id: taxId,
            tax_inclusive_pricing: taxInclusivePricing
        });
    };

    return (
        <form onSubmit={handleSubmit} className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="portal-content-card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 25px 0' }}>Company Information</h3>
                <div className="settings-form-grid">
                    <SettingsInputField label="Company Name" value={name} onChange={e => setName(e.target.value)} />
                    <SettingsInputField label="Company Email" value={email} onChange={e => setEmail(e.target.value)} type="email" />
                    <SettingsInputField label="Company Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                    <SettingsInputField label="Office Address" value={address} onChange={e => setAddress(e.target.value)} />
                    <SettingsInputField label="City" value={city} onChange={e => setCity(e.target.value)} />
                    <SettingsInputField label="Country" value={country} onChange={e => setCountry(e.target.value)} />
                    <SettingsInputField label="Tax PIN / ID" value={taxId} onChange={e => setTaxId(e.target.value)} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '35px' }}>
                        <input 
                            type="checkbox" 
                            id="taxInclusive" 
                            checked={taxInclusivePricing} 
                            onChange={e => setTaxInclusivePricing(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="taxInclusive" style={{ fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                            Tax Inclusive Pricing
                        </label>
                    </div>
                </div>
            </div>

            <div className="portal-content-card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 25px 0' }}>System Preferences</h3>
                <div className="settings-form-grid">
                    <SelectField label="Default Currency" options={["KES (KSh)", "USD ($)", "EUR (€)", "GBP (£)"]} />
                    <SelectField label="Time Zone" options={["(GMT+03:00) Nairobi", "(GMT+00:00) UTC", "(GMT-05:00) EST"]} />
                    <SelectField label="Language" options={["English", "Swahili", "French"]} />
                    <SelectField label="Date Format" options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} />
                </div>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '12px 30px', fontWeight: 600 }}>Save Changes</button>
        </form>
    );
};

const SettingsInputField = ({ label, value, onChange, type = "text", disabled = false }) => (
    <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', background: disabled ? '#f8fafc' : 'white', fontSize: '14px' }}
        />
    </div>
);

const SecuritySettings = () => (
    <div className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <div className="portal-content-card" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 25px 0' }}>Password Policy</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ToggleItem label="Enforce Strong Passwords" desc="Require special characters, numbers, and mixed case." active />
                <ToggleItem label="Password Expiry" desc="Force users to change password every 90 days." />
                <ToggleItem label="Prevent Reuse" desc="Users cannot reuse their last 5 passwords." active />
            </div>
        </div>

        <div className="portal-content-card" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 25px 0' }}>Account Security</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ToggleItem label="Require 2FA" desc="Mandatory two-factor authentication for all staff members." active />
                <ToggleItem label="Auto Session Timeout" desc="Log users out after 30 minutes of inactivity." active />
                <ToggleItem label="IP Restricted Access" desc="Only allow logins from approved company IP addresses." />
            </div>
        </div>

        <div className="portal-content-card" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>System Firewall</h3>
            <div style={{ padding: '20px', borderRadius: '15px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: '15px' }}>
                <AlertTriangle color="#f59e0b" size={24} />
                <div>
                    <h5 style={{ margin: '0 0 5px 0', color: '#92400e' }}>Intrusion Detection is Active</h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>The system is automatically blocking repeated failed login attempts from 12 malicious IP sources.</p>
                </div>
            </div>
        </div>
    </div>
);

const EmailSettings = () => {
    const [provider, setProvider] = useState('RESEND');
    const [apiKey, setApiKey] = useState('');
    const [fromName, setFromName] = useState('Royal Software Solutions');
    const [fromEmail, setFromEmail] = useState('onboarding@resend.dev');
    const [replyTo, setReplyTo] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [smtpHost, setSmtpHost] = useState('smtp.royalsoftwares.co.ke');
    const [smtpPort, setSmtpPort] = useState('587');
    const [smtpUsername, setSmtpUsername] = useState('notifications@royalsoftwares.co.ke');
    const [smtpPassword, setSmtpPassword] = useState('');
    const [smtpUseTls, setSmtpUseTls] = useState(true);

    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await apiClient.emailConfig.get();
            if (data && data.provider) {
                setProvider(data.provider || 'RESEND');
                setApiKey(data.api_key || '');
                setFromName(data.from_name || 'Royal Software Solutions');
                setFromEmail(data.from_email || 'onboarding@resend.dev');
                setReplyTo(data.reply_to || '');
                setIsActive(data.is_active !== undefined ? data.is_active : true);
                if (data.smtp_host) setSmtpHost(data.smtp_host);
                if (data.smtp_port) setSmtpPort(String(data.smtp_port));
                if (data.smtp_username) setSmtpUsername(data.smtp_username);
                if (data.smtp_password) setSmtpPassword(data.smtp_password);
                if (data.smtp_use_tls !== undefined) setSmtpUseTls(data.smtp_use_tls);
            }
        } catch (err) {
            console.error('Failed to load email config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        try {
            setSaving(true);
            setFeedback(null);
            const payload = {
                provider,
                api_key: apiKey,
                from_name: fromName,
                from_email: fromEmail,
                reply_to: replyTo,
                is_active: isActive,
                smtp_host: smtpHost,
                smtp_port: parseInt(smtpPort, 10) || 587,
                smtp_username: smtpUsername,
                smtp_password: smtpPassword,
                smtp_use_tls: smtpUseTls
            };
            await apiClient.emailConfig.save(payload);
            setFeedback({ type: 'success', message: 'Email configuration stored in database successfully!' });
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to save configuration.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTestSend = async () => {
        if (!testEmail) {
            setFeedback({ type: 'error', message: 'Please enter a recipient email address to test dispatch.' });
            return;
        }
        try {
            setTesting(true);
            setFeedback(null);
            const res = await apiClient.emailConfig.testSend(testEmail);
            const msgId = res.message_id ? ` (Resend ID: ${res.message_id})` : '';
            setFeedback({
                type: 'success',
                message: `Verification email dispatched successfully to ${testEmail}!${msgId}`
            });
        } catch (err) {
            setFeedback({
                type: 'error',
                message: `Dispatch failed: ${err.message || 'Check your Resend API Key or sender address domain.'}`
            });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="portal-content-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="spin" style={{ marginBottom: '12px' }} />
                <div>Loading Email Gateway Configuration...</div>
            </div>
        );
    }

    return (
        <div className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {feedback && (
                <div style={{
                    padding: '14px 20px',
                    borderRadius: '10px',
                    background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {feedback.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                    <div style={{ flex: 1, fontWeight: 500 }}>{feedback.message}</div>
                    <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Provider Selection Ribbon */}
            <div className="portal-content-card" style={{ padding: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Email Gateway Provider</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                            Choose the dispatch engine for Royal Software Solutions client quotations, notifications, and communications.
                        </p>
                    </div>
                    <span style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: isActive ? '#dcfce7' : '#fee2e2',
                        color: isActive ? '#15803d' : '#b91c1c'
                    }}>
                        {isActive ? 'STATUS: ACTIVE' : 'STATUS: DISABLED'}
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div
                        onClick={() => setProvider('RESEND')}
                        style={{
                            padding: '20px',
                            borderRadius: '12px',
                            border: `2px solid ${provider === 'RESEND' ? '#005f73' : '#e2e8f0'}`,
                            background: provider === 'RESEND' ? '#f0fdfa' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#005f73' }}>Resend REST API (Recommended)</span>
                            <span style={{ background: '#0a9396', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>CLOUD API</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                            High deliverability transactional email API. Native PDF attachments, live analytics, and fast cloud delivery.
                        </p>
                    </div>

                    <div
                        onClick={() => setProvider('SMTP')}
                        style={{
                            padding: '20px',
                            borderRadius: '12px',
                            border: `2px solid ${provider === 'SMTP' ? '#005f73' : '#e2e8f0'}`,
                            background: provider === 'SMTP' ? '#f0fdfa' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>Standard SMTP Server</span>
                            <span style={{ background: '#e2e8f0', color: '#475569', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>FALLBACK</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                            Direct connection through a traditional mail server or host with SMTP credentials.
                        </p>
                    </div>
                </div>
            </div>

            {/* Provider Configuration Form */}
            {provider === 'RESEND' ? (
                <div className="portal-content-card" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#005f73', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <Mail size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Resend Gateway Credentials & Headers</h3>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                                Stored securely in database table <code>email_integration_config</code> for Company ID 2
                            </p>
                        </div>
                    </div>

                    <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                Resend API Key <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                                    style={{
                                        width: '100%',
                                        padding: '11px 45px 11px 15px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        fontFamily: showKey ? 'monospace' : 'inherit',
                                        fontSize: '14px'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}
                                >
                                    {showKey ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                                Obtain your key from your dashboard at <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#005f73', fontWeight: 600 }}>resend.com/api-keys</a>.
                            </span>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                Sender Display Name
                            </label>
                            <input
                                type="text"
                                value={fromName}
                                onChange={(e) => setFromName(e.target.value)}
                                placeholder="Royal Software Solutions"
                                style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                Sender Email Address <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="email"
                                value={fromEmail}
                                onChange={(e) => setFromEmail(e.target.value)}
                                placeholder="onboarding@resend.dev"
                                style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            />
                            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '5px', display: 'block' }}>
                                For sandbox/testing, use <code>onboarding@resend.dev</code>. For production, enter your verified domain email.
                            </span>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                Reply-To Email Address (Optional)
                            </label>
                            <input
                                type="email"
                                value={replyTo}
                                onChange={(e) => setReplyTo(e.target.value)}
                                placeholder="info@royalsoftwaresolutions.com"
                                style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                            <input
                                type="checkbox"
                                id="activeToggle"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="activeToggle" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                Enable Resend as Primary Communications Gateway
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary"
                            style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                        >
                            <Save size={16} />
                            {saving ? 'Saving to Database...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="portal-content-card" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <Server size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Custom SMTP Server Details</h3>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Configure custom host and port for outgoing mail</p>
                        </div>
                    </div>

                    <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>SMTP Host</label>
                            <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Port</label>
                            <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Username</label>
                            <input type="text" value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Password</label>
                            <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="••••••••••••" style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary"
                            style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            )}

            {/* Test Connection / Dispatch Live Email Suite */}
            <div className="portal-content-card" style={{ padding: '25px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    Live Verification Test Suite
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                    Send an instantaneous test dispatch through your configured {provider === 'RESEND' ? 'Resend REST API' : 'SMTP'} gateway to confirm that Royal Software Solutions can deliver proposals and documents.
                </p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '600px' }}>
                    <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Enter your email to receive test (e.g. james@example.com)"
                        style={{
                            flex: 1,
                            padding: '11px 15px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            background: '#ffffff'
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleTestSend}
                        disabled={testing}
                        className="btn-outline"
                        style={{
                            padding: '11px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {testing ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                        {testing ? 'Dispatching...' : 'Send Live Test Email'}
                    </button>
                </div>
            </div>

            {/* Automated Notification Options */}
            <div className="portal-content-card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 25px 0' }}>Automated Commercial Notifications</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <ToggleItem label="Sales Quotations & Proposals" desc="Automatically send compiled quotation PDFs to prospective clients via Resend." active />
                    <ToggleItem label="Customer Follow-up Reminders" desc="Trigger scheduled reminder dispatches based on activity due dates." active />
                    <ToggleItem label="Invoice & Receipt Delivery" desc="Send formal payment receipts and invoices upon payment recording." active />
                    <ToggleItem label="System Maintenance Alerts" desc="Broadcast operational maintenance emails to company staff." />
                </div>
            </div>
        </div>
    );
};


const IntegrationsSettings = () => (
    <div className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <div className="portal-content-card" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 25px 0' }}>Payment Gateways</h3>
            <div className="settings-form-grid integration-grid">
                <div style={{ padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={20} color="#6366f1" />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700 }}>Stripe Payments</div>
                            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>CONNECTED</div>
                        </div>
                    </div>
                    <Settings size={16} color="#64748b" style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Globe size={20} color="#0070ba" />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700 }}>PayPal Checkout</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>NOT CONNECTED</div>
                        </div>
                    </div>
                    <Plus size={16} color="#6366f1" style={{ cursor: 'pointer' }} />
                </div>
            </div>
        </div>

        <div className="portal-content-card" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 25px 0' }}>External Integrations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <IntegrationRow name="Slack Notifications" desc="Post portal alerts to #dev-updates Slack channel." status="Active" />
                <IntegrationRow name="Google Calendar" desc="Sync project milestones with staff calendars." status="Inactive" />
                <IntegrationRow name="QuickBooks Online" desc="Automatic sync of invoices and expenses." status="Active" />
            </div>
        </div>
    </div>
);

const BackupSettings = () => (
    <div className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <div className="portal-content-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0 }}>System Backups</h3>
                <button className="btn-primary btn-sm"><RefreshCw size={14} style={{ marginRight: '8px' }} /> Backup Now</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ToggleItem label="Automated Backups" desc="Schedule daily database backups to cloud storage." active />
                <SelectField label="Backup Frequency" options={["Every 6 Hours", "Daily (Midnight)", "Weekly (Sunday)"]} />
                <div style={{ padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}><Database size={14} /> Last Backup: backup_2026_03_09.sql</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>145MB • Success</span>
                    </div>
                    <button className="btn-text" style={{ fontSize: '12px', padding: 0 }}><Download size={14} /> Download</button>
                </div>
            </div>
        </div>

        <div className="portal-content-card" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Bulk Data Export</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Export all system records in various formats for offline processing.</p>
            <div style={{ display: 'flex', gap: '15px' }}>
                <ExportBtn format="Excel" />
                <ExportBtn format="CSV" />
                <ExportBtn format="PDF Report" />
            </div>
        </div>
    </div>
);

const LogsSettings = () => (
    <div className="portal-content-card animations-fade-in" style={{ padding: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>System Audit Logs</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-outline btn-sm">Filter</button>
                <button className="btn-outline btn-sm">Clear Logs</button>
            </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {systemLogs.map(log => (
                <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px 100px', gap: '15px', padding: '15px', borderBottom: '1px solid #f1f5f9' }} className="hover-bg-light audit-log-row">
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{log.user}</span>
                    <span style={{ fontSize: '13px' }}>{log.action}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1' }}>{log.module.toUpperCase()}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right' }} className="audit-log-time">{log.time}</span>
                </div>
            ))}
        </div>
        <button className="btn-text" style={{ width: '100%', marginTop: '15px', color: '#6366f1', fontWeight: 700 }}>Load Older Logs</button>
    </div>
);

// --- Generic UI Components ---

const InputField = ({ label, defaultValue, type = "text", disabled = false }) => (
    <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>{label}</label>
        <input
            type={type}
            defaultValue={defaultValue}
            disabled={disabled}
            style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', background: disabled ? '#f8fafc' : 'white', fontSize: '14px' }}
        />
    </div>
);

const SelectField = ({ label, options }) => (
    <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>{label}</label>
        <select style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}>
            {options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
    </div>
);

const ToggleItem = ({ label, desc, active }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{desc}</div>
        </div>
        <div style={{
            width: '44px', height: '24px', borderRadius: '12px', background: active ? '#6366f1' : '#e2e8f0',
            position: 'relative', cursor: 'pointer'
        }}>
            <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px', left: active ? '23px' : '3px',
                transition: 'all 0.3s'
            }}></div>
        </div>
    </div>
);

const IntegrationRow = ({ name, desc, status }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
        <div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{desc}</div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '10px', background: status === 'Active' ? '#ecfdf5' : '#f1f5f9', color: status === 'Active' ? '#10b981' : '#64748b' }}>{status.toUpperCase()}</span>
    </div>
);

const ExportBtn = ({ format }) => (
    <button className="btn-outline" style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <FileText size={20} />
        <span style={{ fontSize: '12px', fontWeight: 700 }}>Export as {format}</span>
    </button>
);

export default SettingsPage;
