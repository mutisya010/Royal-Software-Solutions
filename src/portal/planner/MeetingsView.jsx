import React, { useState, useEffect } from 'react';
import {
    Video, Plus, Calendar, Clock, CheckCircle, ExternalLink,
    FileText, User, X, CheckSquare, Sparkles, AlertCircle
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import StatusPillBadge from '../shared/StatusPillBadge';

const MeetingsView = ({ projects = [] }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [agenda, setAgenda] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [projectId, setProjectId] = useState('');
    const [saving, setSaving] = useState(false);

    // Minute note taker
    const [noteText, setNoteText] = useState('');
    const [actionItemInput, setActionItemInput] = useState('');

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.meetings.list();
            setMeetings(data);
            if (data.length > 0 && !selectedMeeting) {
                setSelectedMeeting(data[0]);
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
            const created = await apiClient.planner.meetings.create({
                title,
                agenda,
                meeting_link: meetingLink,
                start_time: startTime,
                end_time: endTime,
                related_project: projectId || null,
                status: 'SCHEDULED'
            });
            setIsCreateModalOpen(false);
            setTitle('');
            setAgenda('');
            setMeetingLink('');
            loadMeetings();
            setSelectedMeeting(created);
        } catch (err) {
            console.error('Failed to create meeting:', err);
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

    const handleConvertActionItem = async (actionText) => {
        if (!selectedMeeting) return;
        try {
            await apiClient.planner.meetings.convertActionItem(selectedMeeting.id, {
                title: actionText,
                due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
            });
            alert(`Converted "${actionText}" to an active Task!`);
        } catch (err) {
            console.error('Failed to convert action item:', err);
        }
    };

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Meetings & Executive Syncs"
                subtitle="Structured meeting agendas, virtual meeting rooms, minute-taking, and automatic task conversion"
                primaryAction={{
                    label: 'Schedule Meeting',
                    icon: Plus,
                    onClick: () => {
                        const now = new Date();
                        const plusOne = new Date(Date.now() + 3600000);
                        setStartTime(now.toISOString().slice(0, 16));
                        setEndTime(plusOne.toISOString().slice(0, 16));
                        setIsCreateModalOpen(true);
                    }
                }}
            />

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Loading meetings...
                </div>
            ) : meetings.length === 0 ? (
                <div className="portal-content-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <Video size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No Scheduled Meetings</h3>
                    <p style={{ margin: '6px 0 16px' }}>Schedule client reviews, daily standups, or one-on-one sessions.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-planner-quick primary" style={{ margin: '0 auto' }}>
                        <Plus size={15} /> Schedule Sync
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px' }}>
                    {/* Left: Meeting Directory */}
                    <div className="portal-content-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '700px', overflowY: 'auto' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 800, color: '#475569' }}>
                            All Meetings ({meetings.length})
                        </h4>
                        {meetings.map(m => {
                            const isSelected = selectedMeeting?.id === m.id;
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
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                                            {m.title}
                                        </span>
                                        <StatusPillBadge status={m.status} />
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '10px' }}>
                                        <span>📅 {new Date(m.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                        <span>⏰ {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Selected Meeting Details & Minute Taking */}
                    {selectedMeeting && (
                        <div className="portal-content-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                            {selectedMeeting.title}
                                        </h2>
                                        <StatusPillBadge status={selectedMeeting.status} />
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                                        Scheduled: {new Date(selectedMeeting.start_time).toLocaleString()} - {new Date(selectedMeeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {selectedMeeting.meeting_link && (
                                    <a
                                        href={selectedMeeting.meeting_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-planner-quick primary"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <Video size={15} /> Join Call <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>

                            {/* Agenda */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                    Meeting Agenda & Objectives:
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                                    {selectedMeeting.agenda || 'No formal agenda provided.'}
                                </p>
                            </div>

                            {/* Meeting Minutes & Notes */}
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={16} color="#005f73" /> Meeting Minutes & Recorded Action Items
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
                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#1e293b', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px' }}>
                                                                    <span>• {ai}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleConvertActionItem(ai)}
                                                                        className="btn-planner-quick"
                                                                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                                                                    >
                                                                        Convert to Task
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
                                            placeholder="Action Item (e.g. Timothy to update pricing matrix)..."
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
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                Schedule Dedicated Meeting
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
                                        placeholder="e.g. Weekly Operational Sprint Sync"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
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
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Meeting URL or Virtual Room
                                    </label>
                                    <input
                                        type="text"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="https://meet.google.com/..."
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Agenda Outline
                                    </label>
                                    <textarea
                                        value={agenda}
                                        onChange={(e) => setAgenda(e.target.value)}
                                        rows={3}
                                        placeholder="Objectives, questions to resolve, and planned presentations..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-planner-quick primary">
                                    {saving ? 'Scheduling...' : 'Confirm Meeting'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingsView;

