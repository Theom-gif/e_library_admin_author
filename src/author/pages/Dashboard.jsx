import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Star,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const data = [
  { name: 'Jan', sales: 4000, reads: 2400 },
  { name: 'Feb', sales: 3000, reads: 1398 },
  { name: 'Mar', sales: 2000, reads: 9800 },
  { name: 'Apr', sales: 2780, reads: 3908 },
  { name: 'May', sales: 1890, reads: 4800 },
  { name: 'Jun', sales: 2390, reads: 3800 },
  { name: 'Jul', sales: 3490, reads: 4300 },
];

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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Alex</h1>
          <p className="text-slate-400 mt-1">Here's what's happening with your books today.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.alert('Showing metrics for the last 30 days.')}
            className="flex items-center gap-2 px-4 py-2 bg-card-dark border border-white/5 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Calendar className="size-4" />
            <span>Last 30 Days</span>
          </button>
          <button
            onClick={() => window.alert('Report download started.')}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold shadow-glow hover:opacity-90 transition-all"
          >
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Sales" 
          value="$12,840.50" 
          change="+12.5%" 
          icon={TrendingUp} 
          isPositive={true} 
        />
        <StatCard 
          title="Active Readers" 
          value="45,210" 
          change="+8.2%" 
          icon={Users} 
          isPositive={true} 
        />
        <StatCard 
          title="Total Reads" 
          value="1.2M" 
          change="-2.4%" 
          icon={BookOpen} 
          isPositive={false} 
        />
        <StatCard 
          title="Avg. Rating" 
          value="4.8" 
          change="+0.1" 
          icon={Star} 
          isPositive={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Performance Overview</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-accent"></div>
                <span className="text-xs text-slate-400">Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary"></div>
                <span className="text-xs text-slate-400">Reads</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a868f" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4a868f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="name" 
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
                    color: '#fff'
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
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <h2 className="text-lg font-bold mb-6">Top Books</h2>
          <div className="space-y-6">
            {[
              { title: "The Midnight Library", author: "Matt Haig", sales: "$4,200", growth: "+15%", img: "https://picsum.photos/seed/book1/100/150" },
              { title: "Project Hail Mary", author: "Andy Weir", sales: "$3,850", growth: "+12%", img: "https://picsum.photos/seed/book2/100/150" },
              { title: "Klara and the Sun", author: "Kazuo Ishiguro", sales: "$2,900", growth: "-5%", img: "https://picsum.photos/seed/book3/100/150" },
              { title: "The Silent Patient", author: "Alex Michaelides", sales: "$2,100", growth: "+8%", img: "https://picsum.photos/seed/book4/100/150" },
            ].map((book, i) => (
              <div key={i} className="flex items-center gap-4">
                <img src={book.img} alt={book.title} className="w-12 h-16 rounded-md object-cover border border-white/5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{book.title}</h3>
                  <p className="text-xs text-slate-500 truncate">{book.author}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{book.sales}</p>
                  <p className={`text-[10px] ${book.growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{book.growth}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/author/my-books')}
            className="w-full mt-8 py-2 text-sm font-medium text-accent hover:text-white transition-colors"
          >
            View All Books
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <h2 className="text-lg font-bold mb-6">Recent Feedback</h2>
          <div className="space-y-4">
            {[
              { user: "Sarah J.", comment: "Absolutely loved the character development in Chapter 4!", rating: 5, time: "2h ago" },
              { user: "Michael R.", comment: "The plot twist at the end was completely unexpected. Brilliant!", rating: 5, time: "5h ago" },
              { user: "Emma W.", comment: "Could use more descriptive language in the opening scene.", rating: 4, time: "1d ago" },
            ].map((feedback, i) => (
              <div key={i} className="p-4 bg-primary/5 rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                      {feedback.user[0]}
                    </div>
                    <span className="text-xs font-bold">{feedback.user}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{feedback.time}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{feedback.comment}</p>
                <div className="flex gap-0.5 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`size-2.5 ${i < feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Reader Demographics</h2>
            <button
              onClick={() => window.alert('More demographic actions coming soon.')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { age: '18-24', count: 400 },
                  { age: '25-34', count: 700 },
                  { age: '35-44', count: 550 },
                  { age: '45-54', count: 300 },
                  { age: '55+', count: 200 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#16282b', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#4a868f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-center text-slate-500 mt-2 uppercase tracking-wider font-bold">Age Distribution</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400">Top Regions</h3>
              {[
                { country: "United States", percentage: 45, color: "bg-accent" },
                { country: "United Kingdom", percentage: 22, color: "bg-primary" },
                { country: "Canada", percentage: 15, color: "bg-slate-600" },
                { country: "Australia", percentage: 10, color: "bg-slate-700" },
              ].map((region, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>{region.country}</span>
                    <span className="font-bold">{region.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${region.color}`} style={{ width: `${region.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
