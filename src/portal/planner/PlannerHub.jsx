import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

import PlannerDashboard from './PlannerDashboard';
import MyDayView from './MyDayView';
import TaskManagementView from './TaskManagementView';
import CalendarView from './CalendarView';
import ProjectsView from './ProjectsView';
import HabitsTrackerView from './HabitsTrackerView';
import MeetingsView from './MeetingsView';
import GoalsView from './GoalsView';
import NotesView from './NotesView';
import ProductivityAnalyticsView from './ProductivityAnalyticsView';
import TaskDetailModal from './TaskDetailModal';

import './planner.css';

const PlannerHub = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'dashboard';

    // Global Project context for selects
    const [projects, setProjects] = useState([]);

    // Global Task Detail Modal
    const [modalTask, setModalTask] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    useEffect(() => {
        loadProjects();

        // Listen for topbar quick actions (+ New Goal / + New Task / etc.)
        const handleQuickAction = (e) => {
            const type = e.detail?.type;
            if (type === 'task') {
                handleOpenCreateTask();
            } else if (type === 'goal') {
                setSearchParams({ view: 'goals', create: 'true' });
            } else if (type === 'project') {
                setSearchParams({ view: 'projects', create: 'true' });
            } else if (type === 'meeting') {
                setSearchParams({ view: 'meetings', create: 'true' });
            } else if (type === 'note') {
                setSearchParams({ view: 'notes', create: 'true' });
            } else {
                handleOpenCreateTask();
            }
        };

        window.addEventListener('planner:openCreate', handleQuickAction);
        return () => window.removeEventListener('planner:openCreate', handleQuickAction);
    }, []);

    const loadProjects = async () => {
        try {
            const data = await apiClient.planner.projects.list();
            setProjects(data);
        } catch (err) {
            console.error('Failed to pre-fetch projects in PlannerHub:', err);
        }
    };

    const handleNavigateView = (viewKey) => {
        setSearchParams({ view: viewKey });
    };

    const handleOpenCreateTask = () => {
        setModalTask(null);
        setIsTaskModalOpen(true);
    };

    const handleSelectTask = (task) => {
        setModalTask(task);
        setIsTaskModalOpen(true);
    };

    const handleTaskSaved = () => {
        window.dispatchEvent(new CustomEvent('planner:taskUpdated'));
    };

    return (
        <div className="planner-hub-wrapper">
            {/* View Dispatcher */}
            {currentView === 'dashboard' && (
                <PlannerDashboard
                    onNavigateView={handleNavigateView}
                    onOpenCreateTask={handleOpenCreateTask}
                />
            )}

            {currentView === 'my-day' && (
                <MyDayView
                    onSelectTask={handleSelectTask}
                />
            )}

            {(currentView === 'tasks' || currentView === 'my-tasks' || currentView === 'team') && (
                <TaskManagementView
                    onSelectTask={handleSelectTask}
                    onOpenCreateTask={handleOpenCreateTask}
                />
            )}

            {currentView === 'calendar' && (
                <CalendarView
                    projects={projects}
                />
            )}

            {(currentView === 'projects' || currentView === 'work') && (
                <ProjectsView
                    onSelectProject={(proj) => {
                        setSearchParams({ view: 'tasks', project: proj.id });
                    }}
                />
            )}

            {currentView === 'habits' && (
                <HabitsTrackerView />
            )}

            {currentView === 'meetings' && (
                <MeetingsView
                    projects={projects}
                />
            )}

            {currentView === 'goals' && (
                <GoalsView />
            )}

            {currentView === 'notes' && (
                <NotesView />
            )}

            {currentView === 'analytics' && (
                <ProductivityAnalyticsView />
            )}

            {/* Global Task Modal */}
            <TaskDetailModal
                task={modalTask}
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSaveSuccess={handleTaskSaved}
                projects={projects}
            />
        </div>
    );
};

export default PlannerHub;

