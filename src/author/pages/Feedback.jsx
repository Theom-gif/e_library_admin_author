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
  Send
} from 'lucide-react';

const Feedback = () => {
  const MotionDiv = motion.div;
  const [feedbacks, setFeedbacks] = React.useState([
    {
      id: 1,
      user: "Sarah Jenkins",
      book: "The Midnight Library",
      rating: 5,
      comment: "The way you handled the concept of regret was so moving. I've been thinking about Chapter 12 for days. Can't wait for your next work!",
      time: "2 hours ago",
      status: "Unread",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      helpful: 12,
      notHelpful: 0,
    },
    {
      id: 2,
      user: "Michael Ross",
      book: "Project Hail Mary",
      rating: 5,
      comment: "The technical details were spot on. It's rare to find hard sci-fi that's also this emotionally resonant. Great job!",
      time: "5 hours ago",
      status: "Read",
      avatar: "https://i.pravatar.cc/150?u=michael",
      helpful: 8,
      notHelpful: 0,
    },
    {
      id: 3,
      user: "Emma Watson",
      book: "The Silent Patient",
      rating: 4,
      comment: "Loved the atmosphere, but I felt the middle section dragged a little. Still, that twist at the end was worth it!",
      time: "1 day ago",
      status: "Replied",
      avatar: "https://i.pravatar.cc/150?u=emma",
      helpful: 5,
      notHelpful: 1,
      authorReply: 'Thanks for reading. I appreciate this detailed feedback.',
    },
    {
      id: 4,
      user: "David Chen",
      book: "The Midnight Library",
      rating: 5,
      comment: "Your prose is beautiful. Every sentence feels carefully crafted. Looking forward to more from you.",
      time: "2 days ago",
      status: "Read",
      avatar: "https://i.pravatar.cc/150?u=david",
      helpful: 6,
      notHelpful: 0,
    }
  ]);

  const [searchText, setSearchText] = React.useState('');
  const [bookFilter, setBookFilter] = React.useState('All Books');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [openReplyId, setOpenReplyId] = React.useState(null);
  const [replyDrafts, setReplyDrafts] = React.useState({});
  const [visibleCount, setVisibleCount] = React.useState(4);

  const uniqueBooks = React.useMemo(
    () => ['All Books', ...Array.from(new Set(feedbacks.map((item) => item.book)))],
    [feedbacks],
  );

  const filteredFeedbacks = React.useMemo(() => {
    return feedbacks.filter((item) => {
      const matchesSearch =
        item.user.toLowerCase().includes(searchText.toLowerCase()) ||
        item.book.toLowerCase().includes(searchText.toLowerCase()) ||
        item.comment.toLowerCase().includes(searchText.toLowerCase());
      const matchesBook = bookFilter === 'All Books' || item.book === bookFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesBook && matchesStatus;
    });
  }, [bookFilter, feedbacks, searchText, statusFilter]);

  const visibleFeedbacks = filteredFeedbacks.slice(0, visibleCount);

  const upvote = (id) => {
    setFeedbacks((prev) => prev.map((item) => (item.id === id ? { ...item, helpful: item.helpful + 1 } : item)));
  };

  const downvote = (id) => {
    setFeedbacks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notHelpful: item.notHelpful + 1 } : item)),
    );
  };

  const submitReply = (id) => {
    const draft = (replyDrafts[id] || '').trim();
    if (!draft) return;
    setFeedbacks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Replied', authorReply: draft } : item)),
    );
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
            <span className="text-sm font-bold">4.8 Avg Rating</span>
          </div>
          <div className="bg-card-dark border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <MessageSquare className="size-4 text-accent" />
            <span className="text-sm font-bold">1,240 Reviews</span>
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

      <div className="space-y-6">
        {visibleFeedbacks.map((item, i) => (
          <MotionDiv 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow group hover:border-accent/30 transition-all"
          >
            <div className="flex gap-6">
              <img src={item.avatar} alt={item.user} className="size-12 rounded-full object-cover border-2 border-primary/20" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-100">{item.user}</h3>
                    <p className="text-xs text-slate-500">on <span className="text-accent font-medium">{item.book}</span></p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`size-3 ${i < item.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{item.time}</span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-300 leading-relaxed mb-6">"{item.comment}"</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex gap-4">
                    <button
                      onClick={() => upvote(item.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-accent transition-colors"
                    >
                      <ThumbsUp className="size-3.5" />
                      <span>Helpful ({item.helpful})</span>
                    </button>
                    <button
                      onClick={() => downvote(item.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <ThumbsDown className="size-3.5" />
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
                      onClick={() => setOpenReplyId((prev) => (prev === item.id ? null : item.id))}
                      className="p-2 text-slate-500 hover:text-white transition-colors"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    <button
                      onClick={() => setOpenReplyId((prev) => (prev === item.id ? null : item.id))}
                      className="px-4 py-1.5 bg-primary/20 text-accent rounded-lg text-xs font-bold hover:bg-accent hover:text-white transition-all"
                    >
                      {item.status === 'Replied' ? 'Edit Reply' : 'Reply'}
                    </button>
                  </div>
                </div>
                {item.authorReply && (
                  <div className="mt-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-accent mb-1">Your Reply</p>
                    <p className="text-sm text-slate-200">{item.authorReply}</p>
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
            onClick={() => setVisibleCount((prev) => prev + 4)}
            className="px-8 py-3 bg-card-dark border border-white/5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
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
