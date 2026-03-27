export const MOCK_STATS = {
  totalUsers: 12483,
  totalBooks: 2847,
  pendingApprovals: 24,
  authors: 1234,
};

export const MOCK_TRENDS = {
  totalUsers: 342,
  totalBooks: 127,
  pendingApprovals: -4,
  authors: 89,
};

export const MOCK_ACTIVITY_7D = [
  { name: "Mon", users: 45 },
  { name: "Tue", users: 62 },
  { name: "Wed", users: 38 },
  { name: "Thu", users: 71 },
  { name: "Fri", users: 55 },
  { name: "Sat", users: 29 },
  { name: "Sun", users: 33 },
];

export const MOCK_ACTIVITY_30D = [
  { name: "Mar 1", users: 120 },
  { name: "Mar 5", users: 145 },
  { name: "Mar 10", users: 98 },
  { name: "Mar 15", users: 167 },
  { name: "Mar 20", users: 134 },
  { name: "Mar 24", users: 89 },
];

export const MOCK_HEALTH = {
  uptimePercent: 99.98,
  apiServer: { status: "online", latencyMs: 12 },
  database: { status: "online", queryTimeMs: 4 },
  fileStorage: { status: "warning", usedPercent: 78 },
  emailService: { status: "online", responseMs: 67 },
};

export const MOCK_TOP_READERS = [
  {
    user: {
      id: 1,
      first_name: "Alice",
      last_name: "Johnson",
      email: "alice@example.com",
      avatar_url: "https://ui-avatars.com/api/?name=Alice+Johnson&background=0b1625&color=00f5a0",
    },
    booksRead: 52,
    trend: 8,
  },
  {
    user: {
      id: 2,
      first_name: "Bob",
      last_name: "Smith",
      email: "bob@example.com",
      avatar_url: "https://ui-avatars.com/api/?name=Bob+Smith&background=0b1625&color=00f5a0",
    },
    booksRead: 38,
    trend: 5,
  },
  {
    user: {
      id: 3,
      first_name: "Carol",
      last_name: "Davis",
      email: "carol@example.com",
      avatar_url: "https://ui-avatars.com/api/?name=Carol+Davis&background=0b1625&color=00f5a0",
    },
    booksRead: 24,
    trend: 3,
  },
];
