import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBooksRequest } from '../services/bookService';
import { getBookReadAnalytics } from '../../lib/userActivityService';

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatNumber = (value) => Number(value || 0).toLocaleString();

const buildAnalyticsRows = (books = [], analyticsByIndex = []) => {
  const rows = books.map((book, index) => {
    const analytics = analyticsByIndex[index] || {};
    const totalReaders = Number(analytics.totalReaders) || 0;
    const completionRate = Number(analytics.completionRate) || 0;
    const monthlyReads = Number(analytics.monthlyReads) || 0;

    return {
      id: book.id,
      title: book.title || 'Untitled',
      totalReaders,
      completionRate,
      monthlyReads,
      coverUrl: book.img,
    };
  });

  const totalReadersAll = rows.reduce((sum, row) => sum + row.totalReaders, 0);

  return rows
    .map((row) => ({
      ...row,
      percent: totalReadersAll > 0 ? (row.totalReaders / totalReadersAll) * 100 : 0,
    }))
    .sort((a, b) => b.percent - a.percent);
};

const Analytics = () => {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const books = await getBooksRequest({ status: 'approved' });
        const analyticsResults = await Promise.allSettled(
          books.map((book) => getBookReadAnalytics(book.id, { signal: controller.signal })),
        );
        const analyticsByIndex = analyticsResults.map((result) =>
          result.status === 'fulfilled' ? result.value : {},
        );
        const nextRows = buildAnalyticsRows(books, analyticsByIndex);

        if (mounted) {
          setRows(nextRows);
        }
      } catch (err) {
        if (!controller.signal.aborted && mounted) {
          console.error('Error loading analytics:', err);
          setError('Unable to load analytics right now.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const totalReaders = rows.reduce((sum, row) => sum + row.totalReaders, 0);
  const totalBooks = rows.length;

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="text-slate-400 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-slate-400">
          Track reader interest by book, including reader counts and percentage share.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <p className="text-sm text-slate-400">Total Books</p>
          <p className="text-2xl font-bold mt-2">{formatNumber(totalBooks)}</p>
        </div>
        <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <p className="text-sm text-slate-400">Total Readers (All Books)</p>
          <p className="text-2xl font-bold mt-2">{formatNumber(totalReaders)}</p>
        </div>
      </div>

      <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Reader Share by Book</h2>
          <span className="text-xs text-slate-400">Percent of total readers</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-slate-500">No book analytics available yet.</p>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={140}
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  tickFormatter={(value) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    formatPercent(value),
                    'Reader Share',
                  ]}
                  labelFormatter={(label) => `Book: ${label}`}
                  contentStyle={{
                    backgroundColor: '#16282b',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="percent" fill="#4a868f" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Book Interest Details</h2>
          <span className="text-xs text-slate-400">Readers & completion rate</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-slate-500">No data to show yet.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-4">
                <img
                  src={row.coverUrl}
                  alt={row.title}
                  className="w-12 h-16 rounded-lg object-cover border border-white/5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold truncate">{row.title}</p>
                    <p className="text-xs text-slate-400 whitespace-nowrap">
                      {formatNumber(row.totalReaders)} readers
                    </p>
                  </div>
                  <div className="mt-2 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${Math.min(100, row.percent)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{formatPercent(row.percent)} of readers</span>
                    <span>{formatPercent(row.completionRate)} completion</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
