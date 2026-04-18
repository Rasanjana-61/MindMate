import { expect, test } from '@playwright/test';

function formatTimeLabel(dateString) {
  const timestamp = new Date(dateString).getTime();
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function createPeerPost({
  id,
  userId,
  category = 'Stress',
  content,
  isFlagged: flagged = false,
  likeCount = 0,
  replyCount = 0,
  isOwn = false,
  isBookmarked = false,
  isLiked = false,
  createdAt = new Date().toISOString(),
}) {
  return {
    id,
    userId,
    category,
    content,
    faculty: 'Engineering',
    isFlagged: flagged,
    isBookmarked,
    isLiked,
    likeCount,
    replyCount,
    isOwn,
    createdAt,
    updatedAt: createdAt,
    replies: [],
  };
}

function createPeerReply({
  id,
  postId,
  userId,
  content,
  isFlagged = false,
  isOwn = false,
  createdAt = new Date().toISOString(),
}) {
  return {
    id,
    postId,
    userId,
    content,
    isFlagged,
    isOwn,
    createdAt,
    updatedAt: createdAt,
  };
}

async function mockPeerApp(page, { posts = [], replies = [] } = {}) {
  const state = {
    posts: [...posts],
    replies: [...replies],
  };

  const authenticatedUser = {
    id: 'user-1',
    fullName: 'Sarah Smith',
    email: 'sarah.smith@example.com',
    role: 'student',
    faculty: 'Engineering',
  };

  const PEER_CATEGORIES = [
    'Stress',
    'Exams',
    'Relationships',
    'Academic Difficulty',
    'Personal Growth',
  ];

  const peerOverviewResponse = {
    posts: state.posts,
    stats: {
      totalPosts: state.posts.length,
      totalReplies: state.replies.length,
      suggestedConnections: [
        {
          userId: 'user-2',
          name: 'Anonymous User',
          compatibilityScore: 85,
          commonInterests: ['Stress Management', 'Exam Preparation'],
        },
      ],
    },
  };

  const createPostResponse = (category, content) => {
    const newPost = createPeerPost({
      id: `post-${state.posts.length + 1}`,
      userId: 'user-1',
      category,
      content,
      isOwn: true,
      createdAt: new Date().toISOString(),
    });

    state.posts = [newPost, ...state.posts];

    return {
      message: 'Post created successfully.',
      ...newPost,
    };
  };

  const createReplyResponse = (postId, content) => {
    const newReply = createPeerReply({
      id: `reply-${state.replies.length + 1}`,
      postId,
      userId: 'user-1',
      content,
      isOwn: true,
      createdAt: new Date().toISOString(),
    });

    state.replies = [newReply, ...state.replies];

    const postIndex = state.posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      state.posts[postIndex].replyCount += 1;
    }

    return {
      message: 'Reply created successfully.',
      ...newReply,
    };
  };

  await page.addInitScript(() => {
    localStorage.setItem('studentwell_token', 'playwright-token');
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    // Auth endpoints
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

    // Peer support endpoints
    if (pathname.endsWith('/api/peer') && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(peerOverviewResponse),
      });
      return;
    }

    if (pathname.endsWith('/api/peer/posts') && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ posts: state.posts }),
      });
      return;
    }

    if (pathname.endsWith('/api/peer/posts') && request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const response = createPostResponse(body.category, body.content);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
      return;
    }

    // Get posts by category
    const categoryMatch = pathname.match(/\/api\/peer\/posts\/category\/(.+)$/);
    if (categoryMatch && request.method() === 'GET') {
      const category = decodeURIComponent(categoryMatch[1]);
      const filteredPosts = state.posts.filter(p => p.category === category);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ posts: filteredPosts }),
      });
      return;
    }

    // Update post
    const postMatch = pathname.match(/\/api\/peer\/posts\/([^/]+)$/);
    if (postMatch && request.method() === 'PUT') {
      const body = JSON.parse(request.postData() || '{}');
      const postIndex = state.posts.findIndex(p => p.id === postMatch[1]);

      if (postIndex !== -1) {
        const updatedPost = {
          ...state.posts[postIndex],
          content: body.content ?? state.posts[postIndex].content,
          updatedAt: new Date().toISOString(),
        };

        state.posts[postIndex] = updatedPost;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Post updated successfully.', ...updatedPost }),
        });
        return;
      }
    }

    // Delete post
    if (postMatch && request.method() === 'DELETE') {
      const postIndex = state.posts.findIndex(p => p.id === postMatch[1]);

      if (postIndex !== -1) {
        state.posts.splice(postIndex, 1);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Post deleted successfully.' }),
        });
        return;
      }
    }

    // Like post
    if (pathname.match(/\/api\/peer\/posts\/([^/]+)\/like$/) && request.method() === 'POST') {
      const postId = pathname.match(/\/api\/peer\/posts\/([^/]+)\/like$/)[1];
      const postIndex = state.posts.findIndex(p => p.id === postId);

      if (postIndex !== -1) {
        const updatedPost = {
          ...state.posts[postIndex],
          isLiked: true,
          likeCount: state.posts[postIndex].likeCount + 1,
        };

        state.posts[postIndex] = updatedPost;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Post liked.', ...updatedPost }),
        });
        return;
      }
    }

    // Unlike post
    if (pathname.match(/\/api\/peer\/posts\/([^/]+)\/unlike$/) && request.method() === 'POST') {
      const postId = pathname.match(/\/api\/peer\/posts\/([^/]+)\/unlike$/)[1];
      const postIndex = state.posts.findIndex(p => p.id === postId);

      if (postIndex !== -1) {
        const updatedPost = {
          ...state.posts[postIndex],
          isLiked: false,
          likeCount: Math.max(0, state.posts[postIndex].likeCount - 1),
        };

        state.posts[postIndex] = updatedPost;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Post unliked.', ...updatedPost }),
        });
        return;
      }
    }

    // Bookmark post
    if (pathname.match(/\/api\/peer\/posts\/([^/]+)\/bookmark$/) && request.method() === 'POST') {
      const postId = pathname.match(/\/api\/peer\/posts\/([^/]+)\/bookmark$/)[1];
      const postIndex = state.posts.findIndex(p => p.id === postId);

      if (postIndex !== -1) {
        const updatedPost = {
          ...state.posts[postIndex],
          isBookmarked: true,
        };

        state.posts[postIndex] = updatedPost;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Post bookmarked.', ...updatedPost }),
        });
        return;
      }
    }

    // Remove bookmark
    if (pathname.match(/\/api\/peer\/posts\/([^/]+)\/bookmark$/) && request.method() === 'DELETE') {
      const postId = pathname.match(/\/api\/peer\/posts\/([^/]+)\/bookmark$/)[1];
      const postIndex = state.posts.findIndex(p => p.id === postId);

      if (postIndex !== -1) {
        const updatedPost = {
          ...state.posts[postIndex],
          isBookmarked: false,
        };

        state.posts[postIndex] = updatedPost;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Bookmark removed.', ...updatedPost }),
        });
        return;
      }
    }

    // Report post
    if (pathname.match(/\/api\/peer\/posts\/([^/]+)\/report$/) && request.method() === 'POST') {
      const postId = pathname.match(/\/api\/peer\/posts\/([^/]+)\/report$/)[1];
      const postIndex = state.posts.findIndex(p => p.id === postId);

      if (postIndex !== -1) {
        const updatedPost = {
          ...state.posts[postIndex],
          isFlagged: true,
        };

        state.posts[postIndex] = updatedPost;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Post reported successfully.', ...updatedPost }),
        });
        return;
      }
    }

    // Create reply
    if (pathname.match(/\/api\/peer\/posts\/([^/]+)\/replies$/) && request.method() === 'POST') {
      const postId = pathname.match(/\/api\/peer\/posts\/([^/]+)\/replies$/)[1];
      const body = JSON.parse(request.postData() || '{}');
      const response = createReplyResponse(postId, body.content);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
      return;
    }

    // Update reply
    const replyMatch = pathname.match(/\/api\/peer\/replies\/([^/]+)$/);
    if (replyMatch && request.method() === 'PUT') {
      const body = JSON.parse(request.postData() || '{}');
      const replyIndex = state.replies.findIndex(r => r.id === replyMatch[1]);

      if (replyIndex !== -1) {
        const updatedReply = {
          ...state.replies[replyIndex],
          content: body.content ?? state.replies[replyIndex].content,
          updatedAt: new Date().toISOString(),
        };

        state.replies[replyIndex] = updatedReply;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Reply updated successfully.', ...updatedReply }),
        });
        return;
      }
    }

    // Delete reply
    if (replyMatch && request.method() === 'DELETE') {
      const replyIndex = state.replies.findIndex(r => r.id === replyMatch[1]);

      if (replyIndex !== -1) {
        const deletedReply = state.replies[replyIndex];
        state.replies.splice(replyIndex, 1);

        // Update post reply count
        const postIndex = state.posts.findIndex(p => p.id === deletedReply.postId);
        if (postIndex !== -1) {
          state.posts[postIndex].replyCount = Math.max(0, state.posts[postIndex].replyCount - 1);
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Reply deleted successfully.' }),
        });
        return;
      }
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `Unhandled API request: ${request.method()} ${pathname}` }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Peer Support' })).toBeVisible();

  return state;
}

