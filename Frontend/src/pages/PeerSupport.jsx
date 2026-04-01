import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  UserPlus,
  X,
  Heart,
  Bookmark,
  Flag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  createPeerPost,
  createPeerReply,
  deletePeerPost,
  deletePeerReply,
  fetchPeerOverview,
  markPeerNotificationsRead,
  updatePeerPost,
  updatePeerReply,
  bookmarkPost,
  removeBookmark,
  likePost,
  unlikePost,
  reportPost,
} from '../lib/auth';

const categoryIcons = {
  All: '\u{1F31F}',
  Stress: '\u{1F4AD}',
  Exams: '\u{1F4DA}',
  Relationships: '\u{1F91D}',
  'Academic Difficulty': '\u{1F4D8}',
  'Personal Growth': '\u{1F331}',
};

const categoryColors = {
  Stress: 'bg-app-stress/10 text-app-stress border-app-stress/20',
  Exams: 'bg-app-primary/10 text-app-primary border-app-primary/20',
  Relationships: 'bg-blue-100 text-blue-600 border-blue-200',
  'Academic Difficulty': 'bg-app-energy/10 text-app-energy border-app-energy/20',
  'Personal Growth': 'bg-app-mood/10 text-app-mood border-app-mood/20',
};

function createInitialPostForm() {
  return {
    category: 'Stress',
    content: '',
  };
}

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

function getAvatarGradient(seed) {
  const gradients = [
    'from-app-primary-light to-app-primary',
    'from-app-stress/20 to-app-stress',
    'from-app-mood/20 to-app-mood',
    'from-blue-200 to-blue-600',
    'from-app-energy/20 to-app-energy',
  ];

  const value = typeof seed === 'string' ? seed.length : Number(seed);
  return gradients[value % gradients.length];
}

