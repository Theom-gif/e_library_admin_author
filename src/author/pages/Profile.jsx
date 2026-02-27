import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Globe, 
  Twitter, 
  Instagram, 
  Github,
  Edit3,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Users
} from 'lucide-react';

const PROFILE_STORAGE_KEY = 'author_studio_profile';
const PROFILE_UPDATED_EVENT = 'author-profile-updated';

const defaultProfile = {
  name: 'Alex Rivera',
  username: 'arivera_author',
  tier: 'Pro Author',
  bio: "Bestselling author of speculative fiction and contemporary thrillers. Obsessed with world-building and complex character arcs. When I'm not writing, you can find me hiking in the Pacific Northwest or lost in a local bookstore.",
  location: 'Seattle, WA',
  joined: 'March 2021',
  email: 'alex.rivera@inkwell.com',
  website: 'https://example.com',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlEVr580N1MAJKB6IPshOgAds-VzQi3M2D3hifRUqDV9JCX-_nULM_zGDb8dVGBYdz4V2CWOYIDkgMI50DEppkE9po92vlp4lfaOQBhpFnndWtWiBrNG2jHQEjunra1G4Svlwf1l2aVjKI9saVSU3euiXQES0MBV-vqptGLQsJ6Y2WNNR3w4DKAGSLfRf_mU_mG2Yh5-_Yxf-cTJN17JAE-4nfmHaWUXvfDosDc3doTApg4pT9ebRdhc885FOqbg9HS_UjNGNPGg',
  coverUrl: 'https://picsum.photos/seed/cover/1200/400',
};

