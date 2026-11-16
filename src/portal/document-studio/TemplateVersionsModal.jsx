import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, CheckCircle2, Clock, User, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const TemplateVersionsModal = ({ template, isOpen, onClose, onRollbackSuccess }) => {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rollingBack, setRollingBack] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && template) {
            fetchVersions();
        }
    }, [isOpen, template]);

    const fetchVersions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiClient.documents.getVersions(template.id);
            setVersions(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch version history');
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = async (versionNumber) => {
        if (!window.confirm(`Are you sure you want to rollback to Version ${versionNumber}? Your current draft will be overwritten with this snapshot.`)) {
            return;
        }

        try {
            setRollingBack(true);
            const response = await apiClient.documents.rollbackVersion(template.id, versionNumber);
            if (onRollbackSuccess) {
                onRollbackSuccess(response.template);
            }
            onClose();
        } catch (err) {
            alert(`Rollback failed: ${err.message}`);
        } finally {
            setRollingBack(false);
        }
    };

    if (!isOpen || !template) return null;

    return (
        <div className="doc-modal-overlay" onClick={onClose}>
            <div className="doc-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="doc-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: '#f0fdfa',
                            color: '#0f766e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <History size={18} />
                        </div>
                        <div>
                            <h3>Version History: {template.name}</h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                Immutable snapshot timeline & one-click rollback
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="doc-modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
                            <Clock size={24} className="spin-icon" style={{ marginBottom: '0.5rem' }} />
                            <p>Loading immutable snapshots...</p>
                        </div>
                    ) : error ? (
                        <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 8 }}>
                            {error}
                        </div>
                    ) : versions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
                            <ShieldCheck size={36} style={{ color: '#0f766e', marginBottom: '0.75rem' }} />
                            <h4>No Published Versions Yet</h4>
                            <p style={{ fontSize: '0.85rem' }}>
                                Versions are automatically snapshot each time you click <strong>Publish</strong>.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {versions.map((ver) => (
                                <div
                                    key={ver.id}
                                    style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 10,
                                        padding: '1rem 1.25rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: '#ffffff'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                color: '#0f766e',
                                                background: '#f0fdfa',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: 6
                                            }}>
                                                v{ver.version_number}.0
                                            </span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                                {ver.published_notes || 'Official Production Release'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.78rem', color: '#64748b' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <Clock size={13} />
                                                {new Date(ver.published_at).toLocaleString()}
                                            </span>
                                            {ver.published_by_username && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <User size={13} />
                                                    {ver.published_by_username}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRollback(ver.version_number)}
                                        disabled={rollingBack}
                                        className="btn-secondary-outline"
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                    >
                                        <RotateCcw size={14} />
                                        Rollback to this
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="doc-modal-footer">
                    <button onClick={onClose} className="btn-secondary-outline">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateVersionsModal;

