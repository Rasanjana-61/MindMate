import { useState, useEffect } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchBookmarkedPosts, removeBookmark } from '../lib/auth';

const categoryColors = {
  Stress: 'bg-wellness-peach-light text-wellness-peach border-wellness-peach/20',
  Exams: 'bg-wellness-blue-light text-wellness-blue border-wellness-blue/20',
  Relationships: 'bg-wellness-lavender/30 text-purple-600 border-purple-200',
  'Academic Difficulty': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Personal Growth': 'bg-wellness-green-light text-wellness-green border-wellness-green/20',
};

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
    'from-wellness-blue-light to-wellness-blue-mid',
    'from-wellness-peach-light to-wellness-peach',
    'from-wellness-green-light to-wellness-green',
    'from-wellness-lavender/50 to-purple-300',
    'from-yellow-100 to-yellow-300',
  ];

  const value = typeof seed === 'string' ? seed.length : Number(seed);
  return gradients[value % gradients.length];
}

export function BookmarkedQuestions() {
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const data = await fetchBookmarkedPosts();
      setBookmarkedQuestions(data.data || []);
    } catch (error) {
      setErrorMessage(error.message);
      console.error('Error loading bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveBookmark(postId) {
    try {
      await removeBookmark(postId);
      setBookmarkedQuestions((current) => current.filter((q) => q.id !== postId));
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="card p-8 border-t-4 border-t-wellness-blue">
          <h1 className="text-3xl font-bold text-wellness-text mb-2">My Bookmarks</h1>
          <p className="text-wellness-text-sec">Questions and discussions you've saved for later</p>
        </div>

        <div className="space-y-4">
          {errorMessage ? (
            <div className="card p-6 border border-wellness-peach/30 bg-wellness-peach-light/30 text-wellness-peach text-sm rounded-2xl">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="card p-12 text-center text-sm text-wellness-text-sec">
              <div className="w-12 h-12 border-4 border-wellness-blue/20 border-t-wellness-blue rounded-full animate-spin mx-auto mb-4"></div>
              Loading your bookmarks...
            </div>
          ) : bookmarkedQuestions.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-wellness-bg rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-wellness-text-muted" />
              </div>
              <h3 className="text-lg font-bold text-wellness-text mb-2">No bookmarked questions yet</h3>
              <p className="text-wellness-text-sec text-sm max-w-md">
                Head over to Peer Support and bookmark questions that are important to you. They'll appear here for easy access.
              </p>
            </div>
          ) : (
            bookmarkedQuestions.map((question) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 hover:shadow-lg transition-all border border-wellness-border/50"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(question.id)} flex items-center justify-center text-white shadow-inner shrink-0`}
                    >
                      <span className="text-xs font-bold">A</span>
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-bold text-wellness-text">Anonymous Student</span>
                      <span className="block text-xs font-medium text-wellness-text-muted">
                        {formatTimeLabel(question.createdAt || new Date().toISOString())}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {question.category && (
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          categoryColors[question.category] || categoryColors.Stress
                        }`}
                      >
                        {question.category}
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveBookmark(question.id)}
                      className="p-2 rounded-lg bg-wellness-bg text-wellness-text-sec hover:text-wellness-peach transition-colors"
                      title="Remove bookmark"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-wellness-text text-base leading-relaxed mb-4 font-medium">
                  {question.content || 'Question content'}
                </p>

                <div className="flex items-center gap-4 text-sm text-wellness-text-sec">
                  <button
                    className="flex items-center gap-1 hover:text-wellness-blue font-bold transition-colors"
                    type="button"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {question.replyCount || 0} {question.replyCount === 1 ? 'Reply' : 'Replies'}
                  </button>
                  <button
                    className="flex items-center gap-1 hover:text-wellness-peach font-bold transition-colors"
                    type="button"
                  >
                    ❤️ {question.likeCount || 0} {question.likeCount === 1 ? 'Like' : 'Likes'}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
