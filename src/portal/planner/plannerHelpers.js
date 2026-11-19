import { isAdminUser, hasPermission, hasAnyPermission } from '../navigationConfig';

/**
 * Derives granular Planner & Task permissions from the authenticated Django user.
 * 
 * Supports:
 * - isSuper: Django superuser (full access to everything)
 * - isAdmin: Administrator group member
 * - canViewAll: Can view all team/company tasks, use staff assignee filter, browse full backlog
 * - canAssign: Can assign/delegate tasks to other staff members
 * - canEdit: Can edit core task parameters (title, project, dates, assignee, hours)
 * - canDelete: Can delete task
 * - isCreator: True if the user created the given task
 * - isAssignee: True if the user is assigned to or collaborating on the given task
 */
export const getPlannerPerms = (user, task = null) => {
    if (!user) {
        return {
            isAdmin: false,
            isSuper: false,
            canViewAll: false,
            canAssign: false,
            canEdit: false,
            canDelete: false,
            isCreator: false,
            isAssignee: false,
            roleName: 'Staff'
        };
    }

    const isSuper = Boolean(user.is_superuser);
    const isAdmin = Boolean(isSuper || isAdminUser(user));
    const isStaff = Boolean(user.is_staff);

    const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    const isExecutiveOrLead = roles.some(r =>
        ['admin', 'super admin', 'administrator', 'director', 'manager', 'general manager', 'lead', 'project lead', 'team lead', 'operations lead']
            .includes(String(r).toLowerCase().trim())
    );

    const canViewAll = isSuper || isAdmin || isExecutiveOrLead || hasAnyPermission(user, [
        'planner.can_view_all_tasks',
        'planner.view_all_tasks',
        'planner.view_plannertask'
    ]);

    const canAssign = isSuper || isAdmin || isExecutiveOrLead || hasAnyPermission(user, [
        'planner.can_assign_task',
        'planner.assign_task',
        'planner.add_plannertask'
    ]);

    const isCreator = Boolean(task && (
        String(task.created_by) === String(user.id) ||
        String(task.created_by_details?.id) === String(user.id)
    ));

    const isAssignee = Boolean(task && (
        String(task.assigned_to) === String(user.id) ||
        String(task.assigned_to_details?.id) === String(user.id) ||
        (Array.isArray(task.collaborators) && task.collaborators.some(c => String(c.id || c) === String(user.id)))
    ));

    const canEdit = isSuper || isAdmin || isExecutiveOrLead || hasAnyPermission(user, [
        'planner.can_edit_task',
        'planner.change_plannertask'
    ]) || isCreator;

    const canDelete = isSuper || isAdmin || isExecutiveOrLead || hasPermission(user, 'planner.can_delete_task') || isCreator;

    return {
        isAdmin,
        isSuper,
        isStaff,
        canViewAll,
        canAssign,
        canEdit,
        canDelete,
        isCreator,
        isAssignee,
        roleName: roles[0] || (isAdmin ? 'Admin' : 'Staff')
    };
};
