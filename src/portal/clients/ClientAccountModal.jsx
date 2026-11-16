import React, { useState, useEffect } from 'react';
import { 
    X, Building2, User, Mail, Phone, MapPin, 
    CreditCard, Tag, ShieldCheck, Upload, CheckCircle2, AlertCircle 
} from 'lucide-react';

const ClientAccountModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    isEdit = false, 
    client = null, 
    countries = [], 
    regions = [], 
    cities = [] 
}) => {
    const [activeTab, setActiveTab] = useState('entity'); // 'entity', 'contact', 'billing', 'location'
    const [submitting, setSubmitting] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);

    const [formData, setFormData] = useState({
        client_type: 'CORPORATE',
        name: '',
        abbreviation: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        client_category: 'Standard',
        industry: '',
        manager: '',
        email: '',
        phone: '',
        address: '',
        country: '',
        state: '',
        city: '',
        tax_id: '',
        credit_limit: '0.00',
        notes: '',
        is_active: true,
        logo: null
    });

    useEffect(() => {
        if (isOpen) {
            if (isEdit && client) {
                setFormData({
                    client_type: client.client_type || 'CORPORATE',
                    name: client.name || '',
                    abbreviation: client.abbreviation || '',
                    contact_person_name: client.contact_person_name || '',
                    contact_person_email: client.contact_person_email || '',
                    contact_person_phone: client.contact_person_phone || '',
                    client_category: client.client_category || 'Standard',
                    industry: client.industry || '',
                    manager: client.manager || '',
                    email: client.email || '',
                    phone: client.phone || '',
                    address: client.address || '',
                    country: client.country || '',
                    state: client.state || '',
                    city: client.city || '',
                    tax_id: client.tax_id || '',
                    credit_limit: client.credit_limit || '0.00',
                    notes: client.notes || '',
                    is_active: client.is_active !== false,
                    logo: null
                });
                setLogoPreview(client.logo || null);
            } else {
                setFormData({
                    client_type: 'CORPORATE',
                    name: '',
                    abbreviation: '',
                    contact_person_name: '',
                    contact_person_email: '',
                    contact_person_phone: '',
                    client_category: 'Standard',
                    industry: '',
                    manager: '',
                    email: '',
                    phone: '',
                    address: '',
                    country: countries.length > 0 ? countries[0].id : '',
                    state: '',
                    city: '',
                    tax_id: '',
                    credit_limit: '0.00',
                    notes: '',
                    is_active: true,
                    logo: null
                });
                setLogoPreview(null);
            }
            setActiveTab('entity');
        }
    }, [isOpen, isEdit, client, countries]);

    const handleNameChange = (e) => {
        const val = e.target.value;
        const newForm = { ...formData, name: val };
        // Auto-generate abbreviation if not manually edited or if creating
        if (!isEdit && val) {
            const words = val.trim().split(/\s+/);
            if (words.length > 1) {
                newForm.abbreviation = words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
            } else {
                newForm.abbreviation = val.slice(0, 3).toUpperCase();
            }
        }
        setFormData(newForm);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, logo: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'logo') {
                    if (formData.logo instanceof File) {
                        submitData.append('logo', formData.logo);
                    }
                } else if (formData[key] !== null && formData[key] !== undefined) {
                    submitData.append(key, formData[key]);
                }
            });

            await onSave(submitData, isEdit ? client?.id : null);
            onClose();
        } catch (err) {
            console.error('Submit error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Filter regions & cities based on selected country/state
    const filteredRegions = regions.filter(r => !formData.country || String(r.country) === String(formData.country));
    const filteredCities = cities.filter(c => !formData.state || String(c.region || c.state) === String(formData.state));

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
                    maxWidth: '820px', 
                    width: '100%', 
                    maxHeight: '92vh', 
                    overflowY: 'auto',
                    position: 'relative',
                    zIndex: 100000
                }}
            >
                {/* Header */}
                <div className="doc-modal-header" style={{ padding: '20px 25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            background: '#f0fdfa',
                            color: '#0f766e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {formData.client_type === 'CORPORATE' ? <Building2 size={22} /> : <User size={22} />}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                                {isEdit ? `Edit Client Account: ${client?.name || ''}` : 'Register New Client Account'}
                            </h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                {isEdit ? 'Update organizational, billing, and contact profile' : 'Create an authoritative client profile in the ERP system'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    padding: '0 25px',
                    gap: '20px'
                }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('entity')}
                        style={{
                            padding: '14px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'entity' ? '2px solid #0f766e' : '2px solid transparent',
                            color: activeTab === 'entity' ? '#0f766e' : '#64748b',
                            fontWeight: 600,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Building2 size={16} /> Entity & Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('contact')}
                        style={{
                            padding: '14px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'contact' ? '2px solid #0f766e' : '2px solid transparent',
                            color: activeTab === 'contact' ? '#0f766e' : '#64748b',
                            fontWeight: 600,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Phone size={16} /> Contacts & Channels
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('billing')}
                        style={{
                            padding: '14px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'billing' ? '2px solid #0f766e' : '2px solid transparent',
                            color: activeTab === 'billing' ? '#0f766e' : '#64748b',
                            fontWeight: 600,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <CreditCard size={16} /> Billing & Ledgers
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('location')}
                        style={{
                            padding: '14px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'location' ? '2px solid #0f766e' : '2px solid transparent',
                            color: activeTab === 'location' ? '#0f766e' : '#64748b',
                            fontWeight: 600,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <MapPin size={16} /> Location & Status
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                        
                        {/* TAB 1: Entity Details */}
                        {activeTab === 'entity' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Client Type</label>
                                        <select 
                                            value={formData.client_type}
                                            onChange={(e) => handleInputChange('client_type', e.target.value)}
                                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                                        >
                                            <option value="CORPORATE">Corporate</option>
                                            <option value="INDIVIDUAL">Individual</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                            {formData.client_type === 'CORPORATE' ? 'Company / Organization Name *' : 'Client Full Name *'}
                                        </label>
                                        <input 
                                            type="text"
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            placeholder={formData.client_type === 'CORPORATE' ? 'e.g. Nakuru Safari Lodge Ltd' : 'e.g. John Doe'}
                                            required
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Abbreviation / Code</label>
                                        <input 
                                            type="text"
                                            value={formData.abbreviation}
                                            onChange={(e) => handleInputChange('abbreviation', e.target.value.toUpperCase())}
                                            placeholder="e.g. NSL"
                                            maxLength={6}
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Category / Tier</label>
                                        <select 
                                            value={formData.client_category}
                                            onChange={(e) => handleInputChange('client_category', e.target.value)}
                                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                                        >
                                            <option value="Standard">Standard Tier</option>
                                            <option value="VIP">VIP Key Account</option>
                                            <option value="Enterprise">Enterprise Commercial</option>
                                            <option value="Government">Government / NGO</option>
                                            <option value="SME">SME / Startup</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Industry Sector</label>
                                        <input 
                                            type="text"
                                            value={formData.industry}
                                            onChange={(e) => handleInputChange('industry', e.target.value)}
                                            placeholder="e.g. Hospitality, Fintech, Retail"
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Assigned Account Manager</label>
                                        <input 
                                            type="text"
                                            value={formData.manager}
                                            onChange={(e) => handleInputChange('manager', e.target.value)}
                                            placeholder="e.g. Alex Kimani"
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                        />
                                    </div>
                                </div>

                                {formData.client_type === 'CORPORATE' && (
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e' }}>
                                            Primary Corporate Representative
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '12px', color: '#64748b' }}>Contact Person Name</label>
                                                <input 
                                                    type="text"
                                                    value={formData.contact_person_name}
                                                    onChange={(e) => handleInputChange('contact_person_name', e.target.value)}
                                                    placeholder="e.g. Sarah Jenkins"
                                                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: 'white' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '12px', color: '#64748b' }}>Representative Email</label>
                                                <input 
                                                    type="email"
                                                    value={formData.contact_person_email}
                                                    onChange={(e) => handleInputChange('contact_person_email', e.target.value)}
                                                    placeholder="e.g. sarah@company.com"
                                                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: 'white' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '12px', color: '#64748b' }}>Representative Phone</label>
                                                <input 
                                                    type="text"
                                                    value={formData.contact_person_phone}
                                                    onChange={(e) => handleInputChange('contact_person_phone', e.target.value)}
                                                    placeholder="e.g. +254 712 345 678"
                                                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: 'white' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: Contacts & Channels */}
                        {activeTab === 'contact' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Mail size={15} style={{ color: '#0f766e' }} /> Primary Business Email *
                                        </label>
                                        <input 
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="billing@company.com or client@gmail.com"
                                            required
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                        />
                                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                            This email receives official WeasyPrint Invoices & Statements via Resend.
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={15} style={{ color: '#0f766e' }} /> Phone / WhatsApp Number *
                                        </label>
                                        <input 
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="+254 700 000 000"
                                            required
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                        />
                                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                            Used for SMS alerts, payment reminders, and WhatsApp communications.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: Billing & Ledgers */}
                        {activeTab === 'billing' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                            KRA PIN / Tax ID Number
                                        </label>
                                        <input 
                                            type="text"
                                            value={formData.tax_id}
                                            onChange={(e) => handleInputChange('tax_id', e.target.value.toUpperCase())}
                                            placeholder="e.g. P051234567Z"
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        />
                                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>Printed on eTIMS tax invoices and official statements.</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                            Authorized Credit Limit (KES)
                                        </label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={formData.credit_limit}
                                            onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                                            placeholder="0.00"
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700 }}
                                        />
                                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>Maximum outstanding balance threshold allowed before sales warnings.</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Internal Accounting Notes & Terms</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        placeholder="Special payment terms, discount agreements, or credit history notes..."
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 4: Location & Status */}
                        {activeTab === 'location' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Country</label>
                                        <select 
                                            value={formData.country}
                                            onChange={(e) => handleInputChange('country', e.target.value)}
                                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Region / County</label>
                                        <select 
                                            value={formData.state}
                                            onChange={(e) => handleInputChange('state', e.target.value)}
                                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                                        >
                                            <option value="">Select County/Region</option>
                                            {filteredRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>City / Town</label>
                                        <select 
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                                        >
                                            <option value="">Select City/Town</option>
                                            {filteredCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Physical / Postal Address</label>
                                    <input 
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        placeholder="e.g. Kenyatta Avenue, Nairobi CBD — P.O. Box 12345"
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                                    {/* Logo Upload */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        {logoPreview ? (
                                            <img 
                                                src={logoPreview} 
                                                alt="Logo preview" 
                                                style={{ width: 56, height: 56, borderRadius: '12px', objectFit: 'cover', border: '2px solid #e2e8f0' }} 
                                            />
                                        ) : (
                                            <div style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: '12px',
                                                background: '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#94a3b8'
                                            }}>
                                                <Upload size={22} />
                                            </div>
                                        )}
                                        <div>
                                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f766e', cursor: 'pointer', display: 'block' }}>
                                                Upload Client Logo
                                                <input 
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>PNG, JPG or SVG up to 2MB</span>
                                        </div>
                                    </div>

                                    {/* Status Switch */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Account Status:</span>
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('is_active', !formData.is_active)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                fontSize: '12.5px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: formData.is_active ? '#dcfce7' : '#fee2e2',
                                                color: formData.is_active ? '#15803d' : '#b91c1c',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: formData.is_active ? '#15803d' : '#b91c1c' }}></span>
                                            {formData.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="doc-modal-footer" style={{ padding: '16px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                        <div>
                            {activeTab !== 'entity' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (activeTab === 'contact') setActiveTab('entity');
                                        if (activeTab === 'billing') setActiveTab('contact');
                                        if (activeTab === 'location') setActiveTab('billing');
                                    }}
                                    className="btn-outline"
                                    style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px' }}
                                >
                                    Previous Step
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-outline"
                                style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px' }}
                            >
                                Cancel
                            </button>
                            {activeTab !== 'location' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (activeTab === 'entity') setActiveTab('contact');
                                        else if (activeTab === 'contact') setActiveTab('billing');
                                        else if (activeTab === 'billing') setActiveTab('location');
                                    }}
                                    className="btn-primary"
                                    style={{ padding: '9px 22px', borderRadius: '10px', fontSize: '13px' }}
                                >
                                    Next Section
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary"
                                    style={{ padding: '9px 26px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <CheckCircle2 size={16} />
                                    {submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Account')}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientAccountModal;

