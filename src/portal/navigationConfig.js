import {
    LayoutDashboard,
    Briefcase,
    DollarSign,
    Users,
    Building,
    Headset,
    Settings,
    User,
    List,
    PlusCircle,
    FileText,
    Receipt,
    Wallet,
    History,
    Activity,
    PieChart as PieChartIcon,
    Clock,
    Calendar,
    TrendingUp,
    MessageSquare,
    BarChart3,
    Ticket,
    BookOpen,
    Shield,
    Mail,
    Lock,
    Globe,
    Database,
    FolderKanban,
    Palette,
    Layers,
    Sparkles,
    FileCheck,
    ShieldCheck,
    UserCog,
    KeyRound
} from 'lucide-react';

/**
 * Configuration-driven two-level module navigation definition
 * Maps each primary module to its verified existing pages, subviews, and permission roles.
 */
export const MODULE_NAV_CONFIG = [
    {
        id: 'planner',
        label: 'Hybrid Planner',
        icon: Calendar,
        path: '/portal/admin/planner',
        roles: ['Admin', 'Finance', 'Sales', 'Support'],
        hasSubmenu: true,
        groups: [
            {
                title: 'PERSONAL WORKSPACE',
                items: [
                    { label: 'Overview & Agenda', view: 'dashboard', icon: LayoutDashboard },
                    { label: 'My Day', view: 'my-day', icon: Sparkles },
                    { label: 'My Tasks', view: 'tasks', icon: List },
                    { label: 'Personal Calendar', view: 'calendar', icon: Calendar },
                    { label: 'Habits & Routines', view: 'habits', icon: Activity },
                    { label: 'Personal Notes', view: 'notes', icon: FileText }
                ]
            },
            {
                title: 'ORGANISATIONAL & TEAMS',
                items: [
                    { label: 'Work & Projects', view: 'projects', icon: FolderKanban },
                    { label: 'Team Planning', view: 'team', icon: Users },
                    { label: 'Meetings & Syncs', view: 'meetings', icon: MessageSquare },
                    { label: 'Goals & Objectives', view: 'goals', icon: TrendingUp },
                    { label: 'Productivity Reports', view: 'analytics', icon: BarChart3 }
                ]
            }
        ]
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/portal/admin/dashboard',
        roles: ['Admin', 'Finance', 'Sales', 'Support'],
        hasSubmenu: false
    },
    {
        id: 'projects',
        label: 'Project Management',
        icon: Briefcase,
        path: '/portal/admin/projects',
        roles: ['Admin'],
        hasSubmenu: true,
        groups: [
            {
                title: 'OPERATIONS',
                items: [
                    { label: 'Overview', view: 'dashboard', icon: LayoutDashboard },
                    { label: 'All Projects', view: 'list', icon: List },
                    { label: 'Create Project', view: 'create', icon: PlusCircle }
                ]
            }
        ]
    },
    {
        id: 'finance',
        label: 'Finance & Accounting',
        icon: DollarSign,
        path: '/portal/admin/finance',
        roles: ['Finance'],
        permissions: [
            'accounts.can_view_financials',
            'accounting.view_invoice',
            'accounting.view_expense',
            'accounting.view_ledger',
            'accounting.can_view_financial_reports'
        ],
        hasSubmenu: true,
        groups: [
            {
                title: 'SALES & PURCHASES',
                items: [
                    { label: 'Overview', view: 'dashboard', icon: LayoutDashboard },
                    { label: 'Invoices', view: 'invoices', icon: FileText },
                    { label: 'Payments Received', view: 'payments', icon: Wallet },
                    { label: 'Expenses & Bills', view: 'expenses', icon: Receipt }
                ]
            },
            {
                title: 'LEDGERS & REPORTS',
                items: [
                    { label: 'Chart of Accounts', view: 'chart-of-accounts', icon: Activity },
                    { label: 'Journals & GL', view: 'transactions', icon: History },
                    { label: 'Financial Reports', view: 'reports', icon: PieChartIcon }
                ]
            }
        ]
    },
    {
        id: 'hr',
        label: 'HR & Staff',
        icon: Users,
        path: '/portal/admin/hr',
        roles: ['Admin'],
        hasSubmenu: true,
        groups: [
            {
                title: 'STAFF DIRECTORY',
                items: [
                    { label: 'Overview', view: 'dashboard', icon: LayoutDashboard },
                    { label: 'Employees', view: 'employees', icon: Users },
                    { label: 'Departments', view: 'departments', icon: Building }
                ]
            },
            {
                title: 'TIME & ATTENDANCE',
                items: [
                    { label: 'Attendance', view: 'attendance', icon: Clock },
                    { label: 'Leave Tracking', view: 'leave', icon: Calendar }
                ]
            },
            {
                title: 'COMPENSATION & REVIEWS',
                items: [
                    { label: 'Payroll', view: 'payroll', icon: DollarSign },
                    { label: 'Performance', view: 'performance', icon: TrendingUp },
                    { label: 'HR Documents', view: 'documents', icon: FileText },
                    { label: 'HR Reports', view: 'reports', icon: PieChartIcon }
                ]
            }
        ]
    },
    {
        id: 'sales',
        label: 'Sales Management',
        icon: TrendingUp,
        path: '/portal/admin/sales',
        roles: ['Admin', 'Sales'],
        hasSubmenu: true,
        groups: [
            {
                title: 'COMMERCIAL OPERATIONS',
                items: [
                    { label: 'Sales Overview', view: 'dashboard', icon: LayoutDashboard },
                    { label: 'Products & Services', view: 'catalogue', icon: Layers },
                    { label: 'Requests for Quotation', view: 'rfqs', icon: FileCheck },
                    { label: 'Quotations', view: 'quotations', icon: FileText },
                    { label: 'Activities & Follow-ups', view: 'activities', icon: Clock },
                    { label: 'Communication History', view: 'communications', icon: MessageSquare }
                ]
            },
            {
                title: 'PIPELINE & DEALS',
                items: [
                    { label: 'Pipeline Board', view: 'pipeline', icon: Activity },
                    { label: 'Deals Management', view: 'deals', icon: TrendingUp },
                    { label: 'Leads Directory', view: 'leads', icon: Users },
                    { label: 'Sales Registry', view: 'sales_registry', icon: History }
                ]
            }

        ]
    },
    {
        id: 'document-studio',
        label: 'Document Studio',
        icon: Palette,
        path: '/portal/admin/document-studio',
        roles: ['Admin', 'Finance', 'Sales'],
        hasSubmenu: true,
        groups: [
            {
                title: 'STUDIO & TEMPLATES',
                items: [
                    { label: 'Overview', view: 'overview', icon: LayoutDashboard },
                    { label: 'Templates', view: 'templates', icon: Layers },
                    { label: 'Visual Studio Editor', view: 'editor', icon: Palette }
                ]
            },
            {
                title: 'BRANDING & LOGS',
                items: [
                    { label: 'Document Branding', view: 'branding', icon: Sparkles },
                    { label: 'Generated Documents', view: 'history', icon: FileCheck }
                ]
            }
        ]
    },
    {
        id: 'clients',
        label: 'Client Management',
        icon: Building,
        path: '/portal/admin/clients',
        roles: ['Admin', 'Sales'],
        hasSubmenu: true,
        groups: [
            {
                title: 'CLIENT DATABASE',
                items: [
                    { label: 'Overview', view: 'dashboard', icon: LayoutDashboard },
                    { label: 'Client Directory', view: 'list', icon: Users },
                    { label: 'New Client Form', view: 'registration', icon: PlusCircle }
                ]
            },
            {
                title: 'ENGAGEMENT',
                items: [
                    { label: 'Communications', view: 'communications', icon: MessageSquare },
                    { label: 'Documents', view: 'documents', icon: FileText },
                    { label: 'Client Reports', view: 'reports', icon: PieChartIcon }
                ]
            }
        ]
    },
    {
        id: 'support-tickets',
        label: 'Support Tickets',
        icon: Headset,
        path: '/portal/admin/support-tickets',
        roles: ['Admin', 'Support'],
        hasSubmenu: true,
        groups: [
            {
                title: 'TICKETING',
                items: [
                    { label: 'Overview', view: 'dashboard', icon: LayoutDashboard },
                    { label: 'All Tickets', view: 'list', icon: Ticket },
                    { label: 'New Ticket', view: 'creation', icon: PlusCircle }
                ]
            },
            {
                title: 'RESOURCES',
                items: [
                    { label: 'Knowledge Base', view: 'kb', icon: BookOpen },
                    { label: 'Reports', view: 'reports', icon: BarChart3 }
                ]
            }
        ]
    },
    {
        id: 'access',
        label: 'Users & Roles',
        icon: ShieldCheck,
        path: '/portal/admin/users-roles',
        // Access is granted purely by Django permissions (no loose role-name matching)
        roles: [],
        permissions: [
            'auth.view_user', 'auth.add_user', 'auth.change_user',
            'accounts.view_companyrole', 'accounts.add_companyrole', 'accounts.change_companyrole',
            'accounts.can_manage_users', 'accounts.can_manage_roles'
        ],
        hasSubmenu: true,
        groups: [
            {
                title: 'ACCESS CONTROL',
                items: [
                    { label: 'System Users', view: 'users', icon: UserCog },
                    { label: 'Roles & Permissions', view: 'roles', icon: KeyRound }
                ]
            }
        ]
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        path: '/portal/admin/settings',
        roles: [],
        permissions: ['accounts.can_manage_settings'],
        hasSubmenu: true,
        groups: [
            {
                title: 'CONFIGURATION',
                items: [
                    { label: 'General', view: 'general', icon: Settings },
                    { label: 'Security & Auth', view: 'security', icon: Lock }
                ]
            },
            {
                title: 'INFRASTRUCTURE',
                items: [
                    { label: 'Email & SMTP', view: 'email', icon: Mail },
                    { label: 'Integrations & API', view: 'integrations', icon: Globe },
                    { label: 'Backup & Recovery', view: 'backup', icon: Database },
                    { label: 'Audit Logs', view: 'logs', icon: Activity }
                ]
            }
        ]
    }
];

