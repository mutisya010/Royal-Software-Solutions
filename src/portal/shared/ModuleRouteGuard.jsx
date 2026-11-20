import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, UserCheck } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { MODULE_NAV_CONFIG, canAccessModule, isAdminUser } from '../navigationConfig';

/**
 * Route-Level Permission Guard
 * Enforces module-level access control based on user roles and Django permissions.
 * Prevents unauthorized users from manually accessing URLs like /portal/admin/projects or /portal/admin/finance.
 */
export const ModuleRouteGuard = ({ moduleId, children }) => {
    const navigate = useNavigate();
    const currentUser = apiClient.auth.getCurrentUser();

    // 1. If not authenticated, redirect to login
    if (!currentUser) {
        navigate('/login', { replace: true });
        return null;
    }

    // 2. Superusers and administrators always bypass module restrictions
    if (currentUser.is_superuser || isAdminUser(currentUser)) {
        return <>{children}</>;
    }

    // 3. Find the module configuration
    const moduleConfig = MODULE_NAV_CONFIG.find(m => 
        m.id === moduleId || 
        m.id === moduleId.replace('-roles', '') ||
        (m.path && (m.path.endsWith(`/${moduleId}`) || m.path.includes(moduleId)))
    );

    // If module has no restrictions or is general (e.g. dashboard/profile), allow access
    if (!moduleConfig) {
        return <>{children}</>;
    }

    // 4. Check if current user is cleared for this module
    const hasAccess = canAccessModule(moduleConfig, currentUser);

    if (hasAccess) {
        return <>{children}</>;
    }

    // 5. Render Access Restricted (403) Screen
    return (
        <div className="access-denied-container">
            <div className="access-denied-card">
                <div className="access-denied-icon-bubble">
                    <ShieldAlert size={36} color="#ef4444" />
                </div>

                <span className="access-denied-code">403 • ACCESS RESTRICTED</span>
                <h1 className="access-denied-title">Permission Required</h1>
                
                <p className="access-denied-desc">
                    Your account does not have permission to access the <strong>{moduleConfig.label}</strong> module.
                </p>

                <div className="access-denied-info-box">
                    <p className="access-denied-info-title">Why am I seeing this?</p>
                    <p className="access-denied-info-text">
                        Access to operational modules is restricted by your assigned roles and company permissions.
                        If you need access to this workspace, please contact your system administrator to update your permissions.
                    </p>
                </div>

                <div className="access-denied-actions">
                    <button
                        className="access-btn access-btn-secondary"
                        onClick={() => navigate('/portal/admin/profile')}
                    >
                        <UserCheck size={16} />
                        <span>View My Permissions</span>
                    </button>
                    <button
                        className="access-btn access-btn-primary"
                        onClick={() => navigate('/portal/admin/dashboard')}
                    >
                        <Home size={16} />
                        <span>Return to Dashboard</span>
                    </button>
                </div>
            </div>

            <style>{`
                .access-denied-container {
                    min-height: 75vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .access-denied-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
                    border-radius: 16px;
                    padding: 36px 32px;
                    max-width: 520px;
                    width: 100%;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .access-denied-icon-bubble {
                    width: 68px;
                    height: 68px;
                    border-radius: 50%;
                    background: #fef2f2;
                    border: 1px solid #fee2e2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                }

                .access-denied-code {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    color: #ef4444;
                    background: #fef2f2;
                    padding: 4px 10px;
                    border-radius: 12px;
                    margin-bottom: 12px;
                }

                .access-denied-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0 0 8px 0;
                }

                .access-denied-desc {
                    font-size: 14px;
                    color: #64748b;
                    margin: 0 0 20px 0;
                    line-height: 1.5;
                }

                .access-denied-info-box {
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 10px;
                    padding: 14px 16px;
                    text-align: left;
                    margin-bottom: 24px;
                    width: 100%;
                }

                .access-denied-info-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #334155;
                    margin: 0 0 4px 0;
                }

                .access-denied-info-text {
                    font-size: 12px;
                    color: #64748b;
                    margin: 0;
                    line-height: 1.5;
                }

                .access-denied-actions {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                    flex-wrap: wrap;
                }

                .access-btn {
                    flex: 1;
                    min-width: 140px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .access-btn-primary {
                    background: var(--primary-color, #16657a);
                    color: #ffffff;
                    border: 1px solid transparent;
                }

                .access-btn-primary:hover {
                    opacity: 0.92;
                    transform: translateY(-1px);
                }

                .access-btn-secondary {
                    background: #ffffff;
                    color: #334155;
                    border: 1px solid #cbd5e1;
                }

                .access-btn-secondary:hover {
                    background: #f8fafc;
                    border-color: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default ModuleRouteGuard;