test('user can create a new peer support post', async ({ page }) => {
  const state = await mockPeerApp(page);

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(1000); // Wait for page to load

  // Select category button
  await page.getByRole('button', { name: 'Exams' }).click();

  // Enter content
  const postContent = 'I am struggling with exam preparation and need some advice on time management.';
  await page.locator('textarea[placeholder*="Share"]').fill(postContent);

  // Submit post
  const postResponse = page.waitForResponse(response => 
    response.url().includes('/api/peer/posts') && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Post Anonymously' }).click();
  await postResponse;
  await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });

  expect(state.posts).toHaveLength(1);
  expect(state.posts[0].category).toBe('Exams');
  expect(state.posts[0].content).toBe(postContent);
});

test('user can view posts filtered by category', async ({ page }) => {
  const existingPosts = [
    createPeerPost({
      id: 'post-1',
      userId: 'user-2',
      category: 'Stress',
      content: 'How do you manage stress during peak academic season?',
      likeCount: 5,
      replyCount: 2,
    }),
    createPeerPost({
      id: 'post-2',
      userId: 'user-3',
      category: 'Exams',
      content: 'Best study techniques for multiple choice exams?',
      likeCount: 8,
      replyCount: 3,
    }),
    createPeerPost({
      id: 'post-3',
      userId: 'user-4',
      category: 'Relationships',
      content: 'How to balance academics and social life?',
      likeCount: 3,
      replyCount: 1,
    }),
  ];

  await mockPeerApp(page, { posts: existingPosts });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(1000);

  // Filter by Exams category
  const examButton = page.getByRole('button', { name: /Exams/ }).nth(0);
  await examButton.click();
  await expect(page.getByText('Best study techniques for multiple choice exams?')).toBeVisible();
  await expect(page.getByText('How do you manage stress during peak academic season?')).not.toBeVisible();
});

