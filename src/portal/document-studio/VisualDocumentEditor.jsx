import React, { useState, useEffect } from 'react';
import {
    Save,
    CheckCircle,
    FileDown,
    ArrowLeft,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Layers,
    Type,
    Layout,
    Sliders,
    Eye,
    EyeOff,
    Sparkles,
    Shield,
    Palette,
    RefreshCw,
    Check
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const VisualDocumentEditor = ({
    template,
    branding,
    onBack,
    onSaveSuccess,
    onPublishSuccess
}) => {
    // Selected node in tree: 'page' | 'header' | 'watermark' | 'table' | 'footer'
    const [activeNode, setActiveNode] = useState('header');
    const [zoomLevel, setZoomLevel] = useState(0.85); // 85% default for desktop view

    // Template editing state
    const [name, setName] = useState(template?.name || 'New Custom Template');
    const [category, setCategory] = useState(template?.category || 'invoice');
    const [description, setDescription] = useState(template?.description || '');
    const [isDefault, setIsDefault] = useState(template?.is_default || false);

    // Structure configurations
    const [headerConfig, setHeaderConfig] = useState({
        show_logo: true,
        show_motto: true,
        show_contacts: true,
        show_divider: true,
        title_override: '',
        motto_override: '',
        accent_color: '',
        layout_style: 'standard', // 'standard' | 'centered' | 'compact'
        ...(template?.header_config || {})
    });

    const [footerConfig, setFooterConfig] = useState({
        show_footer: true,
        show_page_numbers: true,
        show_tax_pin: true,
        custom_notes: '',
        ...(template?.footer_config || {})
    });

    const [watermarkConfig, setWatermarkConfig] = useState({
        enabled: true,
        text: 'ROYAL SOFTWARE',
        opacity: 0.12,
        rotation: -35,
        font_size: 55,
        ...(template?.watermark_config || {})
    });

    const [pageConfig, setPageConfig] = useState({
        size: 'A4',
        orientation: 'portrait',
        margin_top: '15mm',
        margin_bottom: '15mm',
        margin_left: '18mm',
        margin_right: '18mm',
        ...(template?.page_config || {})
    });

    const [tableConfig, setTableConfig] = useState({
        header_background: '#0f766e',
        header_text_color: '#ffffff',
        alternate_row_background: '#f8fafc',
        show_borders: true,
        show_gridlines: false,
        compact_padding: false,
        ...(template?.table_config || {})
    });

    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const primaryColor = headerConfig.accent_color || branding?.primary_color || '#0f766e';
    const companyTitle = branding?.company_name || 'Royal Software Solutions';
    const companyMotto = headerConfig.motto_override || branding?.motto || 'Excellence in Enterprise Software Engineering';

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleSaveDraft = async () => {
        try {
            setSaving(true);
            const payload = {
                name,
                category,
                description,
                is_default: isDefault,
                header_config: headerConfig,
                footer_config: footerConfig,
                watermark_config: watermarkConfig,
                page_config: pageConfig,
                table_config: tableConfig
            };

            let updated;
            if (template?.id) {
                updated = await apiClient.documents.updateTemplate(template.id, payload);
            } else {
                updated = await apiClient.documents.createTemplate(payload);
            }
            showToast('Draft template saved successfully.');
            if (onSaveSuccess) onSaveSuccess(updated);
        } catch (err) {
            alert(`Error saving template: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        try {
            setPublishing(true);
            // 1. Save draft changes first
            const payload = {
                name,
                category,
                description,
                is_default: isDefault,
                header_config: headerConfig,
                footer_config: footerConfig,
                watermark_config: watermarkConfig,
                page_config: pageConfig,
                table_config: tableConfig
            };

            let tmplId = template?.id;
            if (!tmplId) {
                const created = await apiClient.documents.createTemplate(payload);
                tmplId = created.id;
            } else {
                await apiClient.documents.updateTemplate(tmplId, payload);
            }

            // 2. Publish
            const res = await apiClient.documents.publishTemplate(tmplId);
            showToast(res.message || 'Template published into immutable version snapshot!');
            if (onPublishSuccess) onPublishSuccess();
        } catch (err) {
            alert(`Error publishing template: ${err.message}`);
        } finally {
            setPublishing(false);
        }
    };

    const handleDownloadTestPdf = async () => {
        try {
            setGeneratingPdf(true);
            const currentConfig = {
                name,
                category,
                header_config: headerConfig,
                footer_config: footerConfig,
                watermark_config: watermarkConfig,
                page_config: pageConfig,
                table_config: tableConfig
            };

            let blob;
            if (template?.id) {
                blob = await apiClient.documents.previewPdf(template.id, currentConfig);
            } else {
                blob = await apiClient.documents.previewLivePdf(currentConfig);
            }

            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (err) {
            alert(`Test PDF generation failed: ${err.message}`);
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top Studio Action Bar */}
            <div style={{
                background: '#ffffff',
                borderBottom: '1px solid #cbd5e1',
                padding: '0.75rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '10px 10px 0 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={onBack}
                        className="btn-secondary-outline"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                        <ArrowLeft size={14} />
                        Templates
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    border: '1px solid transparent',
                                    borderRadius: 4,
                                    padding: '0.1rem 0.4rem',
                                    color: '#0f172a',
                                    fontFamily: 'Outfit, sans-serif'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#cbd5e1'}
                                onBlur={(e) => e.target.style.borderColor = 'transparent'}
                            />
                            <span className="template-category-tag">{category}</span>
                            <span className={`template-status-badge ${template?.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                                {template?.status || 'draft'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                        onClick={handleDownloadTestPdf}
                        disabled={generatingPdf}
                        className="btn-secondary-outline"
                    >
                        <FileDown size={15} />
                        {generatingPdf ? 'Rendering PDF...' : 'Download Test PDF'}
                    </button>

                    <button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="btn-secondary-outline"
                    >
                        <Save size={15} />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="btn-primary-teal"
                    >
                        <CheckCircle size={15} />
                        {publishing ? 'Publishing...' : 'Publish Version'}
                    </button>
                </div>
            </div>

            {toastMessage && (
                <div style={{
                    position: 'absolute',
                    top: '80px',
                    right: '30px',
                    zIndex: 100,
                    background: '#0f766e',
                    color: '#ffffff',
                    padding: '0.75rem 1.25rem',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '0.85rem',
                    fontWeight: 600
                }}>
                    <Check size={16} />
                    {toastMessage}
                </div>
            )}

            {/* 3-Panel Studio Layout */}
            <div className="studio-editor-viewport">
                {/* 1. Left Panel: Document Tree & Structure */}
                <div className="studio-left-panel">
                    <div className="studio-panel-title">
                        <Layers size={16} />
                        Document Structure
                    </div>

                    <div className="studio-structure-tree">
                        <div
                            className={`tree-node-item ${activeNode === 'page' ? 'node-active' : ''}`}
                            onClick={() => setActiveNode('page')}
                        >
                            <Layout size={16} />
                            <span>Page & Margins</span>
                        </div>

                        <div
                            className={`tree-node-item ${activeNode === 'header' ? 'node-active' : ''}`}
                            onClick={() => setActiveNode('header')}
                        >
                            <Type size={16} />
                            <span>Header & Branding</span>
                        </div>

                        <div
                            className={`tree-node-item ${activeNode === 'watermark' ? 'node-active' : ''}`}
                            onClick={() => setActiveNode('watermark')}
                        >
                            <Shield size={16} />
                            <span>Security Watermark</span>
                        </div>

                        <div
                            className={`tree-node-item ${activeNode === 'table' ? 'node-active' : ''}`}
                            onClick={() => setActiveNode('table')}
                        >
                            <Sliders size={16} />
                            <span>Table & Data Styling</span>
                        </div>

                        <div
                            className={`tree-node-item ${activeNode === 'footer' ? 'node-active' : ''}`}
                            onClick={() => setActiveNode('footer')}
                        >
                            <Sparkles size={16} />
                            <span>Footer & Statutory</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                            DOCUMENT CATEGORY
                        </span>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="prop-input"
                            style={{ fontSize: '0.8rem' }}
                        >
                            <option value="invoice">Tax Invoice</option>
                            <option value="quotation">Sales Quotation</option>
                            <option value="receipt">Official Receipt</option>
                            <option value="certificate">Completion Certificate</option>
                            <option value="report">Executive Report</option>
                        </select>

                        <div className="prop-toggle-row" style={{ marginTop: '0.75rem' }}>
                            <span className="prop-toggle-label" style={{ fontSize: '0.78rem' }}>Set as Category Default</span>
                            <label className="studio-switch">
                                <input
                                    type="checkbox"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                />
                                <span className="slider-round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 2. Middle Panel: Interactive A4 Workspace Canvas */}
                <div className="studio-workspace-canvas">
                    {/* Floating Zoom & Canvas Controls */}
                    <div className="workspace-controls-bar">
                        <button
                            onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.1))}
                            className="zoom-btn"
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="zoom-label">{Math.round(zoomLevel * 100)}%</span>
                        <button
                            onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                            className="zoom-btn"
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                        <button
                            onClick={() => setZoomLevel(0.85)}
                            className="zoom-btn"
                            title="Reset Zoom"
                            style={{ marginLeft: '0.35rem' }}
                        >
                            <Maximize2 size={14} />
                        </button>
                    </div>

                    {/* Interactive A4 Sheet with Live CSS Simulation */}
                    <div
                        className="a4-paper-sheet"
                        style={{
                            transform: `scale(${zoomLevel})`,
                            padding: `${pageConfig.margin_top} ${pageConfig.margin_right} ${pageConfig.margin_bottom} ${pageConfig.margin_left}`
                        }}
                    >
                        {/* Live Watermark Simulation */}
                        {watermarkConfig.enabled && watermarkConfig.text && (
                            <div
                                className="a4-watermark-overlay"
                                style={{
                                    opacity: watermarkConfig.opacity,
                                    transform: `translate(-50%, -50%) rotate(${watermarkConfig.rotation}deg)`,
                                    fontSize: `${watermarkConfig.font_size}pt`,
                                    color: primaryColor
                                }}
                            >
                                {watermarkConfig.text}
                            </div>
                        )}

                        <div className="a4-inner-content">
                            {/* Live Header Block */}
                            <div
                                className="a4-header-block"
                                style={{
                                    borderBottom: headerConfig.show_divider ? `2px solid ${primaryColor}` : 'none'
                                }}
                            >
                                <div className="a4-header-left">
                                    {headerConfig.show_logo && (
                                        branding?.logo ? (
                                            <div style={{
                                                maxHeight: 60,
                                                maxWidth: 160,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}>
                                                <img
                                                    src={branding.logo}
                                                    alt="Official Logo"
                                                    style={{ maxHeight: 54, maxWidth: 150, objectFit: 'contain' }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: 8,
                                                background: `linear-gradient(135deg, ${primaryColor}, #042f2e)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#ffffff',
                                                fontWeight: 800,
                                                fontSize: 20
                                            }}>
                                                RS
                                            </div>
                                        )
                                    )}
                                    <div>
                                        <div className="a4-company-title" style={{ color: '#0f172a' }}>
                                            {headerConfig.title_override || companyTitle}
                                        </div>
                                        {headerConfig.show_motto && (
                                            <div className="a4-company-motto">
                                                {companyMotto}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {headerConfig.show_contacts && (
                                    <div className="a4-header-right">
                                        <div>{branding?.address_line_1 || 'Nairobi Innovation Hub, Kilimani'}</div>
                                        <div>{branding?.phone || '+254 700 000 000'} | {branding?.email || 'info@royalsoftwares.com'}</div>
                                        <div>{branding?.website || 'https://royalsoftwares.com'}</div>
                                    </div>
                                )}
                            </div>

                            {/* Live Sample Body Content */}
                            <div className="a4-body-block">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <div>
                                        <h2 style={{ fontSize: '15pt', fontWeight: 800, color: primaryColor, margin: '0 0 4px 0' }}>
                                            {category.toUpperCase()} SAMPLE
                                        </h2>
                                        <span style={{ fontSize: '9pt', color: '#64748b' }}>Reference: {category.toUpperCase()}-2026-DEMO</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            fontSize: '8pt',
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            background: '#dcfce7',
                                            color: '#15803d'
                                        }}>
                                            ACTIVE DRAFT
                                        </span>
                                        <div style={{ fontSize: '8pt', color: '#64748b', marginTop: 4 }}>Date: 30 Oct 2026</div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, marginBottom: 15, display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <strong style={{ fontSize: '8.5pt', color: '#1e293b' }}>Client:</strong>
                                        <div style={{ fontSize: '8.5pt', color: '#475569' }}>Apex Global Logistics Ltd</div>
                                        <div style={{ fontSize: '8pt', color: '#64748b' }}>Kilimani Business Tower, Nairobi</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <strong style={{ fontSize: '8.5pt', color: '#1e293b' }}>Terms:</strong>
                                        <div style={{ fontSize: '8pt', color: '#64748b' }}>Net 30 Days</div>
                                    </div>
                                </div>

                                {/* Live Styled Table */}
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: tableConfig.compact_padding ? '8pt' : '8.5pt',
                                    border: tableConfig.show_borders ? '1px solid #e2e8f0' : 'none'
                                }}>
                                    <thead>
                                        <tr style={{
                                            background: tableConfig.header_background || primaryColor,
                                            color: tableConfig.header_text_color || '#ffffff'
                                        }}>
                                            <th style={{ padding: '8px 10px', textAlign: 'left', width: '10%' }}>#</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'left', width: '55%' }}>Description</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right', width: '15%' }}>Qty</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right', width: '20%' }}>Total (KES)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 10px' }}>1</td>
                                            <td style={{ padding: '8px 10px' }}>Enterprise Software Platform Subscription</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>1</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>180,000.00</td>
                                        </tr>
                                        <tr style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            background: tableConfig.alternate_row_background
                                        }}>
                                            <td style={{ padding: '8px 10px' }}>2</td>
                                            <td style={{ padding: '8px 10px' }}>Custom Workflow & Module Implementation</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>1</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>75,000.00</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                                Total Due:
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: primaryColor }}>
                                                KES 255,000.00
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Live Footer Block */}
                            {footerConfig.show_footer && (
                                <div className="a4-footer-block">
                                    <div>
                                        {footerConfig.custom_notes || branding?.footer_text || 'Thank you for partnering with Royal Software Solutions.'}
                                        {footerConfig.show_tax_pin && branding?.tax_pin && (
                                            <span style={{ marginLeft: 8 }}>| Tax PIN: {branding.tax_pin}</span>
                                        )}
                                    </div>
                                    {footerConfig.show_page_numbers && (
                                        <div>Page 1 of 1</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Right Panel: Contextual Properties Panel */}
                <div className="studio-right-panel">
                    <div className="studio-panel-title">
                        <Sliders size={16} />
                        Node Properties
                    </div>

                    {/* Context: Page & Margins */}
                    {activeNode === 'page' && (
                        <div className="prop-section">
                            <div className="prop-section-header">
                                <h4>Page Settings</h4>
                            </div>

                            <div className="prop-form-group">
                                <label>Top Margin</label>
                                <input
                                    type="text"
                                    value={pageConfig.margin_top}
                                    onChange={(e) => setPageConfig(prev => ({ ...prev, margin_top: e.target.value }))}
                                    className="prop-input"
                                    placeholder="15mm"
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Bottom Margin</label>
                                <input
                                    type="text"
                                    value={pageConfig.margin_bottom}
                                    onChange={(e) => setPageConfig(prev => ({ ...prev, margin_bottom: e.target.value }))}
                                    className="prop-input"
                                    placeholder="15mm"
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Left Margin</label>
                                <input
                                    type="text"
                                    value={pageConfig.margin_left}
                                    onChange={(e) => setPageConfig(prev => ({ ...prev, margin_left: e.target.value }))}
                                    className="prop-input"
                                    placeholder="18mm"
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Right Margin</label>
                                <input
                                    type="text"
                                    value={pageConfig.margin_right}
                                    onChange={(e) => setPageConfig(prev => ({ ...prev, margin_right: e.target.value }))}
                                    className="prop-input"
                                    placeholder="18mm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Context: Header & Branding */}
                    {activeNode === 'header' && (
                        <div className="prop-section">
                            <div className="prop-section-header">
                                <h4>Header Branding</h4>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Show Corporate Logo</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={headerConfig.show_logo}
                                        onChange={(e) => setHeaderConfig(prev => ({ ...prev, show_logo: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Show Tagline / Motto</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={headerConfig.show_motto}
                                        onChange={(e) => setHeaderConfig(prev => ({ ...prev, show_motto: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Show Contacts & Address</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={headerConfig.show_contacts}
                                        onChange={(e) => setHeaderConfig(prev => ({ ...prev, show_contacts: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Accent Border Line</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={headerConfig.show_divider}
                                        onChange={(e) => setHeaderConfig(prev => ({ ...prev, show_divider: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-form-group" style={{ marginTop: '1rem' }}>
                                <label>Header Accent Color</label>
                                <div className="prop-color-picker-row">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setHeaderConfig(prev => ({ ...prev, accent_color: e.target.value }))}
                                        className="prop-color-input"
                                    />
                                    <input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setHeaderConfig(prev => ({ ...prev, accent_color: e.target.value }))}
                                        className="prop-input"
                                    />
                                </div>
                            </div>

                            <div className="prop-form-group">
                                <label>Company Name Override</label>
                                <input
                                    type="text"
                                    value={headerConfig.title_override}
                                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, title_override: e.target.value }))}
                                    className="prop-input"
                                    placeholder="Leave blank to inherit from branding"
                                />
                            </div>
                        </div>
                    )}

                    {/* Context: Security Watermark */}
                    {activeNode === 'watermark' && (
                        <div className="prop-section">
                            <div className="prop-section-header">
                                <h4>Security Watermark</h4>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Enable Watermark</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={watermarkConfig.enabled}
                                        onChange={(e) => setWatermarkConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-form-group" style={{ marginTop: '1rem' }}>
                                <label>Watermark Text</label>
                                <input
                                    type="text"
                                    value={watermarkConfig.text}
                                    onChange={(e) => setWatermarkConfig(prev => ({ ...prev, text: e.target.value }))}
                                    className="prop-input"
                                    placeholder="e.g. OFFICIAL / CONFIDENTIAL"
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Opacity: {Math.round(watermarkConfig.opacity * 100)}%</label>
                                <input
                                    type="range"
                                    min="0.03"
                                    max="0.4"
                                    step="0.01"
                                    value={watermarkConfig.opacity}
                                    onChange={(e) => setWatermarkConfig(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Rotation Angle: {watermarkConfig.rotation}°</label>
                                <input
                                    type="range"
                                    min="-60"
                                    max="60"
                                    step="5"
                                    value={watermarkConfig.rotation}
                                    onChange={(e) => setWatermarkConfig(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Font Size: {watermarkConfig.font_size}pt</label>
                                <input
                                    type="range"
                                    min="30"
                                    max="90"
                                    step="5"
                                    value={watermarkConfig.font_size}
                                    onChange={(e) => setWatermarkConfig(prev => ({ ...prev, font_size: parseInt(e.target.value) }))}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Context: Table & Data Styling */}
                    {activeNode === 'table' && (
                        <div className="prop-section">
                            <div className="prop-section-header">
                                <h4>Table & Line Items</h4>
                            </div>

                            <div className="prop-form-group">
                                <label>Table Header Fill</label>
                                <div className="prop-color-picker-row">
                                    <input
                                        type="color"
                                        value={tableConfig.header_background || primaryColor}
                                        onChange={(e) => setTableConfig(prev => ({ ...prev, header_background: e.target.value }))}
                                        className="prop-color-input"
                                    />
                                    <input
                                        type="text"
                                        value={tableConfig.header_background || primaryColor}
                                        onChange={(e) => setTableConfig(prev => ({ ...prev, header_background: e.target.value }))}
                                        className="prop-input"
                                    />
                                </div>
                            </div>

                            <div className="prop-form-group">
                                <label>Header Text Color</label>
                                <div className="prop-color-picker-row">
                                    <input
                                        type="color"
                                        value={tableConfig.header_text_color || '#ffffff'}
                                        onChange={(e) => setTableConfig(prev => ({ ...prev, header_text_color: e.target.value }))}
                                        className="prop-color-input"
                                    />
                                    <input
                                        type="text"
                                        value={tableConfig.header_text_color || '#ffffff'}
                                        onChange={(e) => setTableConfig(prev => ({ ...prev, header_text_color: e.target.value }))}
                                        className="prop-input"
                                    />
                                </div>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Outer Borders</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={tableConfig.show_borders}
                                        onChange={(e) => setTableConfig(prev => ({ ...prev, show_borders: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Compact Row Padding</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={tableConfig.compact_padding}
                                        onChange={(e) => setTableConfig(prev => ({ ...prev, compact_padding: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Context: Footer & Statutory */}
                    {activeNode === 'footer' && (
                        <div className="prop-section">
                            <div className="prop-section-header">
                                <h4>Footer & Statutory</h4>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Show Footer</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={footerConfig.show_footer}
                                        onChange={(e) => setFooterConfig(prev => ({ ...prev, show_footer: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Page Number (Page X of Y)</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={footerConfig.show_page_numbers}
                                        onChange={(e) => setFooterConfig(prev => ({ ...prev, show_page_numbers: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-toggle-row">
                                <span className="prop-toggle-label">Include Corporate Tax PIN</span>
                                <label className="studio-switch">
                                    <input
                                        type="checkbox"
                                        checked={footerConfig.show_tax_pin}
                                        onChange={(e) => setFooterConfig(prev => ({ ...prev, show_tax_pin: e.target.checked }))}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            <div className="prop-form-group" style={{ marginTop: '1rem' }}>
                                <label>Custom Footer Note</label>
                                <textarea
                                    value={footerConfig.custom_notes}
                                    onChange={(e) => setFooterConfig(prev => ({ ...prev, custom_notes: e.target.value }))}
                                    rows={3}
                                    className="prop-input"
                                    placeholder="Leave empty to inherit standard branding note"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisualDocumentEditor;

