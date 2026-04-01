import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import { getBooksRequest } from '../services/bookService';
import { fetchAuthorFeedback } from '../../admin/services/adminService';
import { normalizeAuthorFeedbackEntry } from '../services/feedbackUtils';
import { getBookReadAnalytics } from '../../lib/userActivityService';

const formatSignedChange = (value, { digits = 1, suffix = '%' } = {}) => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return `+0${suffix}`;
  }

  const roundedValue = digits === 0 ? Math.round(numericValue) : numericValue.toFixed(digits);
  const normalizedValue = String(Number(roundedValue));
  return `${numericValue >= 0 ? '+' : ''}${normalizedValue}${suffix}`;
};

const getMetricValue = (value, fallback = 0) => {
  if (value && typeof value === 'object' && 'value' in value) {
    return getMetricValue(value.value, fallback);
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const PROFILE_STORAGE_KEY = 'author_studio_profile';
const DASHBOARD_RANGE_DAYS = 30;
const MAX_FEEDBACK_FETCH_LIMIT = 20;

const getStoredAuthorName = () => {
  if (typeof window === 'undefined') return '';
  try {
    const profileRaw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!profileRaw) return '';
    const profile = JSON.parse(profileRaw);
    return profile?.fullName?.trim() || profile?.name?.trim() || '';
  } catch (error) {
    console.error('Failed to parse author profile:', error);
    return '';
  }
};

const toDateKey = (value) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';
  return new Date(timestamp).toISOString().slice(0, 10);
};

const createTimelineDays = (days = DASHBOARD_RANGE_DAYS) => {
  return Array.from({ length: days }, (_, index) => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    current.setDate(current.getDate() - (days - index - 1));

    return {
      key: current.toISOString().slice(0, 10),
      label: current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
  });
};

const getBookMatchKeys = (book = {}) =>
  [
    String(book?.bookId || book?.id || '').trim(),
    String(book?.title || '').trim().toLowerCase(),
  ].filter(Boolean);

const getFeedbackMatchKeys = (item = {}) =>
  [
    String(item?.bookId || '').trim(),
    String(item?.book || '').trim().toLowerCase(),
  ].filter(Boolean);

const getReaderKey = (item = {}) =>
  String(item?.userId || '').trim() ||
  String(item?.user || '').trim().toLowerCase() ||
  `${String(item?.user || 'reader').trim().toLowerCase()}|${String(item?.comment || '').trim().toLowerCase()}`;

