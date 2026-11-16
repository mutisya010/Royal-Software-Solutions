// API Client for Royal Software Solutions connecting to the business-erp backend
// Utilizes native fetch with auto JWT header management and local persistence fallbacks

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'royal_auth_token';
const USER_KEY = import.meta.env.VITE_USER_KEY || 'royal_user_info';

const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
            let message = data.detail || data.error || data.message;
            if (!message && data && typeof data === 'object') {
                // DRF field validation errors: { field: ["msg"] }
                message = Object.entries(data)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
                    .join(' | ');
            }
            const error = new Error(message || 'API request failed.');
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    }
    
    if (!response.ok) {
        throw new Error(response.statusText || 'API response was not ok.');
    }
    return response.text();
};

export const apiClient = {
    // Core HTTP verbs
    get: async (endpoint, config = {}) => {
        let url = `${API_URL}${endpoint}`;
        if (config.params) {
            const queryParams = new URLSearchParams();
            Object.entries(config.params).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    queryParams.append(key, val);
                }
            });
            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        return handleResponse(response);
    },
    
    post: async (endpoint, body) => {
        const isFormData = body instanceof FormData;
        const headers = { ...getAuthHeaders() };
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: isFormData ? body : JSON.stringify(body)
        });
        return handleResponse(response);
    },
    
    put: async (endpoint, body) => {
        const isFormData = body instanceof FormData;
        const headers = { ...getAuthHeaders() };
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: isFormData ? body : JSON.stringify(body)
        });
        return handleResponse(response);
    },
    
    delete: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        return handleResponse(response);
    },

    postBlob: async (endpoint, body = {}) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error(`PDF generation request failed: ${response.statusText}`);
        }
        return await response.blob();
    },

    // Authentication Services
    auth: {
        login: async (username, password) => {
            const data = await apiClient.post('/api/v1/auth/login/', { username, password });
            if (data.access && data.user) {
                if (!data.user.is_superuser && data.user.company_id !== 1) {
                    throw new Error("Unauthorized: Your account does not belong to this portal.");
                }
                localStorage.setItem(TOKEN_KEY, data.access);
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            }
            return data;
        },
        
        requestOtp: async (email) => {
            return apiClient.post('/api/v1/auth/otp-request/', { email });
        },
        
        verifyOtp: async (email, otpCode) => {
            const data = await apiClient.post('/api/v1/auth/otp-verify/', { email, otp_code: otpCode });
            if (data.access && data.user) {
                if (!data.user.is_superuser && data.user.company_id !== 1) {
                    throw new Error("Unauthorized: Your account does not belong to this portal.");
                }
                localStorage.setItem(TOKEN_KEY, data.access);
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            }
            return data;
        },
        
        logout: () => {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            return true;
        },
        
        getCurrentUser: () => {
            const userStr = localStorage.getItem(USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        },

        getProfile: async () => {
            try {
                const user = await apiClient.get('/api/v1/accounts/users/me/');
                if (user && user.id) {
                    localStorage.setItem(USER_KEY, JSON.stringify(user));
                    return user;
                }
            } catch (err) {
                console.warn('Failed to refresh user profile from backend, using cached profile:', err);
            }
            return apiClient.auth.getCurrentUser();
        },
        
        isAuthenticated: () => {
            return !!localStorage.getItem(TOKEN_KEY);
        }
    },

    // Dashboard Statistics
    dashboard: {
        getStats: async () => {
            try {
                return await apiClient.get('/api/v1/dashboard/stats/');
            } catch (error) {
                console.error('Failed to load dashboard stats from API, using fallback:', error);
                return null;
            }
        }
    },

    // Utility Endpoints
    utility: {
        getCountries: async () => {
            const data = await apiClient.get('/api/v1/utility/countries/');
            return data.results || data;
        },
        getRegions: async (countryId) => {
            const data = await apiClient.get('/api/v1/utility/regions/', { params: { country: countryId } });
            return data.results || data;
        },
        getCities: async (regionId) => {
            const data = await apiClient.get('/api/v1/utility/cities/', { params: { state: regionId } });
            return data.results || data;
        }
    },

    // Roles & Access Control Services (Django Groups, Users & Permissions)
    roles: {
        list: async () => {
            const data = await apiClient.get('/api/v1/accounts/roles/');
            return data.results || data;
        },
        get: async (id) => apiClient.get(`/api/v1/accounts/roles/${id}/`),
        create: async (roleData) => apiClient.post('/api/v1/accounts/roles/', roleData),
        update: async (id, roleData) => apiClient.patch(`/api/v1/accounts/roles/${id}/`, roleData),
        delete: async (id) => apiClient.delete(`/api/v1/accounts/roles/${id}/`),
    },

    users: {
        list: async () => {
            const data = await apiClient.get('/api/v1/accounts/users/');
            return data.results || data;
        },
        get: async (id) => apiClient.get(`/api/v1/accounts/users/${id}/`),
        create: async (userData) => apiClient.post('/api/v1/accounts/users/', userData),
        update: async (id, userData) => apiClient.patch(`/api/v1/accounts/users/${id}/`, userData),
        delete: async (id) => apiClient.delete(`/api/v1/accounts/users/${id}/`),
    },

    permissions: {
        list: async () => {
            const data = await apiClient.get('/api/v1/accounts/permissions/');
            return data.results || data;
        },
    },

    // Client Management (Custom App)
    clients: {
        list: async () => {
            const data = await apiClient.get('/api/v1/clients_management/clients/');
            return data.results || data; // handle pagination envelope
        },
        create: async (clientData) => {
            return apiClient.post('/api/v1/clients_management/clients/', clientData);
        },
        update: async (id, clientData) => {
            return apiClient.put(`/api/v1/clients_management/clients/${id}/`, clientData);
        },
        delete: async (id) => {
            return apiClient.delete(`/api/v1/clients_management/clients/${id}/`);
        }
    },

    communications: {
        list: async (clientId) => {
            const data = await apiClient.get('/api/v1/clients_management/communications/', { params: { client: clientId } });
            return data.results || data;
        },
        logInteraction: async (logData) => {
            return apiClient.post('/api/v1/clients_management/communications/', logData);
        },
        sendMessage: async (sendData) => {
            return apiClient.post('/api/v1/clients_management/communications/send/', sendData);
        }
    },

    documents: {
        list: async (clientId) => {
            const params = clientId ? { client: clientId } : {};
            const data = await apiClient.get('/api/v1/clients_management/documents/', { params });
            return data.results || data;
        },
        create: async (formData) => {
            return apiClient.post('/api/v1/clients_management/documents/', formData);
        },
        delete: async (id) => {
            return apiClient.delete(`/api/v1/clients_management/documents/${id}/`);
        }
    },

    accounting: {
        invoices: {
            list: async () => {
                const data = await apiClient.get('/api/v1/accounting/invoices/');
                return data.results || data;
            },
            create: async (invoiceData) => {
                return apiClient.post('/api/v1/accounting/invoices/', invoiceData);
            },
            update: async (id, invoiceData) => {
                return apiClient.put(`/api/v1/accounting/invoices/${id}/`, invoiceData);
            },
            delete: async (id) => {
                return apiClient.delete(`/api/v1/accounting/invoices/${id}/`);
            },
            issue: async (id) => {
                return apiClient.post(`/api/v1/accounting/invoices/${id}/issue/`, {});
            },
            void: async (id) => {
                return apiClient.post(`/api/v1/accounting/invoices/${id}/void/`, {});
            }
        },
        suppliers: {
            list: async () => {
                const data = await apiClient.get('/api/v1/suppliers/');
                return data.results || data;
            }
        },
        expenses: {
            list: async () => {
                const data = await apiClient.get('/api/v1/accounting/expenses/');
                return data.results || data;
            },
            create: async (expenseData) => {
                return apiClient.post('/api/v1/accounting/expenses/', expenseData);
            },
            delete: async (id) => {
                return apiClient.delete(`/api/v1/accounting/expenses/${id}/`);
            },
            approve: async (id) => {
                return apiClient.post(`/api/v1/accounting/expenses/${id}/approve/`, {});
            },
            reject: async (id) => {
                return apiClient.post(`/api/v1/accounting/expenses/${id}/reject/`, {});
            },
            void: async (id) => {
                return apiClient.post(`/api/v1/accounting/expenses/${id}/void/`, {});
            }
        },
        payments: {
            list: async () => {
                const data = await apiClient.get('/api/v1/accounting/payments/');
                return data.results || data;
            },
            create: async (paymentData) => {
                return apiClient.post('/api/v1/accounting/payments/', paymentData);
            },
            reverse: async (id) => {
                return apiClient.post(`/api/v1/accounting/payments/${id}/reverse/`, {});
            }
        },
        transactions: {
            list: async () => {
                const data = await apiClient.get('/api/v1/accounting/transactions/');
                return data.results || data;
            }
        },
        journals: {
            list: async (params = {}) => {
                const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
                const data = await apiClient.get(`/api/v1/accounting/journals/${q ? '?' + q : ''}`);
                return data.results || data;
            },
            create: async (payload) => {
                return apiClient.post('/api/v1/accounting/journals/', payload);
            },
            reverse: async (id, reason = '') => {
                return apiClient.post(`/api/v1/accounting/journals/${id}/reverse/`, { reason });
            }
        },
        reports: {
            summary: async (params = {}) => {
                const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
                return apiClient.get(`/api/v1/accounting/reports/summary/${q ? '?' + q : ''}`);
            },
            trialBalance: async (params = {}) => {
                const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
                return apiClient.get(`/api/v1/accounting/reports/trial-balance/${q ? '?' + q : ''}`);
            },
            profitAndLoss: async (params = {}) => {
                const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
                return apiClient.get(`/api/v1/accounting/reports/profit-and-loss/${q ? '?' + q : ''}`);
            },
            balanceSheet: async (params = {}) => {
                const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
                return apiClient.get(`/api/v1/accounting/reports/balance-sheet/${q ? '?' + q : ''}`);
            },
            vatSummary: async (params = {}) => {
                const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
                return apiClient.get(`/api/v1/accounting/reports/vat-summary/${q ? '?' + q : ''}`);
            },
            aging: async () => apiClient.get('/api/v1/accounting/reports/aging/'),
            ledger: async (params = {}) => {
                const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
                return apiClient.get(`/api/v1/accounting/reports/ledger/${q ? '?' + q : ''}`);
            }
        },
        accountTypes: {
            list: async () => {
                const data = await apiClient.get('/api/v1/accounting/account-types/');
                return data.results || data;
            },
            create: async (payload) => {
                return apiClient.post('/api/v1/accounting/account-types/', payload);
            },
            update: async (id, payload) => {
                return apiClient.put(`/api/v1/accounting/account-types/${id}/`, payload);
            },
            delete: async (id) => {
                return apiClient.delete(`/api/v1/accounting/account-types/${id}/`);
            }
        },
        ledgers: {
            list: async () => {
                const data = await apiClient.get('/api/v1/accounting/ledgers/');
                return data.results || data;
            },
            create: async (payload) => {
                return apiClient.post('/api/v1/accounting/ledgers/', payload);
            },
            update: async (id, payload) => {
                return apiClient.put(`/api/v1/accounting/ledgers/${id}/`, payload);
            },
            delete: async (id) => {
                return apiClient.delete(`/api/v1/accounting/ledgers/${id}/`);
            }
        }
    },

    // HR Staff Management
    hr: {
        listEmployees: async () => {
            const data = await apiClient.get('/api/v1/hr/employees/');
            return data.results || data;
        },
        createEmployee: async (employeeData) => {
            return apiClient.post('/api/v1/hr/employees/', employeeData);
        },
        updateEmployee: async (id, employeeData) => {
            return apiClient.put(`/api/v1/hr/employees/${id}/`, employeeData);
        },
        deleteEmployee: async (id) => {
            return apiClient.delete(`/api/v1/hr/employees/${id}/`);
        }
    },

    // Sales Management (Legacy POS)
    sales: {
        list: async () => {
            const data = await apiClient.get('/api/v1/sales/');
            return data.results || data;
        },
        create: async (saleData) => {
            return apiClient.post('/api/v1/sales/', saleData);
        }
    },

    // Royal Softwares Custom CRM & Sales App
    royalsoftwares: {
        products: {
            list: async () => {
                const data = await apiClient.get('/api/v1/royalsoftwares/products/');
                return data.results || data;
            },
            create: async (payload) => apiClient.post('/api/v1/royalsoftwares/products/', payload)
        },
        leads: {
            list: async () => {
                const data = await apiClient.get('/api/v1/royalsoftwares/leads/');
                return data.results || data;
            },
            create: async (payload) => apiClient.post('/api/v1/royalsoftwares/leads/', payload)
        },
        deals: {
            list: async () => {
                const data = await apiClient.get('/api/v1/royalsoftwares/deals/');
                return data.results || data;
            },
            create: async (payload) => apiClient.post('/api/v1/royalsoftwares/deals/', payload)
        },
        quotations: {
            list: async () => {
                const data = await apiClient.get('/api/v1/royalsoftwares/quotations/');
                return data.results || data;
            },
            create: async (payload) => apiClient.post('/api/v1/royalsoftwares/quotations/', payload),
            convertToInvoice: async (id) => apiClient.post(`/api/v1/royalsoftwares/quotations/${id}/convert-to-invoice/`, {})
        },
        quotationRequests: {
            list: async () => {
                const data = await apiClient.get('/api/v1/royalsoftwares/quotation-requests/');
                return data.results || data;
            },
            create: async (payload) => apiClient.post('/api/v1/royalsoftwares/quotation-requests/', payload),
            update: async (id, payload) => apiClient.put(`/api/v1/royalsoftwares/quotation-requests/${id}/`, payload),
            convertToQuotation: async (id) => apiClient.post(`/api/v1/royalsoftwares/quotation-requests/${id}/convert-to-quotation/`, {})
        },
        sales: {
            list: async () => {
                const data = await apiClient.get('/api/v1/royalsoftwares/sales/');
                return data.results || data;
            },
            create: async (payload) => apiClient.post('/api/v1/royalsoftwares/sales/', payload)
        },
        activities: {
            list: async () => {
                const data = await apiClient.get('/api/v1/royalsoftwares/activities/');
                return data.results || data;
            },
            create: async (payload) => apiClient.post('/api/v1/royalsoftwares/activities/', payload),
            toggleStatus: async (id) => apiClient.post(`/api/v1/royalsoftwares/activities/${id}/toggle-status/`, {})
        },
        communications: {
            list: async () => {
                const data = await apiClient.get('/api/v1/clients_management/communications/');
                return data.results || data;
            },
            sendMessage: async (payload) => apiClient.post('/api/v1/clients_management/communications/send-message/', payload)
        }
    },

    // Profile & Settings
    profile: {
        get: async () => {
            return apiClient.get('/api/v1/profile/');
        }
    },
    
    company: {
        getInfo: async () => {
            return apiClient.get('/api/v1/company/');
        }
    },

    // Local Storage Database Fallbacks for Unmapped Modules (Projects & Support Tickets)
    projects: {
        list: () => {
            const projects = localStorage.getItem('royal_projects');
            if (!projects) {
                const initial = [
                    { id: 'PRJ-001', name: 'ERP Implementation', client: 'Acme Corp', manager: 'John Doe', status: 'completed', progress: 100 },
                    { id: 'PRJ-002', name: 'Website Redesign', client: 'Global Tech', manager: 'Sarah Smith', status: 'active', progress: 60 },
                    { id: 'PRJ-003', name: 'Mobile App Dev', client: 'Stark Ind', manager: 'Mike Johnson', status: 'active', progress: 40 }
                ];
                localStorage.setItem('royal_projects', JSON.stringify(initial));
                return initial;
            }
            return JSON.parse(projects);
        },
        save: (projects) => {
            localStorage.setItem('royal_projects', JSON.stringify(projects));
            return projects;
        }
    },

    // Document Design Studio
    documents: {
        getBranding: async () => apiClient.get('/api/v1/documents/branding/'),
        updateBranding: async (data) => apiClient.put('/api/v1/documents/branding/', data),
        getTemplates: async (params) => apiClient.get('/api/v1/documents/templates/', { params }),
        getTemplate: async (id) => apiClient.get(`/api/v1/documents/templates/${id}/`),
        createTemplate: async (data) => apiClient.post('/api/v1/documents/templates/', data),
        updateTemplate: async (id, data) => apiClient.put(`/api/v1/documents/templates/${id}/`, data),
        deleteTemplate: async (id) => apiClient.delete(`/api/v1/documents/templates/${id}/`),
        publishTemplate: async (id) => apiClient.post(`/api/v1/documents/templates/${id}/publish/`, {}),
        duplicateTemplate: async (id) => apiClient.post(`/api/v1/documents/templates/${id}/duplicate/`, {}),
        getVersions: async (id) => apiClient.get(`/api/v1/documents/templates/${id}/versions/`),
        rollbackVersion: async (id, versionNumber) => apiClient.post(`/api/v1/documents/templates/${id}/rollback/${versionNumber}/`, {}),
        previewPdf: async (id, overrides = {}) => apiClient.postBlob(`/api/v1/documents/templates/${id}/preview-pdf/`, overrides),
        previewLivePdf: async (data) => apiClient.postBlob('/api/v1/documents/templates/preview-live/', data),
        generateDocument: async (data) => apiClient.post('/api/v1/documents/generate/', data),
        getGeneratedDocuments: async (params) => apiClient.get('/api/v1/documents/generated/', { params }),
        getAssets: async () => apiClient.get('/api/v1/documents/assets/'),
        uploadAsset: async (formData) => apiClient.post('/api/v1/documents/assets/', formData),
    },

    emailConfig: {
        get: async () => {
            const data = await apiClient.get('/api/v1/integrations/email-config/');
            return Array.isArray(data) ? (data[0] || null) : (data.results ? data.results[0] : data);
        },
        save: async (payload) => {
            return apiClient.post('/api/v1/integrations/email-config/', payload);
        },
        testSend: async (toEmail) => {
            return apiClient.post('/api/v1/integrations/email-config/test-send/', { to_email: toEmail });
        }
    },

    planner: {
        dashboard: {
            get: async () => apiClient.get('/api/v1/planner/dashboard/')
        },
        tasks: {
            list: async (params = {}) => {
                const data = await apiClient.get('/api/v1/planner/tasks/', { params });
                return Array.isArray(data) ? data : (data.results || []);
            },
            create: async (taskData) => apiClient.post('/api/v1/planner/tasks/', taskData),
            update: async (id, taskData) => apiClient.patch(`/api/v1/planner/tasks/${id}/`, taskData),
            delete: async (id) => apiClient.delete(`/api/v1/planner/tasks/${id}/`),
            toggleStatus: async (id) => apiClient.post(`/api/v1/planner/tasks/${id}/toggle-status/`, {}),
            addComment: async (id, comment) => apiClient.post(`/api/v1/planner/tasks/${id}/add-comment/`, { comment }),
            addSubtask: async (id, subtaskData) => apiClient.post(`/api/v1/planner/tasks/${id}/add-subtask/`, subtaskData),
            addChecklist: async (id, text) => apiClient.post(`/api/v1/planner/tasks/${id}/add-checklist/`, { text }),
            toggleChecklist: async (itemId) => apiClient.post('/api/v1/planner/tasks/toggle-checklist/', { item_id: itemId }),
            toggleSubtask: async (subtaskId) => apiClient.post('/api/v1/planner/tasks/toggle-subtask/', { subtask_id: subtaskId })
        },
        projects: {
            list: async (params = {}) => {
                const data = await apiClient.get('/api/v1/planner/projects/', { params });
                return Array.isArray(data) ? data : (data.results || []);
            },
            create: async (data) => apiClient.post('/api/v1/planner/projects/', data),
            update: async (id, data) => apiClient.patch(`/api/v1/planner/projects/${id}/`, data),
            delete: async (id) => apiClient.delete(`/api/v1/planner/projects/${id}/`),
            addMilestone: async (id, milestoneData) => apiClient.post(`/api/v1/planner/projects/${id}/add-milestone/`, milestoneData)
        },
        events: {
            list: async (params = {}) => {
                const data = await apiClient.get('/api/v1/planner/events/', { params });
                return Array.isArray(data) ? data : (data.results || []);
            },
            create: async (data) => apiClient.post('/api/v1/planner/events/', data),
            update: async (id, data) => apiClient.patch(`/api/v1/planner/events/${id}/`, data),
            delete: async (id) => apiClient.delete(`/api/v1/planner/events/${id}/`),
            rsvp: async (id, status) => apiClient.post(`/api/v1/planner/events/${id}/rsvp/`, { status })
        },
        meetings: {
            list: async (params = {}) => {
                const data = await apiClient.get('/api/v1/planner/meetings/', { params });
                return Array.isArray(data) ? data : (data.results || []);
            },
            create: async (data) => apiClient.post('/api/v1/planner/meetings/', data),
            update: async (id, data) => apiClient.patch(`/api/v1/planner/meetings/${id}/`, data),
            addNote: async (id, noteData) => apiClient.post(`/api/v1/planner/meetings/${id}/add-note/`, noteData),
            convertActionItem: async (id, taskData) => apiClient.post(`/api/v1/planner/meetings/${id}/convert-action-item/`, taskData)
        },
        goals: {
            list: async (params = {}) => {
                const data = await apiClient.get('/api/v1/planner/goals/', { params });
                return Array.isArray(data) ? data : (data.results || []);
            },
            create: async (data) => apiClient.post('/api/v1/planner/goals/', data),
            update: async (id, data) => apiClient.patch(`/api/v1/planner/goals/${id}/`, data),
            updateProgress: async (id, current_value) => apiClient.post(`/api/v1/planner/goals/${id}/update-progress/`, { current_value })
        },
        habits: {
            list: async () => {
                const data = await apiClient.get('/api/v1/planner/habits/');
                return Array.isArray(data) ? data : (data.results || []);
            },
            create: async (data) => apiClient.post('/api/v1/planner/habits/', data),
            update: async (id, data) => apiClient.patch(`/api/v1/planner/habits/${id}/`, data),
            delete: async (id) => apiClient.delete(`/api/v1/planner/habits/${id}/`),
            toggleToday: async (id) => apiClient.post(`/api/v1/planner/habits/${id}/toggle-today/`, {})
        },
        notes: {
            list: async (params = {}) => {
                const data = await apiClient.get('/api/v1/planner/notes/', { params });
                return Array.isArray(data) ? data : (data.results || []);
            },
            create: async (data) => apiClient.post('/api/v1/planner/notes/', data),
            update: async (id, data) => apiClient.patch(`/api/v1/planner/notes/${id}/`, data),
            delete: async (id) => apiClient.delete(`/api/v1/planner/notes/${id}/`),
            togglePin: async (id) => apiClient.post(`/api/v1/planner/notes/${id}/toggle-pin/`, {})
        },
        reminders: {
            list: async () => {
                const data = await apiClient.get('/api/v1/planner/reminders/');
                return Array.isArray(data) ? data : (data.results || []);
            },
            dismiss: async (id) => apiClient.post(`/api/v1/planner/reminders/${id}/dismiss/`, {})
        },
        analytics: {
            get: async () => apiClient.get('/api/v1/planner/analytics/')
        }
    },

    tickets: {
        list: () => {
            const tickets = localStorage.getItem('royal_tickets');
            if (!tickets) {
                const initial = [
                    { id: '#TK-101', client: 'Acme Corp', subject: 'Login Issue', priority: 'High', status: 'Open', date: '2026-05-25' },
                    { id: '#TK-102', client: 'Global Tech', subject: 'Billing Error', priority: 'Medium', status: 'In Progress', date: '2026-05-24' },
                    { id: '#TK-103', client: 'Stark Ind', subject: 'Feature Request', priority: 'Low', status: 'Resolved', date: '2026-05-20' }
                ];
                localStorage.setItem('royal_tickets', JSON.stringify(initial));
                return initial;
            }
            return JSON.parse(tickets);
        },
        save: (tickets) => {
            localStorage.setItem('royal_tickets', JSON.stringify(tickets));
            return tickets;
        }
    }
};
