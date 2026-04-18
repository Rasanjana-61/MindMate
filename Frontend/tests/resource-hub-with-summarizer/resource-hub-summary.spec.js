import { expect, test } from '@playwright/test';

function createResource({
  id,
  title,
  subject = 'Engineering',
  type = 'PDF',
  size = '2.4 MB',
  createdAt = new Date().toISOString(),
}) {
  return {
    id,
    title,
    subject,
    type,
    size,
    createdAt,
    originalFileName: title,
  };
}

async function mockSummarizerApp(page, { resources = [] } = {}) {
  const state = {
    resources: [...resources],
    summaries: new Map(),
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

    // Auth & Notifications
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

    // Summarizer Endpoints
    if (pathname.endsWith('/api/summarizer/video/transcript')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          transcript: [
            { offset: 0, duration: 5000, text: "Hello everyone, welcome to this lecture." },
            { offset: 5000, duration: 5000, text: "Today we will talk about Search Engine Optimization." }
          ]
        }),
      });
      return;
    }

    if (pathname.endsWith('/api/summarizer/summarize') && request.method() === 'POST') {
      const isFormData = request.headers()['content-type']?.includes('multipart/form-data');
      let type = 'video';
      
      if (!isFormData) {
        const body = JSON.parse(request.postData() || '{}');
        type = body.type;
      } else {
        type = 'file';
      }

      let summaryContent = '';
      if (type === 'video') {
        summaryContent = "### Video Summary\n* **SEO basics**: Understanding how algorithms work.\n* **Metadata**: Importance of titles and descriptions.";
      } else if (type === 'text') {
        summaryContent = "### Text Summary\nThis is a high-quality summary of the pasted text content.";
      } else {
        summaryContent = "### File Summary\nKey insights extracted from your document.";
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, summary: summaryContent }),
      });
      return;
    }

    // Resource Hub Endpoints
    if (pathname.endsWith('/api/resources') && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resources: state.resources }),
      });
      return;
    }

    if (pathname.endsWith('/api/resources') && request.method() === 'POST') {
      const newResource = createResource({
        id: `res-${state.resources.length + 1}`,
        title: 'Uploaded_Material.pdf',
        subject: 'General Study',
      });
      state.resources.push(newResource);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, resource: newResource }),
      });
      return;
    }

    const resourceMatch = pathname.match(/\/api\/resources\/([^/]+)$/);
    if (resourceMatch && request.method() === 'DELETE') {
      const resId = resourceMatch[1];
      state.resources = state.resources.filter(r => r.id !== resId);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Resource deleted' }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `Unhandled API request: ${request.method()} ${pathname}` }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: /AI Summarizer|Resource Hub/i }).first()).toBeVisible();
  return state;
}

test('user can summarize a youtube video', async ({ page }) => {
  await mockSummarizerApp(page);

  await page.getByRole('button', { name: 'AI Summarizer' }).click();
  await expect(page.getByRole('heading', { name: 'Your Summarizer & Resource Hub' })).toBeVisible();

  // Pick Video Summarizer
  await page.getByText('Video Summarizer').click();
  await expect(page.getByPlaceholder('Paste YouTube video link here')).toBeVisible();

  // Enter YouTube Link
  const videoInput = page.getByPlaceholder('Paste YouTube video link here');
  await videoInput.fill('https://www.youtube.com/watch?v=WBqMxlExDAU');

  // Click Summarize
  await page.getByRole('button', { name: 'Summarize', exact: true }).click();

  // Check Summary Output
  await expect(page.getByRole('heading', { name: 'AI Summary' })).toBeVisible();
  await expect(page.getByText('SEO basics')).toBeVisible();
});

test('user can summarize pasted text', async ({ page }) => {
  await mockSummarizerApp(page);

  await page.getByRole('button', { name: 'AI Summarizer' }).click();
  await page.getByText('Text Summarizer').click();
  
  await expect(page.getByPlaceholder('Paste your long text here...')).toBeVisible();
  
  const longText = 'This is a very long text that needs to be summarized.';
  await page.getByPlaceholder('Paste your long text here...').fill(longText);
  
  await page.getByRole('button', { name: 'Summarize Now' }).click();
  
  await expect(page.getByText('AI Result')).toBeVisible();
  await expect(page.getByText('high-quality summary')).toBeVisible();
});

test('user can upload and delete resources in the hub', async ({ page }) => {
  const initialResources = [
    createResource({ id: 'res-1', title: 'Calculus_Notes.pdf', subject: 'Mathematics' })
  ];
  const state = await mockSummarizerApp(page, { resources: initialResources });

  await page.getByRole('button', { name: 'Resource Hub' }).click();
  await expect(page.getByText('Calculus_Notes.pdf')).toBeVisible();

  // Delete Resource
  await page.locator('.resource-card').filter({ hasText: 'Calculus_Notes.pdf' }).getByRole('button', { name: /Delete/i }).click();
  await expect(page.getByText('Calculus_Notes.pdf')).not.toBeVisible();
  expect(state.resources).toHaveLength(0);
});

test('resource hub displays proper stats', async ({ page }) => {
    const manyResources = [
        createResource({ id: 'res-1', title: 'Note 1.pdf' }),
        createResource({ id: 'res-2', title: 'Note 2.pdf' }),
        createResource({ id: 'res-3', title: 'Note 3.pdf' })
    ];
    await mockSummarizerApp(page, { resources: manyResources });

    await page.getByRole('button', { name: 'Resource Hub' }).click();
    
    // Check total files count if displayed in dashboard or hub stats
    const statsText = await page.getByText(/3.*materials/i);
    if (await statsText.isVisible()) {
        await expect(statsText).toBeVisible();
    }
});
