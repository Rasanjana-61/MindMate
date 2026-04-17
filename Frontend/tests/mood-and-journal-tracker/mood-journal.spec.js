import { expect, test } from '@playwright/test';

function toLocalDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toNoonUtcIso(date) {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
  )).toISOString();
}

function shiftLocalDate(baseDate, days) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function createHistoryEntry({
  entryId,
  entryDate,
  text,
  moodScore = 4,
  stressScore = 2,
  energyScore = 4,
  emotion = 'joy',
  emotionScores = { joy: 0.78, neutral: 0.18, sadness: 0.04 },
  suggestions = ['Keep protecting this steady momentum tomorrow.'],
  sentiment = 'Positive',
}) {
  return {
    entryId,
    entryDate,
    text,
    moodScore,
    stressScore,
    energyScore,
    emotion,
    emotionScores,
    suggestions,
    sentiment,
    summaryText: 'Mock summary for the journal entry.',
  };
}

async function mockMoodApp(page, { historyEntries = [] } = {}) {
  const state = {
    historyEntries: [...historyEntries],
  };

  const authenticatedUser = {
    id: 'user-1',
    fullName: 'Avery Student',
    email: 'avery.student@example.com',
    role: 'student',
  };

  const dashboardResponse = {
    stats: {
      avgMood: 4.1,
      avgStress: 2.4,
      avgEnergy: 3.8,
    },
    emotionStats: {
      joy: 0.52,
      neutral: 0.28,
      sadness: 0.12,
      stress: 0.08,
    },
    emotionBreakdown: [
      { emotion: 'joy', score: 0.52 },
      { emotion: 'neutral', score: 0.28 },
      { emotion: 'sadness', score: 0.12 },
      { emotion: 'stress', score: 0.08 },
    ],
    chartData: [
      { day: 'Mon', mood: 3, stress: 3, energy: 3 },
      { day: 'Tue', mood: 4, stress: 2, energy: 4 },
      { day: 'Wed', mood: 4, stress: 2, energy: 4 },
      { day: 'Thu', mood: 5, stress: 1, energy: 4 },
      { day: 'Fri', mood: 4, stress: 2, energy: 4 },
      { day: 'Sat', mood: 5, stress: 1, energy: 5 },
      { day: 'Sun', mood: 4, stress: 2, energy: 4 },
    ],
    streakCount: 4,
  };

  const mainDashboardOverviewResponse = {
    stats: {
      todayFocusLabel: '1h 20m',
      completedTasks: 2,
      totalTasks: 4,
      streakDays: 4,
      averageMood: 4.1,
      averageMoodEmoji: '😊',
    },
    tasks: [
      {
        id: 'task-1',
        title: 'Review lecture notes',
        dueDate: toNoonUtcIso(new Date()),
        completed: true,
        priority: 'medium',
      },
      {
        id: 'task-2',
        title: 'Plan tomorrow study blocks',
        dueDate: toNoonUtcIso(new Date()),
        completed: false,
        priority: 'high',
      },
    ],
    focus: {
      dailyGoalHours: 4,
      goalProgressPercent: 33,
      todayFocusLabel: '1h 20m',
    },
    resources: [],
    peerDiscussions: [],
    wellnessTip: 'Keep your current pace and reflect at the end of each day.',
  };

  const moodOverviewResponse = {
    logs: state.historyEntries,
    chartData: [
      { day: 'Mon', mood: 3, stress: 2, energy: 4 },
      { day: 'Tue', mood: 4, stress: 2, energy: 4 },
      { day: 'Wed', mood: 4, stress: 3, energy: 3 },
      { day: 'Thu', mood: 5, stress: 1, energy: 4 },
      { day: 'Fri', mood: 4, stress: 2, energy: 5 },
      { day: 'Sat', mood: 4, stress: 2, energy: 4 },
      { day: 'Sun', mood: 5, stress: 1, energy: 5 },
    ],
    stats: {
      totalEntries: state.historyEntries.length,
      averageMood: 4.2,
      averageStress: 2.1,
      averageEnergy: 4.0,
      highestMoodDay: null,
      lowestMoodDay: null,
    },
    weeklySummary: {
      summary: 'Mock mood summary for the current week.',
      mostStressfulDay: null,
      lowestEnergyDay: null,
    },
    encouragementMessage: 'You are building a consistent check-in habit.',
    insightCards: [],
  };

  const createAnalysisResponse = (entryDate, text) => {
    const createdEntry = createHistoryEntry({
      entryId: `entry-${state.historyEntries.length + 1}`,
      entryDate: toNoonUtcIso(new Date(entryDate)),
      text,
    });

    state.historyEntries = [createdEntry, ...state.historyEntries];

    return {
      message: 'Entry analyzed successfully.',
      ...createdEntry,
    };
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

    if (pathname.endsWith('/api/notifications')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ notifications: [], unreadCount: 0 }),
      });
      return;
    }

    if (pathname.endsWith('/api/dashboard')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dashboardResponse),
      });
      return;
    }

    if (pathname.endsWith('/api/dashboard/overview')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mainDashboardOverviewResponse),
      });
      return;
    }

    if (pathname.endsWith('/api/moods') && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(moodOverviewResponse),
      });
      return;
    }

    if (pathname.endsWith('/api/history') && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.historyEntries),
      });
      return;
    }

    if (pathname.endsWith('/api/entries') && request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const response = createAnalysisResponse(body.entryDate, body.text);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
      return;
    }

    const entryMatch = pathname.match(/\/api\/entries\/([^/]+)$/);
    if (entryMatch && request.method() === 'PUT') {
      const body = JSON.parse(request.postData() || '{}');
      const existingEntryIndex = state.historyEntries.findIndex((entry) => entry.entryId === entryMatch[1]);

      if (existingEntryIndex !== -1) {
        const updatedEntry = {
          ...state.historyEntries[existingEntryIndex],
          text: body.text ?? state.historyEntries[existingEntryIndex].text,
        };

        state.historyEntries = [
          updatedEntry,
          ...state.historyEntries.filter((entry) => entry.entryId !== entryMatch[1]),
        ];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Entry updated successfully.', ...updatedEntry }),
        });
        return;
      }
    }

    if (entryMatch && request.method() === 'DELETE') {
      state.historyEntries = state.historyEntries.filter((entry) => entry.entryId !== entryMatch[1]);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Entry deleted successfully.' }),
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
  await expect(page.getByRole('button', { name: 'Mood Tracker' })).toBeVisible();

  return state;
}

