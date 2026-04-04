import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import FocusPage from './pages/FocusPage';
import TasksPage from './pages/TasksPage';
import { api } from './services/api';
import './styles/app-shell.css';

const normalizeTask = (task) => ({
  course: 'General Studies',
  estimatedPomodoros: 1,
  nextAction: 'Define the next small step for this task.',
  ...task,
});

const mergeFocusData = (currentData, settings = {}, stats = {}) => ({
  ...currentData,
  ...stats,
  ...settings,
  weeklyTrend: stats.weeklyTrend ?? currentData.weeklyTrend,
});

function App() {
  const [storedTasks, setStoredTasks] = useState([]);
  const [focusData, setFocusData] = useState({
    focusDuration: 25,
    breakDuration: 5,
    todayMinutes: 0,
    weekMinutes: 0,
    streak: 0,
    completedSessions: 0,
    weeklyTrend: [
      { day: 'Sun', minutes: 0 },
      { day: 'Mon', minutes: 0 },
      { day: 'Tue', minutes: 0 },
      { day: 'Wed', minutes: 0 },
      { day: 'Thu', minutes: 0 },
      { day: 'Fri', minutes: 0 },
      { day: 'Sat', minutes: 0 },
    ],
  });
  const [isSyncingRemote, setIsSyncingRemote] = useState(true);
  const [loadError, setLoadError] = useState('');
  const tasks = storedTasks.map(normalizeTask);

  useEffect(() => {
    let isActive = true;

    const loadRemoteData = async () => {
      try {
        const [remoteTasks, remoteSettings, remoteStats] = await Promise.all([
          api.getTasks(),
          api.getFocusSettings(),
          api.getFocusStats(),
        ]);

        if (!isActive) {
          return;
        }

        setStoredTasks(remoteTasks);
        setFocusData((currentData) => mergeFocusData(currentData, remoteSettings, remoteStats));
        setLoadError('');
      } catch (error) {
        console.error('Failed to load backend data.', error);
        if (isActive) {
          setLoadError('Backend connection failed. Make sure Spring Boot is running on port 8080.');
        }
      } finally {
        if (isActive) {
          setIsSyncingRemote(false);
        }
      }
    };

    loadRemoteData();

    return () => {
      isActive = false;
    };
  }, [setFocusData, setStoredTasks]);

  const completedTasksCount = tasks.filter((task) => task.status === 'Completed').length;
  const upcomingTasksCount = tasks.filter((task) => task.status !== 'Completed').length;
  const activeTasks = tasks.filter((task) => task.status === 'In Progress').length;
  const completionRate = tasks.length ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const productivityStats = {
    todayMinutes: focusData.todayMinutes,
    weekMinutes: focusData.weekMinutes,
    streak: focusData.streak,
    completedTasksCount,
    upcomingTasksCount,
    activeTasks,
    completionRate,
    completedSessions: focusData.completedSessions,
    weeklyTrend: focusData.weeklyTrend,
    focusDuration: focusData.focusDuration,
    breakDuration: focusData.breakDuration,
  };

  const saveTask = async (taskData) => {
    const normalizedTask = normalizeTask(taskData);
    const taskExists = storedTasks.some((task) => task.id === normalizedTask.id);

    const savedTask = taskExists
      ? await api.updateTask(normalizedTask.id, normalizedTask)
      : await api.createTask(normalizedTask);

    setStoredTasks((currentTasks) => {
      const exists = currentTasks.some((task) => task.id === savedTask.id);
      if (exists) {
        return currentTasks.map((task) => (task.id === savedTask.id ? savedTask : task));
      }
      return [savedTask, ...currentTasks];
    });
  };

  const deleteTask = async (taskId) => {
    await api.deleteTask(taskId);
    setStoredTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  };

  const toggleTaskCompletion = async (taskId) => {
    const updatedTask = await api.toggleTaskCompletion(taskId);
    setStoredTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const updateFocusSettings = async (settings) => {
    const remoteSettings = await api.updateFocusSettings(settings);
    setFocusData((currentData) => ({
      ...currentData,
      focusDuration: remoteSettings.focusDuration,
      breakDuration: remoteSettings.breakDuration,
    }));
  };

  const handleSessionComplete = async (mode, completedMinutes) => {
    await api.recordSession({
      mode,
      completedMinutes,
      completedAt: new Date().toISOString(),
    });

    if (mode !== 'Focus') {
      return;
    }

    const remoteStats = await api.getFocusStats();
    setFocusData((currentData) => mergeFocusData(currentData, {}, remoteStats));
  };

  if (isSyncingRemote) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="app-shell__main">
          <main className="app-shell__content">
            <div className="page">
              <section className="page__hero">
                <div className="page__hero-copy">
                  <h1>Loading your dashboard data...</h1>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="app-shell__main">
          <main className="app-shell__content">
            <div className="page">
              <section className="page__hero">
                <div className="page__hero-copy">
                  <h1>Backend connection required.</h1>
                  <p>{loadError}</p>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <main className="app-shell__content">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  tasks={tasks}
                  stats={productivityStats}
                />
              }
            />
            <Route
              path="/focus"
              element={
                <FocusPage
                  tasks={tasks}
                  stats={productivityStats}
                  onUpdateFocusSettings={updateFocusSettings}
                  onSessionComplete={handleSessionComplete}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <TasksPage
                  tasks={tasks}
                  stats={productivityStats}
                  onSaveTask={saveTask}
                  onDeleteTask={deleteTask}
                  onToggleTaskCompletion={toggleTaskCompletion}
                />
              }
            />
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
