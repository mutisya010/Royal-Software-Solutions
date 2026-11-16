import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Plus, Clock, MapPin, Video, User, X, Check, Filter
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = ({ projects = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('ALL');

    // Create / Inspect Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventType, setEventType] = useState('MEETING');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [locationLink, setLocationLink] = useState('');
    const [visibility, setVisibility] = useState('TEAM');
    const [selectedProject, setSelectedProject] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEvents();
    }, [currentDate]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
            const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const data = await apiClient.planner.events.list({ start_date: firstDay, end_date: lastDay });
            setEvents(data);
        } catch (err) {
            console.error('Failed to load events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const openCreateModal = (dateStr) => {
        setSelectedEvent(null);
        setEventTitle('');
        setEventDescription('');
        setEventType('MEETING');
        const defaultStart = dateStr ? `${dateStr}T09:00` : new Date().toISOString().slice(0, 16);
        const defaultEnd = dateStr ? `${dateStr}T10:00` : new Date(Date.now() + 3600000).toISOString().slice(0, 16);
        setStartTime(defaultStart);
        setEndTime(defaultEnd);
        setLocationLink('');
        setVisibility('TEAM');
        setSelectedProject('');
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        if (!eventTitle.trim() || !startTime || !endTime) return;
        try {
            setSaving(true);
            const payload = {
                title: eventTitle,
                description: eventDescription,
                event_type: eventType,
                start_time: startTime,
                end_time: endTime,
                location_or_link: locationLink,
                visibility,
                related_project: selectedProject || null
            };
            if (selectedEvent) {
                await apiClient.planner.events.update(selectedEvent.id, payload);
            } else {
                await apiClient.planner.events.create(payload);
            }
            setIsModalOpen(false);
            loadEvents();
        } catch (err) {
            console.error('Failed to save event:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleRSVP = async (eventId, rsvpStatus) => {
        try {
            await apiClient.planner.events.rsvp(eventId, rsvpStatus);
            loadEvents();
            if (selectedEvent) {
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to submit RSVP:', err);
        }
    };

    // Calendar Matrix Calculation
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days = [];
        // Previous month days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            const dateObj = new Date(year, month - 1, d);
            days.push({
                dateObj,
                dateStr: dateObj.toISOString().split('T')[0],
                dayNum: d,
                isOtherMonth: true
            });
        }
        // Current month days
        const todayStr = new Date().toISOString().split('T')[0];
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            const dateStr = dateObj.toISOString().split('T')[0];
            days.push({
                dateObj,
                dateStr,
                dayNum: i,
                isOtherMonth: false,
                isToday: dateStr === todayStr
            });
        }
        // Next month trailing days to complete 35 or 42 cells
        const total = days.length > 35 ? 42 : 35;
        const remaining = total - days.length;
        for (let i = 1; i <= remaining; i++) {
            const dateObj = new Date(year, month + 1, i);
            days.push({
                dateObj,
                dateStr: dateObj.toISOString().split('T')[0],
                dayNum: i,
                isOtherMonth: true
            });
        }
        return days;
    }, [currentDate]);

    const filteredEvents = useMemo(() => {
        if (typeFilter === 'ALL') return events;
        return events.filter(e => e.event_type === typeFilter);
    }, [events, typeFilter]);

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Interactive Calendar & Appointments"
                subtitle="Synchronized schedule covering team meetings, project deadlines, client reviews, and personal events"
                primaryAction={{
                    label: 'Create Event',
                    icon: Plus,
                    onClick: () => openCreateModal()
                }}
            />

            {/* Navigation & Toolbar */}
            <div className="planner-quick-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={handlePrevMonth} className="btn-planner-quick">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={handleNextMonth} className="btn-planner-quick">
                        <ChevronRight size={16} />
                    </button>
                    <button onClick={handleToday} className="btn-planner-quick">
                        Today
                    </button>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginLeft: '10px' }}>
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Filter:</span>
                    {['ALL', 'MEETING', 'DEADLINE', 'REVIEW', 'PERSONAL'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setTypeFilter(cat)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: '15px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                border: '1px solid',
                                borderColor: typeFilter === cat ? '#005f73' : '#cbd5e1',
                                background: typeFilter === cat ? '#005f73' : '#ffffff',
                                color: typeFilter === cat ? '#ffffff' : '#475569',
                                cursor: 'pointer'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Month View Grid */}
            <div className="calendar-month-grid">
                {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="calendar-header-cell">
                        {day}
                    </div>
                ))}

                {calendarDays.map((day, idx) => {
                    const dayEvents = filteredEvents.filter(e => e.start_time?.startsWith(day.dateStr));
                    return (
                        <div
                            key={idx}
                            className={`calendar-day-cell ${day.isOtherMonth ? 'other-month' : ''} ${day.isToday ? 'is-today' : ''}`}
                            onClick={() => openCreateModal(day.dateStr)}
                        >
                            <span className="calendar-day-num">{day.dayNum}</span>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                                {dayEvents.map(ev => {
                                    const typeClass = `type-${(ev.event_type || 'meeting').toLowerCase()}`;
                                    return (
                                        <div
                                            key={ev.id}
                                            className={`calendar-event-chip ${typeClass}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEvent(ev);
                                                setEventTitle(ev.title);
                                                setEventDescription(ev.description || '');
                                                setEventType(ev.event_type || 'MEETING');
                                                setStartTime(ev.start_time?.slice(0, 16) || '');
                                                setEndTime(ev.end_time?.slice(0, 16) || '');
                                                setLocationLink(ev.location_or_link || '');
                                                setVisibility(ev.visibility || 'TEAM');
                                                setSelectedProject(ev.related_project || '');
                                                setIsModalOpen(true);
                                            }}
                                            title={`${ev.title} (${new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                                        >
                                            {ev.title}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Event Creator / Inspector Modal */}
            {isModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                {selectedEvent ? 'Calendar Event Details' : 'Schedule New Event'}
                            </span>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Event Title <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={eventTitle}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                        placeholder="e.g. Client Architecture Review Sync"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Event Type
                                        </label>
                                        <select
                                            value={eventType}
                                            onChange={(e) => setEventType(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        >
                                            <option value="MEETING">Meeting</option>
                                            <option value="DEADLINE">Project Deadline</option>
                                            <option value="REVIEW">Client Review</option>
                                            <option value="HOLIDAY">Holiday</option>
                                            <option value="PERSONAL">Personal / Private</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Visibility Scope
                                        </label>
                                        <select
                                            value={visibility}
                                            onChange={(e) => setVisibility(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        >
                                            <option value="TEAM">Team / Project Members</option>
                                            <option value="COMPANY">Company-Wide</option>
                                            <option value="PERSONAL">Private (Only Me)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Start Date & Time
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
                                            End Date & Time
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
                                        Location or Virtual Meeting Link
                                    </label>
                                    <input
                                        type="text"
                                        value={locationLink}
                                        onChange={(e) => setLocationLink(e.target.value)}
                                        placeholder="e.g. Conference Room A or https://meet.google.com/xyz"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Description & Agenda
                                    </label>
                                    <textarea
                                        value={eventDescription}
                                        onChange={(e) => setEventDescription(e.target.value)}
                                        rows={3}
                                        placeholder="Add background notes or discussion outline..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>

                                {/* RSVP Buttons for Existing Events */}
                                {selectedEvent && (
                                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                            Your Invitation RSVP:
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleRSVP(selectedEvent.id, 'ACCEPTED')}
                                                className="btn-planner-quick"
                                                style={{ color: '#16a34a', borderColor: '#bbf7d0' }}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRSVP(selectedEvent.id, 'TENTATIVE')}
                                                className="btn-planner-quick"
                                                style={{ color: '#d97706', borderColor: '#fde68a' }}
                                            >
                                                Tentative
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRSVP(selectedEvent.id, 'DECLINED')}
                                                className="btn-planner-quick"
                                                style={{ color: '#dc2626', borderColor: '#fecaca' }}
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-planner-quick primary">
                                    {saving ? 'Saving...' : (selectedEvent ? 'Save Changes' : 'Schedule Event')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;

