import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Star,
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
import adminService from '../../admin/services/adminService';
import { resolveBackendAssetUrl } from '../services/profileStorage';

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

// Fallback/Mock data when API calls fail
const FALLBACK_STATS = {
  authorName: '',
  totalSales: 0,
  totalReaders: 0,
  totalReads: 0,
  averageRating: 0,
  salesTrend: '+0%',
  readersTrend: '+0%',
  readsTrend: '+0%',
  ratingTrend: '+0.0',
};

const FALLBACK_PERFORMANCE = [
  { label: 'No data', sales: 0, reads: 0 },
];

const FALLBACK_TOP_BOOKS = [];

const normalizeAuthorStats = (payload = {}) => ({
  authorName: payload.authorName || payload.author?.name || payload.name || '',
  totalSales: getMetricValue(payload.totalSales ?? payload.sales, 0),
  totalReaders: getMetricValue(payload.totalReaders ?? payload.activeReaders, 0),
  totalReads: getMetricValue(payload.totalReads ?? payload.reads, 0),
  averageRating: getMetricValue(payload.averageRating ?? payload.rating, 0),
  salesTrend: formatSignedChange(payload.salesTrend ?? payload.totalSales?.change ?? payload.salesChange),
  readersTrend: formatSignedChange(payload.readersTrend ?? payload.activeReaders?.change ?? payload.totalReaders?.change),
  readsTrend: formatSignedChange(payload.readsTrend ?? payload.totalReads?.change ?? payload.readsChange),
  ratingTrend: formatSignedChange(payload.ratingTrend ?? payload.averageRating?.change ?? payload.ratingChange, {
    digits: 1,
    suffix: '',
  }),
});

const normalizePerformanceData = (rows = []) =>
  rows
    .map((row) => ({
      label: row.label || row.name || row.date || row.month || '',
      sales: getMetricValue(row.sales ?? row.revenue, 0),
      reads: getMetricValue(row.reads, 0),
    }))
    .filter((row) => row.label);

const normalizeTopBooks = (rows = []) =>
  rows.map((book, index) => ({
    id: book.id ?? `${book.title || 'book'}-${index}`,
    title: book.title || 'Untitled',
    author: book.author || book.authorName || 'Unknown author',
    sales: getMetricValue(book.sales ?? book.revenue, 0),
    trend: formatSignedChange(book.trend ?? book.growth ?? book.salesChange),
    coverUrl: resolveBackendAssetUrl(
      book.coverUrl ||
      book.coverImage ||
      book.bookCover ||
      (book.cover_image_path ? adminService.buildStorageUrl(book.cover_image_path) : ''),
    ),
  }));

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
  const displayName = stats?.authorName || storedAuthorName || 'Author';
  const [performanceData, setPerformanceData] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, perfRes, booksRes] = await Promise.allSettled([
          adminService.fetchAuthorStats({ signal: controller.signal }),
          adminService.fetchAuthorPerformance('30d', 'daily', { signal: controller.signal }),
          adminService.fetchAuthorTopBooks({ limit: 4, orderBy: 'sales' }, { signal: controller.signal }),
        ]);

        if (controller.signal.aborted || !mounted) {
          return;
        }

        if (statsRes.status === 'fulfilled') {
          setStats(normalizeAuthorStats(statsRes.value));
        }

        if (perfRes.status === 'fulfilled') {
          setPerformanceData(normalizePerformanceData(perfRes.value));
        }

        if (booksRes.status === 'fulfilled') {
          setTopBooks(normalizeTopBooks(booksRes.value));
        }
      } catch (err) {
        if (controller.signal.aborted || !mounted) return;
        console.error('Error fetching dashboard data:', err);
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
          <button
            onClick={() => window.alert('Report download started.')}
            className="px-4 py-2 rounded-lg text-sm font-bold border border-white/10 bg-primary text-on-primary shadow-glow hover:brightness-110 transition-all"
          >
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Books" 
          value={stats ? `$${stats.totalSales?.toFixed(2) || '0.00'}` : '$0.00'} 
          change={stats?.salesTrend || '+0%'} 
          icon={TrendingUp} 
          isPositive={stats?.salesTrend?.startsWith('+') !== false}
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
        <StatCard 
          title="Avg. Rating" 
          value={stats ? (stats.averageRating?.toFixed(1) || '0.0') : '0.0'} 
          change={stats?.ratingTrend || '+0.0'} 
          icon={Star} 
          isPositive={!stats?.ratingTrend?.startsWith('-')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Books Overview</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-accent"></div>
                <span className="text-xs font-semibold text-[color:var(--text)]">Books Sold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary"></div>
                <span className="text-xs font-semibold text-[color:var(--text)]">Books Read</span>
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
                  dataKey="sales"
                  stroke="#4a868f"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="reads"
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
                  src={book.coverUrl || `https://picsum.photos/seed/book${i}/100/150`} 
                  alt={book.title} 
                  className="w-12 h-16 rounded-md object-cover border border-white/5" 
                  onError={(e) => { e.target.src = `https://picsum.photos/seed/book${i}/100/150`; }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{book.title}</h3>
                  <p className="text-xs text-slate-500 truncate">{book.author}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${book.sales?.toFixed(0) || '0'}</p>
                  <p className={`text-[10px] ${book.trend?.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {book.trend || '+0%'}
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
