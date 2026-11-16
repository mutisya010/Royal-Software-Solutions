import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    Mail,
    Phone,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Clock,
    Search,
    Send,
    Filter,
    X,
    FileText
} from 'lucide-react';
import ListPageHeader from '../shared/ListPageHeader';
import StatSummaryRibbon from '../shared/StatSummaryRibbon';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';
import { apiClient } from '../../services/apiClient';
import '../shared/portalShared.css';

const CommunicationHistoryPage = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [channelFilter, setChannelFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        loadCommunications();
    }, []);

    const loadCommunications = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get('/api/v1/clients_management/communications/');
            setLogs(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to load communication logs:', err);
        } finally {
            setLoading(false);
        }
    };

    // Ribbon Metrics (Reference Image 4)
    const ribbonStats = useMemo(() => {
        const total = logs.length;
        const emails = logs.filter(l => l.channel === 'EMAIL').length;
        const whatsapps = logs.filter(l => l.channel === 'WHATSAPP').length;
        const delivered = logs.filter(l => l.status === 'SENT' || l.status === 'DELIVERED').length;

        return [
            { label: 'Total Dispatches', value: total },
            { label: 'Emails Sent', value: emails, trend: `${Math.round((emails / (total || 1)) * 100)}% Email` },
            { label: 'WhatsApp Dispatched', value: whatsapps, trend: `${Math.round((whatsapps / (total || 1)) * 100)}% WhatsApp` },
            { label: 'Verified Deliveries', value: delivered, trendType: 'positive' }
        ];
    }, [logs]);

    // Pill filters
    const filterPills = useMemo(() => {
        return [
            { id: 'ALL', label: 'All Channels', count: logs.length },
            { id: 'EMAIL', label: 'Email', count: logs.filter(l => l.channel === 'EMAIL').length },
            { id: 'WHATSAPP', label: 'WhatsApp', count: logs.filter(l => l.channel === 'WHATSAPP').length },
            { id: 'SMS', label: 'SMS', count: logs.filter(l => l.channel === 'SMS').length }
        ];
    }, [logs]);

    // Filtered Logs
    const filteredLogs = useMemo(() => {
        return logs.filter(l => {
            const matchesChannel = channelFilter === 'ALL' || l.channel === channelFilter;
            const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (l.client_name || '').toLowerCase().includes(q) ||
                (l.subject || '').toLowerCase().includes(q) ||
                (l.message || '').toLowerCase().includes(q) ||
                (l.sender_name || '').toLowerCase().includes(q);

            return matchesChannel && matchesStatus && matchesSearch;
        });
    }, [logs, channelFilter, statusFilter, searchQuery]);

    const getChannelIcon = (channel) => {
        switch (channel) {
            case 'EMAIL': return <Mail size={16} color="#2563eb" />;
            case 'WHATSAPP': return <MessageSquare size={16} color="#16a34a" />;
            default: return <Phone size={16} color="#d97706" />;
        }
    };

    return (
        <div className="portal-page-container animations-fade-in">
            {/* 1. Header */}
            <ListPageHeader
                title="Customer Communication History"
                subtitle="Complete verified audit trail of all outbound quotation proposals, email dispatches, and WhatsApp messages"
                primaryAction={{
                    label: loading ? 'Refreshing...' : 'Refresh Logs',
                    icon: RefreshCw,
                    onClick: loadCommunications
                }}
                secondaryActions={[
                    {
                        label: 'Resend Gateway Settings',
                        icon: Mail,
                        onClick: () => navigate('/portal/admin/settings?view=email')
                    }
                ]}
            />

            {/* 2. Stat Summary Ribbon (Reference Image 4) */}
            <StatSummaryRibbon items={ribbonStats} />

            {/* 3. Search and Channel Filter Bar */}
            <ListFilterBar
                searchPlaceholder="Search dispatches by client name, subject, or message content..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filterPills={filterPills}
                activeFilter={channelFilter}
                onFilterChange={setChannelFilter}
                extraControls={
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="prop-input"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="SENT">Sent</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="FAILED">Failed</option>
                    </select>
                }
            />

            {/* 4. Communication Cards Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                        Loading verified communication logs...
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="clean-table-card">
                        <div className="list-empty-state">
                            <div className="list-empty-icon">
                                <MessageSquare size={28} />
                            </div>
                            <h4>No Communication Logs Recorded</h4>
                            <p>No customer messages or quotation dispatches matched your filter.</p>
                        </div>
                    </div>
                ) : (
                    filteredLogs.map(log => {
                        return (
                            <div
                                key={log.id}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 14,
                                    padding: '1.25rem',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start',
                                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
                                }}
                            >
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getChannelIcon(log.channel)}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                                {log.subject || `${log.channel} dispatch to ${log.client_name}`}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                                                {log.channel}
                                            </span>
                                        </div>

                                        <StatusPillBadge status={log.status} />
                                    </div>

                                    <p style={{ margin: '0.5rem 0', fontSize: '0.86rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                                        {log.message}
                                    </p>

                                    {log.error_details && (
                                        <div style={{
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            color: '#b91c1c',
                                            borderRadius: 6,
                                            padding: '0.4rem 0.65rem',
                                            fontSize: '0.78rem',
                                            marginBottom: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem'
                                        }}>
                                            <AlertCircle size={13} />
                                            <span>Diagnostic: {log.error_details}</span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#94a3b8', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <span>Recipient: <strong>{log.client_name}</strong> • Dispatched by {log.sender_name || 'Commercial Team'}</span>
                                        <span>{log.created_on ? new Date(log.created_on).toLocaleString() : ''}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CommunicationHistoryPage;

