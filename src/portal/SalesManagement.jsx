import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import GenerateQuotationModal from './document-studio/GenerateQuotationModal';
import CreateQuotationModal from './document-studio/CreateQuotationModal';
import ProductsServicesCatalogue from './ProductsServicesCatalogue';
import SalesOverviewDashboard from './sales/SalesOverviewDashboard';
import RequestsForQuotationPage from './sales/RequestsForQuotationPage';
import QuotationsListPage from './sales/QuotationsListPage';
import ActivitiesFollowupsPage from './sales/ActivitiesFollowupsPage';
import CommunicationHistoryPage from './sales/CommunicationHistoryPage';
import LeadsDirectoryPage from './sales/LeadsDirectoryPage';
import PipelineBoardPage from './sales/PipelineBoardPage';
import DealsManagementPage from './sales/DealsManagementPage';
import SalesRegistryPage from './sales/SalesRegistryPage';
import ListPageHeader from './shared/ListPageHeader';
import { canAccessNavItem } from './navigationConfig';
import {
    Search, Filter, Plus, Users, Building, MonitorSmartphone,
    TrendingUp, DollarSign, Target, Briefcase, ChevronRight,
    MoreVertical, FileText, Download, Mail, Phone, Calendar,
    Clock, CheckCircle, AlertCircle, PieChart as PieChartIcon,
    BarChart, ExternalLink, UserPlus, Zap, MessageSquare,
    ArrowUpRight, ArrowDownRight, Layout, X, Check, ShieldAlert
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, BarChart as RechartsBarChart,
    Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// Dummy Data
const pipelineStages = [
    { id: 'new', label: 'New Lead', color: '#64748b' },
    { id: 'contacted', label: 'Initial Contact', color: '#3b82f6' },
    { id: 'qualified', label: 'Qualified', color: '#8b5cf6' },
    { id: 'proposal', label: 'Proposal Sent', color: '#f59e0b' },
    { id: 'negotiation', label: 'Negotiation', color: '#ec4899' },
    { id: 'won', label: 'Deal Won', color: '#10b981' },
    { id: 'lost', label: 'Deal Lost', color: '#ef4444' }
];

const SalesManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('view') || 'dashboard';

    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showRecordSale, setShowRecordSale] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [leads, setLeads] = useState([]);
    const [deals, setDeals] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [quotationRequests, setQuotationRequests] = useState([]);
    const [activities, setActivities] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => apiClient.auth.getCurrentUser());

    useEffect(() => {
        let isMounted = true;
        apiClient.auth.getProfile()
            .then(profile => {
                if (isMounted && profile) setCurrentUser(profile);
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    const canViewCatalogue = canAccessNavItem(
        {
            permissions: [
                'royalsoftwares.view_productservice',
                'royalsoftwares.add_productservice',
                'pos.view_product',
                'pos.add_product',
                'royalsoftwares.can_manage_pricing'
            ],
            roles: ['Admin', 'Sales', 'Finance']
        },
        currentUser
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesResp, customersResp, productsResp, leadsResp, dealsResp, quotesResp, quoteReqsResp, actsResp] = await Promise.all([
                apiClient.royalsoftwares.sales.list().catch(() => []),
                apiClient.clients.list().catch(() => []),
                apiClient.get('/api/v1/royalsoftwares/products/').catch(() => []),
                apiClient.royalsoftwares.leads.list().catch(() => []),
                apiClient.royalsoftwares.deals.list().catch(() => []),
                apiClient.royalsoftwares.quotations.list().catch(() => []),
                apiClient.royalsoftwares.quotationRequests.list().catch(() => []),
                apiClient.royalsoftwares.activities.list().catch(() => []),
            ]);
            
            setSales(salesResp);
            setCustomers(customersResp);
            setProducts(productsResp?.results || productsResp || []);
            setLeads(leadsResp);
            setDeals(dealsResp);
            setQuotations(quotesResp);
            setQuotationRequests(quoteReqsResp);
            setActivities(actsResp);
            
            setError(null);
        } catch (err) {
            console.error("Failed to load CRM/Sales data:", err);
            setError("Failed to sync sales registry with backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRecordSaleSubmit = async (payload) => {
        setLoading(true);
        try {
            const newSale = await apiClient.sales.create(payload);
            setSales(prev => [newSale, ...prev]);
            setShowRecordSale(false);
            setError(null);
        } catch (err) {
            console.error("Failed to submit sale:", err);
            setError(err.message || "Failed to submit sale to backend. Check inventory levels.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate dynamic live revenue for dashboard
    const liveRevenue = sales.reduce((acc, sale) => acc + parseFloat(sale.total || 0), 0);
    const liveStats = [
        { label: 'Total Leads', value: '482', trend: '+12%', icon: <Users size={20} />, color: '#6366f1' },
        { label: 'Active Deals', value: '34', trend: '+5%', icon: <Target size={20} />, color: '#8b5cf6' },
        { label: 'Won Deals', value: String(sales.filter(s => s.status === 'COMPLETED' || s.status === 'completed').length || 18), trend: '+2%', icon: <CheckCircle size={20} />, color: '#10b981' },
        { label: 'Live Revenue', value: liveRevenue > 0 ? `$${liveRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$124.5k', trend: '+18%', icon: <DollarSign size={20} />, color: '#0ea5e9' },
    ];

    return (
        <div className="sales-main-container portal-module animations-fade-in">
            <style>{`
                .sales-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
                .sales-charts-grid { display: grid; grid-template-columns: 2fr 1fr; }
                .sales-reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
                .sales-docs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }

                @media (max-width: 1024px) {
                    .sales-charts-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .sales-header-section {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 15px;
                    }
                    .sales-sub-nav {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        width: 100% !important;
                        background: rgba(255, 255, 255, 0.95) !important;
                        backdrop-filter: blur(10px);
                        padding: 12px 10px !important;
                        box-shadow: 0 -8px 25px rgba(0,0,0,0.1) !important;
                        z-index: 1000;
                        border-radius: 20px 20px 0 0 !important;
                        display: flex !important;
                        justify-content: flex-start !important;
                        gap: 5px !important;
                        margin-bottom: 0 !important;
                        border-bottom: none !important;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }
                    .sales-sub-nav::-webkit-scrollbar { display: none; }
                    
                    .sales-sub-nav button {
                        flex: 0 0 auto;
                        flex-direction: column;
                        padding: 8px 12px !important;
                        font-size: 10px !important;
                        background: transparent !important;
                        color: #64748b !important;
                        min-width: 70px;
                        gap: 2px !important;
                    }
                    .sales-sub-nav button.active-sales-btn {
                        color: #6366f1 !important;
                    }
                    .sales-sub-nav button svg {
                        width: 20px !important;
                        height: 20px !important;
                    }
                    .sales-main-container {
                        padding-bottom: 90px !important;
                    }
                    .sales-stats-grid {
                        grid-template-columns: 1fr;
                    }
                    .leads-header {
                        flex-direction: column;
                        align-items: stretch !important;
                    }
                    .leads-actions {
                        flex-direction: column;
                    }
                    .search-container {
                        width: 100% !important;
                    }
                    .search-container input {
                        width: 100% !important;
                    }
                }

                @media (max-width: 640px) {
                    .sales-header-section h2 {
                        font-size: 1.5rem !important;
                    }
                }
            `}</style>
            {/* View Content */}
            {view === 'dashboard' && (
                <SalesOverviewDashboard 
                    leads={leads} 
                    deals={deals} 
                    quotations={quotations} 
                    rfqs={quotationRequests} 
                    onNavigateView={(v) => setSearchParams({ view: v })} 
                />
            )}

            {view === 'catalogue' && (
                canViewCatalogue ? (
                    <ProductsServicesCatalogue 
                        products={products} 
                        onRefresh={loadData} 
                        loading={loading}
                        user={currentUser}
                    />
                ) : (
                    <div className="portal-content-card animations-fade-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <ShieldAlert size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                            Access Restricted
                        </h3>
                        <p style={{ maxWidth: '440px', margin: '0 auto 20px', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                            You do not have permission to view or manage the Products & Services Catalogue. Please contact your system administrator if you require access.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSearchParams({ view: 'dashboard' })}
                            style={{ padding: '10px 22px', borderRadius: 8, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                        >
                            Return to Sales Overview
                        </button>
                    </div>
                )
            )}

            {view === 'rfqs' && (
                <RequestsForQuotationPage 
                    rfqs={quotationRequests} 
                    clients={customers} 
                    products={products} 
                    onRefresh={loadData} 
                    loading={loading} 
                />
            )}

            {view === 'quotations' && (
                <QuotationsListPage 
                    quotations={quotations} 
                    clients={customers} 
                    products={products} 
                    onRefresh={loadData} 
                    loading={loading} 
                />
            )}

            {view === 'activities' && (
                <ActivitiesFollowupsPage 
                    activities={activities} 
                    clients={customers} 
                    deals={deals} 
                    onRefresh={loadData} 
                    loading={loading} 
                />
            )}

            {view === 'communications' && (
                <CommunicationHistoryPage />
            )}

            {view === 'sales_registry' && (
                <SalesRegistryPage 
                    sales={sales} 
                    clients={customers} 
                    products={products} 
                    quotations={quotations}
                    onRefresh={loadData}
                    loading={loading}
                />
            )}

            {view === 'leads' && (
                <LeadsDirectoryPage 
                    leads={leads} 
                    onRefresh={loadData} 
                    loading={loading}
                />
            )}

            {view === 'pipeline' && (
                <PipelineBoardPage 
                    deals={deals} 
                    clients={customers}
                    onRefresh={loadData}
                    onNavigateToQuote={(deal) => setSearchParams({ view: 'quotations', dealId: deal?.id })}
                    onSwitchToTableView={() => setSearchParams({ view: 'deals' })}
                    loading={loading}
                />
            )}

            {view === 'deals' && (
                <DealsManagementPage 
                    deals={deals} 
                    clients={customers} 
                    onRefresh={loadData}
                    onNavigateToQuote={(deal) => setSearchParams({ view: 'quotations', dealId: deal?.id })}
                    onSwitchToKanbanView={() => setSearchParams({ view: 'pipeline' })}
                    loading={loading}
                />
            )}

            {view === 'reports' && <SalesReportsSection />}

            {view === 'documents' && <SalesDocumentsSection />}
        </div>
    );
};

// Sub-components
const SalesNavBtn = ({ icon, label, active, onClick, className }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px',
            border: 'none', background: active ? '#6366f1' : 'transparent',
            color: active ? 'white' : '#64748b', fontWeight: 600, fontSize: '14px',
            cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap'
        }}
        className={`${active ? '' : 'hover-bg-light'} ${className || ''}`}
    >
        {icon}
        {label}
    </button>
);

const SalesDashboard = ({ stats }) => {
    return (
        <div className="animations-fade-in">
            {/* Stats Grid */}
            <div className="sales-stats-grid" style={{ gap: '20px', marginBottom: '30px' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="portal-content-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {stat.icon}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '20px' }}>
                                {stat.trend}
                            </span>
                        </div>
                        <h4 style={{ margin: '15px 0 5px 0', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>{stat.label}</h4>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="sales-charts-grid" style={{ gap: '25px', marginBottom: '30px' }}>
                <div className="portal-content-card" style={{ padding: '25px' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Sales Performance</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={[
                                { name: 'Jan', sales: 4000 }, { name: 'Feb', sales: 3000 }, { name: 'Mar', sales: 5000 },
                                { name: 'Apr', sales: 4500 }, { name: 'May', sales: 6000 }, { name: 'Jun', sales: 8000 }
                            ]}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="portal-content-card" style={{ padding: '25px' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Lead Sources</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Website', value: 40 },
                                        { name: 'Referral', value: 25 },
                                        { name: 'Ads', value: 20 },
                                        { name: 'Social', value: 15 }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'].map((color, i) => <Cell key={i} fill={color} />)}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeadsSection = ({ leads = [], onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [source, setSource] = useState('Website');
    const [estimatedValue, setEstimatedValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [convertingId, setConvertingId] = useState(null);

    const handleCreateLead = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            setSubmitting(true);
            await apiClient.royalsoftwares.leads.create({
                name: name.trim(),
                company_name: companyName.trim() || undefined,
                source,
                estimated_value: parseFloat(estimatedValue) || 0,
                status: 'NEW'
            });
            setIsAddModalOpen(false);
            setName('');
            setCompanyName('');
            setEstimatedValue('');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to create lead:', err);
            alert('Could not save lead.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConvertToDeal = async (leadId) => {
        try {
            setConvertingId(leadId);
            const deal = await apiClient.royalsoftwares.leads.convertToDeal(leadId);
            alert(`Lead successfully converted to Deal "${deal.name}"! Client and pipeline deal have been established.`);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to convert lead:', err);
            alert('Could not convert lead to deal.');
        } finally {
            setConvertingId(null);
        }
    };

    const filteredLeads = leads.filter(l =>
        (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.source || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="portal-content-card animations-fade-in" style={{ padding: '25px' }}>
            <div className="leads-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Sales Leads</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Inbound prospects, referrals, and qualifying opportunities</p>
                </div>
                <div className="leads-actions" style={{ display: 'flex', gap: '10px' }}>
                    <div className="search-container" style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px 10px 10px 35px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', width: '250px' }}
                        />
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={18} /> Add Lead
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Lead Name & Company</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Acquisition Source</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Assigned Agent</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Estimated Value</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    No leads recorded. Click "Add Lead" to capture your first opportunity.
                                </td>
                            </tr>
                        ) : (
                            filteredLeads.map((lead) => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-bg-light">
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{lead.name}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{lead.company_name || 'Individual Prospect'}</div>
                                    </td>
                                    <td style={{ padding: '15px', fontSize: '14px', color: '#475569' }}>{lead.source || 'Direct Outreach'}</td>
                                    <td style={{ padding: '15px', fontSize: '14px', color: '#475569' }}>{lead.assigned_to_name || 'Unassigned'}</td>
                                    <td style={{ padding: '15px', fontWeight: 700, color: '#0f766e' }}>
                                        KES {Number(lead.estimated_value || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                            background: lead.status === 'QUALIFIED' ? '#ecfdf5' : '#eff6ff',
                                            color: lead.status === 'QUALIFIED' ? '#10b981' : '#6366f1'
                                        }}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {lead.status !== 'QUALIFIED' ? (
                                                <button
                                                    onClick={() => handleConvertToDeal(lead.id)}
                                                    disabled={convertingId === lead.id}
                                                    title="Promote this lead to an active client and pipeline deal"
                                                    style={{
                                                        background: '#ecfdf5',
                                                        color: '#047857',
                                                        border: '1px solid #a7f3d0',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Zap size={13} /> {convertingId === lead.id ? 'Converting...' : 'Convert to Deal'}
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <Check size={14} /> Active Deal
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Lead Modal */}
            {isAddModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Capture New Sales Lead</span>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLead}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Contact / Lead Name <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Dr. Catherine Nduta"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Company or Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g. Apex Health Logistics Ltd"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Lead Source
                                        </label>
                                        <select
                                            value={source}
                                            onChange={(e) => setSource(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                        >
                                            <option value="Website">Website Inbound</option>
                                            <option value="Referral">Client Referral</option>
                                            <option value="LinkedIn">LinkedIn / Social</option>
                                            <option value="Direct Outreach">Direct Call / Outreach</option>
                                            <option value="Conference">Conference / Event</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Estimated Value (KES)
                                        </label>
                                        <input
                                            type="number"
                                            value={estimatedValue}
                                            onChange={(e) => setEstimatedValue(e.target.value)}
                                            placeholder="e.g. 250000"
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-planner-quick primary">
                                    {submitting ? 'Saving...' : 'Add Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PipelineBoard = ({ deals = [], stages = [], onRefresh, onNavigateToQuote }) => {
    const handleUpdateStage = async (dealId, newStage) => {
        try {
            await apiClient.royalsoftwares.deals.updateStage(dealId, newStage);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to advance deal stage:', err);
            alert('Could not update deal stage.');
        }
    };

    return (
        <div className="portal-page-container animations-fade-in">
            <ListPageHeader
                title="Commercial Pipeline Board"
                subtitle="Visual Kanban stage progression across qualification, proposal, negotiation, and closing."
                primaryAction={{
                    label: 'Create New Deal',
                    icon: Plus,
                    onClick: () => onNavigateToQuote ? onNavigateToQuote(null) : null
                }}
            />
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '620px', marginTop: '1rem' }}>
                {stages.map(stage => {
                const stageDeals = deals.filter(d => (d.stage || '').toLowerCase() === stage.id);
                const stageTotalVal = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
                return (
                    <div key={stage.id} style={{ minWidth: '310px', flex: 1, background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b' }}>
                                    {stage.label}
                                </h4>
                                <span style={{ background: '#ffffff', color: '#475569', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    {stageDeals.length}
                                </span>
                            </div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '14px' }}>
                            Volume: KES {stageTotalVal.toLocaleString()}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {stageDeals.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                                    No deals in this stage
                                </div>
                            ) : (
                                stageDeals.map(deal => (
                                    <div
                                        key={deal.id}
                                        className="portal-content-card"
                                        style={{
                                            padding: '16px',
                                            borderLeft: `4px solid ${stage.color}`,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                                                DEAL #{deal.id}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700, background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                                                {deal.probability_percentage || 0}%
                                            </span>
                                        </div>

                                        <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                            {deal.name}
                                        </h5>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                                            🏢 {deal.client_name || 'Client Account'}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f766e' }}>
                                                KES {Number(deal.value || 0).toLocaleString()}
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                👤 {deal.assigned_to_name || 'Agent'}
                                            </span>
                                        </div>

                                        {/* Stage Switcher Controls */}
                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Stage:</span>
                                                <select
                                                    value={(deal.stage || '').toUpperCase()}
                                                    onChange={(e) => handleUpdateStage(deal.id, e.target.value)}
                                                    style={{
                                                        fontSize: '11px',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #cbd5e1',
                                                        background: deal.stage === 'WON' ? '#ecfdf5' : '#ffffff',
                                                        color: deal.stage === 'WON' ? '#047857' : '#1e293b',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {stages.map(s => (
                                                        <option key={s.id} value={s.id.toUpperCase()}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {deal.stage === 'WON' && (
                                                <button
                                                    onClick={() => onNavigateToQuote && onNavigateToQuote(deal)}
                                                    style={{
                                                        marginTop: '8px',
                                                        width: '100%',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #6ee7b7',
                                                        background: '#ecfdf5',
                                                        color: '#047857',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <FileText size={13} /> Generate Quotation
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
            </div>
        </div>
    );
};

const DealsManagementSection = ({ deals = [], clients = [], onRefresh, onNavigateToQuote }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [clientId, setClientId] = useState('');
    const [value, setValue] = useState('');
    const [stage, setStage] = useState('NEW');
    const [probability, setProbability] = useState('20');
    const [submitting, setSubmitting] = useState(false);

    const handleCreateDeal = async (e) => {
        e.preventDefault();
        if (!name.trim() || !clientId) {
            alert('Please fill Deal Name and select a Client.');
            return;
        }
        try {
            setSubmitting(true);
            await apiClient.royalsoftwares.deals.create({
                name: name.trim(),
                client: clientId,
                value: parseFloat(value) || 0,
                stage,
                probability_percentage: parseInt(probability) || 0
            });
            setIsAddModalOpen(false);
            setName('');
            setValue('');
            setClientId('');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to create deal:', err);
            alert('Could not save deal.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="portal-content-card animations-fade-in" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Active Sales Deals</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Complete transaction registry and probability forecast</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px' }}>
                    <Target size={18} style={{ marginRight: '8px' }} /> Create Deal
                </button>
            </div>

            <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Deal Name & Client</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Deal Value</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Pipeline Stage</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Win Probability</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Assigned Agent</th>
                            <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deals.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    No deals currently open. Convert a lead or click "Create Deal".
                                </td>
                            </tr>
                        ) : (
                            deals.map((deal) => (
                                <tr key={deal.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-bg-light">
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{deal.name}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{deal.client_name || 'Client Account'}</div>
                                    </td>
                                    <td style={{ padding: '15px', fontWeight: 700, color: '#0f766e', fontSize: '14px' }}>
                                        KES {Number(deal.value || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                            background: deal.stage === 'WON' ? '#ecfdf5' : '#f1f5f9',
                                            color: deal.stage === 'WON' ? '#047857' : '#475569'
                                        }}>
                                            {(deal.stage || '').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', width: '60px' }}>
                                                <div style={{ width: `${deal.probability_percentage || 0}%`, height: '100%', background: '#6366f1', borderRadius: '3px' }} />
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>{deal.probability_percentage || 0}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', fontSize: '13px', color: '#475569' }}>
                                        {deal.assigned_to_name || 'Unassigned'}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <button
                                            onClick={() => onNavigateToQuote && onNavigateToQuote(deal)}
                                            style={{
                                                background: '#f0fdfa',
                                                color: '#0f766e',
                                                border: '1px solid #ccfbf1',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <FileText size={13} /> Quotation
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Deal Modal */}
            {isAddModalOpen && (
                <div className="planner-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="planner-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="planner-modal-header">
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Create Sales Deal</span>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateDeal}>
                            <div className="planner-modal-body">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Deal Title <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Enterprise Cloud ERP Deployment"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                        Client Account <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                        required
                                    >
                                        <option value="">Select Client...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Deal Value (KES)
                                        </label>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="e.g. 500000"
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                            Pipeline Stage
                                        </label>
                                        <select
                                            value={stage}
                                            onChange={(e) => setStage(e.target.value)}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                        >
                                            <option value="NEW">New</option>
                                            <option value="CONTACTED">Contacted</option>
                                            <option value="QUALIFIED">Qualified</option>
                                            <option value="PROPOSAL">Proposal Sent</option>
                                            <option value="NEGOTIATION">Negotiation</option>
                                            <option value="WON">Deal Won</option>
                                            <option value="LOST">Deal Lost</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="planner-modal-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-planner-quick">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-planner-quick primary">
                                    {submitting ? 'Saving...' : 'Create Deal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const QuotationsSection = ({ quotations, quotationRequests, clients = [], products = [], onRefresh }) => {
    const [tab, setTab] = useState('active');
    const [selectedQuotationForDoc, setSelectedQuotationForDoc] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeRfqForConvert, setActiveRfqForConvert] = useState(null);
    const [convertingId, setConvertingId] = useState(null);

    const handleConvertToInvoice = async (qt) => {
        if (!window.confirm(`Convert Quotation ${qt.quotation_number} into a live accounting Invoice in Finance?`)) return;
        try {
            setConvertingId(qt.id);
            const res = await apiClient.royalsoftwares.quotations.convertToInvoice(qt.id);
            alert(`✅ Invoice ${res?.invoice_number || 'created'} generated successfully in Finance!`);
            if (onRefresh) onRefresh();
        } catch (err) {
            alert(err?.response?.data?.detail || err?.message || 'Failed to convert quotation to invoice');
        } finally {
            setConvertingId(null);
        }
    };

    const handleOpenCreateNew = () => {
        setActiveRfqForConvert(null);
        setShowCreateModal(true);
    };

    const handleConvertRfq = (rfq) => {
        setActiveRfqForConvert(rfq);
        setShowCreateModal(true);
    };

    const handleQuotationCreated = (newQuotation) => {
        if (onRefresh) onRefresh();
        if (newQuotation) {
            setSelectedQuotationForDoc(newQuotation);
        }
    };

    return (
        <div className="portal-content-card animations-fade-in" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <h3 
                        style={{ margin: 0, cursor: 'pointer', color: tab === 'active' ? '#1e293b' : '#94a3b8', borderBottom: tab === 'active' ? '2px solid #0f766e' : 'none', paddingBottom: '5px' }}
                        onClick={() => setTab('active')}
                    >
                        Sales Quotations
                    </h3>
                    <h3 
                        style={{ margin: 0, cursor: 'pointer', color: tab === 'requests' ? '#1e293b' : '#94a3b8', borderBottom: tab === 'requests' ? '2px solid #0f766e' : 'none', paddingBottom: '5px' }}
                        onClick={() => setTab('requests')}
                    >
                        Quotation Requests (RFQs)
                    </h3>
                </div>
                {tab === 'active' && (
                    <button onClick={handleOpenCreateNew} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px' }}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> New Quotation
                    </button>
                )}
            </div>

            {tab === 'active' && (
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}><th style={{ padding: '15px' }}>Quotation #</th><th style={{ padding: '15px' }}>Client</th><th style={{ padding: '15px' }}>Date</th><th style={{ padding: '15px' }}>Expiry</th><th style={{ padding: '15px' }}>Total Amount</th><th style={{ padding: '15px' }}>Status</th><th style={{ padding: '15px' }}>Actions</th></tr></thead>
                        <tbody>{quotations.map((qt) => (
                            <tr key={qt.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-bg-light">
                                <td style={{ padding: '15px', fontWeight: 600 }}>{qt.quotation_number}</td>
                                <td style={{ padding: '15px' }}>{qt.client_name}</td>
                                <td style={{ padding: '15px', color: '#64748b' }}>{qt.issue_date}</td>
                                <td style={{ padding: '15px', color: '#64748b' }}>{qt.expiry_date || '30 Days'}</td>
                                <td style={{ padding: '15px', fontWeight: 700, color: '#0f766e' }}>KES {Number(qt.total_amount || 0).toLocaleString()}</td>
                                <td style={{ padding: '15px' }}><QuotationStatusBadge status={qt.status} /></td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => setSelectedQuotationForDoc(qt)} 
                                            title="Generate / Download Official Quotation Document" 
                                            style={{ background: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                                        >
                                            <FileText size={14} /> PDF
                                        </button>
                                        <button 
                                            onClick={() => setSelectedQuotationForDoc(qt)} 
                                            title="Send via Email or WhatsApp" 
                                            style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569' }}
                                        >
                                            <Mail size={14} /> Dispatch
                                        </button>
                                        <button 
                                            onClick={() => handleConvertToInvoice(qt)} 
                                            disabled={convertingId === qt.id}
                                            title="Convert to Accounting Invoice" 
                                            style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                                        >
                                            <DollarSign size={14} /> {convertingId === qt.id ? '...' : 'Invoice'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {tab === 'requests' && (
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}><th style={{ padding: '15px' }}>Date</th><th style={{ padding: '15px' }}>Client</th><th style={{ padding: '15px' }}>Subject</th><th style={{ padding: '15px' }}>Description</th><th style={{ padding: '15px' }}>Status</th><th style={{ padding: '15px' }}>Actions</th></tr></thead>
                        <tbody>{(quotationRequests || []).map((req) => (
                            <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-bg-light">
                                <td style={{ padding: '15px', color: '#64748b' }}>{req.date_requested}</td>
                                <td style={{ padding: '15px', fontWeight: 600 }}>{req.client_name}</td>
                                <td style={{ padding: '15px' }}>{req.subject}</td>
                                <td style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>{req.description?.substring(0, 50)}{req.description?.length > 50 ? '...' : ''}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        background: req.status === 'PENDING' ? '#fef3c7' : req.status === 'RESPONDED' ? '#dcfce7' : '#f1f5f9',
                                        color: req.status === 'PENDING' ? '#d97706' : req.status === 'RESPONDED' ? '#15803d' : '#64748b'
                                    }}>
                                        {req.status === 'RESPONDED' ? 'QUOTED' : req.status}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    {req.status === 'PENDING' ? (
                                        <button 
                                            onClick={() => handleConvertRfq(req)} 
                                            className="btn-primary" 
                                            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                                        >
                                            Convert to Quotation
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleConvertRfq(req)} 
                                            className="btn-text" 
                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                        >
                                            Re-quote / Edit
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {/* Document Design Studio Generator & Dispatch Modal */}
            <GenerateQuotationModal
                quotation={selectedQuotationForDoc}
                isOpen={Boolean(selectedQuotationForDoc)}
                onClose={() => setSelectedQuotationForDoc(null)}
                onGenerated={() => {
                    if (onRefresh) onRefresh();
                }}
            />

            {/* Create & Convert Quotation Modal */}
            <CreateQuotationModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setActiveRfqForConvert(null);
                }}
                onCreated={handleQuotationCreated}
                clients={clients}
                products={products}
                rfq={activeRfqForConvert}
            />
        </div>
    );
};

const QuotationStatusBadge = ({ status }) => {
    let bg = '#f1f5f9', color = '#64748b';
    const s = (status || '').toUpperCase();
    if (s === 'ACCEPTED') { bg = '#ecfdf5'; color = '#10b981'; } else if (s === 'SENT') { bg = '#eff6ff'; color = '#3b82f6'; } else if (s === 'DRAFT') { bg = '#f8fafc'; color = '#94a3b8'; } else { bg = '#fef2f2'; color = '#ef4444'; }
    return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: bg, color: color }}>{status}</span>;
};

const SalesActivitiesSection = ({ activities = [], clients = [], deals = [], quotations = [], onRefresh }) => {
    const [filterType, setFilterType] = useState('ALL');
    const [selectedTab, setSelectedTab] = useState('activities'); // 'activities' | 'communications'
    const [commLogs, setCommLogs] = useState([]);
    const [loadingComm, setLoadingComm] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [newType, setNewType] = useState('CALL');
    const [newClient, setNewClient] = useState('');
    const [newDeal, setNewDeal] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newDueDate, setNewDueDate] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [savingActivity, setSavingActivity] = useState(false);

    useEffect(() => {
        if (selectedTab === 'communications') {
            loadCommunications();
        }
    }, [selectedTab]);

    const loadCommunications = async () => {
        try {
            setLoadingComm(true);
            const data = await apiClient.get('/api/v1/clients_management/communications/');
            setCommLogs(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to load communication logs:', err);
        } finally {
            setLoadingComm(false);
        }
    };

    const handleToggleStatus = async (actId) => {
        try {
            await apiClient.royalsoftwares.activities.toggleStatus(actId);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to toggle activity status:', err);
        }
    };

    const handleCreateActivity = async (e) => {
        e.preventDefault();
        try {
            setSavingActivity(true);
            const payload = {
                activity_type: newType,
                client: newClient || null,
                deal: newDeal || null,
                date: newDate,
                due_date: newDueDate || null,
                notes: newNotes,
                status: 'PENDING'
            };
            await apiClient.royalsoftwares.activities.create(payload);
            setShowLogModal(false);
            setNewNotes('');
            if (onRefresh) onRefresh();
        } catch (err) {
            alert(err.message || 'Failed to save activity');
        } finally {
            setSavingActivity(false);
        }
    };

    const filteredActivities = activities.filter(act => {
        if (filterType === 'ALL') return true;
        return act.activity_type === filterType;
    });

    return (
        <div className="portal-content-card animations-fade-in" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <h3 
                        style={{ margin: 0, cursor: 'pointer', color: selectedTab === 'activities' ? '#1e293b' : '#94a3b8', borderBottom: selectedTab === 'activities' ? '2px solid #0f766e' : 'none', paddingBottom: '6px' }}
                        onClick={() => setSelectedTab('activities')}
                    >
                        Sales Follow-ups & Reminders
                    </h3>
                    <h3 
                        style={{ margin: 0, cursor: 'pointer', color: selectedTab === 'communications' ? '#1e293b' : '#94a3b8', borderBottom: selectedTab === 'communications' ? '2px solid #0f766e' : 'none', paddingBottom: '6px' }}
                        onClick={() => setSelectedTab('communications')}
                    >
                        Unified Communication History
                    </h3>
                </div>

                {selectedTab === 'activities' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['ALL', 'CALL', 'MEETING', 'EMAIL', 'WHATSAPP'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '15px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        border: '1px solid #e2e8f0',
                                        background: filterType === t ? '#0f766e' : '#ffffff',
                                        color: filterType === t ? '#ffffff' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowLogModal(true)}
                            className="btn-primary"
                            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Plus size={14} /> Log Follow-up
                        </button>
                    </div>
                )}
            </div>

            {selectedTab === 'communications' ? (
                <div>
                    {loadingComm ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
                            Loading unified communication records...
                        </div>
                    ) : commLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748b' }}>
                            No email or message dispatches recorded yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {commLogs.map(log => (
                                <div key={log.id} style={{ display: 'flex', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{
                                        padding: '10px',
                                        borderRadius: '10px',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        color: log.channel === 'EMAIL' ? '#2563eb' : log.channel === 'WHATSAPP' ? '#16a34a' : '#d97706',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '38px',
                                        height: '38px'
                                    }}>
                                        {log.channel === 'EMAIL' ? <Mail size={18} /> : log.channel === 'WHATSAPP' ? <MessageSquare size={18} /> : <Phone size={18} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>
                                                {log.subject || `${log.channel} dispatch to ${log.client_name}`}
                                            </span>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: log.status === 'SENT' || log.status === 'DELIVERED' ? '#dcfce7' : log.status === 'FAILED' ? '#fee2e2' : '#f1f5f9',
                                                color: log.status === 'SENT' || log.status === 'DELIVERED' ? '#15803d' : log.status === 'FAILED' ? '#b91c1c' : '#64748b'
                                            }}>
                                                {log.status}
                                            </span>
                                        </div>
                                        <p style={{ margin: '6px 0', fontSize: '12.5px', color: '#475569', whiteSpace: 'pre-line' }}>
                                            {log.message}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8' }}>
                                            <span>Recipient: {log.client_name} • Dispatched by {log.sender_name || 'Staff'}</span>
                                            <span>{new Date(log.created_on).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredActivities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
                            No follow-up activities recorded under this filter.
                        </div>
                    ) : (
                        filteredActivities.map(act => (
                            <div key={act.id} style={{ display: 'flex', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                                <div style={{
                                    padding: '10px',
                                    borderRadius: '10px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    color: act.activity_type === 'CALL' ? '#2563eb' : act.activity_type === 'MEETING' ? '#7c3aed' : act.activity_type === 'WHATSAPP' ? '#16a34a' : '#0f766e'
                                }}>
                                    {act.activity_type === 'CALL' ? <Phone size={18} /> : act.activity_type === 'MEETING' ? <Users size={18} /> : act.activity_type === 'WHATSAPP' ? <MessageSquare size={18} /> : <Mail size={18} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{act.activity_type}: {act.client_name || 'Client Follow-up'}</span>
                                            {act.deal_name && <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>({act.deal_name})</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: act.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                                                color: act.status === 'COMPLETED' ? '#15803d' : '#d97706'
                                            }}>
                                                {act.status || 'PENDING'}
                                            </span>
                                            <button
                                                onClick={() => handleToggleStatus(act.id)}
                                                className="btn-secondary-outline"
                                                style={{ fontSize: '11px', padding: '2px 8px', cursor: 'pointer' }}
                                                title="Toggle completion status"
                                            >
                                                {act.status === 'COMPLETED' ? 'Re-open' : 'Mark Done'}
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ margin: '6px 0', fontSize: '13px', color: '#475569' }}>{act.notes || 'No specific agenda remarks recorded.'}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8' }}>
                                        <span>Logged by: {act.agent_name || 'Staff'} • Date: {act.date} {act.time || ''}</span>
                                        {act.due_date && <span style={{ color: '#d97706', fontWeight: 600 }}>Due: {act.due_date}</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Quick Activity Modal */}
            {showLogModal && (
                <div className="doc-modal-overlay" onClick={() => setShowLogModal(false)}>
                    <div className="doc-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="doc-modal-header">
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Log Sales Follow-up Activity</h3>
                            <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateActivity}>
                            <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                <div className="prop-form-group">
                                    <label>Activity Channel / Type</label>
                                    <select value={newType} onChange={e => setNewType(e.target.value)} className="prop-input">
                                        <option value="CALL">Phone Call</option>
                                        <option value="MEETING">Client Meeting</option>
                                        <option value="WHATSAPP">WhatsApp Follow-up</option>
                                        <option value="EMAIL">Email Dispatch</option>
                                        <option value="NOTE">Internal Milestone Note</option>
                                    </select>
                                </div>
                                <div className="prop-form-group">
                                    <label>Client</label>
                                    <select value={newClient} onChange={e => setNewClient(e.target.value)} className="prop-input">
                                        <option value="">-- Select Client --</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="prop-form-group">
                                    <label>Related Deal (Optional)</label>
                                    <select value={newDeal} onChange={e => setNewDeal(e.target.value)} className="prop-input">
                                        <option value="">-- None --</option>
                                        {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div className="prop-form-group">
                                        <label>Date Conducted</label>
                                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="prop-input" required />
                                    </div>
                                    <div className="prop-form-group">
                                        <label>Follow-up Due Date</label>
                                        <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="prop-input" />
                                    </div>
                                </div>
                                <div className="prop-form-group">
                                    <label>Meeting Remarks & Action Items</label>
                                    <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={3} className="prop-input" style={{ resize: 'vertical' }} required />
                                </div>
                            </div>
                            <div className="doc-modal-footer">
                                <button type="button" onClick={() => setShowLogModal(false)} className="btn-secondary-outline">Cancel</button>
                                <button type="submit" disabled={savingActivity} className="btn-primary-teal">{savingActivity ? 'Saving...' : 'Save Activity'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SalesReportsSection = () => (
    <div className="animations-fade-in">
        <div className="sales-reports-grid" style={{ gap: '20px', marginBottom: '25px' }}>
            <div className="portal-content-card" style={{ padding: '25px' }}><h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Revenue Forecast</h3><div style={{ height: '200px' }}><ResponsiveContainer width="100%" height="100%" minWidth={0}><RechartsBarChart data={[{ name: 'Commit', value: 45000 }, { name: 'Probable', value: 32000 }, { name: 'Best Case', value: 68000 }]}><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis hide /><Tooltip /><Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} /></RechartsBarChart></ResponsiveContainer></div></div>
            <div className="portal-content-card" style={{ padding: '25px' }}><h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Top Agents</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}><AgentPerformanceRow name="Alex Smith" deals="12" revenue="$84,000" color="#6366f1" percent={85} /><AgentPerformanceRow name="Maria Garcia" deals="8" revenue="$52,000" color="#8b5cf6" percent={60} /></div></div>
        </div>
    </div>
);

const AgentPerformanceRow = ({ name, deals, revenue, color, percent }) => (
    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{name}</span><span>{deals} Deals • <strong>{revenue}</strong></span></div><div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '3px' }} /></div></div>
);

const SalesDocumentsSection = () => (
    <div className="portal-content-card animations-fade-in" style={{ padding: '25px' }}>
        <h3 style={{ margin: '0 0 25px 0' }}>Sales Assets & Documents</h3>
        <div className="sales-docs-grid" style={{ gap: '15px' }}>
            {['Proposal_Template.docx', 'Product_Manual_v2.pdf', 'Sales_Deck_2026.pptx'].map((doc, i) => (
                <div key={i} style={{ padding: '20px', border: '1px solid #f1f5f9', borderRadius: '15px', textAlign: 'center' }} className="hover-bg-light">
                    <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: '#6366f1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}><FileText size={24} /></div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>{doc}</div>
                    <button className="btn-text" style={{ fontSize: '12px' }}><Download size={14} style={{ marginRight: '5px' }} /> Download</button>
                </div>
            ))}
        </div>
    </div>
);

export default SalesManagement;

const SalesRegistrySection = ({ sales, onAddNew, loading, error }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = sales.filter(sale => {
        const matchesSearch = 
            (sale.sale_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sale.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sale.cashier_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="portal-content-card animations-fade-in" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Sales Registry</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Live ERP transaction ledger</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                        <input 
                            type="text" 
                            placeholder="Search transactions..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px 10px 10px 35px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', width: '250px', background: 'white' }} 
                        />
                    </div>
                    <button className="btn-primary" onClick={onAddNew} style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Record Sale
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#ef4444', marginBottom: '20px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading transactions...</div>
            ) : (
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Sale Number</th>
                                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Customer</th>
                                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Cashier</th>
                                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Payment</th>
                                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Total</th>
                                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No recorded transactions found.</td>
                                </tr>
                            ) : (
                                filtered.map((sale) => (
                                    <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-bg-light">
                                        <td style={{ padding: '15px', fontWeight: 700, color: '#6366f1' }}>{sale.sale_number}</td>
                                        <td style={{ padding: '15px', fontSize: '14px', fontWeight: 600 }}>{sale.customer_name || 'Walk-in Customer'}</td>
                                        <td style={{ padding: '15px', fontSize: '14px', color: '#64748b' }}>{sale.cashier_name || 'System Cashier'}</td>
                                        <td style={{ padding: '15px', fontSize: '14px', color: '#64748b' }}>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}</td>
                                        <td style={{ padding: '15px', fontSize: '14px' }}>
                                            <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '12px' }}>
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', fontWeight: 800, color: '#1e293b' }}>${parseFloat(sale.total || 0).toFixed(2)}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                                background: (sale.status === 'COMPLETED' || sale.status === 'completed') ? '#ecfdf5' : '#fffbeb',
                                                color: (sale.status === 'COMPLETED' || sale.status === 'completed') ? '#10b981' : '#f59e0b'
                                            }}>{sale.status || 'Completed'}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const RecordSaleForm = ({ onCancel, onSave, customers, products }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [taxPercentage, setTaxPercentage] = useState(16); // Default standard VAT 16%
    const [notes, setNotes] = useState('');
    
    // Cart management
    const [cart, setCart] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [customPrice, setCustomPrice] = useState('');
    const [formError, setFormError] = useState(null);

    // Watch selected product to prefill selling price
    const handleProductChange = (productId) => {
        setSelectedProductId(productId);
        const prod = products.find(p => String(p.id) === String(productId));
        if (prod) {
            setCustomPrice(prod.selling_price || '');
        } else {
            setCustomPrice('');
        }
    };

    const addToCart = () => {
        if (!selectedProductId) {
            setFormError("Please select a product first.");
            return;
        }
        const prod = products.find(p => String(p.id) === String(selectedProductId));
        if (!prod) return;

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            setFormError("Quantity must be greater than zero.");
            return;
        }

        const price = parseFloat(customPrice || prod.selling_price || 0);
        
        // Check if item already in cart
        const existingIdx = cart.findIndex(item => String(item.productId) === String(selectedProductId));
        if (existingIdx > -1) {
            const updatedCart = [...cart];
            updatedCart[existingIdx].quantity += qty;
            updatedCart[existingIdx].subtotal = updatedCart[existingIdx].quantity * updatedCart[existingIdx].unitPrice;
            setCart(updatedCart);
        } else {
            setCart([...cart, {
                productId: prod.id,
                name: prod.name,
                sku: prod.sku,
                quantity: qty,
                unitPrice: price,
                subtotal: qty * price
            }]);
        }

        // Reset item input
        setSelectedProductId('');
        setQuantity(1);
        setCustomPrice('');
        setFormError(null);
    };

    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    // Calculate totals
    const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmt = (cartSubtotal * parseFloat(discountPercentage || 0)) / 100;
    const netTotal = cartSubtotal - discountAmt;
    const taxAmt = (netTotal * parseFloat(taxPercentage || 0)) / 100;
    const cartTotal = netTotal + taxAmt;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            setFormError("Your cart is empty. Please add at least one product.");
            return;
        }

        onSave({
            customer: selectedCustomerId || null,
            payment_method: paymentMethod,
            discount_percentage: parseFloat(discountPercentage || 0),
            tax_percentage: parseFloat(taxPercentage || 0),
            notes,
            items: cart.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice
            }))
        });
    };

    return (
        <form onSubmit={handleSubmit} className="portal-content-card animations-fade-in" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Record Sales Transaction</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Post a checkout sale directly to ERP</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '10px', fontWeight: 600 }}>Submit Sale</button>
                </div>
            </div>

            {formError && (
                <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#ef4444', marginBottom: '20px', fontSize: '14px' }}>
                    {formError}
                </div>
            )}

            <div className="form-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {/* Customer and General Details */}
                    <div className="card-section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#6366f1' }}>1. Customer & Payment</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Customer (Optional)</label>
                                <select 
                                    value={selectedCustomerId} 
                                    onChange={e => setSelectedCustomerId(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}
                                >
                                    <option value="">Walk-in Customer / Guest</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Payment Method</label>
                                <select 
                                    value={paymentMethod} 
                                    onChange={e => setPaymentMethod(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="M-Pesa">M-Pesa Mobile Money</option>
                                    <option value="Card">Credit/Debit Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Add Items Section */}
                    <div className="card-section" style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '15px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#6366f1' }}>2. Add Products to Sale</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Select Product</label>
                                <select 
                                    value={selectedProductId} 
                                    onChange={e => handleProductChange(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}
                                >
                                    <option value="">-- Choose Product --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (Stock: {p.stock_quantity}) - ${parseFloat(p.selling_price || 0).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Quantity</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    step="any"
                                    value={quantity} 
                                    onChange={e => setQuantity(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Price (ea)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={customPrice} 
                                    onChange={e => setCustomPrice(e.target.value)}
                                    placeholder="0.00"
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={addToCart}
                                className="btn-primary" 
                                style={{ padding: '12px 20px', borderRadius: '8px', fontWeight: 600 }}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="card-section">
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569' }}>Cart Items</h4>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Product</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Qty</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Subtotal</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No items in cart yet.</td>
                                        </tr>
                                    ) : (
                                        cart.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px', fontWeight: 600 }}>{item.name}</td>
                                                <td style={{ padding: '10px', textAlign: 'right' }}>{item.quantity}</td>
                                                <td style={{ padding: '10px', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>${item.subtotal.toFixed(2)}</td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeFromCart(idx)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Totals Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div className="portal-content-card" style={{ padding: '25px', background: '#f8fafc', border: 'none' }}>
                        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Checkout Summary</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#64748b' }}>Subtotal:</span>
                                <span style={{ fontWeight: 600 }}>${cartSubtotal.toFixed(2)}</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Discount (%)</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    value={discountPercentage} 
                                    onChange={e => setDiscountPercentage(Number(e.target.value))}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Tax (%)</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    value={taxPercentage} 
                                    onChange={e => setTaxPercentage(Number(e.target.value))}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}
                                />
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#64748b' }}>Discount Amount:</span>
                                <span style={{ color: '#ef4444' }}>-${discountAmt.toFixed(2)}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#64748b' }}>Tax Amount:</span>
                                <span>+${taxAmt.toFixed(2)}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: '#1e293b', marginTop: '10px' }}>
                                <span>Grand Total:</span>
                                <span style={{ color: '#6366f1' }}>${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card-section">
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569' }}>Transaction Notes</h4>
                        <textarea 
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '100px', fontSize: '14px', background: 'white' }} 
                            placeholder="Add memo or comments here..." 
                        />
                    </div>
                </div>
            </div>
        </form>
    );
};
