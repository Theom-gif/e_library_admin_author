import React from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Filter,
  Search,
  Send,
  Loader2,
} from 'lucide-react';
import { fetchAuthorFeedback } from '../../admin/services/adminService';
import { normalizeAuthorFeedbackEntry } from '../services/feedbackUtils';

const FEEDBACK_STATE_STORAGE_KEY = 'author_feedback_ui_state';
const MAX_FEEDBACK_FETCH_LIMIT = 20;

const readFeedbackUiState = () => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(FEEDBACK_STATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeFeedbackUiState = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FEEDBACK_STATE_STORAGE_KEY, JSON.stringify(value));
};

const Feedback = () => {
  const MotionDiv = motion.div;
  const [feedbacks, setFeedbacks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [searchText, setSearchText] = React.useState('');
  const [bookFilter, setBookFilter] = React.useState('All Books');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [openReplyId, setOpenReplyId] = React.useState(null);
  const [replyDrafts, setReplyDrafts] = React.useState({});
  const [visibleCount, setVisibleCount] = React.useState(6);
  const [feedbackUiState, setFeedbackUiState] = React.useState(() => readFeedbackUiState());

  const loadFeedback = React.useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await fetchAuthorFeedback(MAX_FEEDBACK_FETCH_LIMIT, 'all');
      setFeedbacks(Array.isArray(rows) ? rows : []);
    } catch (requestError) {
      setFeedbacks([]);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to load reader feedback.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  React.useEffect(() => {
    writeFeedbackUiState(feedbackUiState);
  }, [feedbackUiState]);

  const normalizedFeedbacks = React.useMemo(
    () =>
      feedbacks
        .map((item) => normalizeAuthorFeedbackEntry(item, feedbackUiState))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [feedbackUiState, feedbacks],
  );

  const baseFeedbackById = React.useMemo(
    () =>
      new Map(
        feedbacks.map((item) => {
          const normalized = normalizeAuthorFeedbackEntry(item);
          return [normalized.id, normalized];
        }),
      ),
    [feedbacks],
  );

  const uniqueBooks = React.useMemo(
    () => ['All Books', ...Array.from(new Set(normalizedFeedbacks.map((item) => item.book)))],
    [normalizedFeedbacks],
  );

  const filteredFeedbacks = React.useMemo(() => {
    return normalizedFeedbacks.filter((item) => {
      const matchesSearch =
        item.user.toLowerCase().includes(searchText.toLowerCase()) ||
        item.book.toLowerCase().includes(searchText.toLowerCase()) ||
        item.comment.toLowerCase().includes(searchText.toLowerCase());
      const matchesBook = bookFilter === 'All Books' || item.book === bookFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesBook && matchesStatus;
    });
  }, [bookFilter, normalizedFeedbacks, searchText, statusFilter]);

  const visibleFeedbacks = filteredFeedbacks.slice(0, visibleCount);
  const averageRating = normalizedFeedbacks.length
    ? (
        normalizedFeedbacks.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) /
        normalizedFeedbacks.length
      ).toFixed(1)
    : '0.0';

  const updateFeedbackUiState = (id, updater) => {
    setFeedbackUiState((current) => {
      const nextEntry = updater(current[id] || {});
      return { ...current, [id]: nextEntry };
    });
  };

  const setReaction = (id, nextReaction) => {
    const baseEntry = baseFeedbackById.get(id);
    if (!baseEntry) return;

    updateFeedbackUiState(id, (current) => {
      const previousReaction = String(current.reaction || '').trim();
      if (previousReaction === nextReaction) {
        return current;
      }

      const baseHelpful = Number(baseEntry.helpful || 0);
      const baseNotHelpful = Number(baseEntry.notHelpful || 0);
      let helpfulDelta = Number(current.helpfulDelta);
      let notHelpfulDelta = Number(current.notHelpfulDelta);

      if (!Number.isFinite(helpfulDelta)) {
        helpfulDelta = Number.isFinite(Number(current.helpful))
          ? Number(current.helpful) - baseHelpful
          : 0;
      }

      if (!Number.isFinite(notHelpfulDelta)) {
        notHelpfulDelta = Number.isFinite(Number(current.notHelpful))
          ? Number(current.notHelpful) - baseNotHelpful
          : 0;
      }

      if (previousReaction === 'helpful') {
        helpfulDelta -= 1;
      }

      if (previousReaction === 'notHelpful') {
        notHelpfulDelta -= 1;
      }

      if (nextReaction === 'helpful') {
        helpfulDelta += 1;
      }

      if (nextReaction === 'notHelpful') {
        notHelpfulDelta += 1;
      }

      return {
        ...current,
        reaction: nextReaction,
        helpfulDelta: Math.max(-baseHelpful, helpfulDelta),
        notHelpfulDelta: Math.max(-baseNotHelpful, notHelpfulDelta),
      };
    });
  };

  const markAsRead = (id) => {
    updateFeedbackUiState(id, (current) => ({
      ...current,
      status: current.authorReply ? 'Replied' : 'Read',
    }));
  };

  const submitReply = (id) => {
    const draft = (replyDrafts[id] || '').trim();
    if (!draft) return;

    updateFeedbackUiState(id, (current) => ({
      ...current,
      status: 'Replied',
      authorReply: draft,
    }));
    setReplyDrafts((prev) => ({ ...prev, [id]: '' }));
    setOpenReplyId(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reader Feedback</h1>
          <p className="text-slate-400 mt-1">Engage with your readers and see what they're saying about your stories.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-card-dark border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <Star className="size-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-bold">{averageRating} Avg Rating</span>
          </div>
          <div className="bg-card-dark border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <MessageSquare className="size-4 text-accent" />
            <span className="text-sm font-bold">{normalizedFeedbacks.length.toLocaleString()} Reviews</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search feedback..."
            className="w-full bg-card-dark border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setStatusFilter((prev) =>
                prev === 'All' ? 'Unread' : prev === 'Unread' ? 'Read' : prev === 'Read' ? 'Replied' : 'All',
              )
            }
            className="flex items-center gap-2 px-4 py-3 bg-card-dark border border-white/5 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Filter className="size-4" />
            <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
          </button>
          <select
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
            className="bg-card-dark border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          >
            {uniqueBooks.map((book) => (
              <option key={book}>{book}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading feedback...</span>
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-rose-400 mb-6">{error}</p>
      )}

      {!loading && !error && filteredFeedbacks.length === 0 && (
        <p className="text-sm text-slate-400 mb-8">
          No reader comments or ratings yet.
        </p>
      )}

      <div className="space-y-6">
        {visibleFeedbacks.map((item, i) => (
          <MotionDiv
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow group hover:border-accent/30 transition-all"
          >
            <div className="flex gap-6">
              <img src={item.avatar} alt={item.user} className="size-12 rounded-full object-cover border-2 border-primary/20 bg-white" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-[color:var(--text)]">{item.user}</h3>
                    <p className="text-xs text-slate-500">on <span className="text-accent font-medium">{item.book}</span></p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, index) => (
                        <Star key={index} className={`size-3 ${index < item.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{item.time}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">"{item.comment || 'A reader left a rating without a written comment.'}"</p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setReaction(item.id, 'helpful')}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                        item.reaction === 'helpful'
                          ? 'text-accent'
                          : item.reaction === 'notHelpful'
                            ? 'text-slate-400 hover:text-slate-500'
                            : 'text-slate-500 hover:text-accent'
                      }`}
                      aria-pressed={item.reaction === 'helpful'}
                    >
                      <ThumbsUp className={`size-3.5 ${item.reaction === 'helpful' ? 'fill-current' : ''}`} />
                      <span>Helpful ({item.helpful})</span>
                    </button>
                    <button
                      onClick={() => setReaction(item.id, 'notHelpful')}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                        item.reaction === 'notHelpful'
                          ? 'text-rose-500'
                          : item.reaction === 'helpful'
                            ? 'text-slate-400 hover:text-slate-500'
                            : 'text-slate-500 hover:text-rose-500'
                      }`}
                      aria-pressed={item.reaction === 'notHelpful'}
                    >
                      <ThumbsDown className={`size-3.5 ${item.reaction === 'notHelpful' ? 'fill-current' : ''}`} />
                      <span>Not Helpful ({item.notHelpful})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                      item.status === 'Unread' ? 'bg-accent/10 text-accent' :
                      item.status === 'Replied' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="p-2 text-slate-500 hover:text-[color:var(--text)] transition-colors"
                      title="Mark as read"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    <button
                      onClick={() => {
                        markAsRead(item.id);
                        setOpenReplyId((prev) => (prev === item.id ? null : item.id));
                      }}
                      className="px-4 py-1.5 bg-primary/20 text-accent rounded-lg text-xs font-bold hover:bg-accent hover:text-white transition-all"
                    >
                      {item.status === 'Replied' ? 'Edit Reply' : 'Reply'}
                    </button>
                  </div>
                </div>
                {item.authorReply && (
                  <div className="mt-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-accent mb-1">Your Reply</p>
                    <p className="text-sm text-[color:var(--text)]">{item.authorReply}</p>
                  </div>
                )}
                {openReplyId === item.id && (
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={replyDrafts[item.id] ?? item.authorReply ?? ''}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder={`Reply to ${item.user}...`}
                      className="flex-1 bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <button
                      onClick={() => submitReply(item.id)}
                      className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5"
                    >
                      <Send className="size-3.5" />
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          </MotionDiv>
        ))}
      </div>

      <div className="mt-10 text-center">
        {visibleCount < filteredFeedbacks.length ? (
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-8 py-3 bg-card-dark border border-white/5 rounded-xl text-sm font-bold text-slate-400 hover:text-[color:var(--text)] hover:bg-white/5 transition-all"
          >
            Load More Feedback
          </button>
        ) : (
          <p className="text-xs text-slate-500">No more feedback to load.</p>
        )}
      </div>
    </div>
  );
};

export default Feedback;
