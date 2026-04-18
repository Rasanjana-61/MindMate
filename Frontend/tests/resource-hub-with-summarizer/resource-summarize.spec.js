import { expect, test } from '@playwright/test';

function createResource({
  id,
  userId = 'user-1',
  originalFileName = 'Lecture_Notes.pdf',
  subject = 'Software Engineering',
  resourceType = 'pdf',
  status = 'approved',
  createdAt = new Date().toISOString(),
}) {
  return {
    id,
    userId,
    originalFileName,
    subject,
    faculty: 'FOC',
    year: 'Year 1',
    semester: 'Semester 1',
    resourceType,
    description: `Discussion about ${subject}`,
    status,
    createdAt,
    updatedAt: createdAt,
  };
}

async function mockResourceHub(page, { resources = [] } = {}) {
  const state = {
    resources: [...resources],
  };

  const authenticatedUser = {
    id: 'user-1',
    fullName: 'Test Student',
    email: 'student@example.com',
    role: 'student',
    faculty: 'FOC',
    year: 'Year 1',
    semester: 'Semester 1',
  };

  await page.addInitScript(() => {
    localStorage.setItem('studentwell_token', 'playwright-mock-token');
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname.endsWith('/api/auth/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: authenticatedUser }),
      });
      return;
    }

    if (pathname.endsWith('/api/notifications')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ notifications: [], unreadCount: 0 }),
      });
      return;
    }

    if (pathname.endsWith('/api/resource') && request.method() === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase() || '';
      const type = url.searchParams.get('type') || 'all';
      
      let filtered = state.resources;
      if (search) {
        filtered = filtered.filter(r => 
          r.subject.toLowerCase().includes(search) || 
          r.originalFileName.toLowerCase().includes(search)
        );
      }
      if (type !== 'all' && type !== '') {
        filtered = filtered.filter(r => r.resourceType === type);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resources: filtered }),
      });
      return;
    }

    if (pathname.endsWith('/api/resource') && request.method() === 'POST') {
      const newResource = createResource({
        id: `res-${state.resources.length + 1}`,
        userId: 'user-1',
        subject: 'New Uploaded Resource',
        status: 'pending',
      });
      state.resources.push(newResource);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ 
          message: 'Resource uploaded successfully.', 
          resource: newResource 
        }),
      });
      return;
    }

    const deleteMatch = pathname.match(/\/api\/resource\/([^/]+)$/);
    if (deleteMatch && request.method() === 'DELETE') {
      const id = deleteMatch[1];
      state.resources = state.resources.filter(r => r.id !== id);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Resource deleted successfully.' }),
      });
      return;
    }

    if (pathname.match(/\/api\/resource\/([^/]+)\/download$/)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: new TextEncoder().encode('%PDF-1.4 mock summary content'),
        headers: {
          'Content-Disposition': 'attachment; filename="summary.pdf"',
        },
      });
      return;
    }

    await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not Found' }) });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Resource Hub' })).toBeVisible();
  return state;
}

test('user can browse approved resources for the student', async ({ page }) => {
  const resources = [
    createResource({ id: '1', subject: 'Data Structures', resourceType: 'pdf' }),
  ];
  await mockResourceHub(page, { resources });

  await page.getByRole('button', { name: 'Resource Hub' }).click();
  await expect(page.getByText('Data Structures')).toBeVisible();
});

test('user can search for resources', async ({ page }) => {
  const resources = [
    createResource({ id: '1', subject: 'Machine Learning' }),
    createResource({ id: '2', subject: 'Database Systems' }),
  ];
  await mockResourceHub(page, { resources });

  await page.getByRole('button', { name: 'Resource Hub' }).click();
  const searchInput = page.getByPlaceholder(/Search resources/);
  await searchInput.fill('Machine');
  await expect(page.getByText('Machine Learning')).toBeVisible();
  await expect(page.getByText('Database Systems')).not.toBeVisible();
});

test('user can upload a new resource', async ({ page }) => {
  const state = await mockResourceHub(page);
  await page.getByRole('button', { name: 'Resource Hub' }).click();
  await page.getByRole('button', { name: 'Upload Resource' }).click();
  await page.getByPlaceholder(/e.g. Operating Systems/).fill('Physics Revision');
  
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('.dashed-border-animate').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'notes.pdf',
    mimeType: 'application/pdf',
    buffer: new TextEncoder().encode('mock pdf'),
  });

  await page.getByRole('button', { name: 'Confirm & Upload' }).click();
  await expect(page.getByText(/Resource uploaded/)).toBeVisible();
  await expect(page.getByText('Pending Approval')).toBeVisible();
});

test('user can download AI-generated PDF summary', async ({ page }) => {
  const resource = createResource({ 
    id: 'res-abc', 
    subject: 'Cloud Computing Guide', 
    status: 'approved' 
  });
  await mockResourceHub(page, { resources: [resource] });

  await page.getByRole('button', { name: 'Resource Hub' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('summary.pdf');
});

test('user can delete their own resource', async ({ page }) => {
  const resource = createResource({ 
    id: 'my-res', 
    subject: 'Personal Notes to Delete' 
  });
  const state = await mockResourceHub(page, { resources: [resource] });

  await page.getByRole('button', { name: 'Resource Hub' }).click();
  await page.getByText('Personal Notes to Delete').hover();
  page.on('dialog', dialog => dialog.accept());
  
  const deleteBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash2') });
  await deleteBtn.click();
  await expect(page.getByText('Personal Notes to Delete')).not.toBeVisible();
});
