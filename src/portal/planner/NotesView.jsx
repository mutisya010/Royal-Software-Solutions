import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, Plus, Pin, Trash2, Search, Tag, X,
    Edit3, Check, Sparkles
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ListPageHeader from '../shared/ListPageHeader';

const NOTE_COLORS = [
    { id: '#ffffff', label: 'Default White' },
    { id: '#fef3c7', label: 'Warm Amber' },
    { id: '#ecfdf5', label: 'Mint Teal' },
    { id: '#eff6ff', label: 'Soft Blue' },
    { id: '#fdf2f8', label: 'Rose Pink' },
    { id: '#f5f3ff', label: 'Lavender' }
];

const NotesView = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [color, setColor] = useState('#ffffff');
    const [isPersonal, setIsPersonal] = useState(true);
    const [isPinned, setIsPinned] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const data = await apiClient.planner.notes.list();
            setNotes(data);
        } catch (err) {
            console.error('Failed to load notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            setSaving(true);
            await apiClient.planner.notes.create({
                title,
                content,
                category,
                color,
                is_personal: isPersonal,
                is_pinned: isPinned
            });
            setIsCreateModalOpen(false);
            setTitle('');
            setContent('');
            loadNotes();
        } catch (err) {
            console.error('Failed to save note:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePin = async (noteId, e) => {
        if (e) e.stopPropagation();
        try {
            const updated = await apiClient.planner.notes.togglePin(noteId);
            setNotes(notes.map(n => n.id === noteId ? updated : n));
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const handleDeleteNote = async (noteId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Delete this note permanently?')) return;
        try {
            await apiClient.planner.notes.delete(noteId);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    const filteredNotes = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return notes;
        return notes.filter(n =>
            (n.title || '').toLowerCase().includes(q) ||
            (n.content || '').toLowerCase().includes(q) ||
            (n.category || '').toLowerCase().includes(q)
        );
    }, [notes, searchQuery]);

    return (
        <div className="planner-container animations-fade-in">
            <ListPageHeader
                title="Personal & Team Knowledge Notes"
                subtitle="Capture quick architectural thoughts, meeting memos, checklists, and references"
                primaryAction={{
                    label: 'Create Note',
                    icon: Plus,
                    onClick: () => setIsCreateModalOpen(true)
                }}
            />

            {/* Search & Actions Bar */}
            <div className="planner-quick-bar">
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search knowledge notes..."
                        style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Loading notes...
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="portal-content-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No Notes Found</h3>
                    <p style={{ margin: '6px 0 16px' }}>Capture ideas, design documentation, or team cheat-sheets.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-planner-quick primary" style={{ margin: '0 auto' }}>
                        <Plus size={15} /> Create First Note
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                    {filteredNotes.map(n => (
                        <div
                            key={n.id}
                            style={{
                                background: n.color || '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                boxShadow: n.is_pinned ? '0 4px 12px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
                                position: 'relative',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#005f73', background: 'rgba(0,95,115,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                                    {n.category || 'General'}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={(e) => handleTogglePin(n.id, e)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: n.is_pinned ? '#005f73' : '#cbd5e1' }}
                                        title={n.is_pinned ? 'Unpin' : 'Pin to top'}
                                    >
                                        <Pin size={15} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteNote(n.id, e)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                                {n.title}
                            </h3>

                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5, flex: 1 }}>
                                {n.content}
                            </p>

                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{n.is_personal ? '🔒 Personal' : '👥 Shared'}</span>
                                <span>{new Date(n.modified_on).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Note Modal */}
            {isCreateModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                Capture Knowledge Note
                            </span>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateNote}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Note Title <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Cloud Architecture Scaling Notes"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Category
                                        </label>
                                        <input
                                            type="text"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            placeholder="General, Tech, Meeting, Design..."
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Accent Color
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '38px' }}>
                                            {NOTE_COLORS.map(c => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => setColor(c.id)}
                                                    style={{
                                                        width: '26px',
                                                        height: '26px',
                                                        borderRadius: '50%',
                                                        background: c.id,
                                                        border: `2px solid ${color === c.id ? '#005f73' : '#cbd5e1'}`,
                                                        cursor: 'pointer'
                                                    }}
                                                    title={c.label}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Content & Body
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={6}
                                        placeholder="Type your notes, code snippets, or reference links..."
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={isPersonal}
                                            onChange={(e) => setIsPersonal(e.target.checked)}
                                        />
                                        Private (Only visible to me)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={isPinned}
                                            onChange={(e) => setIsPinned(e.target.checked)}
                                        />
                                        Pin to Top
                                    </label>
                                </div>
                            </div>

                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-planner-quick primary">
                                    {saving ? 'Saving...' : 'Save Note'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesView;

