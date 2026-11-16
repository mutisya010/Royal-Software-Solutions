import React, { useState } from 'react';
import {
    Plus,
    Search,
    Edit3,
    Copy,
    CheckCircle,
    History,
    FileDown,
    Trash2,
    Layers,
    FileText,
    Star,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const CATEGORIES = [
    { id: 'all', label: 'All Templates' },
    { id: 'invoice', label: 'Invoices' },
    { id: 'quotation', label: 'Quotations' },
    { id: 'receipt', label: 'Receipts' },
    { id: 'certificate', label: 'Certificates' },
    { id: 'report', label: 'Reports' },
];

const TemplateListView = ({
    templates,
    loading,
    onSelectTemplate,
    onOpenVersions,
    onRefresh,
    onCreateNew
}) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const filteredTemplates = templates.filter(tmpl => {
        const matchesCategory = selectedCategory === 'all' || tmpl.category === selectedCategory;
        const matchesSearch = !searchTerm.trim() ||
            tmpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tmpl.description && tmpl.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const handlePublish = async (template) => {
        try {
            setActionLoadingId(template.id);
            await apiClient.documents.publishTemplate(template.id);
            onRefresh();
        } catch (err) {
            alert(`Publish failed: ${err.message}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDuplicate = async (template) => {
        try {
            setActionLoadingId(template.id);
            await apiClient.documents.duplicateTemplate(template.id);
            onRefresh();
        } catch (err) {
            alert(`Duplication failed: ${err.message}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDelete = async (template) => {
        if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) return;
        try {
            setActionLoadingId(template.id);
            await apiClient.documents.deleteTemplate(template.id);
            onRefresh();
        } catch (err) {
            alert(`Deletion failed: ${err.message}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handlePreviewPdf = async (template) => {
        try {
            setActionLoadingId(template.id);
            const blob = await apiClient.documents.previewPdf(template.id);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            alert(`PDF preview failed: ${err.message}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div>
            {/* Top Toolbar */}
            <div className="doc-templates-toolbar">
                <div className="doc-category-pills">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`doc-pill ${selectedCategory === cat.id ? 'pill-active' : ''}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="prop-input"
                            style={{ paddingLeft: '32px', width: '220px' }}
                        />
                    </div>

                    <button onClick={onCreateNew} className="btn-primary-teal">
                        <Plus size={16} />
                        New Template
                    </button>
                </div>
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
                    <Layers size={32} className="spin-icon" style={{ marginBottom: '0.75rem', color: '#0f766e' }} />
                    <p>Loading document templates...</p>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    border: '1px dashed #cbd5e1',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                }}>
                    <Layers size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem auto' }} />
                    <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.5rem' }}>No Templates Found</h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                        {searchTerm ? 'No templates match your search criteria.' : 'Create your first branded template for invoices, quotations, or agreements.'}
                    </p>
                    <button onClick={onCreateNew} className="btn-primary-teal">
                        <Plus size={16} />
                        Create New Template
                    </button>
                </div>
            ) : (
                <div className="doc-templates-grid">
                    {filteredTemplates.map(template => {
                        const isPublished = template.status === 'published';
                        const isLoading = actionLoadingId === template.id;

                        return (
                            <div
                                key={template.id}
                                className={`doc-template-card ${template.is_default ? 'is-default-card' : ''}`}
                            >
                                <div>
                                    <div className="template-card-header">
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h3 className="template-title">{template.name}</h3>
                                                {template.is_default && (
                                                    <span title="Default template for this category" style={{ color: '#0d9488' }}>
                                                        <Star size={14} fill="#0d9488" />
                                                    </span>
                                                )}
                                            </div>
                                            <span className="template-category-tag">{template.category}</span>
                                        </div>
                                        <span className={`template-status-badge ${isPublished ? 'badge-published' : 'badge-draft'}`}>
                                            {template.status}
                                        </span>
                                    </div>

                                    <p className="template-desc">
                                        {template.description || 'Enterprise document template configured for automated business generation.'}
                                    </p>
                                </div>

                                <div>
                                    <div className="template-meta-row">
                                        <span>v{template.version_number || 1}.0</span>
                                        <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                                    </div>

                                    <div className="template-actions">
                                        <button
                                            onClick={() => onSelectTemplate(template)}
                                            className="btn-primary-teal"
                                            style={{ flex: 1, justifyContent: 'center' }}
                                            disabled={isLoading}
                                        >
                                            <Edit3 size={14} />
                                            Open Studio
                                        </button>

                                        <button
                                            onClick={() => handlePreviewPdf(template)}
                                            title="Download Test PDF"
                                            className="btn-secondary-outline"
                                            style={{ padding: '0.5rem 0.65rem' }}
                                            disabled={isLoading}
                                        >
                                            <FileDown size={14} />
                                        </button>

                                        <button
                                            onClick={() => handleDuplicate(template)}
                                            title="Duplicate Template"
                                            className="btn-secondary-outline"
                                            style={{ padding: '0.5rem 0.65rem' }}
                                            disabled={isLoading}
                                        >
                                            <Copy size={14} />
                                        </button>

                                        <button
                                            onClick={() => onOpenVersions(template)}
                                            title="Version History & Rollback"
                                            className="btn-secondary-outline"
                                            style={{ padding: '0.5rem 0.65rem' }}
                                            disabled={isLoading}
                                        >
                                            <History size={14} />
                                        </button>

                                        {!isPublished && (
                                            <button
                                                onClick={() => handlePublish(template)}
                                                title="Publish Snapshot"
                                                className="btn-secondary-outline"
                                                style={{ padding: '0.5rem 0.65rem', color: '#15803d' }}
                                                disabled={isLoading}
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(template)}
                                            title="Delete Template"
                                            className="btn-secondary-outline"
                                            style={{ padding: '0.5rem 0.65rem', color: '#ef4444' }}
                                            disabled={isLoading}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TemplateListView;