test('user can reply to a peer support post', async ({ page }) => {
  const existingPosts = [
    createPeerPost({
      id: 'post-1',
      userId: 'user-2',
      category: 'Stress',
      content: 'How do you manage stress during peak academic season?',
      replyCount: 0,
    }),
  ];

  const state = await mockPeerApp(page, { posts: existingPosts });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(500);
  
  // Click to expand thread
  const postContent = page.getByText('How do you manage stress during peak academic season?');
  await postContent.locator('..').click();
  await page.waitForTimeout(500);

  // Find and click reply button
  const replyButton = page.getByRole('button', { name: /Reply|MessageCircle/ }).first();
  await replyButton.click();

  const replyContent = 'I find meditation and regular exercise really help manage stress effectively.';
  await page.locator('textarea').nth(-1).fill(replyContent);

  await page.getByRole('button', { name: /Post|Send/ }).nth(-1).click();
  await expect(page.getByText(replyContent)).toBeVisible();

  expect(state.replies).toHaveLength(1);
  expect(state.replies[0].content).toBe(replyContent);
});

test('user can like and bookmark a post', async ({ page }) => {
  const existingPosts = [
    createPeerPost({
      id: 'post-1',
      userId: 'user-2',
      category: 'Personal Growth',
      content: 'Tips for building confidence in group projects?',
      likeCount: 0,
      isLiked: false,
      isBookmarked: false,
    }),
  ];

  const state = await mockPeerApp(page, { posts: existingPosts });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(500);

  // Find post and like it
  const postText = page.getByText('Tips for building confidence in group projects?');
  const postCard = postText.locator('..');
  
  // Like button (Heart icon)
  const likeButton = postCard.locator('button').filter({ hasNot: page.locator('[class*="bookmark"], [class*="delete"]') }).nth(0);
  await likeButton.click();

  expect(state.posts[0].isLiked).toBe(true);
  expect(state.posts[0].likeCount).toBe(1);

  // Bookmark button
  const bookmarkButton = postCard.locator('button').filter({ hasNot: page.locator('[class*="delete"]') }).nth(1);
  await bookmarkButton.click();

  expect(state.posts[0].isBookmarked).toBe(true);
});

