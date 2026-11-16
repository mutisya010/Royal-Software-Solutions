import React, { useState, useEffect, useRef } from 'react';
import {
    Save,
    Building,
    Image,
    Palette,
    MapPin,
    Mail,
    Phone,
    Globe,
    Shield,
    CheckCircle,
    RefreshCw,
    UploadCloud,
    Trash2,
    Eye
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const BrandingProfileView = ({ onSaveSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // File input ref and preview state
    const fileInputRef = useRef(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const [form, setForm] = useState({
        name: 'Royal Software Solutions',
        display_name: 'Royal Software Solutions Ltd',
        motto: 'Architects of Scalable Enterprise Solutions',
        address: 'Nairobi Innovation Hub, Kilimani — P.O. Box 2840-00100',
        phone: '+254 700 000 000',
        phone_alt: '',
        email: 'info@royalsoftwares.co.ke',
        website: 'www.royalsoftwares.co.ke',
        tax_id: 'P051234567Z',
        registration_number: 'CPR/2026/89412',
        primary_color: '#0f766e',
        secondary_color: '#0d9488',
        accent_color: '#c89b2a',
        text_color: '#1e293b',
        font_family: 'Inter, sans-serif',
        footer_text: 'Thank you for partnering with Royal Software Solutions. All payments due within specified terms.'
    });

    useEffect(() => {
        fetchBranding();
    }, []);

    const fetchBranding = async () => {
        try {
            setLoading(true);
            const data = await apiClient.documents.getBranding();
            if (data) {
                setForm({
                    name: data.name || 'Royal Software Solutions',
                    display_name: data.display_name || '',
                    motto: data.motto || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    phone_alt: data.phone_alt || '',
                    email: data.email || '',
                    website: data.website || '',
                    tax_id: data.tax_id || '',
                    registration_number: data.registration_number || '',
                    primary_color: data.primary_color || '#0f766e',
                    secondary_color: data.secondary_color || '#0d9488',
                    accent_color: data.accent_color || '#c89b2a',
                    text_color: data.text_color || '#1e293b',
                    font_family: data.font_family || 'Inter, sans-serif',
                    footer_text: data.footer_text || ''
                });

                if (data.logo) {
                    setLogoPreview(data.logo);
                }
            }
        } catch (err) {
            console.warn('Could not load existing branding profile, using defaults:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        // Validate image file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image file (PNG, JPG, SVG, or WEBP).');
            return;
        }

        // Validate file size (< 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file size must be under 5MB.');
            return;
        }

        setLogoFile(file);
        const objectUrl = URL.createObjectURL(file);
        setLogoPreview(objectUrl);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage({ text: '', type: '' });

            // Create multipart FormData payload for file uploads
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('display_name', form.display_name);
            formData.append('motto', form.motto);
            formData.append('address', form.address);
            formData.append('phone', form.phone);
            formData.append('phone_alt', form.phone_alt);
            formData.append('email', form.email);
            formData.append('website', form.website);
            formData.append('tax_id', form.tax_id);
            formData.append('registration_number', form.registration_number);
            formData.append('primary_color', form.primary_color);
            formData.append('secondary_color', form.secondary_color);
            formData.append('accent_color', form.accent_color);
            formData.append('text_color', form.text_color);
            formData.append('font_family', form.font_family);
            formData.append('footer_text', form.footer_text);

            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const updatedData = await apiClient.documents.updateBranding(formData);
            setMessage({ text: 'Company document branding and logo updated successfully!', type: 'success' });

            if (updatedData && updatedData.logo) {
                setLogoPreview(updatedData.logo);
                setLogoFile(null);
            }

            if (onSaveSuccess) onSaveSuccess(updatedData || form);
        } catch (err) {
            setMessage({ text: err.message || 'Failed to update document branding.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                        Company Document Identity & Branding Profile
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                        Upload your official document logo, typography, corporate colors, and statutory tax details.
                    </p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="btn-primary-teal"
                >
                    {saving ? <RefreshCw size={16} className="spin-icon" /> : <Save size={16} />}
                    {saving ? 'Saving Changes...' : 'Save Branding'}
                </button>
            </div>

            {message.text && (
                <div style={{
                    padding: '0.9rem 1.25rem',
                    borderRadius: 10,
                    marginBottom: '1.5rem',
                    background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#15803d' : '#b91c1c',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <CheckCircle size={18} />
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* 1. Official Document Logo Upload Section */}
                <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Image size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Official Document Logo</h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                This high-resolution logo will be embedded in all generated invoices, quotations, and official letters.
                            </span>
                        </div>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                        style={{ display: 'none' }}
                    />

                    {logoPreview ? (
                        /* Active Logo Preview Card */
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '1.25rem 1.5rem',
                            background: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{
                                    width: 140,
                                    height: 80,
                                    background: '#ffffff',
                                    borderRadius: 8,
                                    border: '1px solid #cbd5e1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <img
                                        src={logoPreview}
                                        alt="Document Logo"
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                </div>

                                <div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: '#15803d',
                                        background: '#dcfce7',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: 4,
                                        textTransform: 'uppercase'
                                    }}>
                                        Active Logo Loaded
                                    </span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginTop: '0.4rem' }}>
                                        {logoFile ? logoFile.name : 'Current Official Document Logo'}
                                    </div>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                        {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB — Pending Save` : 'Inherited by all document templates'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.65rem' }}>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn-secondary-outline"
                                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                                >
                                    <UploadCloud size={14} />
                                    Change Logo
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    className="btn-secondary-outline"
                                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', color: '#ef4444' }}
                                    title="Remove Logo"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Drag & Drop File Upload Zone */
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: isDragging ? '2px dashed #0f766e' : '2px dashed #cbd5e1',
                                background: isDragging ? '#f0fdfa' : '#f8fafc',
                                borderRadius: 12,
                                padding: '2.5rem 1.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto',
                                color: '#0f766e',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                            }}>
                                <UploadCloud size={24} />
                            </div>

                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                                Click to browse or drag & drop corporate logo
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                Supports PNG, SVG, JPG or WEBP (Max 5MB). High-resolution transparent PNG recommended.
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. Core Corporate Identity */}
                <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building size={18} />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Corporate Details</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div className="prop-form-group">
                            <label>Official Document Trading Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="prop-input"
                                required
                            />
                        </div>
                        <div className="prop-form-group">
                            <label>Full Legal Display Name</label>
                            <input
                                type="text"
                                name="display_name"
                                value={form.display_name}
                                onChange={handleChange}
                                className="prop-input"
                                placeholder="Royal Software Solutions Ltd"
                            />
                        </div>
                        <div className="prop-form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Corporate Tagline / Motto</label>
                            <input
                                type="text"
                                name="motto"
                                value={form.motto}
                                onChange={handleChange}
                                className="prop-input"
                                placeholder="e.g. Architects of Scalable Enterprise Solutions"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Visual Palette & Typography */}
                <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Palette size={18} />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Colors & Typography</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        <div className="prop-form-group">
                            <label>Primary Accent Color (Dark Teal)</label>
                            <div className="prop-color-picker-row">
                                <input
                                    type="color"
                                    name="primary_color"
                                    value={form.primary_color}
                                    onChange={handleChange}
                                    className="prop-color-input"
                                />
                                <input
                                    type="text"
                                    name="primary_color"
                                    value={form.primary_color}
                                    onChange={handleChange}
                                    className="prop-input"
                                    style={{ width: '120px' }}
                                />
                            </div>
                        </div>

                        <div className="prop-form-group">
                            <label>Secondary Color (Accent Orange)</label>
                            <div className="prop-color-picker-row">
                                <input
                                    type="color"
                                    name="secondary_color"
                                    value={form.secondary_color}
                                    onChange={handleChange}
                                    className="prop-color-input"
                                />
                                <input
                                    type="text"
                                    name="secondary_color"
                                    value={form.secondary_color}
                                    onChange={handleChange}
                                    className="prop-input"
                                    style={{ width: '120px' }}
                                />
                            </div>
                        </div>

                        <div className="prop-form-group">
                            <label>Document Body Font</label>
                            <select
                                name="font_family"
                                value={form.font_family}
                                onChange={handleChange}
                                className="prop-input"
                            >
                                <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                                <option value="'Outfit', sans-serif">Outfit (Editorial)</option>
                                <option value="Helvetica, Arial, sans-serif">Helvetica Standard</option>
                                <option value="'Times New Roman', serif">Times New Roman (Formal)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Address & Contact Information */}
                <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={18} />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Address & Contacts</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                        <div className="prop-form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Postal & Physical Address</label>
                            <input
                                type="text"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                className="prop-input"
                            />
                        </div>
                        <div className="prop-form-group">
                            <label>Telephone</label>
                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="prop-input"
                            />
                        </div>
                        <div className="prop-form-group">
                            <label>Alternate Telephone</label>
                            <input
                                type="text"
                                name="phone_alt"
                                value={form.phone_alt}
                                onChange={handleChange}
                                className="prop-input"
                            />
                        </div>
                        <div className="prop-form-group">
                            <label>Official Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className="prop-input"
                            />
                        </div>
                        <div className="prop-form-group">
                            <label>Official Website</label>
                            <input
                                type="text"
                                name="website"
                                value={form.website}
                                onChange={handleChange}
                                className="prop-input"
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Statutory & Tax Registration */}
                <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={18} />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Statutory & Legal Information</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                        <div className="prop-form-group">
                            <label>KRA PIN / Tax ID</label>
                            <input
                                type="text"
                                name="tax_id"
                                value={form.tax_id}
                                onChange={handleChange}
                                className="prop-input"
                                placeholder="e.g. P051234567Z"
                            />
                        </div>
                        <div className="prop-form-group">
                            <label>Business Registration / Incorporation Number</label>
                            <input
                                type="text"
                                name="registration_number"
                                value={form.registration_number}
                                onChange={handleChange}
                                className="prop-input"
                                placeholder="e.g. CPR/2024/ROYAL1"
                            />
                        </div>
                        <div className="prop-form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Default Document Footer / Notice</label>
                            <textarea
                                name="footer_text"
                                value={form.footer_text}
                                onChange={handleChange}
                                rows={3}
                                className="prop-input"
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BrandingProfileView;
