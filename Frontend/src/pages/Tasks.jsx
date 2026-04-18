import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Search, CheckCircle2, Circle, Calendar, 
  Pencil, Trash2, X, Save, Clock, Flame, 
  Filter, Tag, MoreVertical, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchFocusOverview, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../lib/auth';

function formatDateLabel(dateString) {
  if (!dateString) return 'No due date';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const priorityTheme = {
  high: {
    bg: 'bg-red-50 text-app-stress border-red-100',
    dot: 'bg-app-stress',
    badge: 'bg-red-100 text-red-700',
  },
  medium: {
    bg: 'bg-yellow-50 text-wellness-peach border-yellow-100',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  low: {
    bg: 'bg-green-50 text-app-primary border-green-100',
    dot: 'bg-app-primary',
    badge: 'bg-green-100 text-green-700',
  },
};

export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    subject: '', // Added subject metadata
    pomodoros: 1,
  });

  async function loadTasks() {
    setIsLoading(true);
    try {
      const data = await fetchFocusOverview();
      setTasks(data.tasks);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || 
                          (activeFilter === 'Completed' && task.completed) ||
                          (activeFilter === 'Pending' && !task.completed);
      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchQuery, activeFilter]);

  const stats = useMemo(() => ({
    total: filteredTasks.length,
    completed: tasks.filter(t => t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed).length,
  }), [tasks, filteredTasks]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, taskForm);
      } else {
        await createTask(taskForm);
      }
      setIsModalOpen(false);
      setEditingTaskId(null);
      setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', subject: '', pomodoros: 1 });
      loadTasks();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleToggle(task) {
    try {
      await updateTask(task.id, { ...task, completed: !task.completed });
      loadTasks();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      loadTasks();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleEdit(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      priority: task.priority || 'medium',
      subject: task.subject || '',
      pomodoros: task.pomodoros || 1,
    });
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Banner */}
      <div className="bg-[#D7E8DA] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row justify-between items-center text-[#2F3E34]">
        <div className="relative z-10 w-full md:w-2/3">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">View, add, and update your study tasks.</h1>
        </div>
        <div className="relative z-10 bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/40 min-w-[180px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7C72] mb-1">COMPLETED</p>
          <p className="text-3xl font-bold">{stats.completed}</p>
          <p className="text-sm text-[#6B7C72]">tasks done</p>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-[#D7E8DA]/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <h2 className="text-2xl font-bold text-[#2F3E34]">Task Manager</h2>
          <button 
            onClick={() => { setEditingTaskId(null); setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', subject: '', pomodoros: 1 }); setIsModalOpen(true); }}
            className="bg-[#6FA5A5] hover:bg-[#5E9494] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#6FA5A5]/20"
          >
            <Plus className="w-5 h-5" /> Add Task
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-10">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7C72]" />
            <input 
              type="text" 
              placeholder="Search tasks" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#F6F7F5] border-none rounded-2xl focus:ring-2 focus:ring-[#7BAE7F]/20 text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full lg:w-auto scrollbar-hide">
            {['All', 'Pending', 'In Progress', 'Completed'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  activeFilter === filter 
                    ? 'bg-[#D7E8DA] text-[#4F7D5C] shadow-sm' 
                    : 'text-[#6B7C72] hover:bg-[#F6F7F5]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#F6F7F5] p-6 rounded-3xl border border-transparent hover:border-[#D7E8DA] transition-all">
            <p className="text-xs font-bold text-[#6B7C72] uppercase tracking-widest mb-1">Visible tasks</p>
            <p className="text-2xl font-bold text-[#2F3E34]">{stats.total}</p>
          </div>
          <div className="bg-[#F6F7F5] p-6 rounded-3xl border border-transparent hover:border-[#D7E8DA] transition-all">
            <p className="text-xs font-bold text-[#6B7C72] uppercase tracking-widest mb-1">Completed</p>
            <p className="text-2xl font-bold text-[#2F3E34]">{stats.completed}</p>
          </div>
          <div className="bg-[#F6F7F5] p-6 rounded-3xl border border-transparent hover:border-[#D7E8DA] transition-all">
            <p className="text-xs font-bold text-[#6B7C72] uppercase tracking-widest mb-1">High priority</p>
            <p className="text-2xl font-bold text-[#2F3E34]">{stats.highPriority}</p>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-[#7BAE7F]/20 border-t-[#7BAE7F] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-[#6B7C72]">Loading your tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-20 text-center bg-[#F6F7F5] rounded-[32px] border border-dashed border-[#D7E8DA]">
              <CheckCircle2 className="w-12 h-12 text-[#DDEAD9] mx-auto mb-4" />
              <p className="text-[#2F3E34] font-bold">All caught up!</p>
              <p className="text-sm text-[#6B7C72] mt-1">No tasks matching your search or filters.</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={task.id}
                className={`relative bg-[#F6F7F5]/30 rounded-[32px] p-8 border border-transparent hover:border-[#D7E8DA] transition-all ${task.completed ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-[#CFE6E6] text-[#6FA5A5] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {task.subject || 'GENERAL'}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold text-[#2F3E34] ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-[#6B7C72] mt-2 leading-relaxed">
                        {task.description || 'No description provided.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${(priorityTheme[task.priority] || priorityTheme.medium).badge}`}>
                        {task.priority || 'MEDIUM'}
                      </span>
                      {task.completed && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                          Completed
                        </span>
                      )}
                      <span className="bg-white border border-[#D7E8DA] px-3 py-1 rounded-full text-[10px] font-bold uppercase text-[#6B7C72]">
                        {task.pomodoros || 1} Pomodoros
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${task.completed ? 'bg-[#7BAE7F] text-white shadow-sm' : 'bg-[#CFE6E6] text-[#6FA5A5] border border-[#6FA5A5]/20'}`}>
                        <Clock className="w-3 h-3" /> 
                        {task.totalTimeSpent > 0 ? (
                          `${Math.floor(task.totalTimeSpent / 60)}h ${task.totalTimeSpent % 60}m logged`
                        ) : (
                          '0m tracked'
                        )}
                      </span>
                    </div>

                    <div className="bg-[#F6F7F5] rounded-2xl p-4 border border-[#D7E8DA]/30">
                      <p className="text-[10px] font-bold text-[#6B7C72] uppercase tracking-[0.15em] mb-2">NEXT</p>
                      <p className="text-xs text-[#2F3E34] font-medium italic">
                        {task.completed ? 'Enjoy your achievement!' : 'Stay focused and complete this milestone.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-bold text-[#6B7C72] uppercase tracking-widest">
                         <span>Progress</span>
                         <span>{task.completed ? '100%' : '0%'}</span>
                       </div>
                       <div className="w-full bg-[#E8F0E8] h-2 rounded-full overflow-hidden">
                         <div className={`h-full bg-[#7BAE7F] transition-all duration-1000 ${task.completed ? 'w-full' : 'w-0'}`} />
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleToggle(task)}
                      className={`p-3 rounded-2xl transition-all ${task.completed ? 'bg-[#7BAE7F] text-white' : 'bg-white text-[#D7E8DA] border border-[#D7E8DA]'}`}
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <div className="h-px w-8 md:w-full md:h-px bg-[#D7E8DA] my-1" />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(task)} className="p-3 bg-white border border-[#D7E8DA] rounded-2xl text-[#6B7C72] hover:text-[#7BAE7F] transition-all">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="p-3 bg-white border border-[#D7E8DA] rounded-2xl text-[#6B7C72] hover:text-red-500 transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modal / Overlay for Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#2F3E34]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[40px] p-8 lg:p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-[#2F3E34]">{editingTaskId ? 'Edit Task' : 'Create New Task'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F6F7F5] rounded-full transition-all">
                  <X className="w-6 h-6 text-[#6B7C72]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-[#6B7C72] uppercase tracking-widest block mb-2">Title</label>
                  <input 
                    required
                    type="text" 
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    placeholder="What needs to be done?"
                    className="w-full px-6 py-4 bg-[#F6F7F5] border-none rounded-2xl focus:ring-2 focus:ring-[#7BAE7F]/20 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#6B7C72] uppercase tracking-widest block mb-2">Subject</label>
                  <input 
                    type="text" 
                    value={taskForm.subject}
                    onChange={(e) => setTaskForm({...taskForm, subject: e.target.value})}
                    placeholder="e.g. SE 318, MATH 101"
                    className="w-full px-6 py-4 bg-[#F6F7F5] border-none rounded-2xl focus:ring-2 focus:ring-[#7BAE7F]/20 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#6B7C72] uppercase tracking-widest block mb-2">Description</label>
                  <textarea 
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    placeholder="Add some details..."
                    className="w-full px-6 py-4 bg-[#F6F7F5] border-none rounded-2xl focus:ring-2 focus:ring-[#7BAE7F]/20 font-medium min-h-[100px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7C72] uppercase tracking-widest block mb-2">Priority</label>
                    <select 
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F6F7F5] border-none rounded-2xl focus:ring-2 focus:ring-[#7BAE7F]/20 font-medium appearance-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7C72] uppercase tracking-widest block mb-2">Pomodoros</label>
                    <input 
                      type="number" 
                      min="1"
                      value={taskForm.pomodoros}
                      onChange={(e) => setTaskForm({...taskForm, pomodoros: Number(e.target.value)})}
                      className="w-full px-6 py-4 bg-[#F6F7F5] border-none rounded-2xl focus:ring-2 focus:ring-[#7BAE7F]/20 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                   <button 
                     type="button"
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 py-4 rounded-2xl font-bold bg-[#F6F7F5] text-[#6B7C72] hover:bg-[#E8F0E8] transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     className="flex-[2] py-4 rounded-2xl font-bold bg-[#6FA5A5] text-white shadow-lg shadow-[#6FA5A5]/20 hover:bg-[#5E9494] transition-all"
                   >
                     {editingTaskId ? 'Save Changes' : 'Create Task'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