const getAnalyticsNumber = (analytics = {}, ...keys) => {
  for (const key of keys) {
    const value = Number(analytics?.[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
};

const calculateChange = (current, previous, options = {}) => {
  const { digits = 1, suffix = '%' } = options;
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;

  if (previousValue === 0) {
    return formatSignedChange(currentValue > 0 ? 100 : 0, { digits, suffix });
  }

  const percentChange = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  return formatSignedChange(percentChange, { digits, suffix });
};

const buildFeedbackSummary = (feedbackRows = []) => {
  const normalizedRows = feedbackRows.map((item) => normalizeAuthorFeedbackEntry(item));
  const perBook = new Map();
  const readerSet = new Set();
  const timelineReaders = new Map();
  let ratingsTotal = 0;
  let ratingsCount = 0;

  normalizedRows.forEach((item) => {
    const matchKeys = getFeedbackMatchKeys(item);
    if (matchKeys.length === 0) return;

    const readerKey = getReaderKey(item);
    if (readerKey) {
      readerSet.add(readerKey);
    }

    const dateKey = toDateKey(item.createdAt);
    if (dateKey) {
      timelineReaders.set(dateKey, (timelineReaders.get(dateKey) || 0) + 1);
    }

    const rating = Number(item.rating);
    if (Number.isFinite(rating) && rating > 0) {
      ratingsTotal += rating;
      ratingsCount += 1;
    }

    matchKeys.forEach((key) => {
      const current = perBook.get(key) || {
        readerKeys: new Set(),
        interactions: 0,
        ratingsTotal: 0,
        ratingsCount: 0,
      };

      current.interactions += 1;
      if (readerKey) {
        current.readerKeys.add(readerKey);
      }
      if (Number.isFinite(rating) && rating > 0) {
        current.ratingsTotal += rating;
        current.ratingsCount += 1;
      }

      perBook.set(key, current);
    });
  });

  return {
    perBook,
    readerCount: readerSet.size,
    timelineReaders,
    ratingsTotal,
    ratingsCount,
  };
};

const getFeedbackForBook = (book, feedbackSummary) => {
  const keys = getBookMatchKeys(book);
  for (const key of keys) {
    const match = feedbackSummary.perBook.get(key);
    if (match) return match;
  }
  return null;
};

const buildBookMetrics = (books = [], analyticsByIndex = [], feedbackSummary) =>
  books.map((book, index) => {
    const analytics = analyticsByIndex[index] || {};
    const feedback = getFeedbackForBook(book, feedbackSummary);
    const totalReaders =
      getAnalyticsNumber(analytics, 'totalReaders', 'total_readers', 'readers') ||
      Number(book?.totalReaders) ||
      feedback?.readerKeys?.size ||
      feedback?.interactions ||
      0;
    const totalReads =
      getAnalyticsNumber(analytics, 'monthlyReads', 'monthly_reads', 'reads', 'totalReads', 'total_reads') ||
      Number(book?.monthlyReads) ||
      feedback?.interactions ||
      totalReaders;
    const rating =
      Number(book?.rating) > 0
        ? Number(book.rating)
        : feedback?.ratingsCount
          ? feedback.ratingsTotal / feedback.ratingsCount
          : 0;

    return {
      ...book,
      totalReaders,
      totalReads,
      rating,
    };
  });

const buildOverviewSeries = (books = [], feedbackSummary, days = DASHBOARD_RANGE_DAYS) => {
  const timeline = createTimelineDays(days);
  const datedBooks = books.filter((book) => toDateKey(book.createdAt));
  const undatedBooksCount = books.length - datedBooks.length;
  const booksByDay = datedBooks.reduce((map, book) => {
    const key = toDateKey(book.createdAt);
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());

  let cumulativeBooks = undatedBooksCount;
  let cumulativeReaders = 0;

  return timeline.map((point) => {
    cumulativeBooks += booksByDay.get(point.key) || 0;
    cumulativeReaders += feedbackSummary.timelineReaders.get(point.key) || 0;

    return {
      label: point.label,
      books: cumulativeBooks,
      readers: cumulativeReaders,
    };
  });
};

const buildDashboardStats = (bookMetrics = [], feedbackSummary, overviewSeries = []) => {
  const totalBooks = bookMetrics.length;
  const totalReaders =
    feedbackSummary.readerCount ||
    bookMetrics.reduce((sum, book) => sum + (Number(book.totalReaders) || 0), 0);
  const totalReads =
    bookMetrics.reduce((sum, book) => sum + (Number(book.totalReads) || 0), 0) ||
    Array.from(feedbackSummary.timelineReaders.values()).reduce((sum, value) => sum + value, 0);

  const midpoint = Math.max(1, Math.floor(overviewSeries.length / 2));
  const previousHalf = overviewSeries.slice(0, midpoint);
  const recentHalf = overviewSeries.slice(midpoint);
  const previousBookAdds = Math.max(0, (previousHalf.at(-1)?.books || 0) - (previousHalf[0]?.books || 0));
  const recentBookAdds = Math.max(0, (recentHalf.at(-1)?.books || 0) - (recentHalf[0]?.books || 0));
  const previousReaders = Math.max(0, (previousHalf.at(-1)?.readers || 0) - (previousHalf[0]?.readers || 0));
  const recentReaders = Math.max(0, (recentHalf.at(-1)?.readers || 0) - (recentHalf[0]?.readers || 0));

  return {
    totalBooks,
    totalReaders,
    totalReads,
    booksTrend: calculateChange(recentBookAdds, previousBookAdds),
    readersTrend: calculateChange(recentReaders, previousReaders),
    readsTrend: calculateChange(totalReads, Math.max(0, totalReads - recentReaders)),
  };
};

const buildTopBooks = (bookMetrics = []) =>
  [...bookMetrics]
    .sort((left, right) => {
      const byReaders = (Number(right.totalReaders) || 0) - (Number(left.totalReaders) || 0);
      if (byReaders !== 0) return byReaders;

      const byRating = (Number(right.rating) || 0) - (Number(left.rating) || 0);
      if (byRating !== 0) return byRating;

      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    })
    .slice(0, 4);

const MeasuredChart = ({ className, hasData, emptyMessage, children }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      const nextSize = {
        width: Math.floor(element.clientWidth),
        height: Math.floor(element.clientHeight),
      };

      setSize((currentSize) =>
        currentSize.width === nextSize.width && currentSize.height === nextSize.height
          ? currentSize
          : nextSize,
      );
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {!hasData ? (
        <div className="h-full flex items-center justify-center text-slate-500">
          {emptyMessage}
        </div>
      ) : size.width > 0 && size.height > 0 ? (
        children(size)
      ) : (
        <div className="h-full" aria-hidden="true" />
      )}
    </div>
  );
};

const StatCard = ({ title, value, change, icon, isPositive }) => {
  const IconComponent = icon;

  return (
    <div className="bg-card-dark border border-white/5 p-6 rounded-2xl card-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-primary/20 rounded-lg text-accent">
        <IconComponent className="size-5" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {change}
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [storedAuthorName] = useState(() => getStoredAuthorName());
  const [stats, setStats] = useState(null);
  const displayName = storedAuthorName || 'Author';
  const [performanceData, setPerformanceData] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [booksResult, feedbackResult] = await Promise.allSettled([
          getBooksRequest({ status: 'All' }),
          fetchAuthorFeedback(MAX_FEEDBACK_FETCH_LIMIT, 'all', { signal: controller.signal }),
        ]);
        const books = booksResult.status === 'fulfilled' ? booksResult.value : [];
        const feedbackRows =
          feedbackResult.status === 'fulfilled' && Array.isArray(feedbackResult.value)
            ? feedbackResult.value
            : [];
        const analyticsResults = await Promise.allSettled(
          books.map((book) => getBookReadAnalytics(book.id, { signal: controller.signal })),
        );

        if (controller.signal.aborted || !mounted) {
          return;
        }

        const analyticsByIndex = analyticsResults.map((result) =>
          result.status === 'fulfilled' ? result.value : {},
        );
        const feedbackSummary = buildFeedbackSummary(feedbackRows);
        const bookMetrics = buildBookMetrics(books, analyticsByIndex, feedbackSummary);
        const overviewSeries = buildOverviewSeries(bookMetrics, feedbackSummary);
        const nextStats = buildDashboardStats(bookMetrics, feedbackSummary, overviewSeries);

        setStats(nextStats);
        setPerformanceData(overviewSeries);
        setTopBooks(buildTopBooks(bookMetrics));
      } catch (err) {
        if (controller.signal.aborted || !mounted) return;
        console.error('Error fetching dashboard data:', err);
        setStats({
          totalBooks: 0,
          totalReaders: 0,
          totalReads: 0,
          booksTrend: '+0%',
          readersTrend: '+0%',
          readsTrend: '+0%',
        });
        setPerformanceData([]);
        setTopBooks([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="text-slate-400 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayName}</h1>
          <p className="text-slate-400 mt-1">Here's what's happening with your books today.</p>
        </div>
        <div className="flex gap-3">
          {/* <button
            onClick={() => window.alert('Report download started.')}
            className="px-4 py-2 rounded-lg text-sm font-bold border border-white/10 bg-primary text-on-primary shadow-glow hover:brightness-110 transition-all"
          >
            Download Report
          </button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Books" 
          value={stats ? (stats.totalBooks?.toLocaleString() || '0') : '0'} 
          change={stats?.booksTrend || '+0%'} 
          icon={TrendingUp} 
          isPositive={stats?.booksTrend?.startsWith('+') !== false}
        />
        <StatCard 
          title="Active Readers" 
          value={stats ? (stats.totalReaders?.toLocaleString() || '0') : '0'} 
          change={stats?.readersTrend || '+0%'} 
          icon={Users} 
          isPositive={stats?.readersTrend?.startsWith('+') !== false}
        />
        <StatCard 
          title="Total Reads" 
          value={stats ? (stats.totalReads?.toLocaleString() || '0') : '0'} 
          change={stats?.readsTrend || '+0%'} 
          icon={BookOpen} 
          isPositive={!stats?.readsTrend?.startsWith('-')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Books Overview</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-accent"></div>
                <span className="text-xs font-semibold text-[color:var(--text)]">Books</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary"></div>
                <span className="text-xs font-semibold text-[color:var(--text)]">Readers</span>
              </div>
            </div>
          </div>
          <MeasuredChart
            className="h-[300px] w-full min-w-0"
            hasData={performanceData.length > 0}
            emptyMessage="No book data available"
          >
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={performanceData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a868f" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4a868f" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22494f" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22494f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16282b',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="books"
                  stroke="#4a868f"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="readers"
                  stroke="#22494f"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReads)"
                />
              </AreaChart>
            )}
          </MeasuredChart>
        </div>

        <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <h2 className="text-lg font-bold mb-6">Top Books</h2>
          <div className="space-y-6">
            {topBooks.length > 0 ? topBooks.map((book, i) => (
              <div key={book.id} className="flex items-center gap-4">
                <img 
                  src={book.img || `https://picsum.photos/seed/book${i}/100/150`} 
                  alt={book.title} 
                  className="w-12 h-16 rounded-md object-cover border border-white/5" 
                  onError={(e) => { e.target.src = `https://picsum.photos/seed/book${i}/100/150`; }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{book.title}</h3>
                  <p className="text-xs text-slate-500 truncate">{book.author}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{Number(book.totalReaders || 0).toLocaleString()} readers</p>
                  <p className="text-[10px] text-slate-500">
                    {Number(book.rating) > 0 ? `${Number(book.rating).toFixed(1)} rating` : 'No rating yet'}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-sm">No books available</p>
            )}
          </div>
          <button
            onClick={() => navigate('/author/my-books')}
            className="w-full mt-8 py-2 text-sm font-medium text-accent hover:text-[color:var(--text)] transition-colors"
          >
            View All Books
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
