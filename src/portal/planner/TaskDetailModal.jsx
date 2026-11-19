import React, { useState, useEffect, useMemo } from 'react';
import {
    X, CheckCircle, Clock, AlertTriangle, Calendar,
    User, Folder, Plus, Trash2, Send, Tag, Flag, CheckSquare,
    Edit3, ChevronLeft, ShieldCheck, Lock
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import StatusPillBadge from '../shared/StatusPillBadge';
import { getPlannerPerms } from './plannerHelpers';

const TaskDetailModal = ({
    task,
    isOpen,
    onClose,
    onSaveSuccess,
    projects = []
}) => {
    const isNew = !task?.id;
    const [currentUser, setCurrentUser] = useState(() => apiClient.auth.getCurrentUser());

    // RBAC & Permission derivation
    const perms = useMemo(() => getPlannerPerms(currentUser, task), [currentUser, task]);

    // Modal Display Mode: 'view' (Checklist & Execution) vs 'edit' (Administrative Edit Form)
    const [modalMode, setModalMode] = useState(isNew ? 'edit' : 'view');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('');
    const [priority, setPriority] = useState('NORMAL');
    const [status, setStatus] = useState('NOT_STARTED');
    const [category, setCategory] = useState('OPERATIONS');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [estimatedHours, setEstimatedHours] = useState('0');
    const [isPersonal, setIsPersonal] = useState(false);
    const [assignedTo, setAssignedTo] = useState('');
    const [users, setUsers] = useState([]);

    // Subtasks, Checklist & Comments
    const [subtasks, setSubtasks] = useState([]);
    const [checklists, setChecklists] = useState([]);
    const [comments, setComments] = useState([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newChecklistText, setNewChecklistText] = useState('');
    const [newCommentText, setNewCommentText] = useState('');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        apiClient.auth.getProfile()
            .then(profile => {
                if (isMounted && profile) setCurrentUser(profile);
            })
            .catch(() => {});
        loadDirectory();
        return () => { isMounted = false; };
    }, []);

    const loadDirectory = async () => {
        try {
            const list = await apiClient.users.directory();
            setUsers(list || []);
        } catch (err) {
            try {
                const fallback = await apiClient.users.list();
                setUsers(fallback || []);
            } catch (e) {
                console.warn('Could not load user directory for task assignment:', e);
            }
        }
    };

    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setProjectId(task.project || '');
            setPriority(task.priority || 'NORMAL');
            setStatus(task.status || 'NOT_STARTED');
            setCategory(task.category || 'OPERATIONS');
            setStartDate(task.start_date || '');
            setDueDate(task.due_date || '');
            setEstimatedHours(String(task.estimated_hours || '0'));
            setIsPersonal(Boolean(task.is_personal));
            setAssignedTo(task.assigned_to || task.assigned_to_details?.id || '');
            setSubtasks(task.subtasks || []);
            setChecklists(task.checklist_items || []);
            setComments(task.comments || []);
            setModalMode('view'); // Default to checklist & execution view on existing task
        } else {
            setTitle('');
            setDescription('');
            setProjectId('');
            setPriority('NORMAL');
            setStatus('NOT_STARTED');
            setCategory('OPERATIONS');
            setStartDate('');
            setDueDate(new Date().toISOString().split('T')[0]);
            setEstimatedHours('0');
            setIsPersonal(false);
            // Default assignment to self if user cannot delegate to others
            setAssignedTo(currentUser?.id ? String(currentUser.id) : '');
            setSubtasks([]);
            setChecklists([]);
            setComments([]);
            setModalMode('edit'); // Creating a task begins in edit mode
        }
        setError(null);
    }, [task, isOpen, currentUser?.id]);

    const activeProjectObj = useMemo(() => {
        if (!projectId) return null;
        return projects.find(p => String(p.id) === String(projectId));
    }, [projectId, projects]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!title.trim()) {
            setError('Task title is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // Enforce RBAC: If user lacks canAssign permission, lock assigned_to to themselves
            const targetAssignee = perms.canAssign
                ? (isPersonal ? null : (assignedTo ? parseInt(assignedTo) : null))
                : (currentUser?.id ? parseInt(currentUser.id) : null);

            const payload = {
                title,
                description,
                project: projectId || null,
                priority,
                status,
                category,
                start_date: startDate || null,
                due_date: dueDate || null,
                estimated_hours: parseFloat(estimatedHours) || 0,
                is_personal: isPersonal,
                assigned_to: targetAssignee
            };

            let saved;
            if (isNew) {
                saved = await apiClient.planner.tasks.create(payload);
            } else {
                saved = await apiClient.planner.tasks.update(task.id, payload);
            }

            if (onSaveSuccess) onSaveSuccess(saved);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save task.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (isNew) return;
        try {
            const updated = await apiClient.planner.tasks.toggleStatus(task.id);
            setStatus(updated.status);
            if (onSaveSuccess) onSaveSuccess(updated);
        } catch (err) {
            setError('Failed to update status');
        }
    };

    const handleAddChecklist = async (e) => {
        e.preventDefault();
        if (!newChecklistText.trim() || isNew) return;
        try {
            const item = await apiClient.planner.tasks.addChecklist(task.id, newChecklistText);
            setChecklists([...checklists, item]);
            setNewChecklistText('');
        } catch (err) {
            setError('Failed to add checklist item');
        }
    };

    const handleToggleChecklist = async (itemId) => {
        try {
            const updated = await apiClient.planner.tasks.toggleChecklist(itemId);
            setChecklists(checklists.map(c => c.id === itemId ? updated : c));
        } catch (err) {
            setError('Failed to toggle checklist item');
        }
    };

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || isNew) return;
        try {
            const sub = await apiClient.planner.tasks.addSubtask(task.id, { title: newSubtaskTitle });
            setSubtasks([...subtasks, sub]);
            setNewSubtaskTitle('');
        } catch (err) {
            setError('Failed to add subtask');
        }
    };

    const handleToggleSubtask = async (subtaskId) => {
        try {
            const updated = await apiClient.planner.tasks.toggleSubtask(subtaskId);
            setSubtasks(subtasks.map(s => s.id === subtaskId ? updated : s));
        } catch (err) {
            setError('Failed to toggle subtask');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim() || isNew) return;
        try {
            const comment = await apiClient.planner.tasks.addComment(task.id, newCommentText);
            setComments([...comments, comment]);
            setNewCommentText('');
        } catch (err) {
            setError('Failed to post comment');
        }
    };

    const completedChecklistsCount = checklists.filter(c => c.is_done).length;
    const completedSubtasksCount = subtasks.filter(s => s.is_completed).length;

    if (!isOpen) return null;

    return (
        <div className="planner-modal-overlay" onClick={onClose}>
            <div className="planner-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                {/* Modal Header */}
                <div className="planner-modal-header" style={{ alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#005f73', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                                {isNew ? 'NEW ITEM' : (task.reference_code || 'TSK')}
                            </span>
                            {!isNew && <StatusPillBadge status={status} />}
                            {!isNew && <StatusPillBadge status={priority} />}
                            {modalMode === 'edit' && !isNew && (
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '2px 8px', borderRadius: '6px' }}>
                                    Editing Mode
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                            {isNew ? 'Create New Work Item' : (modalMode === 'view' ? title : `Edit: ${title}`)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isNew && modalMode === 'edit' && (
                            <button
                                type="button"
                                onClick={() => setModalMode('view')}
                                className="btn-planner-quick"
                                style={{ fontSize: '12px', padding: '5px 10px' }}
                            >
                                <ChevronLeft size={13} /> View Checklist
                            </button>
                        )}
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{ margin: '12px 20px 0', padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                {/* ======================================================== */}
                {/* MODE 1: CHECKLIST & EXECUTION VIEW (Default for Tasks)  */}
                {/* ======================================================== */}
                {modalMode === 'view' && !isNew ? (
                    <div className="planner-modal-body">
                        {/* Metadata Ribbon */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '12px 14px'
                        }}>
                            <div>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Due Date</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Calendar size={13} color="#005f73" /> {dueDate || 'No Due Date'}
                                </span>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Project</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Folder size={13} color="#0a9396" /> {task.project_name || activeProjectObj?.name || 'Standalone'}
                                </span>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Assignee</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <User size={13} color="#64748b" /> {task.assigned_to_details?.full_name || (perms.isAssignee ? 'You (Self)' : 'Unassigned')}
                                </span>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Estimated Effort</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Clock size={13} color="#ca6702" /> {estimatedHours} hrs
                                </span>
                            </div>
                        </div>

                        {/* Description & Deliverables */}
                        {description && (
                            <div style={{ marginTop: '14px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                                    Deliverables & Description
                                </span>
                                <div style={{
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '13px',
                                    color: '#334155',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {description}
                                </div>
                            </div>
                        )}

                        {/* Interactive Checklist (Primary Section) */}
                        <div style={{ marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckSquare size={16} color="#005f73" /> Task Checklist
                                </h4>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: completedChecklistsCount === checklists.length && checklists.length > 0 ? '#10b981' : '#005f73',
                                    background: completedChecklistsCount === checklists.length && checklists.length > 0 ? '#ecfdf5' : '#e0f2fe',
                                    padding: '2px 8px',
                                    borderRadius: '10px'
                                }}>
                                    {completedChecklistsCount}/{checklists.length} Done
                                </span>
                            </div>

                            {checklists.length === 0 ? (
                                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                    No checklist items yet. Add actionable steps below to track deliverable completion.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                    {checklists.map(c => (
                                        <label
                                            key={c.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '8px 12px',
                                                background: c.is_done ? '#f8fafc' : '#ffffff',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={c.is_done}
                                                onChange={() => handleToggleChecklist(c.id)}
                                                style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#005f73' }}
                                            />
                                            <span style={{
                                                fontSize: '13px',
                                                color: c.is_done ? '#94a3b8' : '#1e293b',
                                                textDecoration: c.is_done ? 'line-through' : 'none',
                                                flex: 1,
                                                fontWeight: c.is_done ? 400 : 500
                                            }}>
                                                {c.text}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Add Checklist Item */}
                            <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={newChecklistText}
                                    onChange={(e) => setNewChecklistText(e.target.value)}
                                    placeholder="Add a checklist step and press Enter..."
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <button type="submit" className="btn-planner-quick" style={{ padding: '0 14px' }}>
                                    <Plus size={14} /> Add
                                </button>
                            </form>
                        </div>

                        {/* Interactive Subtasks Section */}
                        <div style={{ marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={16} color="#0a9396" /> Subtasks Breakdown
                                </h4>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0a9396', background: '#ccfbf1', padding: '2px 8px', borderRadius: '10px' }}>
                                    {completedSubtasksCount}/{subtasks.length}
                                </span>
                            </div>

                            {subtasks.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                    {subtasks.map(s => (
                                        <label
                                            key={s.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '8px 12px',
                                                background: s.is_completed ? '#f8fafc' : '#ffffff',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={s.is_completed}
                                                onChange={() => handleToggleSubtask(s.id)}
                                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0a9396' }}
                                            />
                                            <span style={{
                                                fontSize: '13px',
                                                color: s.is_completed ? '#94a3b8' : '#1e293b',
                                                textDecoration: s.is_completed ? 'line-through' : 'none',
                                                flex: 1
                                            }}>
                                                {s.title}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    placeholder="Add a subtask..."
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <button type="submit" className="btn-planner-quick" style={{ padding: '0 14px' }}>
                                    <Plus size={14} /> Add Subtask
                                </button>
                            </form>
                        </div>

                        {/* Task Comments & Updates */}
                        <div style={{ marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                                Task Activity & Discussion ({comments.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', marginBottom: '10px' }}>
                                {comments.map(c => (
                                    <div key={c.id} style={{ padding: '8px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                                            <span style={{ fontWeight: 700, color: '#005f73' }}>{c.author_details?.full_name || 'Staff Member'}</span>
                                            <span>{new Date(c.created_on).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#334155' }}>{c.comment}</div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    placeholder="Write an execution note or progress comment..."
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <button type="submit" className="btn-planner-quick primary" style={{ padding: '0 14px' }}>
                                    <Send size={13} /> Post
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* ======================================================== */
                    /* MODE 2: EDIT & CREATION FORM (Admins / Creators / New)   */
                    /* ======================================================== */
                    <div className="planner-modal-body">
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                Task Title <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Implement client authorization webhook"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Related Project
                                </label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                >
                                    <option value="">None (Standalone Work Item)</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.code || 'PRJ'})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Work Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                >
                                    <option value="OPERATIONS">Operations & Client Delivery</option>
                                    <option value="FEATURE">Feature & Development</option>
                                    <option value="BUG">Bug Fix & Maintenance</option>
                                    <option value="ADMIN">Administrative & Compliance</option>
                                    <option value="PERSONAL">Personal Productivity</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Priority Level
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                >
                                    <option value="LOW">Low Priority</option>
                                    <option value="NORMAL">Normal Priority</option>
                                    <option value="HIGH">High Priority</option>
                                    <option value="CRITICAL">Critical / Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Current Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                >
                                    <option value="NOT_STARTED">Not Started</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="UNDER_REVIEW">Under Review</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                            </div>

                            {/* Assignee Field: Enforce RBAC Self-Assignment vs Admin Delegation */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Assignee (Staff Member)
                                </label>
                                {perms.canAssign ? (
                                    <select
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                        disabled={isPersonal}
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '13px',
                                            background: isPersonal ? '#f1f5f9' : '#ffffff',
                                            cursor: isPersonal ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <option value="">Unassigned (Team Backlog)</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.full_name} — {u.designation || u.role} ({u.department || 'Operations'})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    /* Staff Assignee Locked View */
                                    <div style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '13px'
                                    }}>
                                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <User size={14} color="#005f73" />
                                            {currentUser?.first_name || currentUser?.full_name || currentUser?.username || 'You (Self-assigned)'}
                                        </span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Lock size={10} /> Self Only
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                    Estimated Effort (Hours)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={estimatedHours}
                                    onChange={(e) => setEstimatedHours(e.target.value)}
                                    placeholder="e.g. 4"
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                Description & Deliverables
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Detailed requirements, specifications, or notes..."
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <input
                                type="checkbox"
                                id="personalToggle"
                                checked={isPersonal}
                                onChange={(e) => setIsPersonal(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor="personalToggle" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                Personal Private Task (Strictly isolated to your personal workspace)
                            </label>
                        </div>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="planner-modal-footer">
                    {modalMode === 'view' && !isNew ? (
                        <>
                            <button
                                type="button"
                                onClick={handleToggleStatus}
                                className="btn-planner-quick"
                                style={{ marginRight: 'auto' }}
                            >
                                <CheckCircle size={14} color={status === 'COMPLETED' ? '#10b981' : '#64748b'} />
                                {status === 'COMPLETED' ? 'Mark In Progress' : 'Mark Completed'}
                            </button>
                            <button type="button" onClick={onClose} className="btn-planner-quick">
                                Close
                            </button>
                            {perms.canEdit && (
                                <button
                                    type="button"
                                    onClick={() => setModalMode('edit')}
                                    className="btn-planner-quick primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Edit3 size={14} /> Edit Task
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            {!isNew ? (
                                <button
                                    type="button"
                                    onClick={() => setModalMode('view')}
                                    className="btn-planner-quick"
                                    style={{ marginRight: 'auto' }}
                                >
                                    <ChevronLeft size={14} /> Back to Checklist
                                </button>
                            ) : null}
                            <button type="button" onClick={onClose} className="btn-planner-quick">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-planner-quick primary"
                            >
                                {saving ? 'Saving...' : (isNew ? 'Create Work Item' : 'Save Changes')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
