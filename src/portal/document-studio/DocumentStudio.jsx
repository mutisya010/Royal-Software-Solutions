import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Palette,
    Layers,
    Sparkles,
    FileCheck,
    LayoutDashboard,
    Plus,
    FileText,
    History,
    FileDown,
    ArrowRight,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import './DocumentStudio.css';

import TemplateListView from './TemplateListView';
import VisualDocumentEditor from './VisualDocumentEditor';
import BrandingProfileView from './BrandingProfileView';
import GeneratedDocumentsView from './GeneratedDocumentsView';
import TemplateVersionsModal from './TemplateVersionsModal';

const DocumentStudio = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlView = searchParams.get('view');
    const [currentView, setCurrentView] = useState(urlView || 'overview');

    const [templates, setTemplates] = useState([]);
    const [branding, setBranding] = useState(null);
    const [stats, setStats] = useState({
        totalTemplates: 0,
        publishedTemplates: 0,
        generatedDocuments: 0
    });
    const [loading, setLoading] = useState(false);

    // Active template for editor and version history modal
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [versionsModalTemplate, setVersionsModalTemplate] = useState(null);

    // Synchronize view state with URL search param
    useEffect(() => {
        if (urlView && urlView !== currentView) {
            setCurrentView(urlView);
        }
    }, [urlView]);

    const navigateToView = (viewName) => {
        setCurrentView(viewName);
        setSearchParams({ view: viewName });
    };

    useEffect(() => {
        loadStudioData();
    }, []);

    const loadStudioData = async () => {
        try {
            setLoading(true);
            const [templatesData, brandingData, generatedData] = await Promise.all([
                apiClient.documents.getTemplates().catch(() => []),
                apiClient.documents.getBranding().catch(() => null),
                apiClient.documents.getGeneratedDocuments().catch(() => [])
            ]);

            const tmpls = Array.isArray(templatesData) ? templatesData : templatesData.results || [];
            const genDocs = Array.isArray(generatedData) ? generatedData : generatedData.results || [];

            setTemplates(tmpls);
            setBranding(brandingData);
            setStats({
                totalTemplates: tmpls.length,
                publishedTemplates: tmpls.filter(t => t.status === 'published').length,
                generatedDocuments: genDocs.length
            });
        } catch (err) {
            console.error('Failed to load document studio data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplateForEdit = (template) => {
        setEditingTemplate(template);
        navigateToView('editor');
    };

    const handleCreateNewTemplate = () => {
        setEditingTemplate(null);
        navigateToView('editor');
    };

    return (
        <div className="doc-studio-container">
            {/* Top Studio Header & Navigation Tabs */}
            <div className="doc-studio-header">
                <div className="doc-studio-title-area">
                    <div className="doc-studio-icon-badge">
                        <Palette size={22} />
                    </div>
                    <div>
                        <h1>Document Design Studio</h1>
                        <p>Enterprise document template engine, brand styling, and WeasyPrint generation for Royal Software Solutions</p>
                    </div>
                </div>

                <div className="doc-studio-nav-tabs">
                    <button
                        onClick={() => navigateToView('overview')}
                        className={`doc-tab-btn ${currentView === 'overview' ? 'tab-active' : ''}`}
                    >
                        <LayoutDashboard size={15} />
                        Overview
                    </button>

                    <button
                        onClick={() => navigateToView('templates')}
                        className={`doc-tab-btn ${currentView === 'templates' ? 'tab-active' : ''}`}
                    >
                        <Layers size={15} />
                        Templates
                    </button>

                    <button
                        onClick={() => {
                            if (!editingTemplate && templates.length > 0) {
                                setEditingTemplate(templates[0]);
                            }
                            navigateToView('editor');
                        }}
                        className={`doc-tab-btn ${currentView === 'editor' ? 'tab-active' : ''}`}
                    >
                        <Palette size={15} />
                        Visual Editor
                    </button>

                    <button
                        onClick={() => navigateToView('branding')}
                        className={`doc-tab-btn ${currentView === 'branding' ? 'tab-active' : ''}`}
                    >
                        <Sparkles size={15} />
                        Document Branding
                    </button>

                    <button
                        onClick={() => navigateToView('history')}
                        className={`doc-tab-btn ${currentView === 'history' ? 'tab-active' : ''}`}
                    >
                        <FileCheck size={15} />
                        Audit Archive
                    </button>
                </div>
            </div>

            {/* Main Studio Views */}
            <div className="doc-studio-content">
                {currentView === 'overview' && (
                    <div>
                        {/* KPI Metrics */}
                        <div className="doc-stats-grid">
                            <div className="doc-stat-card">
                                <div className="doc-stat-icon" style={{ background: '#f0fdfa', color: '#0f766e' }}>
                                    <Layers size={24} />
                                </div>
                                <div className="doc-stat-info">
                                    <span>Total Templates</span>
                                    <h3>{stats.totalTemplates}</h3>
                                </div>
                            </div>

                            <div className="doc-stat-card">
                                <div className="doc-stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                                    <ShieldCheck size={24} />
                                </div>
                                <div className="doc-stat-info">
                                    <span>Published & Active</span>
                                    <h3>{stats.publishedTemplates}</h3>
                                </div>
                            </div>

                            <div className="doc-stat-card">
                                <div className="doc-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <FileCheck size={24} />
                                </div>
                                <div className="doc-stat-info">
                                    <span>Compiled PDFs</span>
                                    <h3>{stats.generatedDocuments}</h3>
                                </div>
                            </div>

                            <div className="doc-stat-card">
                                <div className="doc-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                                    <Sparkles size={24} />
                                </div>
                                <div className="doc-stat-info">
                                    <span>Brand Identity</span>
                                    <h3>{branding?.primary_color || 'Configured'}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions & Recent Templates Banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 100%)',
                            borderRadius: 16,
                            padding: '2.5rem',
                            color: '#ffffff',
                            marginBottom: '2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 10px 30px rgba(15, 118, 110, 0.25)'
                        }}>
                            <div style={{ maxWidth: '600px' }}>
                                <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: '#5eead4',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: 9999
                                }}>
                                    Professional Document Studio
                                </span>
                                <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.85rem 0 0.5rem 0', fontFamily: 'Outfit, sans-serif' }}>
                                    Centralized Document Engine for Royal Softwares
                                </h2>
                                <p style={{ fontSize: '0.95rem', color: '#ccfbf1', lineHeight: 1.5, margin: 0 }}>
                                    Design pixel-perfect A4 tax invoices, official sales proposals, certificates, and reports.
                                    All documents inherit company brand tokens with WeasyPrint fidelity.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    onClick={handleCreateNewTemplate}
                                    style={{
                                        background: '#ffffff',
                                        color: '#0f766e',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: 10,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    <Plus size={18} />
                                    Create New Template
                                </button>
                                <button
                                    onClick={() => navigateToView('branding')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        padding: '0.65rem 1.5rem',
                                        borderRadius: 10,
                                        border: '1px solid rgba(255, 255, 255, 0.25)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Sparkles size={16} />
                                    Configure Brand Identity
                                </button>
                            </div>
                        </div>

                        {/* Recent Templates Preview Section */}
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                Active Document Templates
                            </h3>
                            <button
                                onClick={() => navigateToView('templates')}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#0f766e',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                View all {stats.totalTemplates} templates <ArrowRight size={14} />
                            </button>
                        </div>

                        <TemplateListView
                            templates={templates.slice(0, 3)}
                            loading={loading}
                            onSelectTemplate={handleSelectTemplateForEdit}
                            onOpenVersions={(t) => setVersionsModalTemplate(t)}
                            onRefresh={loadStudioData}
                            onCreateNew={handleCreateNewTemplate}
                        />
                    </div>
                )}

                {currentView === 'templates' && (
                    <TemplateListView
                        templates={templates}
                        loading={loading}
                        onSelectTemplate={handleSelectTemplateForEdit}
                        onOpenVersions={(t) => setVersionsModalTemplate(t)}
                        onRefresh={loadStudioData}
                        onCreateNew={handleCreateNewTemplate}
                    />
                )}

                {currentView === 'editor' && (
                    <VisualDocumentEditor
                        template={editingTemplate}
                        branding={branding}
                        onBack={() => navigateToView('templates')}
                        onSaveSuccess={(t) => {
                            setEditingTemplate(t);
                            loadStudioData();
                        }}
                        onPublishSuccess={() => {
                            loadStudioData();
                        }}
                    />
                )}

                {currentView === 'branding' && (
                    <BrandingProfileView
                        onSaveSuccess={(b) => {
                            setBranding(b);
                            loadStudioData();
                        }}
                    />
                )}

                {currentView === 'history' && (
                    <GeneratedDocumentsView />
                )}
            </div>

            {/* Version History & Rollback Modal */}
            <TemplateVersionsModal
                template={versionsModalTemplate}
                isOpen={Boolean(versionsModalTemplate)}
                onClose={() => setVersionsModalTemplate(null)}
                onRollbackSuccess={(updated) => {
                    setEditingTemplate(updated);
                    loadStudioData();
                }}
            />
        </div>
    );
};

export default DocumentStudio;

