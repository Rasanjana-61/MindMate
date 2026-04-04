import { useState } from 'react';
import { FaPenToSquare, FaPlus, FaRegCircleCheck, FaTrashCan } from 'react-icons/fa6';
import TaskForm from './TaskForm';
import '../../styles/task-manager.css';

const statusOptions = ['All', 'Pending', 'In Progress', 'Completed'];

function getTaskProgress(status) {
  if (status === 'Completed') {
    return 100;
  }

  if (status === 'In Progress') {
    return 64;
  }

  return 22;
}

function TaskManager({ tasks, onSaveTask, onDeleteTask, onToggleTaskCompletion }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const completedTasks = tasks.filter((task) => task.status === 'Completed').length;
  const highPriorityTasks = tasks.filter((task) => task.priority === 'High').length;

  const visibleTasks = tasks
    .filter((task) => (statusFilter === 'All' ? true : task.status === statusFilter))
    .filter((task) => task.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const openAddModal = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  return (
    <section className="task-manager panel">
      <div className="section-heading">
        <div>
          <h2>Task Manager</h2>
        </div>
        <button className="btn btn--primary" type="button" onClick={openAddModal}>
          <FaPlus /> Add Task
        </button>
      </div>

      <div className="task-manager__toolbar">
        <input
          type="text"
          placeholder="Search tasks"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <div className="task-manager__filters">
          {statusOptions.map((option) => (
            <button
              key={option}
              className={`task-manager__filter ${statusFilter === option ? 'task-manager__filter--active' : ''}`}
              type="button"
              onClick={() => setStatusFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="task-manager__overview">
        <div className="task-manager__overview-card">
          <span>Visible tasks</span>
          <strong>{visibleTasks.length}</strong>
        </div>
        <div className="task-manager__overview-card">
          <span>Completed</span>
          <strong>{completedTasks}</strong>
        </div>
        <div className="task-manager__overview-card">
          <span>High priority</span>
          <strong>{highPriorityTasks}</strong>
        </div>
      </div>

      <div className="task-list">
        {visibleTasks.length === 0 ? (
          <div className="task-list__empty">
            <strong>No tasks found</strong>
            <span>Try another search or add a task.</span>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <article key={task.id} className="task-card">
              <div className="task-card__topline">
                <span className="task-card__course">{task.course}</span>
              </div>

              <div className="task-card__header">
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.description || 'No description.'}</p>
                </div>
                <button
                  className={`task-card__complete ${task.status === 'Completed' ? 'task-card__complete--done' : ''}`}
                  type="button"
                  onClick={() => onToggleTaskCompletion(task.id)}
                >
                  <FaRegCircleCheck />
                </button>
              </div>

              <div className="task-card__meta">
                <span className={`badge badge--priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                <span className={`badge badge--status-${task.status.toLowerCase().replace(/\s/g, '-')}`}>
                  {task.status}
                </span>
                <span className="badge badge--neutral">{task.estimatedPomodoros} Pomodoros</span>
              </div>

              <div className="task-card__next">
                <span>Next</span>
                <p>{task.nextAction || 'Add the next step.'}</p>
              </div>

              <div className="task-card__progress">
                <div className="task-card__progress-head">
                  <span>Progress</span>
                  <strong>{getTaskProgress(task.status)}%</strong>
                </div>
                <div className="task-card__progress-bar">
                  <div style={{ width: `${getTaskProgress(task.status)}%` }} />
                </div>
              </div>

              <div className="task-card__actions">
                <button className="btn btn--ghost" type="button" onClick={() => openEditModal(task)}>
                  <FaPenToSquare /> Edit
                </button>
                <button className="btn btn--soft btn--danger" type="button" onClick={() => onDeleteTask(task.id)}>
                  <FaTrashCan /> Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <TaskForm
        isOpen={isFormOpen}
        editingTask={editingTask}
        onClose={() => setIsFormOpen(false)}
        onSave={onSaveTask}
      />
    </section>
  );
}

export default TaskManager;
