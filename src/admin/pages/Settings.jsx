import { cn } from "../../lib/utils";

const notifications = [
  { label: "New Reader", desc: "When someone starts reading your book", active: true },
  { label: "Book Approved", desc: "When admin approves your submission", active: true },
  { label: "Weekly Report", desc: "Weekly analytics summary email", active: false },
  { label: "New Comment", desc: "When someone comments on your book", active: true },
];

const Settings = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Notifications</h3>
          <div className="space-y-6">
            {notifications.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <button className={cn("w-12 h-6 rounded-full transition-colors relative", item.active ? "bg-purple-500" : "bg-white/10")}>
                  <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", item.active ? "right-1" : "left-1")} />
                </button>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl">
            Save Notifications
          </button>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Change Password</h3>
          <div className="space-y-4">
            <input type="password" placeholder="Current password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" />
            <input type="password" placeholder="New password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" />
            <input type="password" placeholder="Confirm new password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" />
          </div>
          <button className="mt-8 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl">
            Update Password
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Preferences</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Preferred Language</label>
              <select className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-xl">
                <button className="py-2 text-xs font-bold rounded-lg bg-purple-500 text-white">Dark</button>
                <button className="py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white">System</button>
                <button className="py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white">Light</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
