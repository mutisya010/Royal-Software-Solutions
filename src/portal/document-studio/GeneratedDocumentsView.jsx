import React, { useState, useEffect } from 'react';
import {
    FileCheck,
    Download,
    Search,
    Filter,
    Shield,
    Clock,
    User,
    ExternalLink,
    FileText,
    RefreshCw
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const GeneratedDocumentsView = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [docTypeFilter, setDocTypeFilter] = useState('all');
    const [searchRef, setSearchRef] = useState('');

    useEffect(() => {
        fetchGeneratedDocs();
    }, [docTypeFilter]);

    const fetchGeneratedDocs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (docTypeFilter !== 'all') params.document_type = docTypeFilter;
            const data = await apiClient.documents.getGeneratedDocuments(params);
            setDocuments(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to fetch generated docs:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocs = documents.filter(doc => {
        if (!searchRef.trim()) return true;
        const ref = (doc.reference_number || '').toLowerCase();
        const title = (doc.title || '').toLowerCase();
        const term = searchRef.toLowerCase();
        return ref.includes(term) || title.includes(term);
    });

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div>
            <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                        Generated Document Audit Trail & Archive
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                        Authoritative history of all customer-facing PDFs compiled with cryptographic SHA-256 integrity checksums.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search reference #..."
                            value={searchRef}
                            onChange={(e) => setSearchRef(e.target.value)}
                            className="prop-input"
                            style={{ paddingLeft: '32px', width: '220px' }}
                        />
                    </div>

                    <select
                        value={docTypeFilter}
                        onChange={(e) => setDocTypeFilter(e.target.value)}
                        className="prop-input"
                        style={{ width: '150px' }}
                    >
                        <option value="all">All Types</option>
                        <option value="invoice">Tax Invoices</option>
                        <option value="quotation">Quotations</option>
                    </select>

                    <button onClick={fetchGeneratedDocs} className="btn-secondary-outline" style={{ padding: '0.5rem' }}>
                        <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
                    <RefreshCw size={32} className="spin-icon" style={{ marginBottom: '0.75rem', color: '#0f766e' }} />
                    <p>Loading document audit records...</p>
                </div>
            ) : filteredDocs.length === 0 ? (
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    border: '1px dashed #cbd5e1',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                }}>
                    <FileCheck size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem auto' }} />
                    <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.5rem' }}>No Documents Recorded</h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
                        When you generate invoices or quotations through the management modules, immutable audit records will appear here.
                    </p>
                </div>
            ) : (
                <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                                <th style={{ padding: '0.85rem 1.25rem' }}>Document</th>
                                <th style={{ padding: '0.85rem 1.25rem' }}>Reference</th>
                                <th style={{ padding: '0.85rem 1.25rem' }}>Type</th>
                                <th style={{ padding: '0.85rem 1.25rem' }}>Generated At</th>
                                <th style={{ padding: '0.85rem 1.25rem' }}>SHA-256 Checksum</th>
                                <th style={{ padding: '0.85rem 1.25rem' }}>Size</th>
                                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocs.map((doc, idx) => (
                                <tr
                                    key={doc.id || idx}
                                    style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                >
                                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0f172a' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={16} style={{ color: '#0f766e' }} />
                                            {doc.title || `Document #${doc.id}`}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem', color: '#334155', fontFamily: 'monospace' }}>
                                        {doc.reference_number || 'N/A'}
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '0.2rem 0.55rem',
                                            borderRadius: 6,
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            textTransform: 'capitalize'
                                        }}>
                                            {doc.document_type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                                        {new Date(doc.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <span
                                            title={doc.checksum}
                                            style={{
                                                fontSize: '0.75rem',
                                                fontFamily: 'monospace',
                                                color: '#64748b',
                                                background: '#f8fafc',
                                                padding: '0.2rem 0.4rem',
                                                borderRadius: 4,
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(doc.checksum);
                                                alert('SHA-256 checksum copied to clipboard');
                                            }}
                                        >
                                            {doc.checksum ? `${doc.checksum.substring(0, 12)}...` : 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                                        {formatBytes(doc.file_size)}
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                                        {doc.file ? (
                                            <a
                                                href={doc.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-secondary-outline"
                                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', textDecoration: 'none' }}
                                            >
                                                <Download size={14} />
                                                Download PDF
                                            </a>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GeneratedDocumentsView;