export function PeerSupport({ user }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedThreads, setExpandedThreads] = useState([]);
  const [postForm, setPostForm] = useState(createInitialPostForm);
  const [editingPostId, setEditingPostId] = useState('');
  const [editingReplyId, setEditingReplyId] = useState('');
  const [replyingToReplyId, setReplyingToReplyId] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [postErrors, setPostErrors] = useState({});
  const [replyErrors, setReplyErrors] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [reportedPosts, setReportedPosts] = useState(new Set());
  const [postLikeCounts, setPostLikeCounts] = useState({});
  const [overview, setOverview] = useState({
    posts: [],
    categories: [],
    notifications: [],
    unreadNotificationCount: 0,
    suggestedConnections: [],
    moderationNotice: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function loadOverview(nextCategory = activeCategory, options = {}) {
    if (!options.silent) {
      setIsLoading(true);
    }

    try {
      const data = await fetchPeerOverview(nextCategory);
      setOverview(data);
      
      // Update bookmarked posts from API response
      const bookmarked = data.posts
        .filter((post) => post.isBookmarked)
        .map((post) => post.id);
      setBookmarkedPosts(new Set(bookmarked));

      // Update liked posts from API response
      const liked = data.posts
        .filter((post) => post.isLiked)
        .map((post) => post.id);
      setLikedPosts(new Set(liked));

      // Update like counts from API response
      const counts = {};
      data.posts.forEach((post) => {
        counts[post.id] = post.likeCount || 0;
      });
      setPostLikeCounts(counts);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      if (!options.silent) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadOverview(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadOverview(activeCategory, { silent: true });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [activeCategory]);

  const categoryTabs = useMemo(() => {
    if (overview.categories.length) {
      return overview.categories;
    }

    return [{ name: 'All', count: 0 }];
  }, [overview.categories]);

  function resetPostForm() {
    setPostForm(createInitialPostForm());
    setEditingPostId('');
    setPostErrors({});
  }

  function startEditingPost(post) {
    setEditingPostId(post.id);
    setPostForm({
      category: post.category,
      content: post.content,
    });
    setPostErrors({});
    setStatusMessage('');
    setErrorMessage('');
  }

  function startEditingReply(reply) {
    setEditingReplyId(reply.id);
    setReplyTexts((current) => ({
      ...current,
      [reply.postId]: reply.content,
    }));
    setReplyErrors({});
    setStatusMessage('');
    setErrorMessage('');
  }

  function cancelReplyEdit(postId) {
    setEditingReplyId('');
    setReplyTexts((current) => ({
      ...current,
      [postId]: '',
    }));
    setReplyErrors((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
  }

  async function handlePostSubmit() {
    setIsSaving(true);
    setStatusMessage('');
    setErrorMessage('');
    setPostErrors({});

    try {
      const response = editingPostId
        ? await updatePeerPost(editingPostId, postForm)
        : await createPeerPost(postForm);

      setStatusMessage(response.message);
      resetPostForm();
      await loadOverview(activeCategory, { silent: true });
    } catch (error) {
      setPostErrors(error.errors || {});
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeletePost(postId) {
    setStatusMessage('');
    setErrorMessage('');

    try {
      await deletePeerPost(postId);
      if (editingPostId === postId) {
        resetPostForm();
      }
      setStatusMessage('Post deleted successfully.');
      await loadOverview(activeCategory, { silent: true });
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleReplySubmit(postId) {
    const content = (replyTexts[postId] || '').trim();
    if (!content) {
      setReplyErrors((current) => ({
        ...current,
        [postId]: 'Reply content is required.',
      }));
      return;
    }

    setStatusMessage('');
    setErrorMessage('');

    try {
      const response =
        editingReplyId && overview.posts.some((post) => post.replies.some((reply) => reply.id === editingReplyId))
          ? await updatePeerReply(editingReplyId, { content })
          : await createPeerReply(postId, { 
              content,
              parentReplyId: replyingToReplyId || undefined 
            });

      setStatusMessage(response.message);
      setEditingReplyId('');
      setReplyingToReplyId('');
      setReplyTexts((current) => ({
        ...current,
        [postId]: '',
      }));
      setReplyErrors((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
      await loadOverview(activeCategory, { silent: true });
    } catch (error) {
      setReplyErrors((current) => ({
        ...current,
        [postId]: error.errors?.content || error.message,
      }));
      setErrorMessage(error.message);
    }
  }

  async function handleDeleteReply(replyId) {
    setStatusMessage('');
    setErrorMessage('');

    try {
      await deletePeerReply(replyId);
      if (editingReplyId === replyId) {
        setEditingReplyId('');
      }
      setStatusMessage('Reply deleted successfully.');
      await loadOverview(activeCategory, { silent: true });
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleLikePost(postId) {
    try {
      if (likedPosts.has(postId)) {
        const response = await unlikePost(postId);
        setLikedPosts((current) => {
          const next = new Set(current);
          next.delete(postId);
          return next;
        });
        setPostLikeCounts((current) => ({
          ...current,
          [postId]: response.likeCount || 0,
        }));
      } else {
        const response = await likePost(postId);
        setLikedPosts((current) => new Set([...current, postId]));
        setPostLikeCounts((current) => ({
          ...current,
          [postId]: response.likeCount || 0,
        }));
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleBookmarkPost(postId) {
    try {
      if (bookmarkedPosts.has(postId)) {
        await removeBookmark(postId);
        setBookmarkedPosts((current) => {
          const next = new Set(current);
          next.delete(postId);
          return next;
        });
      } else {
        await bookmarkPost(postId);
        setBookmarkedPosts((current) => new Set([...current, postId]));
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleReportPost(postId) {
    if (reportedPosts.has(postId)) {
      setErrorMessage("You have already reported this post.");
      return;
    }

    try {
      await reportPost(postId, "Inappropriate content", "");
      setReportedPosts((current) => new Set([...current, postId]));
      setStatusMessage('Post reported successfully. Thank you for helping keep our community safe.');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="card p-6 md:p-8 border-t-4 border-t-app-primary shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="bg-app-primary/10 text-app-primary text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold w-fit border border-app-primary/20">
                <Lock className="w-3.5 h-3.5" />
                You are posting anonymously inside {user.faculty}
              </div>
              <p className="text-xs text-app-text-secondary max-w-md">{overview.moderationNotice}</p>
            </div>

            <div className="relative mb-4">
              <textarea
                value={postForm.content}
                onChange={(event) => setPostForm((current) => ({ ...current, content: event.target.value }))}
                maxLength={500}
                placeholder="Share a concern, ask a question, or describe what you are dealing with."
                className="w-full p-5 bg-app-background border border-transparent rounded-2xl focus:bg-white focus:border-app-primary focus:ring-4 focus:ring-app-primary/10 outline-none resize-none h-32 text-sm transition-all shadow-inner"
              />
              <span className="absolute bottom-4 right-4 text-xs font-medium text-app-text-secondary">
                {postForm.content.length}/500
              </span>
            </div>

            {postErrors.content ? <p className="text-xs text-app-stress mb-3">{postErrors.content}</p> : null}

            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                {Object.keys(categoryIcons)
                  .filter((name) => name !== 'All')
                  .map((name) => (
                    <button
                      key={name}
                      onClick={() => setPostForm((current) => ({ ...current, category: name }))}
                      type="button"
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        postForm.category === name
                          ? `${categoryColors[name]} shadow-sm scale-105`
                          : 'bg-white text-app-text-secondary hover:bg-app-background border-app-primary-light'
                      }`}
                    >
                      {categoryIcons[name]} {name}
                    </button>
                  ))}
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                {editingPostId ? (
                  <button type="button" onClick={resetPostForm} className="btn-secondary px-5 py-3 flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Cancel Edit
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handlePostSubmit}
                  disabled={isSaving}
                  className="btn-primary bg-app-primary hover:bg-app-primary-dark focus:ring-app-primary text-white px-8 py-3 shadow-lg shadow-app-primary/30 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : editingPostId ? 'Update Post' : 'Post Anonymously'}
                </button>
              </div>
            </div>

            {statusMessage ? (
              <div className="mt-4 rounded-2xl border border-app-mood/30 bg-app-mood/10 px-4 py-3 text-sm text-app-mood">
                {statusMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-app-stress/30 bg-app-stress/10 px-4 py-3 text-sm text-app-stress">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div>
            <div className="flex gap-3 overflow-x-auto pb-4 mb-2 px-1">
              {categoryTabs.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                    activeCategory === category.name
                      ? 'bg-app-primary-dark text-white scale-105'
                      : 'bg-white border border-app-primary-light text-app-text-secondary hover:bg-app-background hover:text-app-text-primary'
                  }`}
                >
                  {categoryIcons[category.name]} {category.name} ({category.count})
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {isLoading ? (
                <div className="card p-12 text-center text-sm text-app-text-secondary">Loading discussions...</div>
              ) : overview.posts.length === 0 ? (
                <div className="card p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-app-background rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-app-text-secondary" />
                  </div>
                  <h3 className="text-lg font-bold text-app-text-primary mb-2">No discussions yet</h3>
                  <p className="text-app-text-secondary text-sm">Be the first to start a conversation in this category.</p>
                </div>
              ) : (
                overview.posts.map((post) => {
                  const isExpanded = expandedThreads.includes(post.id);
                  return (
                    <div key={post.id} className="card p-0 transition-all duration-300 hover:shadow-lg border border-app-primary-light/50">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4 gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(post.id)} flex items-center justify-center text-white shadow-inner`}>
                              <Lock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-app-text-primary">Anonymous Student</span>
                              <span className="block text-xs font-medium text-app-text-secondary">{formatTimeLabel(post.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryColors[post.category]}`}>
                              {post.category}
                            </span>
                            {post.isOwn ? (
                              <>
                                <button type="button" onClick={() => startEditingPost(post)} className="p-2 rounded-lg bg-app-background text-app-text-secondary hover:text-app-primary">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => handleDeletePost(post.id)} className="p-2 rounded-lg bg-app-background text-app-text-secondary hover:text-app-stress">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <p className="text-app-text-primary text-base leading-relaxed mb-6 font-medium">{post.content}</p>

                        <div className="flex items-center gap-6 border-t border-app-primary-light/50 pt-4">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-2 text-sm font-bold transition-colors group ${
                              likedPosts.has(post.id)
                                ? 'text-app-stress'
                                : 'text-app-text-secondary hover:text-app-stress'
                            }`}
                            type="button"
                            title="Like this post"
                          >
                            <div className={`p-1.5 rounded-full transition-colors ${
                              likedPosts.has(post.id)
                                ? 'bg-app-stress/10'
                                : 'group-hover:bg-app-stress/10'
                            }`}>
                              <Heart className="w-5 h-5" fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                            </div>
                            {postLikeCounts[post.id] || 0} {postLikeCounts[post.id] === 1 ? 'Like' : 'Likes'}
                          </button>

                          <button
                            onClick={() => handleBookmarkPost(post.id)}
                            className={`flex items-center gap-2 text-sm font-bold transition-colors group ${
                              bookmarkedPosts.has(post.id)
                                ? 'text-app-primary'
                                : 'text-app-text-secondary hover:text-app-primary'
                            }`}
                            type="button"
                            title="Bookmark this post"
                          >
                            <div className={`p-1.5 rounded-full transition-colors ${
                              bookmarkedPosts.has(post.id)
                                ? 'bg-app-primary/10'
                                : 'group-hover:bg-app-primary/10'
                            }`}>
                              <Bookmark className="w-5 h-5" fill={bookmarkedPosts.has(post.id) ? 'currentColor' : 'none'} />
                            </div>
                            Save
                          </button>

                          <button
                            onClick={() => handleReportPost(post.id)}
                            className={`flex items-center gap-2 text-sm font-bold transition-colors group ${
                              reportedPosts.has(post.id)
                                ? 'text-app-stress'
                                : 'text-app-text-secondary hover:text-app-stress'
                            }`}
                            type="button"
                            title="Report this post"
                            disabled={reportedPosts.has(post.id)}
                          >
                            <div className={`p-1.5 rounded-full transition-colors ${
                              reportedPosts.has(post.id)
                                ? 'bg-app-stress/10'
                                : 'group-hover:bg-app-stress/10'
                            }`}>
                              <Flag className="w-5 h-5" />
                            </div>
                            {reportedPosts.has(post.id) ? 'Reported' : 'Report'}
                          </button>

                          <button
                            onClick={() =>
                              setExpandedThreads((current) =>
                                current.includes(post.id) ? current.filter((id) => id !== post.id) : [...current, post.id]
                              )
                            }
                            className="flex items-center gap-2 text-sm text-app-text-secondary hover:text-app-primary font-bold transition-colors group ml-auto"
                            type="button"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-app-primary/10 transition-colors">
                              <MessageCircle className="w-5 h-5" />
                            </div>
                            {post.replyCount} {post.replyCount === 1 ? 'Reply' : 'Replies'}
                            {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="overflow-hidden bg-app-background/30 border-t border-app-primary-light">
                          <div className="p-6 space-y-5">
                            {post.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(reply.id)} flex items-center justify-center shrink-0 mt-1 shadow-inner`}>
                                  <Lock className="w-3 h-3 text-white" />
                                </div>
                                <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-app-primary-light/50">
                                  <div className="flex items-center justify-between mb-2 gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-app-text-primary">Anonymous</span>
                                      <span className="text-[10px] font-medium text-app-text-secondary">{formatTimeLabel(reply.createdAt)}</span>
                                    </div>
                                    {reply.isOwn ? (
                                      <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => startEditingReply(reply)} className="p-1.5 rounded-lg bg-app-background text-app-text-secondary hover:text-app-primary">
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => handleDeleteReply(reply.id)} className="p-1.5 rounded-lg bg-app-background text-app-text-secondary hover:text-app-stress">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                  <p className="text-sm text-app-text-secondary leading-relaxed mb-3">{reply.content}</p>
                                  <button
                                    type="button"
                                    onClick={() => setReplyingToReplyId(reply.id)}
                                    className="text-xs font-bold text-app-primary hover:text-app-primary-dark transition-colors flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Reply
                                  </button>
                                </div>
                              </div>
                            ))}

                            <div className="mt-6 pt-2">
                              {replyingToReplyId && (
                                <div className="mb-3 p-3 bg-app-primary/10 border border-app-primary-light rounded-lg flex items-center justify-between">
                                  <span className="text-xs font-bold text-app-primary">↳ Replying to Anonymous</span>
                                  <button
                                    type="button"
                                    onClick={() => setReplyingToReplyId('')}
                                    className="p-1 hover:bg-app-primary/10 rounded text-app-primary"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  value={replyTexts[post.id] || ''}
                                  onChange={(event) =>
                                    setReplyTexts((current) => ({
                                      ...current,
                                      [post.id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Write an anonymous reply..."
                                  className="flex-1 px-5 py-3 text-sm bg-white border border-app-primary-light rounded-full focus:outline-none focus:border-app-primary focus:ring-4 focus:ring-app-primary/10 transition-all shadow-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleReplySubmit(post.id)}
                                  className="w-12 h-12 rounded-full bg-app-primary text-white flex items-center justify-center hover:bg-app-primary-dark transition-all shadow-md shadow-app-primary/30 shrink-0"
                                >
                                  <Send className="w-5 h-5 ml-1" />
                                </button>
                              </div>
                              {replyErrors[post.id] ? <p className="text-xs text-app-stress mt-2">{replyErrors[post.id]}</p> : null}
                              {editingReplyId && (replyTexts[post.id] || '') ? (
                                <button type="button" onClick={() => cancelReplyEdit(post.id)} className="text-xs text-app-text-secondary mt-2 hover:text-app-text-primary">
                                  Cancel reply edit
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="card p-6 bg-gradient-to-br from-app-primary/10 to-white border-app-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-app-text-primary flex items-center gap-2 text-lg">
                <div className="bg-app-primary p-1.5 rounded-lg text-white">
                  <Bell className="w-4 h-4" />
                </div>
                Reply Notifications
              </h3>
              {overview.unreadNotificationCount ? (
                <button type="button" onClick={handleMarkNotificationsRead} className="text-xs font-bold text-app-primary">
                  Mark all read
                </button>
              ) : null}
            </div>

            <div className="space-y-3">
              {overview.notifications.length ? (
                overview.notifications.map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-xl border ${notification.isRead ? 'bg-white border-app-primary-light/50' : 'bg-app-primary/10 border-app-primary-light'}`}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-xs font-bold text-app-text-primary">{notification.category || 'Discussion reply'}</span>
                      {!notification.isRead ? <span className="text-[10px] font-bold text-app-primary">New</span> : null}
                    </div>
                    <p className="text-sm text-app-text-secondary">{notification.replyPreview}</p>
                    <p className="text-[10px] text-app-text-secondary mt-2">{formatTimeLabel(notification.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-app-text-secondary">No reply notifications yet.</p>
              )}
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-b from-app-stress/10 to-white border-app-stress/10">
            <h3 className="font-bold text-app-text-primary mb-2 flex items-center gap-2 text-lg">
              <div className="bg-app-stress p-1.5 rounded-lg text-white">
                <UserPlus className="w-4 h-4" />
              </div>
              Suggested Connections
            </h3>
            <p className="text-xs font-medium text-app-text-secondary mb-5 leading-relaxed">
              Anonymous peer matching is based on overlapping categories and keywords inside your faculty community.
            </p>

            <div className="space-y-4">
              {overview.suggestedConnections.length ? (
                overview.suggestedConnections.map((connection) => (
                  <div key={connection.id} className="bg-white p-4 rounded-2xl border border-app-primary-light/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-app-stress/30 to-app-stress flex items-center justify-center text-white shadow-inner">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-app-text-primary">{connection.label}</p>
                        <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mt-0.5">{user.faculty} Community</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {connection.overlapCategories.map((item) => (
                        <span key={item} className="px-2.5 py-1 bg-app-background text-app-text-secondary font-bold rounded-md text-[10px]">
                          {item}
                        </span>
                      ))}
                      {connection.overlapKeywords.map((item) => (
                        <span key={item} className="px-2.5 py-1 bg-app-background text-app-text-secondary font-bold rounded-md text-[10px]">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-app-text-secondary">Active recently: {formatTimeLabel(connection.latestAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-app-text-secondary">Create a few posts first to unlock anonymous matching suggestions.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
