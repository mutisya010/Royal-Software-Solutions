import React, { useState, useEffect } from 'react';
import {
    X, CheckCircle, Clock, AlertTriangle, Calendar,
    User, Folder, Plus, Trash2, Send, Tag, Flag, CheckSquare
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import StatusPillBadge from '../shared/StatusPillBadge';

const TaskDetailModal = ({
    task,
    isOpen,
    onClose,
    onSaveSuccess,
    projects = []
}) => {
    const isNew = !task?.id;
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
            setSubtasks(task.subtasks || []);
            setChecklists(task.checklist_items || []);
            setComments(task.comments || []);
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
            setSubtasks([]);
            setChecklists([]);
            setComments([]);
        }
        setError(null);
    }, [task, isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!title.trim()) {
            setError('Task title is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);
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
                is_personal: isPersonal
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

    return (
        <div className="planner-modal-overlay" onClick={onClose}>
            <div className="planner-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="planner-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                            {isNew ? 'Create New Work Item' : `Task: ${task.reference_code || 'TSK'}`}
                        </span>
                        {!isNew && (
                            <StatusPillBadge status={status} />
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <div className="planner-modal-body">
                    {error && (
                        <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px' }}>
                            {error}
                        </div>
                    )}

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

                    {/* Checklists & Subtasks Section (For Existing Tasks) */}
                    {!isNew && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            {/* Checklist */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckSquare size={15} color="#005f73" /> Checklist Items ({checklists.filter(c => c.is_done).length}/{checklists.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                    {checklists.map(c => (
                                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                                            <input
                                                type="checkbox"
                                                checked={c.is_done}
                                                onChange={() => handleToggleChecklist(c.id)}
                                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '13px', color: c.is_done ? '#94a3b8' : '#1e293b', textDecoration: c.is_done ? 'line-through' : 'none', flex: 1 }}>
                                                {c.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={newChecklistText}
                                        onChange={(e) => setNewChecklistText(e.target.value)}
                                        placeholder="Add a checklist item and hit enter..."
                                        style={{ flex: 1, padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                                    />
                                    <button type="submit" className="btn-planner-quick">
                                        <Plus size={13} /> Add
                                    </button>
                                </form>
                            </div>

                            {/* Subtasks */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={15} color="#0a9396" /> Subtasks Breakdown ({subtasks.filter(s => s.is_completed).length}/{subtasks.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                    {subtasks.map(s => (
                                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                                            <input
                                                type="checkbox"
                                                checked={s.is_completed}
                                                onChange={() => handleToggleSubtask(s.id)}
                                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '13px', color: s.is_completed ? '#94a3b8' : '#1e293b', textDecoration: s.is_completed ? 'line-through' : 'none', flex: 1 }}>
                                                {s.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        placeholder="Add a subtask..."
                                        style={{ flex: 1, padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                                    />
                                    <button type="submit" className="btn-planner-quick">
                                        <Plus size={13} /> Add Subtask
                                    </button>
                                </form>
                            </div>

                            {/* Comments & Discussion */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                    Task Activity & Comments ({comments.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', marginBottom: '10px' }}>
                                    {comments.map(c => (
                                        <div key={c.id} style={{ padding: '8px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                                                <span style={{ fontWeight: 700, color: '#005f73' }}>{c.author_details?.full_name || 'User'}</span>
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
                                        placeholder="Write an activity update or comment..."
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                    <button type="submit" className="btn-planner-quick primary">
                                        <Send size={13} /> Post
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="planner-modal-footer">
                    {!isNew && (
                        <button
                            type="button"
                            onClick={handleToggleStatus}
                            className="btn-planner-quick"
                            style={{ marginRight: 'auto' }}
                        >
                            <CheckCircle size={14} color={status === 'COMPLETED' ? '#10b981' : '#64748b'} />
                            {status === 'COMPLETED' ? 'Mark In Progress' : 'Mark Completed'}
                        </button>
                    )}
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
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;

