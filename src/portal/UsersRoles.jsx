import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { hasAnyPermission, isAdminUser } from './navigationConfig';
import {
    Users, ShieldCheck, Plus, Search, Edit, Trash2, X, Check, Lock,
    UserCheck, UserX, KeyRound, RefreshCw, Save, ChevronDown, ChevronRight, AlertTriangle
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Permission helpers                                                  */
/* ------------------------------------------------------------------ */

const APP_LABELS = {
    royalsoftwares: 'Sales & Commercial',
    clients_management: 'Clients',
    accounting: 'Finance & Accounting',
    planner: 'Hybrid Planner',
    crm: 'CRM',
    project_management: 'Projects',
    documents: 'Documents',
    accounts: 'Users, Roles & System',
    hr: 'HR & Staff',
    pos: 'Point of Sale',
    inventory: 'Inventory',
    utility: 'Company & Utilities',
    auth: 'Authentication',
};

const CRUD = ['view', 'add', 'change', 'delete'];
const CRUD_LABEL = { view: 'View', add: 'Create', change: 'Edit', delete: 'Delete' };

const prettyModel = (m = '') => m.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());

/** Groups Django permissions: app_label -> model -> { crud: {view: perm,...}, special: [perm] } */
const groupPermissions = (perms) => {
    const apps = {};
    perms.forEach(p => {
        const app = p.app_label || 'other';
        const model = p.model || 'general';
        apps[app] = apps[app] || {};
        apps[app][model] = apps[app][model] || { crud: {}, special: [] };
        const action = CRUD.find(a => p.codename === `${a}_${model}`);
        if (action) apps[app][model].crud[action] = p;
        else apps[app][model].special.push(p);
    });
    return apps;
};

const initials = (u) => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || '?';
    const parts = name.split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