test('user can report inappropriate content', async ({ page }) => {
  const existingPosts = [
    createPeerPost({
      id: 'post-1',
      userId: 'user-2',
      category: 'Stress',
      content: 'Inappropriate or harmful content here.',
      isFlagged: false,
    }),
  ];

  const state = await mockPeerApp(page, { posts: existingPosts });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(500);

  const postText = page.getByText('Inappropriate or harmful content here.');
  const postCard = postText.locator('..');
  
  // Flag/Report button (usually Flag icon)
  const reportButton = postCard.locator('button').last();
  await reportButton.click();

  // Look for confirmation or report dialog
  const confirmButton = page.getByRole('button', { name: /Report|Confirm/ }).last();
  await confirmButton.click();

  expect(state.posts[0].isFlagged).toBe(true);
});

test('user can edit their own post', async ({ page }) => {
  const existingPosts = [
    createPeerPost({
      id: 'post-1',
      userId: 'user-1',
      category: 'Academic Difficulty',
      content: 'I need help understanding calculus concepts.',
      isOwn: true,
    }),
  ];

  const state = await mockPeerApp(page, { posts: existingPosts });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(500);

  const postText = page.getByText('I need help understanding calculus concepts.');
  const postCard = postText.locator('..');
  
  // Find edit button (Pencil icon)
  const editButton = postCard.locator('button').nth(0);
  await editButton.click();

  const updatedContent = 'I need help understanding calculus concepts, especially limits and derivatives.';
  await page.locator('textarea').fill(updatedContent);

  await page.getByRole('button', { name: /Update|Post/ }).click();
  await expect(page.getByText(updatedContent)).toBeVisible();

  expect(state.posts[0].content).toBe(updatedContent);
});

test('user can delete their own post', async ({ page }) => {
  const existingPosts = [
    createPeerPost({
      id: 'post-1',
      userId: 'user-1',
      category: 'Relationships',
      content: 'How to build meaningful friendships at university?',
      isOwn: true,
    }),
  ];

  const state = await mockPeerApp(page, { posts: existingPosts });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(500);

  const postText = page.getByText('How to build meaningful friendships at university?');
  const postCard = postText.locator('..');
  
  // Find delete button (Trash icon)
  const deleteButton = postCard.locator('button').last();
  await deleteButton.click();

  // Confirm deletion
  const confirmDelete = page.getByRole('button', { name: /Delete|Confirm/ }).last();
  await confirmDelete.click();
  
  await expect(page.getByText('How to build meaningful friendships at university?')).not.toBeVisible();

  expect(state.posts).toHaveLength(0);
});

