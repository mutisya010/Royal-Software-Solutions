import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    PanelLeftClose,
    Sparkles,
    Settings,
    ShieldCheck,
    CheckCircle2,
    Sliders,
    HelpCircle
} from 'lucide-react';
import { canAccessNavItem } from './navigationConfig';
import { apiClient } from '../services/apiClient';

/**
 * Secondary Contextual Sidebar (Matching the reference design)
 * Sits beside the slim non-expandable icon rail.
 */
const SecondarySidebar = ({
    module,
    activeView,
    isOpen,
    onClose,
    companyName,
    user
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!module || !isOpen) {
        return null;
    }

    const currentUser = user || (apiClient?.auth ? apiClient.auth.getCurrentUser() : null);
    const ModuleIcon = module.icon;
    const currentView = activeView || 'dashboard';

    // Filter items if user enters a search term and enforce item-level permissions
    const getFilteredGroups = () => {
        if (!module.groups) return [];
        const term = searchTerm.trim().toLowerCase();

        return module.groups
            .map(grp => ({
                ...grp,
                items: grp.items.filter(item => {
                    // Check item-level permission
                    if (!canAccessNavItem(item, currentUser)) {
                        return false;
                    }
                    if (!term) return true;
                    return (
                        item.label.toLowerCase().includes(term) ||
                        item.view.toLowerCase().includes(term)
                    );
                })
            }))
            .filter(grp => grp.items.length > 0);
    };

    const filteredGroups = getFilteredGroups();

    return (
        <aside className="portal-secondary-sidebar-ref" aria-label={`${module.label} Navigation`}>
            {/* 1. Header with Module Branding & Collapse Button */}
            <div className="secondary-ref-header">
                <div className="secondary-brand-box">
                    <div className="secondary-brand-icon">
                        <ModuleIcon size={18} />
                    </div>
                    <div className="secondary-brand-text">
                        <h3 className="secondary-module-name">{module.label}</h3>
                    </div>
                </div>

                <button
                    className="secondary-collapse-btn"
                    onClick={onClose}
                    title="Collapse Sidebar"
                    aria-label="Collapse Sidebar"
                >
                    <PanelLeftClose size={18} />
                </button>
            </div>

            {/* 2. Quick Search Bar */}
            <div className="secondary-search-container">
                <div className="secondary-search-input-wrap">
                    <Search size={15} className="secondary-search-icon" />
                    <input
                        type="text"
                        placeholder="Quick search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="secondary-search-input"
                    />
                </div>
            </div>

            {/* 3. Contextual Menu List */}
            <div className="secondary-menu-scroll">
                {filteredGroups.length > 0 ? (
                    filteredGroups.map((group, gIdx) => (
                        <div key={gIdx} className="secondary-menu-section">
                            <span className="secondary-section-title">
                                {group.title || 'Menu'}
                            </span>

                            <div className="secondary-items-list">
                                {group.items.map((item) => {
                                    const ItemIcon = item.icon;
                                    const isActive = currentView === item.view;

                                    return (
                                        <Link
                                            key={item.view}
                                            to={`${module.path}?view=${item.view}`}
                                            className={`secondary-menu-item ${isActive ? 'item-active' : ''}`}
                                        >
                                            <div className="secondary-item-icon">
                                                <ItemIcon size={17} />
                                            </div>
                                            <span className="secondary-item-label">{item.label}</span>
                                            {item.badge && (
                                                <span className="secondary-item-badge">{item.badge}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="secondary-empty-search">
                        <p>No matching views found.</p>
                    </div>
                )}
            </div>

            {/* 4. Bottom System Status / Plan Card */}
            <div className="secondary-bottom-section">
                <div className="secondary-plan-card">
                    <div className="plan-card-header">
                        <div className="plan-card-icon-wrap">
                            <Sparkles size={16} />
                        </div>
                        <div className="plan-card-info">
                            <span className="plan-card-label">Current System:</span>
                            <span className="plan-card-name">Enterprise ERP</span>
                        </div>
                    </div>
                    <p className="plan-card-desc">
                        Connected to live backend database with active multi-tenant telemetry.
                    </p>
                </div>

                <div className="secondary-bottom-links">
                    <Link to="/portal/admin/settings" className="secondary-bottom-link">
                        <Sliders size={16} />
                        <span>Preferences</span>
                    </Link>
                </div>
            </div>

            {/* Scoped CSS Styles for Secondary Sidebar */}
            <style>{`
                .portal-secondary-sidebar-ref {
                    width: 250px;
                    height: 100vh;
                    background-color: #f8fafc;
                    border-right: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    left: 70px;
                    top: 0;
                    z-index: 1040;
                    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.02);
                    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                }

                /* Header */
                .secondary-ref-header {
                    height: 68px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid #f1f5f9;
                    background-color: #f8fafc;
                }

                .secondary-brand-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }

                .secondary-brand-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    background-color: rgba(22, 101, 122, 0.1);
                    color: var(--primary-color, #16657a);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .secondary-brand-text {
                    min-width: 0;
                }

                .secondary-module-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: var(--font-heading, 'Outfit', sans-serif);
                }

                .secondary-collapse-btn {
                    width: 30px;
                    height: 30px;
                    border-radius: 6px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                }

                .secondary-collapse-btn:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }

                /* Search */
                .secondary-search-container {
                    padding: 12px 14px 8px 14px;
                }

                .secondary-search-input-wrap {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 7px 10px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }

                .secondary-search-icon {
                    color: #94a3b8;
                    flex-shrink: 0;
                }

                .secondary-search-input {
                    border: none;
                    outline: none;
                    background: transparent;
                    font-size: 13px;
                    color: #1e293b;
                    width: 100%;
                }

                .secondary-search-input::placeholder {
                    color: #94a3b8;
                }

                /* Menu Scroll */
                .secondary-menu-scroll {
                    flex: 1;
                    padding: 10px 12px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .secondary-menu-section {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .secondary-section-title {
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748b;
                    padding: 4px 10px;
                    letter-spacing: 0.3px;
                }

                .secondary-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .secondary-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 8px;
                    color: #475569;
                    font-size: 13px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all 0.15s ease;
                }

                .secondary-menu-item:hover {
                    background-color: #f1f5f9;
                    color: #0f172a;
                }

                /* Active state matching the reference white card pill */
                .secondary-menu-item.item-active {
                    background-color: #ffffff;
                    color: #0f172a;
                    font-weight: 600;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e2e8f0;
                }

                .secondary-item-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: inherit;
                    opacity: 0.85;
                }

                .secondary-menu-item.item-active .secondary-item-icon {
                    opacity: 1;
                    color: var(--primary-color, #16657a);
                }

                .secondary-item-label {
                    flex: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .secondary-item-badge {
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748b;
                    background: #f1f5f9;
                    padding: 1px 6px;
                    border-radius: 10px;
                }

                .secondary-empty-search {
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #94a3b8;
                }

                /* Bottom Plan / System Card */
                .secondary-bottom-section {
                    padding: 14px 14px;
                    border-top: 1px solid #e2e8f0;
                    background-color: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .secondary-plan-card {
                    background: linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%);
                    border: 1px solid #bae6fd;
                    border-radius: 10px;
                    padding: 12px;
                }

                .plan-card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }

                .plan-card-icon-wrap {
                    width: 26px;
                    height: 26px;
                    border-radius: 6px;
                    background: #ffffff;
                    color: var(--primary-color, #16657a);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }

                .plan-card-info {
                    display: flex;
                    flex-direction: column;
                }

                .plan-card-label {
                    font-size: 10px;
                    color: #64748b;
                    line-height: 1;
                }

                .plan-card-name {
                    font-size: 12px;
                    font-weight: 700;
                    color: #0369a1;
                    line-height: 1.2;
                }

                .plan-card-desc {
                    font-size: 11px;
                    color: #475569;
                    margin: 0;
                    line-height: 1.3;
                }

                .secondary-bottom-links {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .secondary-bottom-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #64748b;
                    padding: 6px 8px;
                    border-radius: 6px;
                    text-decoration: none;
                    transition: all 0.15s ease;
                }

                .secondary-bottom-link:hover {
                    color: #0f172a;
                    background-color: #f1f5f9;
                }

                /* Mobile Adjustment */
                @media (max-width: 1024px) {
                    .portal-secondary-sidebar-ref {
                        left: 70px;
                        box-shadow: 4px 0 20px rgba(0,0,0,0.15);
                    }
                }
            `}</style>
        </aside>
    );
};

export default SecondarySidebar;
