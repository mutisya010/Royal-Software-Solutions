import React, { useState, useEffect, useMemo } from 'react';
import {
    List, Columns, Plus, Search, Filter, CheckCircle2,
    Clock, AlertTriangle, User, Calendar, Folder, MoreHorizontal,
    CheckSquare, RefreshCw, Lock
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';
import ListFilterBar from '../shared/ListFilterBar';
import StatusPillBadge from '../shared/StatusPillBadge';
import { getPlannerPerms } from './plannerHelpers';

const KANBAN_COLUMNS = [
    { id: 'NOT_STARTED', title: 'Not Started', color: '#64748b' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#005f73' },
    { id: 'UNDER_REVIEW', title: 'Under Review', color: '#ca6702' },
    { id: 'COMPLETED', title: 'Completed', color: '#10b981' },
];

const TaskManagementView = ({ onSelectTask, onOpenCreateTask }) => {
    const [currentUser, setCurrentUser] = useState(() => apiClient.auth.getCurrentUser());
    const perms = useMemo(() => getPlannerPerms(currentUser), [currentUser]);

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayMode, setDisplayMode] = useState('list'); // 'list' | 'kanban'
    const [activeFilter, setActiveFilter] = useState(perms.canViewAll ? 'ALL' : 'MY_TASKS');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        let isMounted = true;
        apiClient.auth.getProfile()
            .then(profile => {
                if (isMounted && profile) setCurrentUser(profile);
            })
            .catch(() => {});
        if (perms.canViewAll) {
            loadUsers();
        }
        return () => { isMounted = false; };
    }, [perms.canViewAll]);

    const loadUsers = async () => {
        try {
            const list = await apiClient.users.directory();
            setUsers(list || []);
        } catch (err) {
            try {
                const fallback = await apiClient.users.list();
                setUsers(fallback || []);
            } catch (e) {
                console.warn('Could not load users for task view filter:', e);
            }
        }
    };

    useEffect(() => {
        loadTasks();
        const onTaskUpdated = () => loadTasks();
        window.addEventListener('planner:taskUpdated', onTaskUpdated);
        return () => window.removeEventListener('planner:taskUpdated', onTaskUpdated);
    }, [activeFilter, selectedAssignee, perms.canViewAll]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const params = {};
            if (!perms.canViewAll) {
                // Non-privileged users are strictly restricted to their own tasks
                params.view = activeFilter === 'OVERDUE' ? 'overdue' : (activeFilter === 'COMPLETED' ? 'completed' : 'my-tasks');
            } else {
                if (activeFilter === 'MY_TASKS') params.view = 'my-tasks';
                else if (activeFilter === 'ASSIGNED_BY_ME') params.view = 'assigned-by-me';
                else if (activeFilter === 'TEAM') params.view = 'team';
                else if (activeFilter === 'OVERDUE') params.view = 'overdue';
                else if (activeFilter === 'COMPLETED') params.view = 'completed';
            }

            if (selectedAssignee && perms.canViewAll) {
                params.assigned_to = selectedAssignee;
            }

            const data = await apiClient.planner.tasks.list(params);
            setTasks(data || []);
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

    const filterPills = useMemo(() => {
        if (!perms.canViewAll) {
            return [
                { id: 'MY_TASKS', label: 'My Tasks', count: tasks.length },
                { id: 'OVERDUE', label: 'Overdue', count: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED').length },
                { id: 'COMPLETED', label: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length }
            ];
        }
        return [
            { id: 'ALL', label: 'All Tasks', count: tasks.length },
            { id: 'MY_TASKS', label: 'My Tasks', count: tasks.filter(t => t.assigned_to || t.is_personal).length },
            { id: 'TEAM', label: 'Team Tasks', count: tasks.filter(t => !t.is_personal).length },
            { id: 'OVERDUE', label: 'Overdue', count: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED').length },
            { id: 'COMPLETED', label: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length }
        ];
    }, [tasks, perms.canViewAll]);

    const filteredTasks = useMemo(() => {
        let list = tasks;
        if (selectedAssignee && perms.canViewAll) {
            list = list.filter(t => String(t.assigned_to || t.assigned_to_details?.id) === String(selectedAssignee));
        }
        const q = searchQuery.toLowerCase().trim();
        if (!q) return list;
        return list.filter(t =>
            (t.title || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q) ||
            (t.reference_code || '').toLowerCase().includes(q) ||
            (t.project_name || '').toLowerCase().includes(q) ||
            (t.assigned_to_details?.full_name || '').toLowerCase().includes(q)
        );
    }, [tasks, searchQuery, selectedAssignee, perms.canViewAll]);

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

            {/* Staff Assignee Toolbar Filter: Strictly available to privileged administrators */}
            {perms.canViewAll && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={15} color="#475569" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Staff Assignee:</span>
                        <select
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                background: '#ffffff',
                                color: '#1e293b'
                            }}
                        >
                            <option value="">All Team Members ({users.length})</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name} — {u.designation || u.role} ({u.department || 'Operations'})
                                </option>
                            ))}
                        </select>
                        {selectedAssignee && (
                            <button
                                type="button"
                                onClick={() => setSelectedAssignee('')}
                                style={{
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    color: '#475569'
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}

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
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Assignee</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Priority</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Status</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Due Date</th>
                                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Checklist</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
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
                                                {task.assigned_to_details ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '26px',
                                                            height: '26px',
                                                            borderRadius: '50%',
                                                            background: '#e0f2fe',
                                                            color: '#0369a1',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            {(task.assigned_to_details.full_name || 'U').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                                                                {task.assigned_to_details.full_name}
                                                            </div>
                                                            <div style={{ fontSize: '0.71rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                                {task.assigned_to_details.designation || 'Staff'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                        Unassigned
                                                    </span>
                                                )}
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
                                            <div className="kanban-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span>📅 {t.due_date || 'No due date'}</span>
                                                    {t.checklist_total > 0 && (
                                                        <span>☑️ {t.checklist_completed}/{t.checklist_total}</span>
                                                    )}
                                                </div>
                                                {t.assigned_to_details ? (
                                                    <div
                                                        title={`Assignee: ${t.assigned_to_details.full_name} (${t.assigned_to_details.designation || 'Staff'})`}
                                                        style={{
                                                            width: '22px',
                                                            height: '22px',
                                                            borderRadius: '50%',
                                                            background: '#005f73',
                                                            color: '#ffffff',
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'help'
                                                        }}
                                                    >
                                                        {(t.assigned_to_details.full_name || 'U').slice(0, 2).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Unassigned</span>
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