const Profile = () => {
  const navigate = useNavigate();
  const avatarInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [profile, setProfile] = React.useState(() => {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    try {
      return { ...defaultProfile, ...JSON.parse(raw) };
    } catch {
      return defaultProfile;
    }
  });
  const [draft, setDraft] = React.useState(profile);

  React.useEffect(() => {
    if (!isEditing) {
      setDraft(profile);
    }
  }, [isEditing, profile]);

  const saveProfile = () => {
    setProfile(draft);
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(draft));
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const updateImageFromFile = (file, key) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setDraft((prev) => ({ ...prev, [key]: reader.result }));
      if (!isEditing) {
        const updated = { ...profile, [key]: reader.result };
        setProfile(updated);
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      }
    };
    reader.readAsDataURL(file);
  };

  const activeProfile = isEditing ? draft : profile;
  const writingHeights = React.useMemo(
    () => Array.from({ length: 30 }, (_, i) => 20 + ((i * 37) % 80)),
    [],
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="relative mb-24">
        <div className="h-48 w-full rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-accent/50 relative">
          <img src={activeProfile.coverUrl} alt="Cover" className="w-full h-full object-cover opacity-40" />
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md rounded-lg text-white hover:bg-black/50 transition-colors"
          >
            <Edit3 className="size-4" />
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              updateImageFromFile(file, 'coverUrl');
              e.target.value = '';
            }}
          />
        </div>
        
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="relative group">
            <img 
              src={activeProfile.avatarUrl} 
              alt={activeProfile.name} 
              className="size-32 rounded-2xl border-4 border-background-dark object-cover shadow-2xl"
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <Edit3 className="size-6" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                updateImageFromFile(file, 'avatarUrl');
                e.target.value = '';
              }}
            />
          </div>
          <div className="mb-2">
            {isEditing ? (
              <input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                className="text-3xl font-bold bg-transparent border-b border-white/20 focus:outline-none"
              />
            ) : (
              <h1 className="text-3xl font-bold">{activeProfile.name}</h1>
            )}
            <p className="text-slate-400 flex items-center gap-2">
              {isEditing ? (
                <input
                  value={draft.username}
                  onChange={(e) => setDraft((prev) => ({ ...prev, username: e.target.value }))}
                  className="text-sm bg-transparent border-b border-white/20 focus:outline-none"
                />
              ) : (
                <span>@{activeProfile.username}</span>
              )}
              <span className="size-1 bg-slate-600 rounded-full"></span>
              <span className="text-accent font-bold">{activeProfile.tier}</span>
            </p>
          </div>
        </div>
        
        <div className="absolute -bottom-12 right-0 flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-glow hover:opacity-90 transition-all"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={cancelEdit}
                className="px-6 py-2.5 bg-card-dark border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-glow hover:opacity-90 transition-all"
              >
                Save Profile
              </button>
            </>
          )}
          <button
            onClick={() => window.open(activeProfile.website || 'https://example.com', '_blank', 'noopener,noreferrer')}
            className="p-2.5 bg-card-dark border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <Globe className="size-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">About Me</h2>
            {isEditing ? (
              <textarea
                value={draft.bio}
                onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                rows={5}
                className="w-full text-sm text-slate-300 leading-relaxed mb-6 bg-primary/10 border border-white/10 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed mb-6">{activeProfile.bio}</p>
            )}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="size-4" />
                {isEditing ? (
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                    className="bg-transparent border-b border-white/20 focus:outline-none"
                  />
                ) : (
                  <span>{activeProfile.location}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Calendar className="size-4" />
                {isEditing ? (
                  <input
                    value={draft.joined}
                    onChange={(e) => setDraft((prev) => ({ ...prev, joined: e.target.value }))}
                    className="bg-transparent border-b border-white/20 focus:outline-none"
                  />
                ) : (
                  <span>Joined {activeProfile.joined}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="size-4" />
                {isEditing ? (
                  <input
                    value={draft.email}
                    onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-transparent border-b border-white/20 focus:outline-none"
                  />
                ) : (
                  <span>{activeProfile.email}</span>
                )}
              </div>
              {isEditing && (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Globe className="size-4" />
                  <input
                    value={draft.website}
                    onChange={(e) => setDraft((prev) => ({ ...prev, website: e.target.value }))}
                    className="bg-transparent border-b border-white/20 focus:outline-none w-full"
                    placeholder="https://your-site.com"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-4 mt-8 pt-8 border-t border-white/5">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Twitter profile"
                className="text-slate-500 hover:text-sky-400 transition-colors"
              >
                <Twitter className="size-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Instagram profile"
                className="text-slate-500 hover:text-pink-400 transition-colors"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open GitHub profile"
                className="text-slate-500 hover:text-white transition-colors"
              >
                <Github className="size-5" />
              </a>
            </div>
          </div>

          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Achievements</h2>
            <div className="space-y-4">
              {[
                { title: "Bestseller", desc: "Top 10 for 4 consecutive weeks", icon: Award, color: "text-yellow-500" },
                { title: "Prolific Writer", desc: "Published 5+ books in one year", icon: BookOpen, color: "text-accent" },
                { title: "Community Star", desc: "Over 1,000 positive reader reviews", icon: Users, color: "text-emerald-500" },
              ].map((ach, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`p-2 bg-white/5 rounded-lg ${ach.color}`}>
                    <ach.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{ach.title}</p>
                    <p className="text-[10px] text-slate-500">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Books", value: "12", icon: BookOpen },
              { label: "Followers", value: "24.5k", icon: Users },
              { label: "Avg. Rating", value: "4.8", icon: Award },
            ].map((stat, i) => (
              <div key={i} className="bg-card-dark border border-white/5 p-6 rounded-2xl card-shadow text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold">Latest Works</h2>
              <button
                onClick={() => navigate('/my-books')}
                className="text-sm font-bold text-accent hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "The Midnight Library", genre: "Fantasy", rating: 4.8, img: "https://picsum.photos/seed/work1/300/450" },
                { title: "Project Hail Mary", genre: "Sci-Fi", rating: 4.9, img: "https://picsum.photos/seed/work2/300/450" },
              ].map((work, i) => (
                <div key={i} className="flex gap-4 p-4 bg-primary/5 rounded-xl border border-white/5 group cursor-pointer hover:border-accent/30 transition-all">
                  <img src={work.img} alt={work.title} className="w-20 h-28 rounded-lg object-cover shadow-lg group-hover:scale-105 transition-transform" />
                  <div className="flex flex-col justify-center">
                    <h3 className="font-bold text-sm mb-1">{work.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{work.genre}</p>
                    <div className="flex items-center gap-1">
                      <Award className="size-3 text-yellow-500" />
                      <span className="text-xs font-bold">{work.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <h2 className="text-lg font-bold mb-6">Writing Activity</h2>
            <div className="flex items-end gap-1 h-32">
              {writingHeights.map((height, i) => {
                return (
                  <div 
                    key={i} 
                    className="flex-1 bg-accent/20 rounded-t-sm hover:bg-accent transition-colors cursor-pointer group relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {Math.floor(height * 20)} words
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              <span>30 Days Ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