test('user can submit a journal entry and review the generated history', async ({ page }) => {
  const state = await mockMoodApp(page);

  await page.getByRole('button', { name: 'Mood Tracker' }).click();
  await expect(page.getByRole('button', { name: "Write Today's Entry" })).toBeVisible();

  await page.getByRole('button', { name: "Write Today's Entry" }).click();
  await expect(page.getByRole('heading', { name: 'How was your day?' })).toBeVisible();

  const journalEntry = 'Today I felt focused and calm after finishing my work, and I want to keep this momentum.';
  await page.locator('textarea').fill(journalEntry);

  await page.getByRole('button', { name: 'Analyze My Entry' }).click();
  await expect(page.getByRole('heading', { name: 'Emotional Insight' })).toBeVisible();
  await expect(page.getByText(journalEntry)).toBeVisible();

  await page.getByRole('button', { name: 'View History' }).click();
  await expect(page.getByRole('heading', { name: 'Journal History' })).toBeVisible();
  await expect(page.getByText(journalEntry)).toBeVisible();
  await expect(page.getByText('Recent 7 Days')).toBeVisible();

  expect(state.historyEntries).toHaveLength(1);
  expect(state.historyEntries[0].text).toBe(journalEntry);
});

test('results show AI suggestions and scores after submitting an entry', async ({ page }) => {
  await mockMoodApp(page);

  await page.getByRole('button', { name: 'Mood Tracker' }).click();
  await page.getByRole('button', { name: "Write Today's Entry" }).click();
  await expect(page.getByRole('heading', { name: 'How was your day?' })).toBeVisible();

  await page.locator('textarea').fill('I felt calm and productive today, and I managed my tasks better than yesterday.');
  await page.getByRole('button', { name: 'Analyze My Entry' }).click();

  await expect(page.getByRole('heading', { name: 'Emotional Insight' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your Scores' })).toBeVisible();
  await expect(page.getByText('Mood').locator('..').getByText('4/5')).toBeVisible();
  await expect(page.getByText('Stress').locator('..').getByText('2/5')).toBeVisible();
  await expect(page.getByText('Energy').locator('..').getByText('4/5')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Wellness Suggestions' })).toBeVisible();
  await expect(page.getByText('Keep protecting this steady momentum tomorrow.')).toBeVisible();
});

test('history Add action opens the journal with the selected date prefilled', async ({ page }) => {
  const today = new Date();
  const yesterday = shiftLocalDate(today, -1);
  const expectedDateValue = toLocalDateInputValue(yesterday);

  await mockMoodApp(page, {
    historyEntries: [
      createHistoryEntry({
        entryId: 'entry-1',
        entryDate: toNoonUtcIso(today),
        text: 'A grounded check-in for today.',
      }),
    ],
  });

  await page.getByRole('button', { name: 'Mood Tracker' }).click();
  await expect(page.getByRole('button', { name: "Write Today's Entry" })).toBeVisible();

  await page.getByRole('button', { name: 'Journal History' }).click();
  await expect(page.getByRole('heading', { name: 'Journal History' })).toBeVisible();

  await page.getByRole('button', { name: 'Add' }).first().click();
  await expect(page.getByRole('heading', { name: 'How was your day?' })).toBeVisible();
  await expect(page.locator('#journal-entry-date')).toHaveValue(expectedDateValue);
});

test('overview lets users switch chart modes and inspect emotion breakdown', async ({ page }) => {
  await mockMoodApp(page);

  await page.getByRole('button', { name: 'Mood Tracker' }).click();
  await expect(page.getByRole('heading', { name: 'Trend Lines' })).toBeVisible();

  await page.getByRole('button', { name: 'Show Emotion Breakdown' }).click();
  await expect(page.getByRole('button', { name: 'Hide Emotion Breakdown' })).toBeVisible();
  await expect(page.getByText('Joy')).toBeVisible();

  await page.getByRole('button', { name: 'Frequency Bars' }).click();
  await expect(page.getByRole('heading', { name: 'Frequency Bars' })).toBeVisible();

  await page.getByRole('button', { name: 'Trend Lines' }).click();
  await expect(page.getByRole('heading', { name: 'Trend Lines' })).toBeVisible();
});

test('journal edit flow updates an existing entry', async ({ page }) => {
  const entryDate = toNoonUtcIso(new Date());
  const existingEntry = createHistoryEntry({
    entryId: 'entry-1',
    entryDate,
    text: 'I feel okay with my progress today.',
  });

  await mockMoodApp(page, {
    historyEntries: [existingEntry],
  });

  await page.getByRole('button', { name: 'Mood Tracker' }).click();
  await page.getByRole('button', { name: 'Journal Entry' }).click();

  await page.getByRole('button', { name: 'Modify Entry' }).click();
  await expect(page.getByRole('button', { name: 'Update Entry' })).toBeVisible();

  const updatedText = 'I feel strong about my progress today and ready for tomorrow.';
  await page.locator('textarea').fill(updatedText);
  await page.getByRole('button', { name: 'Update Entry' }).click();

  await expect(page.getByRole('heading', { name: 'Emotional Insight' })).toBeVisible();
  await expect(page.getByText(updatedText)).toBeVisible();
});

test('calendar popup can delete an entry from history', async ({ page }) => {
  const today = new Date();
  const entryDate = toNoonUtcIso(today);
  const entryIsoDate = toLocalDateInputValue(today);

  const state = await mockMoodApp(page, {
    historyEntries: [
      createHistoryEntry({
        entryId: 'entry-1',
        entryDate,
        text: 'A day worth remembering.',
      }),
    ],
  });

  await page.getByRole('button', { name: 'Mood Tracker' }).click();
  await page.getByRole('button', { name: 'Journal History' }).click();

  await page.locator(`button[title="View entry for ${entryIsoDate}"]`).click();
  await expect(page.getByRole('button', { name: 'Delete Entry' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete Entry' }).click();
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator(`button[title="View entry for ${entryIsoDate}"]`)).toHaveCount(0);
  expect(state.historyEntries).toHaveLength(0);
});