export const ACCOUNT_NAV_CONFIG = [
    {
        id: 'profile',
        label: 'Profile',
        icon: User,
        path: '/portal/admin/profile',
        roles: ['Admin', 'Finance', 'Sales', 'Support']
    }
];

/**
 * Access Control Evaluator:
 * Verifies if the current user possesses permission or role clearance to access a module.
 */
export const canAccessModule = (module, user) => {
    if (!user) return false;
    // 1. Superusers always have full access
    if (user.is_superuser) return true;

    // 2. Normalize user roles
    const userRoles = Array.isArray(user.roles) 
        ? user.roles.map(r => String(r).toLowerCase().trim()) 
        : (user.role ? [String(user.role).toLowerCase().trim()] : []);

    // 3. Admin / Super Admin role bypass
    if (userRoles.some(r => r === 'super admin' || r === 'administrator' || r === 'admin')) {
        return true;
    }

    // 4. Check explicit permissions if module defines them
    const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
    if (module.permissions && module.permissions.length > 0) {
        if (module.permissions.some(p => userPermissions.includes(p))) {
            return true;
        }
    }

    // 5. Check allowed roles
    if (module.roles && module.roles.length > 0) {
        return module.roles.some(allowedRole => {
            const allowed = allowedRole.toLowerCase().trim();
            return userRoles.some(r => r === allowed || r.includes(allowed) || allowed.includes(r));
        });
    }

    return false;
};

export const hasPermission = (user, permissionCodename) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
    return userPermissions.includes(permissionCodename);
};

/** True if the user holds at least one of the given Django permissions (`app_label.codename`). */
export const hasAnyPermission = (user, codenames = []) =>
    codenames.some(code => hasPermission(user, code));

/** Admin-level role names (Django groups) that bypass module checks. */
export const isAdminUser = (user) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    return roles.some(r => ['super admin', 'administrator', 'admin'].includes(String(r).toLowerCase().trim()));
};

