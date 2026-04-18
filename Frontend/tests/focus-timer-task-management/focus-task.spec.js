import { expect, test } from '@playwright/test';

function createFocusTask({
  id,
  title,
  description = '',
  priority = 'medium',
  completed = false,
  totalTimeSpent = 0,
}) {
  return {
    id,
    title,
    description,
    priority,
    completed,
    totalTimeSpent,
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

async function mockFocusApp(page, { tasks = [] } = {}) {
  const state = {
    tasks: [...tasks],
    sessions: [],
  };

  const authenticatedUser = {
    id: 'user-1',
    fullName: 'Sarah Smith',
    email: 'sarah.smith@example.com',
    role: 'student',
    faculty: 'Engineering',
  };

  await page.addInitScript(() => {
    localStorage.setItem('studentwell_token', 'playwright-token');
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname.endsWith('/api/auth/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: authenticatedUser }),
      });
      return;
    }

    if (pathname.endsWith('/api/focus/overview')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: state.tasks,
          stats: {
            todayFocusMinutes: 45,
            weekFocusMinutes: 240,
            completedTasks: state.tasks.filter(t => t.completed).length,
            pendingTasks: state.tasks.filter(t => !t.completed).length,
            totalTasks: state.tasks.length,
            streakDays: 3
          },
          chartData: [],
          recentSessions: []
        }),
      });
      return;
    }

    if (pathname.endsWith('/api/focus/tasks') && request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const newTask = createFocusTask({
        id: `task-${state.tasks.length + 1}`,
        title: body.title,
        description: body.description,
        priority: body.priority,
      });
      state.tasks.push(newTask);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Task created', task: newTask }),
      });
      return;
    }

    const taskMatch = pathname.match(/\/api\/focus\/tasks\/([^/]+)$/);
    if (taskMatch && request.method() === 'PUT') {
        const body = JSON.parse(request.postData() || '{}');
        const taskId = taskMatch[1];
        const taskIndex = state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...body };
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Task updated', task: state.tasks[taskIndex] }),
            });
            return;
        }
    }

    if (pathname.endsWith('/api/focus/sessions') && request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      state.sessions.push(body);
      
      // If task was linked, update its time
      if (body.taskId) {
          const task = state.tasks.find(t => t.id === body.taskId);
          if (task) task.totalTimeSpent += body.completedDurationMinutes;
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Session saved' }),
      });
      return;
    }

    await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not Found' }) });
  });

  await page.goto('/');
  return state;
}

test('user can create a new task in the tasks page', async ({ page }) => {
  const state = await mockFocusApp(page);

  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Task Manager' })).toBeVisible();

  await page.getByRole('button', { name: 'Add Task' }).click();
  
  const testTitle = 'Finish React Testing Prototype';
  await page.getByPlaceholder(/e\.g\. Submit/).fill(testTitle);
  await page.getByPlaceholder('Enter task details...').fill('Must complete Playwright tests for all modules.');
  
  await page.getByRole('button', { name: 'Create Task' }).click();

  await expect(page.getByText(testTitle)).toBeVisible();
  expect(state.tasks).toHaveLength(1);
  expect(state.tasks[0].title).toBe(testTitle);
});

test('user can start focus timer and select a task', async ({ page }) => {
  const initialTasks = [
    createFocusTask({ id: 'task-1', title: 'Focus on Math' })
  ];
  await mockFocusApp(page, { tasks: initialTasks });

  await page.getByRole('button', { name: 'Focus Timer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Focus Timer' })).toBeVisible();

  // Click on the task to select it
  await page.getByText('Focus on Math').click();
  
  // Verify timer starts (ping animation or active state)
  await expect(page.locator('.animate-ping')).toBeVisible();
});

test('user can end a session and log progress', async ({ page }) => {
  const initialTasks = [
    createFocusTask({ id: 'task-1', title: 'Chemistry Study', totalTimeSpent: 10 })
  ];
  const state = await mockFocusApp(page, { tasks: initialTasks });

  await page.getByRole('button', { name: 'Focus Timer', exact: true }).click();
  
  // Select task
  await page.getByText('Chemistry Study').click();
  
  // End session
  await page.getByRole('button', { name: 'End Session' }).click();
  
  // Verify "Complete Task" checkbox is unchecked then checked in modal? 
  // In our UI, End Session just saves.
  
  // Check if session was logged
  expect(state.sessions).toHaveLength(1);
});

test('task manager filters tasks correctly', async ({ page }) => {
    const mixedTasks = [
        createFocusTask({ id: 't1', title: 'Task One', completed: true }),
        createFocusTask({ id: 't2', title: 'Task Two', completed: false })
    ];
    await mockFocusApp(page, { tasks: mixedTasks });

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    
    // Filter by completed
    await page.getByRole('button', { name: 'COMPLETED', exact: true }).click();
    await expect(page.getByText('Task One')).toBeVisible();
    await expect(page.getByText('Task Two')).not.toBeVisible();
});
