import React, { useState, useEffect, useMemo } from 'react';
import {
    List, Columns, Plus, Search, Filter, CheckCircle2,
    Clock, AlertTriangle, User, Calendar, Folder, MoreHorizontal,
    CheckSquare, RefreshCw
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';

const KANBAN_COLUMNS = [
    { id: 'NOT_STARTED', title: 'Not Started', color: '#64748b' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#005f73' },
    { id: 'UNDER_REVIEW', title: 'Under Review', color: '#ca6702' },
    { id: 'COMPLETED', title: 'Completed', color: '#10b981' },
];

const TaskManagementView = ({ onSelectTask, onOpenCreateTask }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayMode, setDisplayMode] = useState('list'); // 'list' | 'kanban'
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTasks();
    }, [activeFilter]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const params = {};
            if (activeFilter === 'MY_TASKS') params.view = 'my-tasks';
            else if (activeFilter === 'ASSIGNED_BY_ME') params.view = 'assigned-by-me';
            else if (activeFilter === 'TEAM') params.view = 'team';
            else if (activeFilter === 'OVERDUE') params.view = 'overdue';
            else if (activeFilter === 'COMPLETED') params.view = 'completed';

            const data = await apiClient.planner.tasks.list(params);
            setTasks(data);
        } catch (err) {
            console.error('Failed to load tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (taskId, e) => {
        if (e) e.stopPropagation();
        try {
            const updated = await apiClient.planner.tasks.toggleStatus(taskId);
            setTasks(tasks.map(t => t.id === taskId ? updated : t));
        } catch (err) {
            console.error('Failed to toggle task:', err);
        }
    };

    const filterPills = useMemo(() => [
        { id: 'ALL', label: 'All Tasks', count: tasks.length },
        { id: 'MY_TASKS', label: 'My Tasks', count: tasks.filter(t => t.assigned_to || t.is_personal).length },
        { id: 'TEAM', label: 'Team Tasks', count: tasks.filter(t => !t.is_personal).length },
        { id: 'OVERDUE', label: 'Overdue', count: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED').length },
        { id: 'COMPLETED', label: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length }
    ], [tasks]);

    const filteredTasks = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return tasks;
        return tasks.filter(t =>
            (t.title || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q) ||
            (t.reference_code || '').toLowerCase().includes(q) ||
            (t.project_name || '').toLowerCase().includes(q)
        );
    }, [tasks, searchQuery]);

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Task & Work Management"
                subtitle="Complete tracking of individual deliverables, delegated assignments, and team workflows"
                primaryAction={{
                    label: 'New Task',
                    icon: Plus,
                    onClick: onOpenCreateTask
                }}
                secondaryActions={[
                    {
                        label: displayMode === 'list' ? 'Kanban Board' : 'List View',
                        icon: displayMode === 'list' ? Columns : List,
                        onClick: () => setDisplayMode(displayMode === 'list' ? 'kanban' : 'list')
                    },
                    {
                        label: 'Refresh',
                        icon: RefreshCw,
                        onClick: loadTasks
                    }
                ]}
            />

            {/* Filter Bar */}
            <ListFilterBar
                searchPlaceholder="Search tasks by title, code (TSK-...), or project name..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filterPills={filterPills}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={26} className="spin" style={{ margin: '0 auto 10px' }} />
                    <p>Loading task catalog...</p>
                </div>
            ) : displayMode === 'list' ? (
                /* List View */
                <div className="portal-content-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', width: '40px' }}>Done</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Code & Title</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Project</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Priority</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Status</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Due Date</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Checklist</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                            No tasks match the active filters. Click "New Task" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTasks.map(task => (
                                        <tr
                                            key={task.id}
                                            onClick={() => onSelectTask(task)}
                                            style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                        >
                                            <td style={{ padding: '14px 18px' }} onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={task.status === 'COMPLETED'}
                                                    onChange={(e) => handleToggleTask(task.id, e)}
                                                    style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    color: task.status === 'COMPLETED' ? '#94a3b8' : '#0f172a',
                                                    textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none'
                                                }}>
                                                    {task.title}
                                                </div>
                                                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                                                    {task.reference_code || 'TSK'} {task.is_personal && '• (Personal)'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px', fontSize: '0.84rem', color: '#334155' }}>
                                                {task.project_name || '—'}
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <StatusPillBadge status={task.priority} />
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <StatusPillBadge status={task.status} />
                                            </td>
                                            <td style={{ padding: '14px 18px', fontSize: '0.84rem', color: '#334155' }}>
                                                {task.due_date || '—'}
                                            </td>
                                            <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: '#64748b' }}>
                                                {task.checklist_total > 0 ? `${task.checklist_completed}/${task.checklist_total}` : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Kanban Board View */
                <div className="planner-kanban-board">
                    {KANBAN_COLUMNS.map(col => {
                        const colTasks = filteredTasks.filter(t => t.status === col.id);
                        return (
                            <div key={col.id} className="kanban-column">
                                <div className="kanban-column-header">
                                    <div className="kanban-column-title">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                                        <span>{col.title}</span>
                                    </div>
                                    <span className="kanban-counter-badge">{colTasks.length}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {colTasks.map(t => (
                                        <div
                                            key={t.id}
                                            className="kanban-card"
                                            onClick={() => onSelectTask(t)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                                                    {t.reference_code || 'TSK'}
                                                </span>
                                                <StatusPillBadge status={t.priority} />
                                            </div>
                                            <div className="kanban-card-title">{t.title}</div>
                                            {t.project_name && (
                                                <div style={{ fontSize: '0.75rem', color: '#005f73', fontWeight: 600 }}>
                                                    📁 {t.project_name}
                                                </div>
                                            )}
                                            <div className="kanban-card-meta">
                                                <span>📅 {t.due_date || 'No due date'}</span>
                                                {t.checklist_total > 0 && (
                                                    <span>☑️ {t.checklist_completed}/{t.checklist_total}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TaskManagementView;

