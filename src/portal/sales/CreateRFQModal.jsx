import React, { useState } from 'react';
import { X, FileCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const CreateRFQModal = ({ isOpen, onClose, onCreated, clients = [] }) => {
    const [clientId, setClientId] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [timeline, setTimeline] = useState('');
    const [budget, setBudget] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clientId) {
            setError('Please select an authorized client.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const payload = {
                client: clientId,
                subject,
                description,
                preferred_timeline: timeline || null,
                estimated_budget: budget ? Number(budget).toFixed(2) : null,
                status: 'PENDING'
            };

            const newRfq = await apiClient.royalsoftwares.quotationRequests.create(payload);
            if (onCreated) onCreated(newRfq);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to capture Quotation Request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="doc-modal-overlay" onClick={onClose}>
            <div className="doc-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
                <div className="doc-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: '#f0fdfa',
                            color: '#0f766e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FileCheck size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Capture Request for Quotation (RFQ)</h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Log prospective customer scope to convert into an official quotation</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {error && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: '#fef2f2',
                                color: '#b91c1c',
                                borderRadius: 8,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="prop-form-group">
                            <label>Prospective Client / Enterprise *</label>
                            <select
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="prop-input"
                                required
                            >
                                <option value="">-- Choose Authorized Client --</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.company_name ? `(${c.company_name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="prop-form-group">
                            <label>Request Subject / Project Title *</label>
                            <input
                                type="text"
                                placeholder="e.g. Enterprise HR & Payroll Integration Suite"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="prop-input"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                            <div className="prop-form-group">
                                <label>Target Timeline</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 6-8 Weeks / Q4 2026"
                                    value={timeline}
                                    onChange={(e) => setTimeline(e.target.value)}
                                    className="prop-input"
                                />
                            </div>

                            <div className="prop-form-group">
                                <label>Estimated Budget (KES)</label>
                                <input
                                    type="number"
                                    placeholder="Optional budget benchmark"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    className="prop-input"
                                />
                            </div>
                        </div>

                        <div className="prop-form-group">
                            <label>Scope Requirements & Technical Description *</label>
                            <textarea
                                rows={4}
                                placeholder="Detail functional modules, user volume, deliverables, and SLAs required..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="prop-input"
                                style={{ resize: 'vertical' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="doc-modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary-outline">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="btn-primary-teal">
                            {submitting ? 'Registering...' : 'Register RFQ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRFQModal;

