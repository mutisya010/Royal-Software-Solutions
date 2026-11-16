import React, { useState, useEffect } from 'react';
import {
    Sparkles, Plus, Calendar, Clock, CheckCircle2,
    CheckSquare, Coffee, Video, ChevronRight, Edit3
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import StatusPillBadge from '../shared/StatusPillBadge';

const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM'
];

const MyDayView = ({ onSelectTask }) => {
    const [tasks, setTasks] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [quickTaskTitle, setQuickTaskTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [dailyNote, setDailyNote] = useState('');

    useEffect(() => {
        loadMyDay();
    }, []);

    const loadMyDay = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const [taskList, meetingList] = await Promise.all([
                apiClient.planner.tasks.list({ view: 'my-tasks', due_date: today }),
                apiClient.planner.meetings.list()
            ]);
            setTasks(taskList);
            setMeetings(meetingList.filter(m => m.start_time?.startsWith(today)));
        } catch (err) {
            console.error('Failed to load My Day:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!quickTaskTitle.trim()) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const newTask = await apiClient.planner.tasks.create({
                title: quickTaskTitle,
                due_date: today,
                category: 'PERSONAL',
                priority: 'NORMAL',
                is_personal: true
            });
            setTasks([newTask, ...tasks]);
            setQuickTaskTitle('');
        } catch (err) {
            console.error('Failed to quick-add task:', err);
        }
    };

    const handleToggleTask = async (taskId) => {
        try {
            const updated = await apiClient.planner.tasks.toggleStatus(taskId);
            setTasks(tasks.map(t => t.id === taskId ? updated : t));
        } catch (err) {
            console.error('Failed to toggle task:', err);
        }
    };

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="My Day • Focus Workspace"
                subtitle={`Concentrated execution list for ${new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}`}
            />

            {/* Quick Add Bar */}
            <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="Add an actionable focus task for today and press Enter..."
                    style={{
                        flex: 1,
                        padding: '13px 18px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                />
                <button
                    type="submit"
                    className="btn-planner-quick primary"
                    style={{ padding: '0 24px', fontSize: '14px' }}
                >
                    <Plus size={16} /> Add to My Day
                </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                {/* 1. Tasks To Accomplish */}
                <div className="portal-content-card" style={{ padding: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckSquare size={18} color="#005f73" /> Today's Deliverables ({tasks.filter(t => t.status === 'COMPLETED').length}/{tasks.length})
                    </h3>

                    {tasks.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                            <Coffee size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>Your daily agenda is clear.</p>
                            <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Type above to queue up your high-priority items.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {tasks.map(t => (
                                <div
                                    key={t.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        background: t.status === 'COMPLETED' ? '#f8fafc' : '#ffffff',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        <input
                                            type="checkbox"
                                            checked={t.status === 'COMPLETED'}
                                            onChange={() => handleToggleTask(t.id)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div
                                            onClick={() => onSelectTask && onSelectTask(t)}
                                            style={{ cursor: 'pointer', flex: 1 }}
                                        >
                                            <div style={{
                                                fontSize: '0.92rem',
                                                fontWeight: 700,
                                                color: t.status === 'COMPLETED' ? '#94a3b8' : '#0f172a',
                                                textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none'
                                            }}>
                                                {t.title}
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                                                {t.reference_code} {t.project_name ? `• ${t.project_name}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusPillBadge status={t.priority} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Today's Hourly Schedule & Syncs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="portal-content-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} color="#0a9396" /> Hourly Schedule
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                            {timeSlots.map(time => (
                                <div key={time} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', width: '65px' }}>{time}</span>
                                    <div style={{ flex: 1, minHeight: '26px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                        Open focus block
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Today's Meetings */}
                    <div className="portal-content-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Video size={18} color="#2563eb" /> Meetings Today ({meetings.length})
                        </h3>
                        {meetings.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>No scheduled meetings today.</p>
                        ) : (
                            meetings.map(m => (
                                <div key={m.id} style={{ padding: '10px 12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e40af' }}>{m.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '3px' }}>
                                        {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyDayView;

