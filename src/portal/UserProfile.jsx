import { useState, useEffect, useRef, useMemo } from 'react';
import { apiClient } from '../services/apiClient';
import { MODULE_NAV_CONFIG, canAccessModule, isAdminUser } from './navigationConfig';
import {
    User, Mail, Phone, MapPin, Briefcase, Building,
    Shield, Key, Bell, Globe, Moon, Sun,
    Monitor, Lock, LogOut, History, FileText,
    Plus, Download, Trash2, Edit3, Camera,
    CheckCircle, AlertCircle, Eye, EyeOff,
    Layout, Settings, Activity, Terminal, ShieldCheck, CheckSquare, XCircle
} from 'lucide-react';

const UserProfile = () => {
    const [view, setView] = useState('overview'); // overview, editing, security, preferences, capabilities
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadProfile = async () => {
        setLoading(true);
        try {
            // Fetch live user info from JWT session & backend endpoint
            const sessionUser = apiClient.auth.getCurrentUser();
            let liveUser = null;
            try {
                liveUser = await apiClient.auth.getProfile();
            } catch (e) {
                console.info('Using cached session profile.');
            }

            const data = liveUser || sessionUser || {};
            const roles = Array.isArray(data.roles) ? data.roles : (data.role ? [data.role] : []);
            const primaryRole = data.is_superuser
                ? 'Super Administrator'
                : (roles[0] || (data.is_staff ? 'Administrator' : 'Staff Member'));

            setProfile({
                id: data.id,
                username: data.username || 'user',
                fullName: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || 'User',
                email: data.email || 'Not provided',
                phone: data.phone || data.cell_phone || '+254 700 000 000',
                jobTitle: primaryRole,
                department: data.department || 'Enterprise Operations',
                company: data.company || 'Royal Software Solutions',
                role: primaryRole,
                roles: roles,
                permissions: data.permissions || [],
                is_superuser: !!data.is_superuser,
                is_staff: !!data.is_staff,
                status: data.is_active !== false ? 'Active' : 'Inactive',
                dateJoined: data.date_joined ? new Date(data.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Active Session',
                bio: data.bio || data.about || 'Enterprise system user contributing across projects, operations, and business execution.',
                address: data.address || 'Nairobi, Kenya',
            });
            setError(null);
        } catch (err) {
            console.error("Failed to load profile:", err);
            setError("Failed to sync profile with ERP backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleProfileUpdate = async (formData) => {
        setLoading(true);
        try {
            const names = (formData.fullName || '').trim().split(' ');
            const payload = {
                first_name: names[0] || '',
                last_name: names.slice(1).join(' ') || '',
                cell_phone: formData.phone,
                about: formData.bio
            };
            const updated = await apiClient.put('/api/v1/profile/', payload);
            setProfile(prev => ({
                ...prev,
                ...updated,
                fullName: updated.first_name || updated.last_name ? `${updated.first_name || ''} ${updated.last_name || ''}`.trim() : formData.fullName,
                phone: updated.phone || updated.cell_phone || formData.phone,
                bio: updated.bio || updated.about || formData.bio
            }));
            setView('overview');
            notify('Profile information updated successfully.');
        } catch (err) {
            console.error("Failed to update profile:", err);
            setError(err.message || "Failed to update profile settings.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-main-container portal-module animations-fade-in">
            <style>{`
                .profile-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
                .profile-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .profile-bottom-nav { display: none; }

                .profile-role-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 12px;
                    border-radius: 20px;
                    background: #ecfdf5;
                    color: #10b981;
                }

                @media (max-width: 1024px) {
                    .profile-grid { grid-template-columns: 1fr; }
                    .profile-sidebar { display: none; }
                    .profile-bottom-nav { 
                        display: flex; 
                        position: fixed; 
                        bottom: 0; 
                        left: 0; 
                        right: 0; 
                        background: rgba(255, 255, 255, 0.95); 
                        backdrop-filter: blur(10px); 
                        border-top: 1px solid #e2e8f0; 
                        padding: 8px 12px; 
                        justify-content: space-around; 
                        z-index: 1000;
                    }
                    .profile-main-container { padding-bottom: 70px; }
                }

                @media (max-width: 768px) {
                    .profile-info-grid { grid-template-columns: 1fr; }
                    .edit-form-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 99999,
                    background: toast.type === 'error' ? '#ef4444' : '#10b981',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    fontSize: '13px',
                    fontWeight: 600
                }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#1e293b' }}>User Account & Profile</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                        View your account identity, security credentials, and authorized module permissions.
                    </p>
                </div>
            </div>

            <div className="profile-grid">
                {/* Left Sidebar */}
                <div className="profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="portal-content-card" style={{ padding: '24px', textAlign: 'center' }}>
                        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 14px auto' }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-color, #16657a) 0%, #0d3c49 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '28px',
                                fontWeight: 700
                            }}>
                                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : <User size={40} />}
                            </div>
                        </div>

                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                            {profile?.fullName}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            @{profile?.username}
                        </p>
                        
                        <div style={{ marginTop: '12px' }}>
                            <span className="profile-role-pill">
                                <ShieldCheck size={13} />
                                {profile?.role}
                            </span>
                        </div>
                    </div>

                    <div className="portal-content-card" style={{ padding: '8px' }}>
                        <ProfileNavBtn
                            icon={<User size={17} />}
                            label="Account Overview"
                            active={view === 'overview' || view === 'editing'}
                            onClick={() => setView('overview')}
                        />
                        <ProfileNavBtn
                            icon={<ShieldCheck size={17} />}
                            label="Module Permissions"
                            active={view === 'capabilities'}
                            onClick={() => setView('capabilities')}
                        />
                        <ProfileNavBtn
                            icon={<Lock size={17} />}
                            label="Password & Security"
                            active={view === 'security'}
                            onClick={() => setView('security')}
                        />
                        <ProfileNavBtn
                            icon={<Settings size={17} />}
                            label="Preferences"
                            active={view === 'preferences'}
                            onClick={() => setView('preferences')}
                        />
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="profile-bottom-nav">
                    <MobileNavBtn icon={<User size={18} />} active={view === 'overview' || view === 'editing'} onClick={() => setView('overview')} />
                    <MobileNavBtn icon={<ShieldCheck size={18} />} active={view === 'capabilities'} onClick={() => setView('capabilities')} />
                    <MobileNavBtn icon={<Lock size={18} />} active={view === 'security'} onClick={() => setView('security')} />
                    <MobileNavBtn icon={<Settings size={18} />} active={view === 'preferences'} onClick={() => setView('preferences')} />
                </div>

                {/* Main Content Area */}
                <div className="profile-content">
                    {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading account details...</div>}
                    {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

                    {profile && !loading && (
                        <>
                            {view === 'overview' && <ProfileOverview profile={profile} onEdit={() => setView('editing')} />}
                            {view === 'editing' && <ProfileEditForm profile={profile} onCancel={() => setView('overview')} onSave={handleProfileUpdate} />}
                            {view === 'capabilities' && <ModuleCapabilitiesView user={profile} />}
                            {view === 'security' && <SecuritySettings notify={notify} user={profile} />}
                            {view === 'preferences' && <UserPreferences />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const ProfileNavBtn = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 14px',
            borderRadius: '8px',
            border: 'none',
            background: active ? 'var(--primary-color, #16657a)' : 'transparent',
            color: active ? '#ffffff' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
            textAlign: 'left'
        }}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const MobileNavBtn = ({ icon, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            border: 'none',
            background: 'transparent',
            color: active ? 'var(--primary-color, #16657a)' : '#64748b',
            cursor: 'pointer'
        }}
    >
        {icon}
    </button>
);

const ProfileOverview = ({ profile, onEdit }) => (
    <div className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="portal-content-card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Account Information</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Your personal identity within the enterprise portal</p>
                </div>
                <button onClick={onEdit} className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Edit3 size={14} /> Edit Details
                </button>
            </div>

            <div className="profile-info-grid">
                <DetailItem label="Full Name" value={profile.fullName} icon={<User size={16} />} />
                <DetailItem label="Email Address" value={profile.email} icon={<Mail size={16} />} />
                <DetailItem label="Phone Number" value={profile.phone} icon={<Phone size={16} />} />
                <DetailItem label="Username" value={`@${profile.username}`} icon={<User size={16} />} />
                <DetailItem label="Assigned Role" value={profile.role} icon={<Shield size={16} />} />
                <DetailItem label="Company / Tenant" value={profile.company} icon={<Building size={16} />} />
                <DetailItem label="Account Status" value={profile.status} icon={<CheckCircle size={16} />} />
                <DetailItem label="Member Since" value={profile.dateJoined} icon={<Clock size={16} />} />
            </div>

            <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>About & Bio</h4>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155', margin: 0 }}>
                    {profile.bio}
                </p>
            </div>
        </div>
    </div>
);

const DetailItem = ({ label, value, icon }) => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--primary-color, #16657a)', marginTop: '2px' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{value || '—'}</div>
        </div>
    </div>
);

/**
 * Module Capabilities Matrix: Visually displays what the user can and cannot access
 */
const ModuleCapabilitiesView = ({ user }) => {
    const isSuper = user?.is_superuser || isAdminUser(user);

    return (
        <div className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="portal-content-card" style={{ padding: '24px 28px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                        Your Authorized Module Access
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        Access control permissions inherited through your assigned enterprise role ({user.role})
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                    {MODULE_NAV_CONFIG.map((mod) => {
                        const hasAccess = isSuper || canAccessModule(mod, user);
                        const ModIcon = mod.icon || Layout;

                        return (
                            <div
                                key={mod.id}
                                style={{
                                    border: '1px solid',
                                    borderColor: hasAccess ? '#bbf7d0' : '#e2e8f0',
                                    background: hasAccess ? '#f0fdf4' : '#f8fafc',
                                    borderRadius: '10px',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '10px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        color: hasAccess ? '#166534' : '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <ModIcon size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: hasAccess ? '#0f172a' : '#64748b' }}>
                                            {mod.label}
                                        </div>
                                        <div style={{ fontSize: '11px', color: hasAccess ? '#15803d' : '#94a3b8' }}>
                                            {hasAccess ? (isSuper ? 'Super Admin Clearance' : 'Authorized for your role') : 'Permission Required'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {hasAccess ? (
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '12px' }}>
                                            ✓ Granted
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: '12px' }}>
                                            🔒 Restricted
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const ProfileEditForm = ({ profile, onCancel, onSave }) => {
    const [fullName, setFullName] = useState(profile.fullName || '');
    const [email, setEmail] = useState(profile.email || '');
    const [phone, setPhone] = useState(profile.phone || '');
    const [address, setAddress] = useState(profile.address || '');
    const [bio, setBio] = useState(profile.bio || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ fullName, email, phone, address, bio });
    };

    return (
        <div className="portal-content-card animations-fade-in" style={{ padding: '24px 28px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Edit Personal Information
            </h3>
            <form onSubmit={handleSubmit} className="edit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', fontSize: '13px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Phone Number</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Location / Address</label>
                    <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Bio / Description</label>
                    <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', fontSize: '13px' }}
                    />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <button type="button" onClick={onCancel} className="btn-outline" style={{ padding: '8px 20px', fontSize: '13px' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>Save Changes</button>
                </div>
            </form>
        </div>
    );
};

/**
 * Real Password Change & Active Session Security
 */
const SecuritySettings = ({ notify, user }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.users.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            setSuccess('Your password has been updated successfully.');
            notify('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.message || 'Failed to update password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="portal-content-card" style={{ padding: '24px 28px' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    Change Password
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#64748b' }}>
                    Update your account password. Choose a strong combination of letters, numbers, and symbols.
                </p>

                {error && (
                    <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ padding: '10px 14px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handlePasswordUpdate} style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Current Password</label>
                        <input
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>New Password</label>
                        <input
                            type="password"
                            placeholder="At least 6 characters"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ alignSelf: 'flex-start', padding: '9px 24px', fontSize: '13px', marginTop: '6px' }}
                    >
                        {loading ? 'Updating Password...' : 'Update Password'}
                    </button>
                </form>
            </div>

            <div className="portal-content-card" style={{ padding: '24px 28px' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    Active Session Security
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                    Information about your active authenticated browser session.
                </p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                            <Monitor size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                Current Web Session (Authenticated)
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                                JWT Token Authenticated • Active now
                            </div>
                        </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: '#dcfce7', padding: '3px 8px', borderRadius: '12px' }}>
                        Active
                    </span>
                </div>
            </div>
        </div>
    );
};

const UserPreferences = () => (
    <div className="animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="portal-content-card" style={{ padding: '24px 28px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Portal Interface & Appearance
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                Choose your display mode and layout theme.
            </p>
            <div style={{ display: 'flex', gap: '16px', maxWidth: '400px' }}>
                <div style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '2px solid var(--primary-color, #16657a)', textAlign: 'center', background: '#f0fdfa' }}>
                    <Sun size={20} color="var(--primary-color, #16657a)" style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Standard Light</div>
                </div>
                <div style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center', background: '#ffffff', opacity: 0.7 }}>
                    <Moon size={20} color="#94a3b8" style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Dark (Coming Soon)</div>
                </div>
            </div>
        </div>

        <div className="portal-content-card" style={{ padding: '24px 28px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Regional & Localization Defaults
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Timezone</label>
                    <input type="text" value="Africa/Nairobi (GMT+03:00)" disabled style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Default Currency</label>
                    <input type="text" value="KES (Kenya Shilling)" disabled style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px' }} />
                </div>
            </div>
        </div>
    </div>
);

export default UserProfile;