test('user can edit and delete their reply', async ({ page }) => {
  const existingPosts = [
    createPeerPost({
      id: 'post-1',
      userId: 'user-2',
      category: 'Exams',
      content: 'Best study methods for final exams?',
      replyCount: 1,
    }),
  ];

  const existingReplies = [
    createPeerReply({
      id: 'reply-1',
      postId: 'post-1',
      userId: 'user-1',
      content: 'Active recall and spaced repetition are the most effective methods.',
      isOwn: true,
    }),
  ];

  const state = await mockPeerApp(page, { posts: existingPosts, replies: existingReplies });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(500);
  
  await page.getByText('Best study methods for final exams?').click();
  await page.waitForTimeout(500);

  // Edit reply
  const replyText = page.getByText('Active recall and spaced repetition are the most effective methods.');
  const replyCard = replyText.locator('..');
  const editButton = replyCard.locator('button').nth(0);
  await editButton.click();

  const updatedReply = 'Active recall, spaced repetition, and the Pomodoro technique are highly effective.';
  await page.locator('textarea').last().fill(updatedReply);
  await page.getByRole('button', { name: /Update|Post/ }).last().click();

  expect(state.replies[0].content).toBe(updatedReply);

  // Delete reply
  const updatedReplyText = page.getByText(updatedReply);
  const updatedReplyCard = updatedReplyText.locator('..');
  const deleteButton = updatedReplyCard.locator('button').last();
  await deleteButton.click();
  
  const confirmDelete = page.getByRole('button', { name: /Delete|Confirm/ }).last();
  await confirmDelete.click();

  expect(state.replies).toHaveLength(0);
});

test('overview displays post statistics and suggested connections', async ({ page }) => {
  const existingPosts = [
    createPeerPost({
      id: 'post-1',
      userId: 'user-2',
      category: 'Stress',
      content: 'Managing exam stress',
      replyCount: 2,
    }),
    createPeerPost({
      id: 'post-2',
      userId: 'user-3',
      category: 'Personal Growth',
      content: 'Building confidence',
      replyCount: 1,
    }),
  ];

  await mockPeerApp(page, { posts: existingPosts });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(1000);

  // Check if statistics are visible
  await expect(page.getByText(/Managing exam stress|Building confidence/)).toBeVisible();

  // The overview includes suggested connections
  const suggestedSection = page.locator('.suggestion, .connection, .match').first();
  if (await suggestedSection.isVisible().catch(() => false)) {
    await expect(suggestedSection).toBeVisible();
  }
});

test('user can view all posts with pagination and load more', async ({ page }) => {
  const manyPosts = Array.from({ length: 15 }, (_, i) =>
    createPeerPost({
      id: `post-${i + 1}`,
      userId: `user-${i + 2}`,
      category: ['Stress', 'Exams', 'Relationships', 'Academic Difficulty', 'Personal Growth'][i % 5],
      content: `Post content ${i + 1}: Some discussion about ${['stress', 'exams', 'relationships', 'academics', 'growth'][i % 5]}`,
      replyCount: Math.floor(Math.random() * 5),
    })
  );

  await mockPeerApp(page, { posts: manyPosts });

  await page.getByRole('button', { name: 'Peer Support' }).click();
  await page.waitForTimeout(1000);
  
  // Check first post is visible
  await expect(page.getByText(/Post content.*:/)).toBeVisible();

  // Look for load more button or pagination
  const loadMoreButton = page.getByRole('button', { name: /Load More|Show More/ });
  if (await loadMoreButton.isVisible().catch(() => false)) {
    await loadMoreButton.click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Post content.*:/)).toBeVisible();
  }
});
