import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Plus, Target, CheckCircle2, Award,
    Calendar, ArrowUpRight, X, Edit2
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import StatusPillBadge from '../shared/StatusPillBadge';

const GoalsView = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('ALL');

    // Create Goal form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('COMPANY');
    const [targetDate, setTargetDate] = useState('');
    const [targetValue, setTargetValue] = useState('100');
    const [unit, setUnit] = useState('%');
    const [saving, setSaving] = useState(false);

    // Update progress modal
    const [updatingGoal, setUpdatingGoal] = useState(null);
    const [newValue, setNewValue] = useState('');

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.goals.list();
            setGoals(data);
        } catch (err) {
            console.error('Failed to load goals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        if (!title.trim() || !targetDate) return;
        try {
            setSaving(true);
            await apiClient.planner.goals.create({
                title,
                description,
                category,
                target_date: targetDate,
                target_value: parseFloat(targetValue) || 100,
                unit: unit || '%',
                status: 'IN_PROGRESS'
            });
            setIsCreateModalOpen(false);
            setTitle('');
            setDescription('');
            loadGoals();
        } catch (err) {
            console.error('Failed to create goal:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault();
        if (!updatingGoal || newValue === '') return;
        try {
            const updated = await apiClient.planner.goals.updateProgress(updatingGoal.id, parseFloat(newValue));
            setGoals(goals.map(g => g.id === updatingGoal.id ? updated : g));
            setUpdatingGoal(null);
            setNewValue('');
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };

    const filteredGoals = activeCategory === 'ALL'
        ? goals
        : goals.filter(g => g.category === activeCategory);

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Goals & Strategic Objectives (OKRs)"
                subtitle="Quarterly benchmarks, departmental key results, and personal professional growth objectives"
                primaryAction={{
                    label: 'Define Goal',
                    icon: Plus,
                    onClick: () => {
                        const nextMonth = new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0];
                        setTargetDate(nextMonth);
                        setIsCreateModalOpen(true);
                    }
                }}
            />

            {/* Category Ribbon */}
            <div className="planner-quick-bar">
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    Filter Scope:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { id: 'ALL', label: 'All Objectives' },
                        { id: 'COMPANY', label: 'Company Strategic' },
                        { id: 'DEPARTMENTAL', label: 'Departmental' },
                        { id: 'PROFESSIONAL', label: 'Professional' },
                        { id: 'PERSONAL', label: 'Personal Growth' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveCategory(tab.id)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '15px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                border: '1px solid',
                                borderColor: activeCategory === tab.id ? '#005f73' : '#cbd5e1',
                                background: activeCategory === tab.id ? '#005f73' : '#ffffff',
                                color: activeCategory === tab.id ? '#ffffff' : '#475569',
                                cursor: 'pointer'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Loading goals...
                </div>
            ) : filteredGoals.length === 0 ? (
                <div className="portal-content-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <Target size={44} color="#0a9396" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No Goals in this Category</h3>
                    <p style={{ margin: '6px 0 16px' }}>Define high-impact measurable milestones and track your advancement.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-planner-quick primary" style={{ margin: '0 auto' }}>
                        <Plus size={15} /> Define Strategic Goal
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {filteredGoals.map(g => (
                        <div
                            key={g.id}
                            className="portal-content-card"
                            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0a9396', background: '#f0fdfa', padding: '2px 8px', borderRadius: '6px' }}>
                                        {g.category}
                                    </span>
                                    <h3 style={{ margin: '6px 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                                        {g.title}
                                    </h3>
                                </div>
                                <StatusPillBadge status={g.status} />
                            </div>

                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                                {g.description || 'Target performance indicator.'}
                            </p>

                            {/* Progress & Values */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                                    <span style={{ color: '#475569', fontWeight: 600 }}>
                                        Current: {g.current_value} / {g.target_value} {g.unit}
                                    </span>
                                    <span style={{ fontWeight: 800, color: '#005f73' }}>{g.progress_pct}%</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${g.progress_pct}%`, height: '100%', background: '#005f73', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    📅 Deadline: {g.target_date}
                                </span>
                                <button
                                    onClick={() => {
                                        setUpdatingGoal(g);
                                        setNewValue(String(g.current_value));
                                    }}
                                    className="btn-planner-quick"
                                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                >
                                    <Edit2 size={12} /> Log Progress
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Define Goal Modal */}
            {isCreateModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                Define New Strategic Goal / OKR
                            </span>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateGoal}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Objective Title <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Expand enterprise ERP client base to 50 active institutions"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Category
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        >
                                            <option value="COMPANY">Company Strategic Goal</option>
                                            <option value="DEPARTMENTAL">Departmental Objective</option>
                                            <option value="PROFESSIONAL">Professional / Career</option>
                                            <option value="PERSONAL">Personal Growth</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Target Deadline <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={targetDate}
                                            onChange={(e) => setTargetDate(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Target Metric Value
                                        </label>
                                        <input
                                            type="number"
                                            value={targetValue}
                                            onChange={(e) => setTargetValue(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Measurement Unit
                                        </label>
                                        <input
                                            type="text"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            placeholder="%, KES, Clients, Deliverables..."
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Key Results & Impact
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        placeholder="How will success be measured and validated..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-planner-quick primary">
                                    {saving ? 'Creating Goal...' : 'Commit Goal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Update Progress Modal */}
            {updatingGoal && (
                <div className="planner-modal-overlay" onClick={() => setUpdatingGoal(null)}>
                    <div className="planner-modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                Log Progress: {updatingGoal.title}
                            </span>
                            <button onClick={() => setUpdatingGoal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProgress}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Enter New Value (Goal: {updatingGoal.target_value} {updatingGoal.unit})
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 700 }}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setUpdatingGoal(null)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-planner-quick primary">
                                    Update Progress
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsView;

