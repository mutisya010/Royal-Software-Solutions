import React, { useState, useEffect, useMemo } from 'react';
import {
    Video, Plus, Calendar, Clock, CheckCircle, ExternalLink,
    FileText, User, X, CheckSquare, Sparkles, AlertCircle,
    Download, Copy, Check, Users, Shield, Link2
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import StatusPillBadge from '../shared/StatusPillBadge';
import {
    getGoogleCalendarUrl,
    openGoogleCalendar,
    downloadIcsFile
} from './calendarIntegration';

const MeetingsView = ({ projects = [] }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'EXECUTIVE' | 'UPCOMING'
    const [copiedLink, setCopiedLink] = useState(false);

    // Users directory for participant selection & assignment
    const [users, setUsers] = useState([]);

    // Create Meeting Form State
    const [title, setTitle] = useState('');
    const [agenda, setAgenda] = useState('');
    const [objectives, setObjectives] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [projectId, setProjectId] = useState('');
    const [isExecutive, setIsExecutive] = useState(false);
    const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
    const [saving, setSaving] = useState(false);

    // Minute note taker
    const [noteText, setNoteText] = useState('');
    const [actionItemInput, setActionItemInput] = useState('');

    // Action item conversion modal
    const [convertingItem, setConvertingItem] = useState(null);
    const [convertAssignee, setConvertAssignee] = useState('');
    const [convertDueDate, setConvertDueDate] = useState('');

    useEffect(() => {
        loadMeetings();
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const list = await apiClient.users.directory();
            setUsers(list || []);
        } catch (err) {
            try {
                const fallback = await apiClient.users.list();
                setUsers(fallback || []);
            } catch (e) {
                console.warn('Could not load user directory for meetings:', e);
            }
        }
    };

    const loadMeetings = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.meetings.list();
            setMeetings(data);
            if (data.length > 0) {
                setSelectedMeeting(prev => {
                    if (!prev) return data[0];
                    const found = data.find(m => m.id === prev.id);
                    return found || data[0];
                });
            }
        } catch (err) {
            console.error('Failed to load meetings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        if (!title.trim() || !startTime || !endTime) return;
        try {
            setSaving(true);
            let finalTitle = title.trim();
            if (isExecutive && !finalTitle.toLowerCase().includes('[executive]')) {
                finalTitle = `[Executive] ${finalTitle}`;
            }

            const payload = {
                title: finalTitle,
                agenda,
                objectives,
                meeting_link: meetingLink,
                start_time: startTime,
                end_time: endTime,
                related_project: projectId || null,
                status: 'SCHEDULED',
                participant_ids: selectedParticipantIds
            };

            const created = await apiClient.planner.meetings.create(payload);
            setIsCreateModalOpen(false);
            setTitle('');
            setAgenda('');
            setObjectives('');
            setMeetingLink('');
            setIsExecutive(false);
            setSelectedParticipantIds([]);
            await loadMeetings();
            setSelectedMeeting(created);
        } catch (err) {
            console.error('Failed to create meeting:', err);
            alert('Failed to schedule meeting: ' + (err.message || 'Please check input fields.'));
        } finally {
            setSaving(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim() || !selectedMeeting) return;
        try {
            await apiClient.planner.meetings.addNote(selectedMeeting.id, {
                notes: noteText,
                action_items: actionItemInput ? [actionItemInput] : []
            });
            setNoteText('');
            setActionItemInput('');
            loadMeetings();
        } catch (err) {
            console.error('Failed to save meeting note:', err);
        }
    };

    const handleOpenConvertActionItem = (actionText) => {
        setConvertingItem(actionText);
        setConvertAssignee(selectedMeeting?.organizer?.id || '');
        const twoDaysLater = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
        setConvertDueDate(twoDaysLater);
    };

    const handleConfirmConvert = async () => {
        if (!selectedMeeting || !convertingItem) return;
        try {
            await apiClient.planner.meetings.convertActionItem(selectedMeeting.id, {
                title: convertingItem,
                assigned_to: convertAssignee ? parseInt(convertAssignee) : null,
                due_date: convertDueDate || null
            });
            alert(`Task assigned and created successfully for "${convertingItem}"!`);
            setConvertingItem(null);
        } catch (err) {
            console.error('Failed to convert action item:', err);
            alert('Failed to convert action item to task.');
        }
    };

    const handleCopyCalendarLink = (meeting) => {
        const url = getGoogleCalendarUrl(meeting);
        if (navigator.clipboard && url) {
            navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    const filteredMeetings = useMemo(() => {
        if (activeTab === 'EXECUTIVE') {
            return meetings.filter(m =>
                m.is_executive ||
                (m.title && (m.title.toLowerCase().includes('[exec') || m.title.toLowerCase().includes('executive') || m.title.toLowerCase().includes('board') || m.title.toLowerCase().includes('leadership')))
            );
        }
        if (activeTab === 'UPCOMING') {
            const now = new Date();
            return meetings.filter(m => new Date(m.end_time || m.start_time) >= now);
        }
        return meetings;
    }, [meetings, activeTab]);

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Executive Syncs & Meeting Planner"
                subtitle="Slot executive meetings into Google Calendar, manage agendas, capture live minutes, and delegate staff tasks"
                primaryAction={{
                    label: 'Schedule Meeting',
                    icon: Plus,
                    onClick: () => {
                        const now = new Date();
                        const plusOne = new Date(Date.now() + 3600000);
                        setStartTime(now.toISOString().slice(0, 16));
                        setEndTime(plusOne.toISOString().slice(0, 16));
                        setIsExecutive(false);
                        setSelectedParticipantIds([]);
                        setIsCreateModalOpen(true);
                    }
                }}
            />

            {/* View / Scope Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: activeTab === 'ALL' ? '#005f73' : '#f1f5f9',
                        color: activeTab === 'ALL' ? '#ffffff' : '#475569',
                        transition: 'all 0.15s ease'
                    }}
                >
                    All Meetings ({meetings.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('EXECUTIVE')}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: activeTab === 'EXECUTIVE' ? '#ca6702' : '#fef3c7',
                        color: activeTab === 'EXECUTIVE' ? '#ffffff' : '#92400e',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Shield size={14} /> Executive Syncs ({meetings.filter(m => m.is_executive || (m.title || '').toLowerCase().includes('exec')).length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('UPCOMING')}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: activeTab === 'UPCOMING' ? '#0a9396' : '#f1f5f9',
                        color: activeTab === 'UPCOMING' ? '#ffffff' : '#475569',
                        transition: 'all 0.15s ease'
                    }}
                >
                    Upcoming
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Loading meetings & calendar schedules...
                </div>
            ) : filteredMeetings.length === 0 ? (
                <div className="portal-content-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <Video size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: 0, color: '#1e293b' }}>
                        {activeTab === 'EXECUTIVE' ? 'No Executive Syncs Found' : 'No Scheduled Meetings'}
                    </h3>
                    <p style={{ margin: '6px 0 16px' }}>
                        {activeTab === 'EXECUTIVE' ? 'Schedule an executive strategy session and slot it into Google Calendar.' : 'Schedule client reviews, daily standups, or one-on-one sessions.'}
                    </p>
                    <button
                        onClick={() => {
                            if (activeTab === 'EXECUTIVE') setIsExecutive(true);
                            setIsCreateModalOpen(true);
                        }}
                        className="btn-planner-quick primary"
                        style={{ margin: '0 auto' }}
                    >
                        <Plus size={15} /> Schedule Sync
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
                    {/* Left: Meeting Directory */}
                    <div className="portal-content-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '720px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#475569' }}>
                                Meetings ({filteredMeetings.length})
                            </h4>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Click to view details & Google Calendar</span>
                        </div>

                        {filteredMeetings.map(m => {
                            const isSelected = selectedMeeting?.id === m.id;
                            const isExec = m.is_executive || (m.title && (m.title.toLowerCase().includes('[exec') || m.title.toLowerCase().includes('executive')));
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMeeting(m)}
                                    style={{
                                        padding: '14px',
                                        borderRadius: '10px',
                                        border: `1px solid ${isSelected ? '#005f73' : '#e2e8f0'}`,
                                        background: isSelected ? '#f0fdfa' : '#ffffff',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {isExec && (
                                                    <span style={{ fontSize: '10px', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px' }}>
                                                        EXEC
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                                                    {m.title}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '10px' }}>
                                                <span>📅 {new Date(m.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                <span>⏰ {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                            <StatusPillBadge status={m.status} />
                                            {/* Quick 1-click Google Calendar button */}
                                            <button
                                                type="button"
                                                title="Slot in Google Calendar"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openGoogleCalendar(m);
                                                }}
                                                style={{
                                                    background: '#ffffff',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '6px',
                                                    padding: '3px 8px',
                                                    fontSize: '11px',
                                                    color: '#1a73e8',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <Calendar size={12} color="#1a73e8" /> G-Cal
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Selected Meeting Details & Minute Taking */}
                    {selectedMeeting && (
                        <div className="portal-content-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Meeting Header */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            {(selectedMeeting.is_executive || (selectedMeeting.title || '').toLowerCase().includes('exec')) && (
                                                <span style={{ fontSize: '11px', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <Shield size={12} /> Executive Meeting
                                                </span>
                                            )}
                                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                                                {selectedMeeting.title}
                                            </h2>
                                            <StatusPillBadge status={selectedMeeting.status} />
                                        </div>
                                        <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} color="#64748b" />
                                            <span>
                                                {new Date(selectedMeeting.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}: {new Date(selectedMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedMeeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedMeeting.meeting_link && (
                                        <a
                                            href={selectedMeeting.meeting_link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn-planner-quick primary"
                                            style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
                                        >
                                            <Video size={14} /> Join Call <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>

                                {/* Calendar Integration Action Bar */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flexWrap: 'wrap',
                                    marginTop: '16px',
                                    padding: '12px 14px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginRight: '4px' }}>
                                        Calendar Slotting:
                                    </span>

                                    {/* Google Calendar 1-Click Button */}
                                    <button
                                        type="button"
                                        onClick={() => openGoogleCalendar(selectedMeeting)}
                                        style={{
                                            background: '#1a73e8',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '7px 12px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                                        }}
                                    >
                                        <Calendar size={14} /> Add to Google Calendar
                                    </button>

                                    {/* Download .ics */}
                                    <button
                                        type="button"
                                        onClick={() => downloadIcsFile(selectedMeeting)}
                                        style={{
                                            background: '#ffffff',
                                            color: '#334155',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            padding: '7px 12px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Download size={14} /> Export .ics (Outlook/Apple)
                                    </button>

                                    {/* Copy Direct Link */}
                                    <button
                                        type="button"
                                        onClick={() => handleCopyCalendarLink(selectedMeeting)}
                                        style={{
                                            background: '#ffffff',
                                            color: '#334155',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            padding: '7px 12px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                        {copiedLink ? 'Link Copied!' : 'Copy G-Cal Link'}
                                    </button>
                                </div>
                            </div>

                            {/* Agenda & Objectives */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                    Meeting Agenda:
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
                                    {selectedMeeting.agenda || 'No formal agenda provided.'}
                                </p>

                                {selectedMeeting.objectives && (
                                    <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                            Key Objectives & Expected Outcomes:
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
                                            {selectedMeeting.objectives}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Participants List */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Users size={16} color="#005f73" /> Invited Participants ({selectedMeeting.participants?.length || 0})
                                </h4>
                                {(!selectedMeeting.participants || selectedMeeting.participants.length === 0) ? (
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                                        No explicit staff members invited. Meeting is open to company leadership.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedMeeting.participants.map(p => (
                                            <div
                                                key={p.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    background: '#f1f5f9',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                <div style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '50%',
                                                    background: '#005f73',
                                                    color: '#ffffff',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {(p.user_details?.full_name || 'U').slice(0, 2).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                                    {p.user_details?.full_name || 'Staff Member'}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                    ({p.user_details?.designation || p.role})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Meeting Minutes & Notes */}
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={16} color="#005f73" /> Meeting Minutes & Action Items
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                                    {selectedMeeting.notes?.length === 0 ? (
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>No minutes recorded for this sync yet.</p>
                                    ) : (
                                        selectedMeeting.notes?.map(n => (
                                            <div key={n.id} style={{ padding: '12px 14px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#005f73', marginBottom: '4px' }}>
                                                    {n.author_details?.full_name || 'Note Author'}
                                                </div>
                                                <div style={{ fontSize: '0.88rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{n.notes}</div>

                                                {/* Action items */}
                                                {n.action_items?.length > 0 && (
                                                    <div style={{ marginTop: '10px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Action Items:</span>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                                            {n.action_items.map((ai, idx) => (
                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#1e293b', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                                                    <span>• {ai}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenConvertActionItem(ai)}
                                                                        className="btn-planner-quick"
                                                                        style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}
                                                                    >
                                                                        Delegate Task
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Minute Form */}
                                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        rows={3}
                                        placeholder="Record key discussions, decisions, and outcomes..."
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            value={actionItemInput}
                                            onChange={(e) => setActionItemInput(e.target.value)}
                                            placeholder="Action Item (e.g. Finance team to audit supplier invoices)..."
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                        <button type="submit" className="btn-planner-quick primary">
                                            Save Notes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Schedule Meeting Modal */}
            {isCreateModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                {isExecutive ? 'Schedule Executive Leadership Sync' : 'Schedule Business Sync'}
                            </span>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateMeeting}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Meeting Subject <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Q4 Executive Strategy & Financial Review"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef3c7', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                    <input
                                        type="checkbox"
                                        id="execMeetingToggle"
                                        checked={isExecutive}
                                        onChange={(e) => setIsExecutive(e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="execMeetingToggle" style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
                                        Executive Meeting (High Priority Leadership Sync)
                                    </label>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Start Date & Time <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            End Date & Time <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                            Meeting URL or Google Meet Link
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setMeetingLink('https://meet.google.com/new')}
                                            style={{
                                                background: '#e0f2fe',
                                                border: '1px solid #bae6fd',
                                                color: '#0369a1',
                                                borderRadius: '4px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ⚡ Instant Google Meet
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="https://meet.google.com/..."
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>

                                {/* Participant Selection from Company Users */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Invite Staff Members / Executive Attendees
                                    </label>
                                    <div style={{
                                        maxHeight: '130px',
                                        overflowY: 'auto',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '6px',
                                        background: '#f8fafc'
                                    }}>
                                        {users.map(u => {
                                            const isChecked = selectedParticipantIds.includes(u.id);
                                            return (
                                                <label
                                                    key={u.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        padding: '4px 6px',
                                                        borderRadius: '4px',
                                                        background: isChecked ? '#e0f2fe' : 'transparent'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedParticipantIds([...selectedParticipantIds, u.id]);
                                                            } else {
                                                                setSelectedParticipantIds(selectedParticipantIds.filter(id => id !== u.id));
                                                            }
                                                        }}
                                                    />
                                                    <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? '#0369a1' : '#334155' }}>
                                                        {u.full_name}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Agenda Outline & Topics
                                    </label>
                                    <textarea
                                        value={agenda}
                                        onChange={(e) => setAgenda(e.target.value)}
                                        rows={2}
                                        placeholder="Topics for discussion, strategic decisions, financial approvals..."
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Key Objectives & Deliverables
                                    </label>
                                    <textarea
                                        value={objectives}
                                        onChange={(e) => setObjectives(e.target.value)}
                                        rows={2}
                                        placeholder="Target decisions, sign-offs, action plans to achieve..."
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-planner-quick primary">
                                    {saving ? 'Scheduling...' : 'Schedule & Enable Google Calendar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delegate Action Item Modal */}
            {convertingItem && (
                <div className="planner-modal-overlay" onClick={() => setConvertingItem(null)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                                Delegate Action Item to Staff
                            </span>
                            <button onClick={() => setConvertingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="planner-modal-body">
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                "{convertingItem}"
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Assignee (Staff Member)
                                </label>
                                <select
                                    value={convertAssignee}
                                    onChange={(e) => setConvertAssignee(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                >
                                    <option value="">Select Assignee...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.full_name} — {u.designation || u.role} ({u.department || 'Operations'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Task Due Date
                                </label>
                                <input
                                    type="date"
                                    value={convertDueDate}
                                    onChange={(e) => setConvertDueDate(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                            </div>
                        </div>

                        <div className="planner-modal-footer">
                            <button type="button" onClick={() => setConvertingItem(null)} className="btn-planner-quick">
                                Cancel
                            </button>
                            <button type="button" onClick={handleConfirmConvert} className="btn-planner-quick primary">
                                Create & Delegate Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingsView;
