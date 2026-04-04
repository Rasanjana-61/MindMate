import { useEffect, useState } from 'react';
import '../../styles/task-manager.css';

const emptyTask = {
  title: '',
  description: '',
  course: '',
  estimatedPomodoros: 1,
  nextAction: '',
  priority: 'Medium',
  status: 'Pending',
};

const priorityOptions = ['Low', 'Medium', 'High'];
const statusOptions = ['Pending', 'In Progress', 'Completed'];

function validateTask(formData) {
  const errors = {};
  const trimmedTitle = formData.title.trim();
  const trimmedDescription = formData.description.trim();
  const trimmedCourse = formData.course.trim();
  const trimmedNextAction = formData.nextAction.trim();
  const estimatedPomodoros = Number(formData.estimatedPomodoros);

  if (!trimmedTitle) {
    errors.title = 'Task title is required.';
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Task title must be at least 3 characters.';
  }

  if (!trimmedDescription) {
    errors.description = 'Description is required.';
  } else if (trimmedDescription.length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  }

  if (!trimmedCourse) {
    errors.course = 'Course or module is required.';
  } else if (trimmedCourse.length < 2) {
    errors.course = 'Course or module must be at least 2 characters.';
  }

  if (!Number.isInteger(estimatedPomodoros)) {
    errors.estimatedPomodoros = 'Estimated Pomodoros must be a whole number.';
  } else if (estimatedPomodoros < 1 || estimatedPomodoros > 8) {
    errors.estimatedPomodoros = 'Estimated Pomodoros must be between 1 and 8.';
  }

  if (!trimmedNextAction) {
    errors.nextAction = 'Next action is required.';
  } else if (trimmedNextAction.length < 5) {
    errors.nextAction = 'Next action must be at least 5 characters.';
  }

  if (!priorityOptions.includes(formData.priority)) {
    errors.priority = 'Please select a valid priority.';
  }

  if (!statusOptions.includes(formData.status)) {
    errors.status = 'Please select a valid status.';
  }

  return errors;
}

function TaskForm({ isOpen, onClose, onSave, editingTask }) {
  const [formData, setFormData] = useState(emptyTask);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (editingTask) {
      setFormData({
        ...emptyTask,
        ...editingTask,
      });
      setErrors({});
      setTouched({});
      return;
    }

    setFormData(emptyTask);
    setErrors({});
    setTouched({});
  }, [editingTask, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(nextFormData);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateTask(nextFormData)[name],
    }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    const nextTouched = {
      ...touched,
      [name]: true,
    };

    setTouched(nextTouched);
    setErrors(validateTask(formData));
  };

  const getFieldProps = (fieldName) => ({
    'aria-invalid': Boolean(touched[fieldName] && errors[fieldName]),
    className: touched[fieldName] && errors[fieldName] ? 'task-form__control task-form__control--error' : 'task-form__control',
  });

  const showFieldError = (fieldName) => touched[fieldName] && errors[fieldName];

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validateTask(formData);
    const allTouched = {
      title: true,
      description: true,
      course: true,
      estimatedPomodoros: true,
      nextAction: true,
      priority: true,
      status: true,
    };

    setTouched(allTouched);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSave({
      ...formData,
      id: editingTask?.id ?? `task-${Date.now()}`,
      course: formData.course.trim(),
      estimatedPomodoros: Number(formData.estimatedPomodoros),
      nextAction: formData.nextAction.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
    });

    onClose();
  };

  return (
    <div className="task-modal">
      <div className="task-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="task-modal__panel">
        <div className="section-heading">
          <div>
            <h3>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
            <p>Create realistic study tasks for your dashboard demo.</p>
          </div>
          <button className="btn btn--ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <label className="task-form__field">
            Task title
            <input
              type="text"
              name="title"
              placeholder="Example: Finish software testing report"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              {...getFieldProps('title')}
            />
            {showFieldError('title') && <span className="task-form__error">{errors.title}</span>}
          </label>

          <label className="task-form__field">
            Description
            <textarea
              name="description"
              rows="4"
              placeholder="Add a short note about what needs to be done."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              {...getFieldProps('description')}
            />
            {showFieldError('description') && <span className="task-form__error">{errors.description}</span>}
          </label>

          <div className="task-form__grid task-form__grid--two">
            <label className="task-form__field">
              Course / Module
              <input
                type="text"
                name="course"
                placeholder="Example: HCI 302"
                value={formData.course}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                {...getFieldProps('course')}
              />
              {showFieldError('course') && <span className="task-form__error">{errors.course}</span>}
            </label>

            <label className="task-form__field">
              Estimated Pomodoros
              <input
                type="number"
                min="1"
                max="8"
                name="estimatedPomodoros"
                value={formData.estimatedPomodoros}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                {...getFieldProps('estimatedPomodoros')}
              />
              {showFieldError('estimatedPomodoros') && (
                <span className="task-form__error">{errors.estimatedPomodoros}</span>
              )}
            </label>
          </div>

          <label className="task-form__field">
            Next action
            <input
              type="text"
              name="nextAction"
              placeholder="Example: Draft the introduction and gather screenshots"
              value={formData.nextAction}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              {...getFieldProps('nextAction')}
            />
            {showFieldError('nextAction') && <span className="task-form__error">{errors.nextAction}</span>}
          </label>

          <div className="task-form__grid">
            <label className="task-form__field">
              Priority
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                {...getFieldProps('priority')}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {showFieldError('priority') && <span className="task-form__error">{errors.priority}</span>}
            </label>

            <label className="task-form__field">
              Status
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                {...getFieldProps('status')}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              {showFieldError('status') && <span className="task-form__error">{errors.status}</span>}
            </label>
          </div>

          <button className="btn btn--primary" type="submit">
            {editingTask ? 'Update Task' : 'Save Task'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;