const errText = (err) => err?.message || 'Request failed';

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const UsersRoles = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('view') === 'roles' ? 'roles' : 'users';

    const currentUser = apiClient.auth.getCurrentUser();
    const admin = isAdminUser(currentUser);
    const canManageUsers = admin || hasAnyPermission(currentUser, ['accounts.can_manage_users', 'auth.add_user', 'auth.change_user']);
    const canManageRoles = admin || hasAnyPermission(currentUser, ['accounts.can_manage_roles', 'accounts.add_companyrole', 'accounts.change_companyrole']);

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = (msg, tone = 'success') => {
        setToast({ msg, tone });
        setTimeout(() => setToast(null), 3200);
    };

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [u, r, p] = await Promise.all([
                apiClient.users.list().catch(() => []),
                apiClient.roles.list(),
                apiClient.permissions.list().catch(() => []),
            ]);
            setUsers(Array.isArray(u) ? u : []);
            setRoles(Array.isArray(r) ? r : []);
            setPermissions(Array.isArray(p) ? p : []);
        } catch (err) {
            setError(`Could not load access data from the server. ${errText(err)}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    return (
        <div className="ur-page animations-fade-in">
            <style>{STYLES}</style>

            <div className="ur-header">
                <div>
                    <h2>{view === 'users' ? 'System Users' : 'Roles & Permissions'}</h2>
                    <p>
                        {view === 'users'
                            ? 'Django user accounts for your company. Access is granted through the roles (groups) assigned to each user.'
                            : 'Roles are Django groups. Every permission ticked here is inherited by all members of the role.'}
                    </p>
                </div>
                <div className="ur-header-actions">
                    <div className="ur-segment">
                        <button className={view === 'users' ? 'on' : ''} onClick={() => setSearchParams({ view: 'users' })}><Users size={14} /> Users</button>
                        <button className={view === 'roles' ? 'on' : ''} onClick={() => setSearchParams({ view: 'roles' })}><ShieldCheck size={14} /> Roles</button>
                    </div>
                    <button className="ur-btn ghost" onClick={loadAll} title="Refresh"><RefreshCw size={14} /></button>
                </div>
            </div>

            {error && <div className="ur-alert"><AlertTriangle size={16} /> {error}</div>}

            {loading ? (
                <div className="ur-empty">Loading users, roles and permissions…</div>
            ) : view === 'users' ? (
                <UsersView users={users} roles={roles} canManage={canManageUsers} currentUser={currentUser} reload={loadAll} notify={notify} />
            ) : (
                <RolesView roles={roles} users={users} permissions={permissions} canManage={canManageRoles} reload={loadAll} notify={notify} />
            )}

            {toast && <div className={`ur-toast ${toast.tone}`}>{toast.tone === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />} {toast.msg}</div>}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

const UsersView = ({ users, roles, canManage, currentUser, reload, notify }) => {
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editing, setEditing] = useState(null); // null | {} (new) | user

    const filtered = useMemo(() => users.filter(u => {
        const q = query.toLowerCase();
        const matchQ = !q || [u.username, u.email, u.first_name, u.last_name].some(v => (v || '').toLowerCase().includes(q));
        const matchR = roleFilter === 'all' || (u.roles || []).includes(roleFilter);
        const matchS = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
        return matchQ && matchR && matchS;
    }), [users, query, roleFilter, statusFilter]);

    const stats = [
        { label: 'Total users', value: users.length, tone: 'slate' },
        { label: 'Active', value: users.filter(u => u.is_active).length, tone: 'green' },
        { label: 'Inactive', value: users.filter(u => !u.is_active).length, tone: 'red' },
        { label: 'Without a role', value: users.filter(u => !(u.roles || []).length && !u.is_superuser).length, tone: 'amber' },
    ];

    const toggleActive = async (u) => {
        if (u.id === currentUser?.id) return notify('You cannot deactivate your own account.', 'error');
        try {
            await apiClient.users.update(u.id, { is_active: !u.is_active });
            notify(`${u.username} ${u.is_active ? 'deactivated' : 'activated'}.`);
            reload();
        } catch (err) { notify(errText(err), 'error'); }
    };

    const remove = async (u) => {
        if (u.id === currentUser?.id) return notify('You cannot delete your own account.', 'error');
        if (!window.confirm(`Delete user "${u.username}" permanently? Consider deactivating instead.`)) return;
        try {
            await apiClient.users.delete(u.id);
            notify(`${u.username} deleted.`);
            reload();
        } catch (err) { notify(errText(err), 'error'); }
    };

    return (
        <>
            <div className="ur-stats">
                {stats.map(s => (
                    <div key={s.label} className={`ur-stat ${s.tone}`}>
                        <span>{s.label}</span>
                        <strong>{s.value}</strong>
                    </div>
                ))}
            </div>

            <div className="ur-card">
                <div className="ur-toolbar">
                    <div className="ur-search">
                        <Search size={15} />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, username or email…" />
                    </div>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="all">All roles</option>
                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">Any status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <div style={{ flex: 1 }} />
                    {canManage && <button className="ur-btn primary" onClick={() => setEditing({})}><Plus size={15} /> New User</button>}
                </div>

                <div className="ur-table-wrap">
                    <table className="ur-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Roles</th>
                                <th>Status</th>
                                <th>Last login</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="ur-empty">No users match the current filters.</td></tr>
                            )}
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="ur-user">
                                            <div className="ur-avatar">{initials(u)}</div>
                                            <div>
                                                <div className="ur-user-name">
                                                    {`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}
                                                    {u.id === currentUser?.id && <span className="ur-you">You</span>}
                                                </div>
                                                <div className="ur-user-sub">@{u.username}{u.email ? ` · ${u.email}` : ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ur-pills">
                                            {u.is_superuser && <span className="ur-pill dark">Superuser</span>}
                                            {(u.roles || []).map(r => <span key={r} className="ur-pill">{r}</span>)}
                                            {!u.is_superuser && !(u.roles || []).length && <span className="ur-muted">No role</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`ur-status ${u.is_active ? 'on' : 'off'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                                    </td>
                                    <td className="ur-muted">{fmtDate(u.last_login)}</td>
                                    <td>
                                        {canManage ? (
                                            <div className="ur-actions">
                                                <button title="Edit user" onClick={() => setEditing(u)}><Edit size={14} /></button>
                                                <button title={u.is_active ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(u)}>
                                                    {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                                </button>
                                                <button className="danger" title="Delete user" onClick={() => remove(u)}><Trash2 size={14} /></button>
                                            </div>
                                        ) : <span className="ur-muted" style={{ display: 'block', textAlign: 'right' }}><Lock size={13} /></span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editing && (
                <UserModal
                    user={editing}
                    roles={roles}
                    currentUser={currentUser}
                    onClose={() => setEditing(null)}
                    onSaved={(msg) => { setEditing(null); notify(msg); reload(); }}
                />
            )}
        </>
    );
};

const UserModal = ({ user, roles, currentUser, onClose, onSaved }) => {
    const isNew = !user.id;
    const roleIdsFromNames = roles.filter(r => (user.roles || []).includes(r.name)).map(r => r.id);
    const [form, setForm] = useState({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '',
        is_active: user.is_active ?? true,
        is_staff: user.is_staff ?? true,
        role_ids: roleIdsFromNames,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const toggleRole = (id) => set('role_ids', form.role_ids.includes(id) ? form.role_ids.filter(x => x !== id) : [...form.role_ids, id]);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.username.trim()) return setError('Username is required.');
        if (isNew && form.password.length < 8) return setError('Password must be at least 8 characters.');
        if (!isNew && form.password && form.password.length < 8) return setError('New password must be at least 8 characters.');
        setSaving(true);
        setError(null);
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        try {
            if (isNew) await apiClient.users.create(payload);
            else await apiClient.users.update(user.id, payload);
            onSaved(isNew ? `User ${form.username} created.` : `User ${form.username} updated.`);
        } catch (err) {
            setError(errText(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title={isNew ? 'Create user' : `Edit ${user.username}`} subtitle="Django user account and role (group) membership" onClose={onClose}>
            <form onSubmit={submit}>
                <div className="ur-modal-body">
                    {error && <div className="ur-alert">{error}</div>}
                    <div className="ur-grid2">
                        <Field label="First name"><input value={form.first_name} onChange={e => set('first_name', e.target.value)} /></Field>
                        <Field label="Last name"><input value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Field>
                        <Field label="Username *"><input value={form.username} onChange={e => set('username', e.target.value)} autoComplete="off" /></Field>
                        <Field label="Email"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
                        <Field label={isNew ? 'Password *' : 'New password'} hint={isNew ? 'Minimum 8 characters' : 'Leave blank to keep the current password'}>
                            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" />
                        </Field>
                        <div className="ur-switches">
                            <label><input type="checkbox" checked={form.is_active} disabled={user.id === currentUser?.id} onChange={e => set('is_active', e.target.checked)} /> Active account</label>
                            <label><input type="checkbox" checked={form.is_staff} onChange={e => set('is_staff', e.target.checked)} /> Staff (portal access)</label>
                        </div>
                    </div>

                    <div className="ur-section-label">Roles</div>
                    {roles.length === 0 ? (
                        <div className="ur-muted">No roles defined yet. Create roles first under Roles &amp; Permissions.</div>
                    ) : (
                        <div className="ur-role-pick">
                            {roles.map(r => {
                                const on = form.role_ids.includes(r.id);
                                return (
                                    <button type="button" key={r.id} className={on ? 'on' : ''} onClick={() => toggleRole(r.id)}>
                                        <span className="box">{on && <Check size={12} strokeWidth={3} />}</span>
                                        <span>
                                            <strong>{r.name}</strong>
                                            <small>{(r.permissions || []).length} permissions</small>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="ur-modal-foot">
                    <button type="button" className="ur-btn ghost" onClick={onClose}>Cancel</button>
                    <button type="submit" className="ur-btn primary" disabled={saving}><Save size={14} /> {saving ? 'Saving…' : isNew ? 'Create user' : 'Save changes'}</button>
                </div>
            </form>
        </Modal>
    );
};

/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */

const RolesView = ({ roles, users, permissions, canManage, reload, notify }) => {
    const [selectedId, setSelectedId] = useState(roles[0]?.id ?? null);
    const [editingRole, setEditingRole] = useState(null);
    const selected = roles.find(r => r.id === selectedId) || roles[0] || null;

    useEffect(() => {
        if (!roles.find(r => r.id === selectedId) && roles[0]) setSelectedId(roles[0].id);
    }, [roles]);

    const removeRole = async (role) => {
        if (role.user_count > 0 && !window.confirm(`"${role.name}" has ${role.user_count} member(s). They will lose these permissions. Continue?`)) return;
        if (role.user_count === 0 && !window.confirm(`Delete role "${role.name}"?`)) return;
        try {
            await apiClient.roles.delete(role.id);
            notify(`Role ${role.name} deleted.`);
            reload();
        } catch (err) { notify(errText(err), 'error'); }
    };

    return (
        <div className="ur-roles-layout">
            <div className="ur-card ur-role-list">
                <div className="ur-role-list-head">
                    <span>{roles.length} roles</span>
                    {canManage && <button className="ur-btn primary sm" onClick={() => setEditingRole({})}><Plus size={14} /> New Role</button>}
                </div>
                {roles.length === 0 && <div className="ur-empty">No roles yet.</div>}
                {roles.map(r => (
                    <button key={r.id} className={`ur-role-item ${selected?.id === r.id ? 'on' : ''}`} onClick={() => setSelectedId(r.id)}>
                        <div className="ur-role-icon"><ShieldCheck size={16} /></div>
                        <div className="ur-role-meta">
                            <strong>{r.name}</strong>
                            <small>{r.user_count ?? 0} members · {(r.permissions || []).length} permissions</small>
                        </div>
                        <ChevronRight size={15} className="chev" />
                    </button>
                ))}
            </div>

            <div className="ur-role-detail">
                {selected ? (
                    <RoleMatrix
                        key={selected.id}
                        role={selected}
                        members={users.filter(u => (u.roles || []).includes(selected.name))}
                        permissions={permissions}
                        canManage={canManage}
                        onEdit={() => setEditingRole(selected)}
                        onDelete={() => removeRole(selected)}
                        reload={reload}
                        notify={notify}
                    />
                ) : (
                    <div className="ur-card ur-empty">Select or create a role to configure its permissions.</div>
                )}
            </div>

            {editingRole && (
                <RoleModal
                    role={editingRole}
                    onClose={() => setEditingRole(null)}
                    onSaved={(msg, newRole) => {
                        setEditingRole(null);
                        notify(msg);
                        if (newRole?.id) setSelectedId(newRole.id);
                        reload();
                    }}
                />
            )}
        </div>
    );
};

const RoleMatrix = ({ role, members, permissions, canManage, onEdit, onDelete, reload, notify }) => {
    const initial = useMemo(() => new Set((role.permissions || []).map(p => p.id)), [role]);
    const [selected, setSelected] = useState(initial);
    const [query, setQuery] = useState('');
    const [collapsed, setCollapsed] = useState({});
    const [saving, setSaving] = useState(false);

    const grouped = useMemo(() => {
        const q = query.toLowerCase();
        const list = q ? permissions.filter(p => `${p.name} ${p.codename} ${p.model} ${APP_LABELS[p.app_label] || p.app_label}`.toLowerCase().includes(q)) : permissions;
        return groupPermissions(list);
    }, [permissions, query]);

    const dirty = selected.size !== initial.size || [...selected].some(id => !initial.has(id));

    const toggle = (id) => {
        if (!canManage) return;
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const setMany = (ids, on) => {
        if (!canManage) return;
        setSelected(prev => {
            const next = new Set(prev);
            ids.forEach(id => on ? next.add(id) : next.delete(id));
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            await apiClient.roles.update(role.id, { permission_ids: [...selected] });
            notify(`Permissions for ${role.name} saved. Members get them on their next page load.`);
            reload();
        } catch (err) {
            notify(errText(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="ur-card ur-role-summary">
                <div>
                    <div className="ur-role-title">
                        <ShieldCheck size={18} /> {role.name}
                    </div>
                    <p>{role.description || 'No description provided.'}</p>
                    <div className="ur-member-row">
                        {members.slice(0, 6).map(m => <div key={m.id} className="ur-avatar sm" title={m.username}>{initials(m)}</div>)}
                        <span className="ur-muted">{members.length ? `${members.length} member${members.length > 1 ? 's' : ''}` : 'No members assigned'}</span>
                    </div>
                </div>
                {canManage && (
                    <div className="ur-actions">
                        <button title="Rename / describe" onClick={onEdit}><Edit size={14} /></button>
                        <button className="danger" title="Delete role" onClick={onDelete}><Trash2 size={14} /></button>
                    </div>
                )}
            </div>

            <div className="ur-card">
                <div className="ur-toolbar">
                    <div className="ur-search">
                        <Search size={15} />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter permissions…" />
                    </div>
                    <span className="ur-muted">{selected.size} of {permissions.length} granted</span>
                    <div style={{ flex: 1 }} />
                    {canManage ? (
                        <>
                            {dirty && <button className="ur-btn ghost" onClick={() => setSelected(new Set(initial))}>Discard</button>}
                            <button className="ur-btn primary" disabled={!dirty || saving} onClick={save}><Save size={14} /> {saving ? 'Saving…' : 'Save permissions'}</button>
                        </>
                    ) : <span className="ur-pill"><Lock size={11} /> Read only</span>}
                </div>

                {Object.keys(grouped).length === 0 && <div className="ur-empty">No permissions found.</div>}

                {Object.entries(grouped).map(([app, models]) => {
                    const appIds = Object.values(models).flatMap(m => [...Object.values(m.crud), ...m.special]).map(p => p.id);
                    const appOn = appIds.filter(id => selected.has(id)).length;
                    const isCollapsed = collapsed[app] ?? false;
                    return (
                        <div key={app} className="ur-app">
                            <div className="ur-app-head">
                                <button className="ur-app-toggle" onClick={() => setCollapsed(c => ({ ...c, [app]: !isCollapsed }))}>
                                    {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                                    <strong>{APP_LABELS[app] || prettyModel(app)}</strong>
                                    <span className="ur-count">{appOn}/{appIds.length}</span>
                                </button>
                                {canManage && (
                                    <div className="ur-app-bulk">
                                        <button onClick={() => setMany(appIds, true)}>Grant all</button>
                                        <button onClick={() => setMany(appIds, false)}>Revoke all</button>
                                    </div>
                                )}
                            </div>
                            {!isCollapsed && (
                                <table className="ur-matrix">
                                    <thead>
                                        <tr>
                                            <th>Resource</th>
                                            {CRUD.map(a => <th key={a}>{CRUD_LABEL[a]}</th>)}
                                            <th style={{ textAlign: 'left' }}>Special permissions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(models).map(([model, def]) => (
                                            <tr key={model}>
                                                <td className="res">{prettyModel(model)}</td>
                                                {CRUD.map(a => (
                                                    <td key={a} className="cell">
                                                        {def.crud[a] ? (
                                                            <Checkbox on={selected.has(def.crud[a].id)} disabled={!canManage} onClick={() => toggle(def.crud[a].id)} title={def.crud[a].name} />
                                                        ) : <span className="ur-dash">—</span>}
                                                    </td>
                                                ))}
                                                <td>
                                                    <div className="ur-special">
                                                        {def.special.map(p => (
                                                            <button key={p.id} className={selected.has(p.id) ? 'on' : ''} disabled={!canManage} onClick={() => toggle(p.id)} title={`${p.app_label}.${p.codename}`}>
                                                                {selected.has(p.id) ? <Check size={11} strokeWidth={3} /> : <KeyRound size={11} />} {p.name.replace(/^Can /, '')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const RoleModal = ({ role, onClose, onSaved }) => {
    const isNew = !role.id;
    const [name, setName] = useState(role.name || '');
    const [description, setDescription] = useState(role.description || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return setError('Role name is required.');
        setSaving(true);
        setError(null);
        try {
            const res = isNew
                ? await apiClient.roles.create({ name: name.trim(), description, permission_ids: [] })
                : await apiClient.roles.update(role.id, { name: name.trim(), description });
            onSaved(isNew ? `Role ${name} created. Now tick its permissions.` : `Role ${name} updated.`, res);
        } catch (err) {
            const msg = errText(err);
            setError(/unique|exists/i.test(msg) ? 'A role (Django group) with this name already exists. Role names must be unique.' : msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title={isNew ? 'Create role' : `Edit ${role.name}`} subtitle="Stored as a Django group linked to your company" onClose={onClose} width={480}>
            <form onSubmit={submit}>
                <div className="ur-modal-body">
                    {error && <div className="ur-alert">{error}</div>}
                    <Field label="Role name *"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales Agent" autoFocus /></Field>
                    <Field label="Description"><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What this role is responsible for" /></Field>
                </div>
                <div className="ur-modal-foot">
                    <button type="button" className="ur-btn ghost" onClick={onClose}>Cancel</button>
                    <button type="submit" className="ur-btn primary" disabled={saving}><Save size={14} /> {saving ? 'Saving…' : isNew ? 'Create role' : 'Save'}</button>
                </div>
            </form>
        </Modal>
    );
};

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

const Checkbox = ({ on, disabled, onClick, title }) => (
    <button type="button" className={`ur-check ${on ? 'on' : ''}`} disabled={disabled} onClick={onClick} title={title} aria-pressed={on}>
        {on && <Check size={12} strokeWidth={3} />}
    </button>
);

const Field = ({ label, hint, children }) => (
    <label className="ur-field">
        <span>{label}</span>
        {children}
        {hint && <small>{hint}</small>}
    </label>
);

const Modal = ({ title, subtitle, onClose, children, width = 640 }) => (
    <div className="ur-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <div className="ur-modal" style={{ maxWidth: width }}>
            <div className="ur-modal-head">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                <button className="ur-x" onClick={onClose}><X size={18} /></button>
            </div>
            {children}
        </div>
    </div>
);

const STYLES = `
.ur-page { max-width: 1240px; display: flex; flex-direction: column; gap: 18px; }
.ur-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.ur-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #0f172a; }
.ur-header p { margin: 4px 0 0; color: #64748b; font-size: 13.5px; max-width: 640px; }
.ur-header-actions { display: flex; gap: 8px; align-items: center; }
.ur-segment { display: inline-flex; background: #f1f5f9; border-radius: 10px; padding: 3px; }
.ur-segment button { border: none; background: transparent; padding: 7px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 600; color: #64748b; display: flex; gap: 6px; align-items: center; cursor: pointer; }
.ur-segment button.on { background: #fff; color: #0f172a; box-shadow: 0 1px 2px rgba(15,23,42,.08); }

.ur-btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 9px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all .15s; white-space: nowrap; }
.ur-btn.sm { padding: 6px 10px; font-size: 12px; }
.ur-btn.primary { background: #0f172a; color: #fff; }
.ur-btn.primary:hover:not(:disabled) { background: #1e293b; }
.ur-btn.primary:disabled { opacity: .45; cursor: not-allowed; }
.ur-btn.ghost { background: #fff; color: #334155; border-color: #e2e8f0; }
.ur-btn.ghost:hover { background: #f8fafc; }

.ur-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }
.ur-alert { display: flex; gap: 8px; align-items: center; padding: 10px 14px; border-radius: 10px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 13px; margin-bottom: 12px; }
.ur-empty { padding: 36px 20px; text-align: center; color: #94a3b8; font-size: 13.5px; }
.ur-muted { color: #94a3b8; font-size: 12.5px; }

.ur-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ur-stat { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; border-left-width: 3px; }
.ur-stat span { font-size: 12px; color: #64748b; font-weight: 500; }
.ur-stat strong { font-size: 22px; color: #0f172a; font-weight: 700; }
.ur-stat.slate { border-left-color: #334155; } .ur-stat.green { border-left-color: #10b981; }
.ur-stat.red { border-left-color: #ef4444; } .ur-stat.amber { border-left-color: #f59e0b; }

.ur-toolbar { display: flex; gap: 10px; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; }
.ur-toolbar select { border: 1px solid #e2e8f0; border-radius: 9px; padding: 8px 10px; font-size: 13px; background: #fff; color: #334155; }
.ur-search { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; padding: 7px 11px; min-width: 260px; color: #94a3b8; }
.ur-search input { border: none; outline: none; background: transparent; font-size: 13px; width: 100%; color: #0f172a; }

.ur-table-wrap { overflow-x: auto; }
.ur-table { width: 100%; border-collapse: collapse; }
.ur-table th { text-align: left; font-size: 11.5px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; font-weight: 600; padding: 10px 16px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.ur-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; vertical-align: middle; }
.ur-table tr:hover td { background: #fcfdfe; }
.ur-user { display: flex; gap: 10px; align-items: center; }
.ur-avatar { width: 34px; height: 34px; border-radius: 50%; background: #0f172a; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ur-avatar.sm { width: 26px; height: 26px; font-size: 10px; margin-right: -6px; border: 2px solid #fff; }
.ur-user-name { font-weight: 600; color: #0f172a; display: flex; gap: 6px; align-items: center; }
.ur-user-sub { font-size: 12px; color: #94a3b8; }
.ur-you { font-size: 10px; background: #eef2ff; color: #4f46e5; padding: 1px 6px; border-radius: 999px; font-weight: 600; }
.ur-pills { display: flex; gap: 5px; flex-wrap: wrap; }
.ur-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 999px; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
.ur-pill.dark { background: #0f172a; color: #fff; border-color: #0f172a; }
.ur-status { font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 999px; display: inline-flex; align-items: center; gap: 5px; }
.ur-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ur-status.on { background: #ecfdf5; color: #047857; } .ur-status.off { background: #fef2f2; color: #b91c1c; }
.ur-actions { display: flex; gap: 6px; justify-content: flex-end; }
.ur-actions button { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #475569; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.ur-actions button:hover { background: #f8fafc; color: #0f172a; }
.ur-actions button.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

.ur-roles-layout { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
.ur-role-list { padding: 8px; position: sticky; top: 80px; }
.ur-role-list-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 8px 12px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.ur-role-item { width: 100%; display: flex; gap: 10px; align-items: center; padding: 10px; border-radius: 10px; border: 1px solid transparent; background: transparent; cursor: pointer; text-align: left; }
.ur-role-item:hover { background: #f8fafc; }
.ur-role-item.on { background: #f1f5f9; border-color: #e2e8f0; }
.ur-role-icon { width: 32px; height: 32px; border-radius: 9px; background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ur-role-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ur-role-meta strong { font-size: 13.5px; color: #0f172a; }
.ur-role-meta small { font-size: 11.5px; color: #94a3b8; }
.ur-role-item .chev { color: #cbd5e1; }
.ur-role-detail { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.ur-role-summary { padding: 18px 20px; display: flex; justify-content: space-between; gap: 16px; }
.ur-role-title { display: flex; gap: 8px; align-items: center; font-size: 17px; font-weight: 700; color: #0f172a; }
.ur-role-summary p { margin: 4px 0 12px; font-size: 13px; color: #64748b; }
.ur-member-row { display: flex; align-items: center; gap: 2px; }
.ur-member-row .ur-muted { margin-left: 14px; }

.ur-app { border-bottom: 1px solid #f1f5f9; }
.ur-app:last-child { border-bottom: none; }
.ur-app-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #fbfcfd; }
.ur-app-toggle { display: flex; gap: 8px; align-items: center; border: none; background: transparent; cursor: pointer; color: #0f172a; font-size: 13.5px; padding: 0; }
.ur-count { font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 7px; border-radius: 999px; }
.ur-app-bulk { display: flex; gap: 4px; }
.ur-app-bulk button { border: none; background: transparent; font-size: 12px; color: #64748b; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.ur-app-bulk button:hover { background: #f1f5f9; color: #0f172a; }
.ur-matrix { width: 100%; border-collapse: collapse; }
.ur-matrix th { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; font-weight: 600; padding: 8px 10px; text-align: center; }
.ur-matrix th:first-child { text-align: left; padding-left: 40px; width: 200px; }
.ur-matrix td { padding: 8px 10px; border-top: 1px solid #f8fafc; font-size: 13px; }
.ur-matrix td.res { padding-left: 40px; color: #334155; font-weight: 500; }
.ur-matrix td.cell { text-align: center; width: 72px; }
.ur-check { width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; transition: all .12s; padding: 0; }
.ur-check.on { background: #0f172a; border-color: #0f172a; }
.ur-check:disabled { cursor: default; opacity: .7; }
.ur-dash { color: #e2e8f0; }
.ur-special { display: flex; flex-wrap: wrap; gap: 5px; }
.ur-special button { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; padding: 4px 9px; border-radius: 999px; border: 1px dashed #cbd5e1; background: #fff; color: #64748b; cursor: pointer; }
.ur-special button.on { border-style: solid; border-color: #c7d2fe; background: #eef2ff; color: #4338ca; font-weight: 600; }
.ur-special button:disabled { cursor: default; }

.ur-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); backdrop-filter: blur(2px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.ur-modal { background: #fff; border-radius: 16px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(15,23,42,.25); }
.ur-modal form { display: flex; flex-direction: column; min-height: 0; }
.ur-modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 22px; border-bottom: 1px solid #f1f5f9; }
.ur-modal-head h3 { margin: 0; font-size: 16px; color: #0f172a; }
.ur-modal-head p { margin: 3px 0 0; font-size: 12.5px; color: #94a3b8; }
.ur-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 6px; }
.ur-x:hover { background: #f1f5f9; color: #0f172a; }
.ur-modal-body { padding: 18px 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.ur-modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px; border-top: 1px solid #f1f5f9; background: #fbfcfd; border-radius: 0 0 16px 16px; }
.ur-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ur-field { display: flex; flex-direction: column; gap: 5px; }
.ur-field span { font-size: 12.5px; font-weight: 600; color: #475569; }
.ur-field input, .ur-field textarea { border: 1px solid #e2e8f0; border-radius: 9px; padding: 9px 12px; font-size: 13.5px; outline: none; font-family: inherit; }
.ur-field input:focus, .ur-field textarea:focus { border-color: #94a3b8; box-shadow: 0 0 0 3px #f1f5f9; }
.ur-field small { font-size: 11.5px; color: #94a3b8; }
.ur-switches { display: flex; flex-direction: column; gap: 8px; justify-content: center; font-size: 13px; color: #334155; }
.ur-switches label { display: flex; gap: 8px; align-items: center; cursor: pointer; }
.ur-section-label { font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-top: 4px; }
.ur-role-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.ur-role-pick button { display: flex; gap: 10px; align-items: center; text-align: left; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background: #fff; cursor: pointer; }
.ur-role-pick button.on { border-color: #0f172a; background: #f8fafc; }
.ur-role-pick .box { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #cbd5e1; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.ur-role-pick button.on .box { background: #0f172a; border-color: #0f172a; }
.ur-role-pick strong { display: block; font-size: 13px; color: #0f172a; }
.ur-role-pick small { font-size: 11px; color: #94a3b8; }

.ur-toast { position: fixed; bottom: 24px; right: 24px; z-index: 2100; display: flex; gap: 8px; align-items: center; padding: 11px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; color: #fff; box-shadow: 0 10px 30px rgba(15,23,42,.25); }
.ur-toast.success { background: #0f172a; } .ur-toast.error { background: #dc2626; }

@media (max-width: 1024px) {
    .ur-roles-layout { grid-template-columns: 1fr; }
    .ur-role-list { position: static; }
    .ur-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
    .ur-grid2 { grid-template-columns: 1fr; }
    .ur-search { min-width: 0; flex: 1; }
    .ur-matrix th:first-child, .ur-matrix td.res { padding-left: 12px; }
}
`;

export default UsersRoles;
