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
  isFlagged = false,
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
    isFlagged,
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
  await expect(page.getByRole('heading', { name: 'Anonymous Q&A' })).toBeVisible();

  await page.getByRole('button', { name: 'Create New Post' }).click();
  await expect(page.getByRole('heading', { name: 'Share Your Thoughts' })).toBeVisible();

  // Select category
  await page.getByLabel('Category').click();
  await page.getByRole('option', { name: 'Exams' }).click();

  // Enter content
  const postContent = 'I am struggling with exam preparation and need some advice on time management.';
  await page.locator('textarea[placeholder*="Share"]').fill(postContent);

  // Submit post
  await page.getByRole('button', { name: 'Post' }).click();
  await expect(page.getByText(postContent)).toBeVisible();

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
  await expect(page.getByRole('heading', { name: 'Anonymous Q&A' })).toBeVisible();

  // Filter by Exams category
  await page.getByRole('button', { name: 'Exams' }).click();
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
  await page.getByText('How do you manage stress during peak academic season?').click();

  // Open reply section
  await page.getByRole('button', { name: 'Reply' }).click();

  const replyContent = 'I find meditation and regular exercise really help manage stress effectively.';
  await page.locator('textarea[placeholder*="Share your response"]').fill(replyContent);

  await page.getByRole('button', { name: 'Send Reply' }).click();
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
  await page.getByText('Tips for building confidence in group projects?').locator('..').getByRole('button', { name: /Like|Heart/ }).click();

  expect(state.posts[0].isLiked).toBe(true);
  expect(state.posts[0].likeCount).toBe(1);

  // Bookmark the post
  await page.getByText('Tips for building confidence in group projects?').locator('..').getByRole('button', { name: /Bookmark/ }).click();

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
  await page.getByText('Inappropriate or harmful content here.').locator('..').getByRole('button', { name: /Report|Flag/ }).click();

  // Confirm report
  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.getByText(/reported successfully|flagged/i)).toBeVisible();

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
  await page.getByText('I need help understanding calculus concepts.').locator('..').getByRole('button', { name: /Edit/ }).click();

  const updatedContent = 'I need help understanding calculus concepts, especially limits and derivatives.';
  await page.locator('textarea').fill(updatedContent);

  await page.getByRole('button', { name: 'Update' }).click();
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
  await page.getByText('How to build meaningful friendships at university?').locator('..').getByRole('button', { name: /Delete/ }).click();

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
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
  await page.getByText('Best study methods for final exams?').click();

  // Edit reply
  await page.getByText('Active recall and spaced repetition are the most effective methods.').locator('..').getByRole('button', { name: /Edit/ }).click();

  const updatedReply = 'Active recall, spaced repetition, and the Pomodoro technique are highly effective.';
  await page.locator('textarea').fill(updatedReply);
  await page.getByRole('button', { name: 'Update' }).click();

  expect(state.replies[0].content).toBe(updatedReply);

  // Delete reply
  await page.getByText(updatedReply).locator('..').getByRole('button', { name: /Delete/ }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

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
  await expect(page.getByRole('heading', { name: /Overview|Statistics/ })).toBeVisible();

  // Check statistics
  await expect(page.getByText(/2.*posts/i)).toBeVisible();
  await expect(page.getByText(/3.*replies/i)).toBeVisible();

  // Check suggested connections
  await expect(page.getByRole('heading', { name: /Suggested Connections|Find Peers/ })).toBeVisible();
  await expect(page.getByText(/85%|compatibility/i)).toBeVisible();
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
  await expect(page.getByText('Post content 1:')).toBeVisible();

  // Load more posts
  if (await page.getByRole('button', { name: /Load More|Show More/ }).isVisible()) {
    await page.getByRole('button', { name: /Load More|Show More/ }).click();
    await expect(page.getByText(/Post content 1[0-5]:/)).toBeVisible();
  }
});
