import React, { useState, useEffect } from 'react';
import {
    Briefcase, Plus, CheckCircle, Clock, AlertTriangle,
    TrendingUp, Calendar, DollarSign, User, X, Flag, Layers
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import StatusPillBadge from '../shared/StatusPillBadge';

const ProjectsView = ({ onSelectProject }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('NORMAL');
    const [startDate, setStartDate] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [budget, setBudget] = useState('0');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.projects.list();
            setProjects(data);
        } catch (err) {
            console.error('Failed to load projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            setSaving(true);
            await apiClient.planner.projects.create({
                name,
                code: code || undefined,
                department,
                description,
                priority,
                start_date: startDate || null,
                target_date: targetDate || null,
                budget: parseFloat(budget) || 0,
                status: 'ACTIVE'
            });
            setIsCreateModalOpen(false);
            setName('');
            setCode('');
            setDescription('');
            loadProjects();
        } catch (err) {
            console.error('Failed to create project:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Work Management & Projects"
                subtitle="High-level initiative tracking, cross-functional deliverables, milestones, and resource allocation"
                primaryAction={{
                    label: 'Create Project',
                    icon: Plus,
                    onClick: () => setIsCreateModalOpen(true)
                }}
            />

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Loading projects...
                </div>
            ) : projects.length === 0 ? (
                <div className="portal-content-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <Briefcase size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No Active Projects</h3>
                    <p style={{ margin: '6px 0 16px' }}>Organize multiple deliverables under a cohesive project milestone roadmap.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-planner-quick primary" style={{ margin: '0 auto' }}>
                        <Plus size={15} /> Create First Project
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {projects.map(p => (
                        <div
                            key={p.id}
                            className="portal-content-card"
                            style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            onClick={() => onSelectProject && onSelectProject(p)}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#005f73'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#005f73', background: '#f0fdfa', padding: '2px 8px', borderRadius: '6px' }}>
                                        {p.code || 'PRJ'}
                                    </span>
                                    <h3 style={{ margin: '6px 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                                        {p.name}
                                    </h3>
                                </div>
                                <StatusPillBadge status={p.status} />
                            </div>

                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.description || 'No description provided.'}
                            </p>

                            {/* Progress bar */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>Overall Progress</span>
                                    <span style={{ fontWeight: 800, color: '#005f73' }}>{p.progress_pct}%</span>
                                </div>
                                <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${p.progress_pct}%`, height: '100%', background: '#0a9396', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#64748b' }}>
                                <span>Tasks: {p.completed_task_count || 0}/{p.task_count || 0}</span>
                                <span>📅 Due {p.target_date || 'TBD'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                Initialize New Work Project
                            </span>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Project Name <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. ERP Hybrid Planner Deployment"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Custom Code (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="Auto-generated if left blank"
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Department
                                        </label>
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        >
                                            <option value="Engineering">Engineering</option>
                                            <option value="Sales">Commercial / Sales</option>
                                            <option value="Finance">Finance & Accounts</option>
                                            <option value="Operations">Operations</option>
                                            <option value="Executive">Executive</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Target Completion Date
                                        </label>
                                        <input
                                            type="date"
                                            value={targetDate}
                                            onChange={(e) => setTargetDate(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Allocated Budget (KES)
                                        </label>
                                        <input
                                            type="number"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Description & Objectives
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        placeholder="Key milestones, scope boundaries, and strategic goals..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-planner-quick primary">
                                    {saving ? 'Creating Project...' : 'Initialize Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsView;

