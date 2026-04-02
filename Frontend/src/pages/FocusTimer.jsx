import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { createFocusSession, createTask, deleteTask, fetchFocusOverview, updateTask } from '../lib/auth';

function createInitialTaskForm() {
  return {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    completed: false,
  };
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDateLabel(dateString) {
  if (!dateString) {
    return 'No due date';
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const priorityTheme = {
  high: {
    border: 'border-l-wellness-peach',
    dot: 'bg-wellness-peach',
    badge: 'bg-wellness-peach-light/50 text-wellness-peach',
  },
  medium: {
    border: 'border-l-yellow-400',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  low: {
    border: 'border-l-wellness-green',
    dot: 'bg-wellness-green',
    badge: 'bg-wellness-green-light text-wellness-green',
  },
};

export function FocusTimer({ user }) {
  const initialFocusMinutes = Number(user?.preferences?.focusDuration || 25);
  const initialBreakMinutes = Number(user?.preferences?.breakDuration || 5);

  const [focusMinutes, setFocusMinutes] = useState(initialFocusMinutes);
  const [breakMinutes, setBreakMinutes] = useState(initialBreakMinutes);
  const [timeLeft, setTimeLeft] = useState(initialFocusMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [taskForm, setTaskForm] = useState(createInitialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [taskErrors, setTaskErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isLoggingSession, setIsLoggingSession] = useState(false);
  const [overview, setOverview] = useState({
    tasks: [],
    stats: {
      todayFocusMinutes: 0,
      weekFocusMinutes: 0,
      completedTasks: 0,
      pendingTasks: 0,
      totalTasks: 0,
      streakDays: 0,
    },
    chartData: [],
    recentSessions: [],
  });

  const currentDurationSeconds = (isBreak ? breakMinutes : focusMinutes) * 60;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / currentDurationSeconds) * circumference;

  async function loadOverview() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await fetchFocusOverview();
      setOverview(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const interval = window.setInterval(() => {
        setTimeLeft((current) => current - 1);
      }, 1000);

      return () => clearInterval(interval);
    }

    return undefined;
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (timeLeft !== 0 || !isActive || isLoggingSession) {
      return;
    }

    async function finalizeSession() {
      setIsActive(false);
      setIsLoggingSession(true);
      setStatusMessage('');
      setErrorMessage('');

      try {
        await createFocusSession({
          sessionType: isBreak ? 'break' : 'focus',
          plannedDurationMinutes: isBreak ? breakMinutes : focusMinutes,
          completedDurationMinutes: isBreak ? breakMinutes : focusMinutes,
          completedAt: new Date().toISOString(),
        });

        setStatusMessage(
          isBreak
            ? 'Break finished. Ready for the next focus block.'
            : 'Focus session completed and saved.'
        );

        setIsBreak((current) => !current);
        setTimeLeft((isBreak ? focusMinutes : breakMinutes) * 60);
        await loadOverview();
      } catch (error) {
        setErrorMessage(error.message);
        setTimeLeft((isBreak ? breakMinutes : focusMinutes) * 60);
      } finally {
        setIsLoggingSession(false);
      }
    }

    finalizeSession();
  }, [timeLeft, isActive, isBreak, focusMinutes, breakMinutes, isLoggingSession]);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft((isBreak ? breakMinutes : focusMinutes) * 60);
    }
  }, [focusMinutes, breakMinutes, isBreak, isActive]);

  function resetTimer() {
    setIsActive(false);
    setStatusMessage('');
    setTimeLeft((isBreak ? breakMinutes : focusMinutes) * 60);
  }

  function startEditingTask(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      priority: task.priority,
      completed: task.completed,
    });
    setTaskErrors({});
    setStatusMessage('');
    setErrorMessage('');
  }

  function resetTaskForm() {
    setEditingTaskId('');
    setTaskForm(createInitialTaskForm());
    setTaskErrors({});
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    setIsSavingTask(true);
    setTaskErrors({});
    setStatusMessage('');
    setErrorMessage('');

    try {
      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate || null,
      };

      const response = editingTaskId
        ? await updateTask(editingTaskId, payload)
        : await createTask(payload);

      setStatusMessage(response.message);
      resetTaskForm();
      await loadOverview();
    } catch (error) {
      setTaskErrors(error.errors || {});
      setErrorMessage(error.message);
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleToggleTask(task) {
    setStatusMessage('');
    setErrorMessage('');

    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        priority: task.priority,
        completed: !task.completed,
      });
      await loadOverview();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDeleteTask(taskId) {
    setStatusMessage('');
    setErrorMessage('');

    try {
      await deleteTask(taskId);
      if (editingTaskId === taskId) {
        resetTaskForm();
      }
      setStatusMessage('Task deleted successfully.');
      await loadOverview();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  const completedRatio = overview.stats.totalTasks
    ? Math.round((overview.stats.completedTasks / overview.stats.totalTasks) * 100)
    : 0;

  const nextDueTask = useMemo(
    () => overview.tasks.find((task) => !task.completed && task.dueDate) || null,
    [overview.tasks]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-6xl mx-auto">
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-wellness-blue-light/45 via-white to-wellness-green-light/25" />
            <div className="relative z-10 w-full">
              <div className="flex items-center justify-between gap-4 mb-6">
                <span
                  className={`px-5 py-2 rounded-full text-sm font-bold shadow-sm ${
                    isBreak ? 'bg-wellness-green text-white' : 'bg-wellness-blue text-white'
                  }`}
                >
                  {isBreak ? 'Break Time' : 'Focus Session'}
                </span>
                <span className="text-sm font-medium text-wellness-text-sec">
                  Default: {focusMinutes}/{breakMinutes} min
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                <div className="bg-white/90 rounded-2xl border border-wellness-border/60 p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-wellness-text-muted block mb-2">
                    Focus Minutes
                  </label>
                  <select
                    value={focusMinutes}
                    onChange={(event) => setFocusMinutes(Number(event.target.value))}
                    className="w-full rounded-xl border border-wellness-border bg-wellness-bg px-3 py-2 text-sm outline-none focus:border-wellness-blue"
                  >
                    {[15, 20, 25, 30, 45, 60].map((value) => (
                      <option key={value} value={value}>
                        {value} min
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/90 rounded-2xl border border-wellness-border/60 p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-wellness-text-muted block mb-2">
                    Break Minutes
                  </label>
                  <select
                    value={breakMinutes}
                    onChange={(event) => setBreakMinutes(Number(event.target.value))}
                    className="w-full rounded-xl border border-wellness-border bg-wellness-bg px-3 py-2 text-sm outline-none focus:border-wellness-blue"
                  >
                    {[5, 10, 15, 20].map((value) => (
                      <option key={value} value={value}>
                        {value} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center mx-auto mb-10">
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                    isActive
                      ? isBreak
                        ? 'shadow-[0_0_40px_rgba(123,200,164,0.35)]'
                        : 'shadow-[0_0_40px_rgba(107,159,212,0.35)]'
                      : ''
                  }`}
                />
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 260 260">
                  <circle cx="130" cy="130" r={radius} fill="none" stroke={isBreak ? '#E8F0E8' : '#CFE6E6'} strokeWidth="12" />
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    fill="none"
                    stroke={isBreak ? '#B8D0B8' : '#6FA5A5'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute flex flex-col items-center z-20">
                  <span className="text-6xl font-bold text-wellness-text font-mono tracking-tighter">
                    {formatCountdown(timeLeft)}
                  </span>
                  <span className="text-sm text-wellness-text-sec mt-2">
                    {isBreak ? 'Reset and recharge' : 'Protected study block'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={resetTimer}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-wellness-bg text-wellness-text-sec hover:bg-gray-200 hover:text-wellness-text transition-all"
                  title="Reset timer"
                  type="button"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsActive((current) => !current)}
                  disabled={isLoggingSession}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${
                    isBreak
                      ? 'bg-wellness-green hover:bg-green-500 shadow-wellness-green/30'
                      : 'bg-wellness-blue hover:bg-blue-500 shadow-wellness-blue/30'
                  } ${isLoggingSession ? 'opacity-60 cursor-not-allowed' : ''}`}
                  type="button"
                >
                  {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1.5" />}
                </button>

                <div className="w-12 h-12 rounded-full bg-white border border-wellness-border flex items-center justify-center text-sm font-semibold text-wellness-text">
                  {overview.recentSessions.length}
                </div>
              </div>

              {statusMessage ? (
                <div className="mt-6 rounded-2xl border border-wellness-green/30 bg-wellness-green-light/40 px-4 py-3 text-sm text-wellness-green">
                  {statusMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mt-6 rounded-2xl border border-wellness-peach/30 bg-wellness-peach-light/30 px-4 py-3 text-sm text-wellness-peach">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <div className="card p-5 flex items-center gap-4">
              <div className="bg-wellness-peach-light/50 p-3 rounded-xl text-wellness-peach">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-wellness-text-sec mb-0.5">Current Streak</p>
                <p className="text-lg font-bold text-wellness-text">{overview.stats.streakDays} Days</p>
              </div>
            </div>

            <div className="card p-5 flex items-center gap-4">
              <div className="bg-wellness-blue-light p-3 rounded-xl text-wellness-blue">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-wellness-text-sec mb-0.5">Today's Focus</p>
                <p className="text-lg font-bold text-wellness-text">{formatMinutes(overview.stats.todayFocusMinutes)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card p-5">
            <p className="text-sm font-semibold text-wellness-text mb-3">Focus snapshot</p>
            <div className="space-y-3 text-sm text-wellness-text-sec">
              <div className="flex items-center justify-between">
                <span>Weekly focus time</span>
                <span className="font-semibold text-wellness-text">{formatMinutes(overview.stats.weekFocusMinutes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completed tasks</span>
                <span className="font-semibold text-wellness-text">{overview.stats.completedTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next due task</span>
                <span className="font-semibold text-wellness-text">
                  {nextDueTask ? formatDateLabel(nextDueTask.dueDate) : 'No deadline set'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <motion.div variants={itemVariants} className="card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-wellness-text">Task Manager</h2>
              <span className="bg-wellness-bg text-wellness-text-sec text-xs font-bold px-3 py-1 rounded-full">
                {overview.stats.completedTasks}/{overview.stats.totalTasks} Done
              </span>
            </div>

            <form onSubmit={handleTaskSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-wellness-bg/50 p-4 rounded-2xl border border-wellness-border/50">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Task title"
                  className="w-full px-4 py-3 bg-white border border-transparent rounded-xl focus:border-wellness-blue focus:ring-2 focus:ring-wellness-blue/20 outline-none text-sm transition-all shadow-sm"
                />
                {taskErrors.title ? <p className="text-xs text-wellness-peach mt-2">{taskErrors.title}</p> : null}
              </div>

              <div className="md:col-span-2">
                <textarea
                  value={taskForm.description}
                  onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-4 py-3 bg-white border border-transparent rounded-xl focus:border-wellness-blue focus:ring-2 focus:ring-wellness-blue/20 outline-none text-sm transition-all shadow-sm min-h-24 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-wellness-text-muted block mb-2">Due date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-transparent rounded-xl focus:border-wellness-blue focus:ring-2 focus:ring-wellness-blue/20 outline-none text-sm transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-wellness-text-muted block mb-2">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-transparent rounded-xl text-sm outline-none focus:border-wellness-blue focus:ring-2 focus:ring-wellness-blue/20 shadow-sm font-medium"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
                {editingTaskId ? (
                  <button type="button" onClick={resetTaskForm} className="btn-secondary px-5 py-3 flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Cancel Edit
                  </button>
                ) : null}

                <button type="submit" disabled={isSavingTask} className="btn-primary px-5 py-3 flex items-center gap-2">
                  {editingTaskId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isSavingTask ? 'Saving...' : editingTaskId ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>

            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-wellness-text-muted mb-2">
                <span>Task completion</span>
                <span>{completedRatio}%</span>
              </div>
              <div className="w-full bg-wellness-bg h-2 rounded-full overflow-hidden">
                <div className="bg-wellness-green h-full rounded-full transition-all" style={{ width: `${completedRatio}%` }} />
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="text-center py-12 text-sm text-wellness-text-sec">Loading tasks...</div>
              ) : overview.tasks.length ? (
                overview.tasks.map((task) => {
                  const theme = priorityTheme[task.priority];

                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 ${
                        task.completed
                          ? 'bg-wellness-bg/50 border-transparent opacity-70'
                          : `bg-white shadow-sm hover:shadow-md border-l-4 ${theme.border} border-y-wellness-border/50 border-r-wellness-border/50`
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`shrink-0 mt-0.5 transition-colors ${
                          task.completed ? 'text-wellness-green' : 'text-wellness-text-muted hover:text-wellness-blue'
                        }`}
                        type="button"
                        title="Toggle complete"
                      >
                        {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className={`text-sm font-medium ${task.completed ? 'line-through text-wellness-text-sec' : 'text-wellness-text'}`}>
                            {task.title}
                          </p>
                          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${theme.badge}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description ? (
                          <p className="text-sm text-wellness-text-sec leading-6 mb-2">{task.description}</p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-wellness-text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateLabel(task.dueDate)}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                          <span>{task.completed ? 'Completed' : 'Pending'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditingTask(task)}
                          className="p-2 rounded-lg bg-wellness-bg text-wellness-text-sec hover:text-wellness-blue"
                          type="button"
                          title="Edit task"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 rounded-lg bg-wellness-bg text-wellness-text-sec hover:text-wellness-peach"
                          type="button"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-wellness-blue-light rounded-full flex items-center justify-center text-wellness-blue mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-wellness-text font-semibold">No tasks yet</p>
                  <p className="text-wellness-text-sec text-sm mt-1">Create your first task above to start organizing work.</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2 text-wellness-text">
                <div className="bg-wellness-blue-light p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-wellness-blue" />
                </div>
                Productivity Tracking
              </h2>
              <div className="text-right">
                <span className="text-2xl font-bold text-wellness-blue">{(overview.stats.weekFocusMinutes / 60).toFixed(1)}</span>
                <span className="text-sm font-medium text-wellness-text-sec ml-1">hrs this week</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-wellness-border/60 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-wellness-text-muted mb-2">Today</p>
                <p className="text-2xl font-bold text-wellness-text">{formatMinutes(overview.stats.todayFocusMinutes)}</p>
              </div>
              <div className="rounded-2xl border border-wellness-border/60 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-wellness-text-muted mb-2">Completed tasks</p>
                <p className="text-2xl font-bold text-wellness-green">{overview.stats.completedTasks}</p>
              </div>
              <div className="rounded-2xl border border-wellness-border/60 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-wellness-text-muted mb-2">Streak</p>
                <p className="text-2xl font-bold text-wellness-peach">{overview.stats.streakDays} days</p>
              </div>
            </div>

            <div className="h-56 mb-8">
              {overview.chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.chartData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CFE3D2" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 12, fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 12, fontWeight: 500 }} />
                    <Tooltip
                      cursor={{ fill: '#E8F4FD', radius: 6 }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        padding: '12px',
                      }}
                      formatter={(value) => [`${value} hrs`, 'Focus Time']}
                      labelFormatter={(label, payload) => (payload?.[0]?.payload?.date ? formatDateLabel(payload[0].payload.date) : label)}
                    />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {overview.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.hours === Math.max(...overview.chartData.map((item) => item.hours)) ? '#548A7B' : '#6FA5A5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-3xl border border-dashed border-wellness-border flex items-center justify-center text-center px-8 text-sm text-wellness-text-sec">
                  Complete a focus session to start building your productivity chart.
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-wellness-text mb-3">Recent focus sessions</h3>
              <div className="space-y-3">
                {overview.recentSessions.length ? (
                  overview.recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between rounded-2xl bg-wellness-bg/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm text-wellness-blue">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-wellness-text">{formatMinutes(session.completedDurationMinutes)} focus block</p>
                          <p className="text-xs text-wellness-text-muted">{formatDateLabel(session.completedAt)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-wellness-blue">Saved</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-wellness-text-sec">No focus sessions saved yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
