import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useCompany } from '../services/CompanyContext';
import { apiClient } from '../services/apiClient';
import { MODULE_NAV_CONFIG, canAccessModule } from './navigationConfig';
import SecondarySidebar from './SecondarySidebar';
import {
    PanelLeft,
    User,
    DollarSign,
    Users,
    Headset,
    Bell,
    Search,
    LogOut,
    ChevronRight,
    ChevronDown,
    MessageSquare,
    Sliders,
    Settings,
    Shield,
    Plus,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

const PortalLayout = () => {
    const [isSecondaryOpen, setIsSecondaryOpen] = useState(true);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [userRole, setUserRole] = useState('Admin');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [adminName, setAdminName] = useState('Administrator');
    const [searchQuery, setSearchQuery] = useState('');

    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    const { company } = useCompany();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const currentViewParam = searchParams.get('view') || 'dashboard';

    // 1. Identify active primary module from current route
    const activeModule = MODULE_NAV_CONFIG.find(m => location.pathname.startsWith(m.path)) || MODULE_NAV_CONFIG[0];
    const isDashboard = activeModule.id === 'dashboard';

    const [currentUser, setCurrentUser] = useState(() => apiClient.auth.getCurrentUser());
    const [profileReady, setProfileReady] = useState(false);

    // 2. Fetch and refresh logged in user profile from Django backend
    useEffect(() => {
        if (!apiClient.auth.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const applyUserData = (user) => {
            if (!user) return;
            setCurrentUser(user);
            const name = user.full_name ||
                `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                user.username || 'Administrator';
            setAdminName(name);
            const primaryRole = (user.roles && user.roles.length > 0) 
                ? user.roles[0] 
                : (user.role || (user.is_superuser ? 'Super Admin' : (user.is_staff ? 'Admin' : 'Staff')));
            setUserRole(primaryRole);

            // Access check: allow superusers, staff, or recognized internal roles
            const isInternal = user.is_superuser || user.is_staff || (
                Array.isArray(user.roles) && user.roles.some(r => 
                    ['admin', 'staff', 'manager', 'director', 'super admin', 'finance', 'sales', 'support'].includes(String(r).toLowerCase().trim())
                )
            );
            if (!isInternal) {
                navigate('/portal/client/dashboard');
            }
        };

        const cachedUser = apiClient.auth.getCurrentUser();
        if (cachedUser) {
            applyUserData(cachedUser);
        }

        // Live refresh from Django accounts endpoint
        apiClient.auth.getProfile()
            .then(freshUser => {
                if (freshUser) applyUserData(freshUser);
            })
            .catch(() => {})
            .finally(() => setProfileReady(true));
    }, [navigate]);

    // 3. Responsive listener
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (mobile) {
                setIsSecondaryOpen(false);
            } else {
                if (activeModule && activeModule.hasSubmenu) {
                    setIsSecondaryOpen(true);
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 4. Update secondary sidebar visibility upon route change
    useEffect(() => {
        setMobileDrawerOpen(false);
        setShowNotifications(false);
        setShowProfileMenu(false);

        if (!isMobile) {
            if (activeModule && activeModule.hasSubmenu) {
                setIsSecondaryOpen(true);
            } else {
                setIsSecondaryOpen(false);
            }
        }
    }, [location.pathname, isMobile]);

    // 5. Global Command-K keyboard shortcut to focus global search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 6. Close dropdowns on view change or clicking away
    useEffect(() => {
        setShowNotifications(false);
        setShowProfileMenu(false);
    }, [currentViewParam]);

    // Filter modules based on authenticated user's Django roles & permissions
    const filteredModules = MODULE_NAV_CONFIG.filter(module => canAccessModule(module, currentUser));

    // Route-level guard: block direct URL access to modules the user is not cleared for
    const matchedRouteModule = MODULE_NAV_CONFIG.find(m => location.pathname.startsWith(m.path));
    const isRouteAllowed = !matchedRouteModule || matchedRouteModule.id === 'dashboard' || canAccessModule(matchedRouteModule, currentUser);
    const settingsModule = MODULE_NAV_CONFIG.find(m => m.id === 'settings');
    const canOpenSettings = settingsModule ? canAccessModule(settingsModule, currentUser) : false;

    // Resolve current active submenu label for topbar breadcrumb
    const getActiveSubmenuLabel = () => {
        if (!activeModule || !activeModule.groups) return null;
        for (const grp of activeModule.groups) {
            const match = grp.items.find(item => item.view === currentViewParam);
            if (match) return match.label;
        }
        return 'Overview';
    };

    const activeSubmenuLabel = getActiveSubmenuLabel();

    // Helper for avatar initials
    const getUserInitials = (name) => {
        if (!name) return 'JK';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Dynamic Context-Aware Quick Action Button
    const getQuickAction = () => {
        if (activeModule.id === 'planner') {
            if (currentViewParam === 'goals') {
                return {
                    label: '+ New Goal',
                    onClick: () => window.dispatchEvent(new CustomEvent('planner:openCreate', { detail: { type: 'goal' } }))
                };
            }
            if (currentViewParam === 'tasks' || currentViewParam === 'my-tasks') {
                return {
                    label: '+ New Task',
                    onClick: () => window.dispatchEvent(new CustomEvent('planner:openCreate', { detail: { type: 'task' } }))
                };
            }
            if (currentViewParam === 'projects') {
                return {
                    label: '+ New Project',
                    onClick: () => window.dispatchEvent(new CustomEvent('planner:openCreate', { detail: { type: 'project' } }))
                };
            }
            if (currentViewParam === 'meetings') {
                return {
                    label: '+ New Meeting',
                    onClick: () => window.dispatchEvent(new CustomEvent('planner:openCreate', { detail: { type: 'meeting' } }))
                };
            }
            if (currentViewParam === 'notes') {
                return {
                    label: '+ New Note',
                    onClick: () => window.dispatchEvent(new CustomEvent('planner:openCreate', { detail: { type: 'note' } }))
                };
            }
            return {
                label: '+ New Goal',
                onClick: () => navigate('/portal/admin/planner?view=goals')
            };
        }
        if (activeModule.id === 'sales') {
            if (currentViewParam === 'quotations') {
                return {
                    label: '+ New Quote',
                    onClick: () => navigate('/portal/admin/sales?view=quotations&create=true')
                };
            }
            if (currentViewParam === 'rfq') {
                return {
                    label: '+ New RFQ',
                    onClick: () => navigate('/portal/admin/sales?view=rfq&create=true')
                };
            }
            return {
                label: '+ New Quote',
                onClick: () => navigate('/portal/admin/sales?view=quotations')
            };
        }
        return {
            label: '+ Create',
            onClick: () => navigate('/portal/admin/planner?view=my-day')
        };
    };

    const quickAction = getQuickAction();

    // Search submit handler
    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            if (activeModule.id === 'planner') {
                navigate(`/portal/admin/planner?view=tasks&q=${encodeURIComponent(searchQuery)}`);
            } else if (activeModule.id === 'sales') {
                navigate(`/portal/admin/sales?view=quotations&q=${encodeURIComponent(searchQuery)}`);
            } else {
                navigate(`/portal/admin/planner?view=tasks&q=${encodeURIComponent(searchQuery)}`);
            }
        }
    };

    // Secondary sidebar display state
    const showSecondary = activeModule.hasSubmenu && (isMobile ? mobileDrawerOpen : isSecondaryOpen);

    return (
        <div className={`portal-layout icon-rail-layout ${showSecondary ? 'secondary-visible' : 'secondary-hidden'}`}>
            {/* ========================================================================= */}
            {/* 1. PRIMARY SIDEBAR: SLIM, NON-EXPANDABLE ICON RAIL (Labels Never Displayed) */}
            {/* ========================================================================= */}
            <aside className="portal-icon-rail" aria-label="Primary Navigation Rail">
                {/* Brand Logo (Centered, No Label) */}
                <div className="rail-logo-container">
                    <Link to="/portal/admin/dashboard" className="rail-logo-link" title="Dashboard">
                        <img
                            src={company.logo || '/logo (2).png'}
                            alt={company.name || 'Royal Software Solutions'}
                            className="rail-logo-img"
                            onError={(e) => { e.target.src = '/logo (2).png'; }}
                        />
                    </Link>
                </div>

                {/* Primary Nav Icons (Icon-Only, Centered) */}
                <nav className="rail-nav-center">
                    {filteredModules.map((module) => {
                        const ModuleIcon = module.icon;
                        const isModuleActive = activeModule.id === module.id;

                        return (
                            <Link
                                key={module.id}
                                to={module.path}
                                className={`rail-icon-btn ${isModuleActive ? 'rail-active' : ''}`}
                                title={module.label}
                                aria-label={module.label}
                                onClick={() => {
                                    if (module.hasSubmenu) {
                                        if (isMobile) {
                                            setMobileDrawerOpen(true);
                                        } else {
                                            setIsSecondaryOpen(true);
                                        }
                                    } else {
                                        setIsSecondaryOpen(false);
                                    }
                                }}
                            >
                                <ModuleIcon size={20} />
                                {isModuleActive && <span className="rail-active-pill" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Rail Bottom Utility Icons */}
                <div className="rail-nav-bottom">
                    {canOpenSettings && (
                    <Link
                        to="/portal/admin/settings"
                        className={`rail-icon-btn ${activeModule.id === 'settings' ? 'rail-active' : ''}`}
                        title="Settings"
                        aria-label="Settings"
                    >
                        <Settings size={20} />
                    </Link>
                    )}

                    <Link
                        to="/portal/admin/profile"
                        className="rail-icon-btn"
                        title="My Profile"
                        aria-label="My Profile"
                    >
                        <User size={20} />
                    </Link>

                    <Link
                        to="/"
                        className="rail-icon-btn rail-logout-btn"
                        title="Sign Out"
                        aria-label="Sign Out"
                    >
                        <LogOut size={19} />
                    </Link>
                </div>
            </aside>

            {/* ========================================================================= */}
            {/* 2. SECONDARY CONTEXTUAL SIDEBAR (Submenu Navigation Beside Icon Rail)     */}
            {/* ========================================================================= */}
            {activeModule.hasSubmenu && (
                <SecondarySidebar
                    module={activeModule}
                    activeView={currentViewParam}
                    isOpen={showSecondary}
                    onClose={() => {
                        if (isMobile) {
                            setMobileDrawerOpen(false);
                        } else {
                            setIsSecondaryOpen(false);
                        }
                    }}
                    companyName={company.name}
                />
            )}

            {/* ========================================================================= */}
            {/* 3. MAIN CONTENT WORKSPACE                                                 */}
            {/* ========================================================================= */}
            <div className={`portal-main-wrapper ${showSecondary ? 'with-secondary' : 'rail-only'}`}>
                {/* Global Topbar: Modern SaaS Top Navigation Bar */}
                <header className="portal-topbar h-16 sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
                    {/* 1. Left Section — Navigation Context & Breadcrumbs */}
                    <div className="topbar-left flex items-center gap-3">
                        {/* Toggle button to expand/collapse secondary sidebar */}
                        {activeModule.hasSubmenu && (
                            <button
                                className={`secondary-toggle-bar-btn w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors ${showSecondary ? 'active' : ''}`}
                                onClick={() => {
                                    if (isMobile) {
                                        setMobileDrawerOpen(!mobileDrawerOpen);
                                    } else {
                                        setIsSecondaryOpen(!isSecondaryOpen);
                                    }
                                }}
                                title={showSecondary ? 'Collapse Sidebar' : 'Expand Sidebar'}
                                aria-label="Toggle Submenu Sidebar"
                            >
                                <PanelLeft size={18} />
                            </button>
                        )}

                        {/* Vertical Divider */}
                        <div className="h-5 w-px bg-slate-200 desktop-only" />

                        {/* Breadcrumb Trail */}
                        <nav className="topbar-breadcrumb-box flex items-center gap-2" aria-label="Breadcrumb">
                            <Link
                                to={activeModule.path}
                                className="breadcrumb-module-name text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                            >
                                {activeModule.label}
                            </Link>

                            {activeSubmenuLabel && !isDashboard && (
                                <>
                                    <ChevronRight size={14} className="breadcrumb-separator text-slate-400" />
                                    <h2 className="breadcrumb-current-view text-sm font-semibold text-slate-900 m-0">
                                        {activeSubmenuLabel}
                                    </h2>
                                </>
                            )}

                            {/* Status Pill Badge */}
                            <span className="breadcrumb-status-pill bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-200/60 inline-flex items-center gap-1.5 ml-1">
                                <span className="pill-dot w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active Quarter
                            </span>
                        </nav>
                    </div>

                    {/* 2. Center Section — Global Command Search */}
                    <div className="topbar-center desktop-only flex justify-center flex-1 max-w-md mx-4">
                        <div className="search-input-container relative w-full">
                            <div className="search-bar-inner flex items-center bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 rounded-lg py-2 px-3.5 transition-all shadow-xs">
                                <Search size={16} className="text-slate-400 mr-2.5 shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchSubmit}
                                    placeholder="Search goals, tickets, invoices, leads..."
                                    className="topbar-search-input bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 w-full"
                                />
                                <kbd className="key-badge px-1.5 py-0.5 text-[11px] font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-xs ml-2 shrink-0 select-none">
                                    {typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K'}
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* 3. Right Section — Utilities, Quick Action, User Profile */}
                    <div className="topbar-right flex items-center gap-3">
                        {/* Primary Quick Action Button */}
                        <button
                            onClick={quickAction.onClick}
                            className="topbar-quick-action-btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                            title={quickAction.label}
                        >
                            <Plus size={14} />
                            <span className="desktop-only">{quickAction.label}</span>
                        </button>

                        {/* Vertical Divider */}
                        <div className="h-5 w-px bg-slate-200 desktop-only" />

                        {/* Notification Center */}
                        <div className="notification-bell-container relative">
                            <button
                                className="notification-btn w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 relative transition-colors cursor-pointer"
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowProfileMenu(false);
                                }}
                                aria-label="Notifications"
                            >
                                <Bell size={18} />
                                <span className="notification-badge bg-rose-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white absolute -top-1 -right-1">
                                    3
                                </span>
                            </button>

                            {showNotifications && (
                                <div className="notifications-dropdown">
                                    <div className="notifications-header">
                                        <h3>Notifications</h3>
                                        <button className="text-btn text-sm">Mark all read</button>
                                    </div>
                                    <div className="notifications-list">
                                        <div className="notification-item unread">
                                            <div className="notification-icon bg-success">
                                                <DollarSign size={14} />
                                            </div>
                                            <div className="notification-content">
                                                <p>Invoice #INV-2026-048 paid via M-Pesa</p>
                                                <span>Just now</span>
                                            </div>
                                        </div>
                                        <div className="notification-item unread">
                                            <div className="notification-icon bg-warning">
                                                <MessageSquare size={14} />
                                            </div>
                                            <div className="notification-content">
                                                <p>New strategic goal update recorded</p>
                                                <span>2 hours ago</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="notifications-footer">
                                        <Link to="/portal/admin/sales?view=activities" className="view-all-link">
                                            View Sales & Support Activities
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile Avatar Trigger */}
                        <div className="user-profile-container relative">
                            <button
                                type="button"
                                className="user-avatar-btn w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-slate-200/80 hover:ring-slate-400 hover:shadow-sm transition-all cursor-pointer focus:outline-none"
                                onClick={() => {
                                    setShowProfileMenu(!showProfileMenu);
                                    setShowNotifications(false);
                                }}
                                aria-label="User Profile"
                                title={`${adminName} (${userRole})`}
                            >
                                {getUserInitials(adminName)}
                            </button>

                            {showProfileMenu && (
                                <div className="profile-dropdown-menu">
                                    <div className="profile-menu-header">
                                        <div className="profile-header-avatar">
                                            {getUserInitials(adminName)}
                                        </div>
                                        <div className="profile-header-details">
                                            <div className="profile-header-name">{adminName}</div>
                                            <div className="profile-header-role">{userRole}</div>
                                        </div>
                                    </div>
                                    <div className="profile-menu-divider" />
                                    <Link
                                        to="/portal/admin/profile"
                                        className="profile-menu-item"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <User size={15} />
                                        <span>My Profile</span>
                                    </Link>
                                    {canOpenSettings && (
                                    <Link
                                        to="/portal/admin/settings"
                                        className="profile-menu-item"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <Settings size={15} />
                                        <span>System Settings</span>
                                    </Link>
                                    )}
                                    <div className="profile-menu-divider" />
                                    <button
                                        className="profile-menu-item text-danger"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            apiClient.auth.logout();
                                        }}
                                    >
                                        <LogOut size={15} />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Primary Page Outlet */}
                <main className="portal-content-area">
                    {isRouteAllowed ? <Outlet /> : !profileReady ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#64748b', fontSize: 14 }}>Verifying access…</div>
                    ) : (
                        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '40px 32px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Shield size={24} />
                            </div>
                            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Access restricted</h2>
                            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>
                                Your role does not grant access to <strong>{matchedRouteModule?.label}</strong>. Contact a system administrator to update your role permissions.
                            </p>
                            <Link to="/portal/admin/dashboard" className="btn-primary btn-sm" style={{ display: 'inline-flex' }}>Back to Dashboard</Link>
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Backdrop Overlay */}
            {isMobile && mobileDrawerOpen && (
                <div
                    className="portal-mobile-overlay"
                    onClick={() => setMobileDrawerOpen(false)}
                />
            )}

            {/* Scoped CSS Styles for Icon Rail & Two-Tier Layout */}
            <style>{`
                /* ======================================================== */
                /* 1. SLIM NON-EXPANDABLE PRIMARY ICON RAIL                 */
                /* ======================================================== */
                .portal-icon-rail {
                    width: 70px;
                    height: 100vh;
                    background: linear-gradient(180deg, #0b2b35 0%, #061920 100%);
                    color: #ffffff;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 1050;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 14px 0;
                    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
                    user-select: none;
                }

                .rail-logo-container {
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 12px;
                }

                .rail-logo-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    transition: transform 0.2s ease;
                }

                .rail-logo-link:hover {
                    transform: scale(1.05);
                }

                .rail-logo-img {
                    width: 32px;
                    height: 32px;
                    object-fit: contain;
                }

                .rail-nav-center {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    overflow-y: auto;
                    padding: 4px 0;
                }

                .rail-icon-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.65);
                    text-decoration: none;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }

                .rail-icon-btn:hover {
                    background-color: rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                }

                /* Active icon container matching the reference card highlight */
                .rail-icon-btn.rail-active {
                    background-color: rgba(255, 255, 255, 0.16);
                    color: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.22);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                }

                .rail-active-pill {
                    position: absolute;
                    left: 2px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 16px;
                    background-color: #ffffff;
                    border-radius: 2px;
                }

                .rail-nav-bottom {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    width: 100%;
                }

                .rail-logout-btn:hover {
                    background-color: rgba(239, 68, 68, 0.15) !important;
                    color: #ef4444 !important;
                }

                /* ======================================================== */
                /* 2. MAIN WORKSPACE MARGINS & TRANSITIONS                  */
                /* ======================================================== */
                .portal-main-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    height: 100vh;
                    overflow: hidden;
                    transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* When Secondary Sidebar is open: 70px rail + 250px secondary = 320px */
                .icon-rail-layout.secondary-visible .portal-main-wrapper {
                    margin-left: 320px;
                }

                /* When Secondary Sidebar is closed: 70px rail only */
                .icon-rail-layout.secondary-hidden .portal-main-wrapper {
                    margin-left: 70px;
                }

                /* Topbar button for secondary sidebar toggle */
                .secondary-toggle-bar-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .secondary-toggle-bar-btn:hover {
                    background: #f8fafc;
                    color: #0f172a;
                    border-color: #cbd5e1;
                }

                .secondary-toggle-bar-btn.active {
                    background: #f1f5f9;
                    color: #0f172a;
                    border-color: #cbd5e1;
                }

                /* Modern SaaS Topbar Styles */
                .portal-topbar {
                    height: 64px !important;
                    min-height: 64px !important;
                    max-height: 64px !important;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border-bottom: 1px solid rgba(226, 232, 240, 0.8) !important;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 1.5rem;
                    box-sizing: border-box;
                    width: 100%;
                }

                .topbar-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .topbar-breadcrumb-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .breadcrumb-module-name {
                    font-size: 13.5px;
                    font-weight: 500;
                    color: #64748b;
                    text-decoration: none;
                    transition: color 0.15s ease;
                }

                .breadcrumb-module-name:hover {
                    color: #0f172a;
                }

                .breadcrumb-separator {
                    color: #94a3b8;
                }

                .breadcrumb-current-view {
                    font-size: 14px;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 0;
                }

                .breadcrumb-status-pill {
                    background: #ecfdf5;
                    color: #047857;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2.5px 8.5px;
                    border-radius: 9999px;
                    border: 1px solid rgba(167, 243, 208, 0.7);
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }

                .pill-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #10b981;
                }

                /* Center Section: Global Command Search */
                .topbar-center {
                    display: flex;
                    justify-content: center;
                    flex: 1;
                    max-width: 420px;
                    margin: 0 1.5rem;
                }

                .search-input-container {
                    width: 100%;
                }

                .search-bar-inner {
                    display: flex;
                    align-items: center;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 6px 12px;
                    width: 100%;
                    box-sizing: border-box;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .search-bar-inner:focus-within {
                    background: #ffffff;
                    border-color: #0f172a;
                    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
                }

                .topbar-search-input {
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 13px;
                    color: #0f172a;
                    width: 100%;
                    padding: 0;
                }

                .topbar-search-input::placeholder {
                    color: #94a3b8;
                }

                .key-badge {
                    font-size: 10.5px;
                    font-weight: 600;
                    color: #64748b;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    padding: 1.5px 5.5px;
                    border-radius: 4px;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
                    margin-left: 8px;
                    white-space: nowrap;
                }

                /* Right Section: Utilities & Profile */
                .topbar-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .topbar-quick-action-btn {
                    background: #0f172a;
                    color: #ffffff;
                    border: none;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 7px 13px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
                    white-space: nowrap;
                }

                .topbar-quick-action-btn:hover {
                    background: #1e293b;
                    transform: translateY(-0.5px);
                }

                .notification-bell-container {
                    position: relative;
                }

                .notification-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.15s ease;
                }

                .notification-btn:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                .notification-badge {
                    background: #f43f5e;
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 700;
                    height: 16px;
                    min-width: 16px;
                    border-radius: 9999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: absolute;
                    top: -1px;
                    right: -1px;
                    border: 2px solid #ffffff;
                }

                .user-profile-container {
                    position: relative;
                }

                .user-profile-menu {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 4px 8px 4px 6px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    border: 1px solid transparent;
                    text-decoration: none;
                }

                .user-profile-menu:hover {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }

                .user-avatar-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #0f172a;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    box-shadow: 0 0 0 2px rgba(226, 232, 240, 0.8);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .user-avatar-btn:hover {
                    box-shadow: 0 0 0 2px #94a3b8, 0 2px 6px rgba(0, 0, 0, 0.1);
                    transform: scale(1.04);
                }

                /* Profile Dropdown Menu */
                .profile-dropdown-menu {
                    position: absolute;
                    right: 0;
                    top: calc(100% + 8px);
                    width: 220px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
                    z-index: 1000;
                    padding: 6px;
                }

                .profile-menu-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 10px 10px;
                }

                .profile-header-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #0f172a;
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .profile-header-details {
                    min-width: 0;
                }

                .profile-header-name {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #0f172a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .profile-header-role {
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    margin-top: 1px;
                }

                .profile-menu-divider {
                    height: 1px;
                    background: #f1f5f9;
                    margin: 4px 0;
                }

                .profile-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 8px 10px;
                    border-radius: 6px;
                    border: none;
                    background: transparent;
                    font-size: 12.5px;
                    font-weight: 500;
                    color: #334155;
                    text-decoration: none;
                    cursor: pointer;
                    transition: background 0.15s ease;
                    box-sizing: border-box;
                    text-align: left;
                }

                .profile-menu-item:hover {
                    background: #f8fafc;
                    color: #0f172a;
                }

                .profile-menu-item.text-danger:hover {
                    background: #fef2f2;
                    color: #ef4444;
                }

                /* Mobile Adaptations */
                @media (max-width: 1024px) {
                    .icon-rail-layout.secondary-visible .portal-main-wrapper,
                    .icon-rail-layout.secondary-hidden .portal-main-wrapper {
                        margin-left: 70px !important;
                    }

                    .portal-secondary-sidebar-ref {
                        left: 70px !important;
                        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
                    }

                    .desktop-only {
                        display: none !important;
                    }
                }

                @media (max-width: 480px) {
                    .portal-icon-rail {
                        width: 56px;
                    }
                    .rail-icon-btn {
                        width: 38px;
                        height: 38px;
                    }
                    .icon-rail-layout.secondary-visible .portal-main-wrapper,
                    .icon-rail-layout.secondary-hidden .portal-main-wrapper {
                        margin-left: 56px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PortalLayout;
