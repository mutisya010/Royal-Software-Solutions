import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    LayoutDashboard, List, PlusCircle, Search, Filter,
    Briefcase, CheckCircle, Clock, AlertTriangle,
    TrendingUp, Users, DollarSign, Calendar, ArrowRight,
    Activity, Plus, FileText, Check, MessageSquare
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { apiClient } from '../services/apiClient';

const ProjectManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlView = searchParams.get('view');
    const [view, setView] = useState(urlView || 'dashboard'); // dashboard, list, create, details

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [userRole, setUserRole] = useState('Admin'); // Admin, PM, Staff, Client

    useEffect(() => {
        if (urlView && urlView !== view) {
            setView(urlView);
        }
    }, [urlView]);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.projects.list();
            setProjects(Array.isArray(data) ? data : (data.results || []));
            setError(null);
        } catch (err) {
            console.error('Failed to load projects from backend:', err);
            setError('Could not connect to project database.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setView('details');
    };

    const handleProjectCreated = (newProject) => {
        loadProjects();
        if (newProject) {
            setSelectedProject(newProject);
            setView('details');
        } else {
            setView('list');
        }
    };

    // Calculate real stats dynamically from live projects
    const stats = useMemo(() => {
        const total = projects.length;
        const active = projects.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING').length;
        const completed = projects.filter(p => p.status === 'COMPLETED').length;
        const onHold = projects.filter(p => p.status === 'ON_HOLD').length;
        const overdue = projects.filter(p =>
            p.target_date &&
            new Date(p.target_date) < new Date() &&
            p.status !== 'COMPLETED'
        ).length;

        return { total, active, completed, onHold, overdue };
    }, [projects]);

    // Calculate real status distribution for Pie Chart
    const statusDistribution = useMemo(() => {
        if (projects.length === 0) return [];
        const activeCount = projects.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING').length;
        const completedCount = projects.filter(p => p.status === 'COMPLETED').length;
        const onHoldCount = projects.filter(p => p.status === 'ON_HOLD').length;

        const data = [];
        if (activeCount > 0) data.push({ name: 'Active', value: activeCount, color: '#3b82f6' });
        if (completedCount > 0) data.push({ name: 'Completed', value: completedCount, color: '#10b981' });
        if (onHoldCount > 0) data.push({ name: 'On Hold', value: onHoldCount, color: '#f59e0b' });
        return data;
    }, [projects]);

    // Calculate real priority distribution for Bar Chart
    const priorityDistribution = useMemo(() => {
        if (projects.length === 0) return [];
        return [
            { priority: 'Critical', count: projects.filter(p => p.priority === 'CRITICAL').length },
            { priority: 'High', count: projects.filter(p => p.priority === 'HIGH').length },
            { priority: 'Normal', count: projects.filter(p => p.priority === 'NORMAL').length },
            { priority: 'Low', count: projects.filter(p => p.priority === 'LOW').length }
        ];
    }, [projects]);

    const renderDashboard = () => (
        <div className="project-dashboard animations-fade-in">
            {/* Stats Grid */}
            <div className="project-stats-grid" style={{ gap: '20px', marginBottom: '25px' }}>
                <StatCard title="Total Projects" value={stats.total} icon={<Briefcase size={20} />} color="#6366f1" />
                <StatCard title="Active" value={stats.active} icon={<Activity size={20} />} color="#3b82f6" />
                <StatCard title="Completed" value={stats.completed} icon={<CheckCircle size={20} />} color="#10b981" />
                <StatCard title="Overdue / Target Missed" value={stats.overdue} icon={<AlertTriangle size={20} />} color="#f43f5e" />
            </div>

            {projects.length === 0 ? (
                <div className="portal-content-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <Briefcase size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No Active Projects Recorded</h3>
                    <p style={{ margin: '6px 0 18px', fontSize: '14px' }}>
                        Create your company deliverables and track milestones in real-time.
                    </p>
                    <button
                        onClick={() => setView('create')}
                        className="btn-primary"
                        style={{ padding: '10px 24px', borderRadius: '8px', margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        <PlusCircle size={16} /> Create First Project
                    </button>
                </div>
            ) : (
                <div className="project-charts-grid" style={{ gap: '25px', marginBottom: '25px' }}>
                    {/* Priority Breakdown Bar Chart */}
                    <div className="portal-content-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Active Projects by Priority</h3>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Live Portfolio</span>
                        </div>
                        <div style={{ height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={priorityDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="portal-content-card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 600 }}>Status Distribution</h3>
                        <div style={{ height: '240px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <style>{`
                .project-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
                .project-charts-grid { display: grid; grid-template-columns: 2fr 1fr; }
                .project-overview-grid { display: grid; grid-template-columns: 2fr 1fr; }
                
                @media (max-width: 1024px) {
                    .project-charts-grid, .project-overview-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .project-header-container {
                        flex-direction: column;
                        align-items: flex-start !important;
                    }
                    .project-nav-pills {
                        width: 100%;
                        justify-content: space-around;
                    }
                }
            `}</style>

            {/* Header / Sub-nav */}
            <div className="project-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>Project Management</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Live delivery milestones, deliverables, and resource allocation</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="project-nav-pills" style={{ display: 'flex', gap: '8px', background: 'white', padding: '6px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <NavBtn icon={<LayoutDashboard size={18} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                        <NavBtn icon={<List size={18} />} label={`Projects (${projects.length})`} active={view === 'list'} onClick={() => setView('list')} />
                        <NavBtn icon={<PlusCircle size={18} />} label="Create Project" active={view === 'create'} onClick={() => setView('create')} />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Loading live project records...
                </div>
            ) : (
                <>
                    {view === 'dashboard' && renderDashboard()}
                    {view === 'list' && (
                        <ProjectListSection
                            projects={projects}
                            onSelectProject={handleSelectProject}
                            onCreateNew={() => setView('create')}
                        />
                    )}
                    {view === 'create' && (
                        <CreateProjectSection
                            onCancel={() => setView('list')}
                            onSuccess={handleProjectCreated}
                        />
                    )}
                    {view === 'details' && (
                        <ProjectDetailsSection
                            project={selectedProject}
                            onBack={() => { setView('list'); setSelectedProject(null); }}
                            onRefresh={loadProjects}
                        />
                    )}
                </>
            )}
        </div>
    );
};

// --- View Components ---

const ProjectDetailsSection = ({ project, onBack, onRefresh }) => {
    if (!project) return null;

    const [milestones, setMilestones] = useState(project.milestones || []);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [newMilestoneDate, setNewMilestoneDate] = useState('');
    const [addingMilestone, setAddingMilestone] = useState(false);

    const handleAddMilestone = async (e) => {
        e.preventDefault();
        if (!newMilestoneTitle.trim() || !newMilestoneDate) return;
        try {
            setAddingMilestone(true);
            const created = await apiClient.planner.projects.addMilestone(project.id, {
                title: newMilestoneTitle,
                target_date: newMilestoneDate
            });
            setMilestones([...milestones, created]);
            setNewMilestoneTitle('');
            setNewMilestoneDate('');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to add milestone:', err);
            alert('Could not add milestone.');
        } finally {
            setAddingMilestone(false);
        }
    };

    return (
        <div className="project-details-container animations-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {/* Project Header */}
            <div className="project-details-header portal-content-card" style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}>
                        <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{project.name}</h2>
                            <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', fontSize: '11px', fontWeight: 700 }}>
                                {project.code || 'PRJ'}
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                            Department: {project.department || 'Operations'} • Priority: {project.priority}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Progress Indicator</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '150px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${project.progress_pct || 0}%`, background: '#6366f1' }} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 700 }}>{project.progress_pct || 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="project-overview-grid" style={{ gap: '25px' }}>
                <div className="portal-content-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Scope & Description</h3>
                        <p style={{ color: '#475569', lineHeight: 1.6, margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                            {project.description || 'No detailed scope description provided for this project.'}
                        </p>
                    </div>

                    {/* Milestones Roadmap */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} color="#6366f1" /> Delivery Milestones ({milestones.length})
                        </h3>

                        {milestones.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>No milestones created yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                                {milestones.map(m => (
                                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.status === 'ACHIEVED' ? '#10b981' : '#6366f1' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{m.title}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>📅 {m.target_date}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: m.status === 'ACHIEVED' ? '#ecfdf5' : '#eff6ff', color: m.status === 'ACHIEVED' ? '#10b981' : '#3b82f6' }}>
                                                {m.status || 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Milestone Form */}
                        <form onSubmit={handleAddMilestone} style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Milestone title (e.g. Beta release)..."
                                value={newMilestoneTitle}
                                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                            <input
                                type="date"
                                value={newMilestoneDate}
                                onChange={(e) => setNewMilestoneDate(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                            <button type="submit" disabled={addingMilestone} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                                {addingMilestone ? 'Adding...' : '+ Add Milestone'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sidebar Project Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="portal-content-card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', fontWeight: 700 }}>Project Financials</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Project Budget</span>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>KES {Number(project.budget || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Target Completion</span>
                                <span style={{ fontWeight: 600, color: '#475569' }}>{project.target_date || 'Unspecified'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Status</span>
                                <span style={{ fontWeight: 700, color: project.status === 'COMPLETED' ? '#10b981' : '#3b82f6' }}>{project.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectListSection = ({ projects, onSelectProject, onCreateNew }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const filteredProjects = projects.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.department || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (projects.length === 0) {
        return (
            <div className="portal-content-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <Briefcase size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: 0, color: '#1e293b' }}>No Projects Available</h3>
                <p style={{ margin: '6px 0 18px', fontSize: '14px' }}>
                    There are currently no projects recorded in the system.
                </p>
                <button
                    onClick={onCreateNew}
                    className="btn-primary"
                    style={{ padding: '10px 24px', borderRadius: '8px', margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    <PlusCircle size={16} /> Create Project
                </button>
            </div>
        );
    }

    return (
        <div className="project-list-container portal-content-card animations-fade-in" style={{ padding: '25px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search projects by name, code, or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Filter size={18} color="#64748b" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PLANNING">Planning</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Project Code & Name</th>
                            <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Department</th>
                            <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Priority</th>
                            <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Target Date</th>
                            <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Budget</th>
                            <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    No projects matching your search criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredProjects.map((p) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-bg-light">
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{p.name}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.code || 'PRJ'}</div>
                                    </td>
                                    <td style={{ padding: '15px', fontSize: '14px', color: '#475569' }}>
                                        {p.department || 'Operations'}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            fontSize: '11px', padding: '3px 8px', borderRadius: '10px',
                                            background: p.priority === 'CRITICAL' ? '#fee2e2' : p.priority === 'HIGH' ? '#ffedd5' : '#eff6ff',
                                            color: p.priority === 'CRITICAL' ? '#ef4444' : p.priority === 'HIGH' ? '#ea580c' : '#3b82f6',
                                            fontWeight: 700
                                        }}>
                                            {p.priority}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', fontSize: '14px', color: '#64748b' }}>
                                        {p.target_date || '—'}
                                    </td>
                                    <td style={{ padding: '15px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                        KES {Number(p.budget || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            background: p.status === 'COMPLETED' ? '#ecfdf5' : p.status === 'ACTIVE' ? '#eff6ff' : '#fffbeb',
                                            color: p.status === 'COMPLETED' ? '#10b981' : p.status === 'ACTIVE' ? '#3b82f6' : '#d97706'
                                        }}>{p.status}</span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <button onClick={() => onSelectProject(p)} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                                            View <ArrowRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CreateProjectSection = ({ onCancel, onSuccess }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [priority, setPriority] = useState('NORMAL');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [budget, setBudget] = useState('0');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setFormError('Project title is required.');
            return;
        }
        try {
            setSubmitting(true);
            setFormError(null);
            const created = await apiClient.planner.projects.create({
                name: name.trim(),
                code: code.trim() || undefined,
                department,
                priority,
                description,
                start_date: startDate || null,
                target_date: targetDate || null,
                budget: parseFloat(budget) || 0,
                status: 'ACTIVE'
            });
            if (onSuccess) onSuccess(created);
        } catch (err) {
            console.error('Failed to create project:', err);
            setFormError(err.message || 'Failed to save project.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="project-create-container portal-content-card animations-fade-in" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '1.25rem' }}>Create New Project</h3>

            {formError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', marginBottom: '16px', fontSize: '13px' }}>
                    {formError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        Project Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. ERP System Upgrade & Client Portal"
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Project Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. PRJ-2026-001"
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Department</label>
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                        >
                            <option value="Engineering">Engineering & Software</option>
                            <option value="Operations">Operations & Delivery</option>
                            <option value="Consulting">Consulting & Strategy</option>
                            <option value="Finance">Finance & Compliance</option>
                            <option value="Executive">Executive Leadership</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Priority Level</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                        >
                            <option value="LOW">Low</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Project Budget (KES)</label>
                        <input
                            type="number"
                            min="0"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Target Completion Date</label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Project Scope & Deliverables</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Detail expected key results, technical architecture, and milestones..."
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 600 }}>
                        {submitting ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- Helper Components ---
const StatCard = ({ title, value, icon, color }) => (
    <div className="portal-content-card" style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        borderLeft: `5px solid ${color}`,
        transition: 'transform 0.3s ease',
        cursor: 'default'
    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{title}</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>{value}</h2>
        </div>
    </div>
);

const NavBtn = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        backgroundColor: active ? '#6366f1' : 'transparent',
        color: active ? 'white' : '#64748b',
        transition: 'all 0.2s ease'
    }}>
        {icon}
        {label}
    </button>
);

export default ProjectManagement;
