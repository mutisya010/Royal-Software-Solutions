import React, { useState, useEffect } from 'react';
import {
    Flame, Plus, Check, CheckCircle2, RotateCcw,
    Calendar, TrendingUp, X, Sparkles
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';

const HabitsTrackerView = () => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState('DAILY');
    const [targetDays, setTargetDays] = useState('7');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.habits.list();
            setHabits(data);
        } catch (err) {
            console.error('Failed to load habits:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleToday = async (habitId) => {
        try {
            const updated = await apiClient.planner.habits.toggleToday(habitId);
            setHabits(habits.map(h => h.id === habitId ? updated : h));
        } catch (err) {
            console.error('Failed to toggle habit:', err);
        }
    };

    const handleCreateHabit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            setSaving(true);
            await apiClient.planner.habits.create({
                title,
                description,
                frequency,
                target_days_per_week: parseInt(targetDays, 10) || 7,
                is_active: true
            });
            setIsCreateModalOpen(false);
            setTitle('');
            setDescription('');
            loadHabits();
        } catch (err) {
            console.error('Failed to create habit:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Habits & Daily Routines Tracker"
                subtitle="Build compounding personal productivity habits, maintain consistency streaks, and track weekly routines"
                primaryAction={{
                    label: 'Track New Habit',
                    icon: Plus,
                    onClick: () => setIsCreateModalOpen(true)
                }}
            />

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Loading consistency streaks...
                </div>
            ) : habits.length === 0 ? (
                <div className="portal-content-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <Flame size={44} color="#ea580c" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No Habits Tracked Yet</h3>
                    <p style={{ margin: '6px 0 16px' }}>
                        Start tracking daily disciplines: professional reading, exercise, client follow-ups, or code reviews.
                    </p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-planner-quick primary" style={{ margin: '0 auto' }}>
                        <Plus size={15} /> Build First Routine
                    </button>
                </div>
            ) : (
                <div className="habit-matrix-grid">
                    {habits.map(h => (
                        <div key={h.id} className="habit-card">
                            <div className="habit-header">
                                <div>
                                    <h4 className="habit-title">{h.title}</h4>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                                        {h.description || h.frequency}
                                    </div>
                                </div>
                                <span className="habit-streak-pill">
                                    <Flame size={14} color="#ea580c" />
                                    {h.current_streak} days
                                </span>
                            </div>

                            {/* 7-day visual consistency matrix */}
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                    Past 7 Days History:
                                </div>
                                <div className="habit-days-row">
                                    {h.weekly_history?.map((day, idx) => (
                                        <div
                                            key={idx}
                                            className={`habit-day-dot ${day.completed ? 'completed' : ''} ${idx === 6 ? 'today' : ''}`}
                                            title={`${day.date}: ${day.completed ? 'Completed' : 'Missed'}`}
                                            onClick={idx === 6 ? () => handleToggleToday(h.id) : undefined}
                                        >
                                            <span style={{ fontSize: '0.62rem' }}>{day.day}</span>
                                            {day.completed ? <Check size={12} /> : <span>•</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Today Check Button */}
                            <button
                                onClick={() => handleToggleToday(h.id)}
                                className={`btn-planner-quick ${h.completed_today ? '' : 'primary'}`}
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '10px 0',
                                    fontSize: '0.84rem'
                                }}
                            >
                                <CheckCircle2 size={16} />
                                {h.completed_today ? 'Completed Today! (Click to undo)' : 'Check Off For Today'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Habit Modal */}
            {isCreateModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                Build New Habit or Routine
                            </span>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateHabit}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Habit Title <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. 30 Minutes Technical Reading"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Frequency
                                        </label>
                                        <select
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        >
                                            <option value="DAILY">Every Day</option>
                                            <option value="WEEKDAYS">Weekdays (Mon - Fri)</option>
                                            <option value="WEEKLY">Weekly Discipline</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Target Days / Week
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="7"
                                            value={targetDays}
                                            onChange={(e) => setTargetDays(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Why is this habit important? (Optional)
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        placeholder="Anchor this routine in your broader strategic objectives..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-planner-quick primary">
                                    {saving ? 'Creating Habit...' : 'Save Habit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HabitsTrackerView;

