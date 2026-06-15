
import React, { useState, useEffect } from 'react';
import { User, NotificationPreferences, UserRole } from '../types';

interface SettingsViewProps {
    user: User;
    onUpdate: (updates: Partial<User>) => void;
    onDelete: () => void;
    onBack: () => void;
    onAboutClick?: () => void;
    onStoryClick?: () => void; // New Prop
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdate, onDelete, onBack, onAboutClick, onStoryClick }) => {
    const [prefs, setPrefs] = useState<NotificationPreferences>(user.notificationPreferences || { newPostings: true, missionUpdates: true, messages: true });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [language, setLanguage] = useState(user.language || 'English');
    const [searchRadius, setSearchRadius] = useState<number>(user.searchRadius || 10);
    const [donationFilter, setDonationFilter] = useState<'ALL' | 'FOOD' | 'CLOTHES'>(user.donationTypeFilter || 'ALL');
    const [sortBy, setSortBy] = useState<'NEWEST' | 'CLOSEST' | 'EXPIRY'>(user.sortBy || 'NEWEST');
    const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'Light');

    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            const isSystemDark = mediaQuery.matches;
            if (theme === 'Dark' || (theme === 'System' && isSystemDark)) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme();
        localStorage.setItem('app_theme', theme);

        // Listen for system theme changes if 'System' is selected
        if (theme === 'System') {
            mediaQuery.addEventListener('change', applyTheme);
        }

        return () => mediaQuery.removeEventListener('change', applyTheme);
    }, [theme]);

    const togglePref = (key: keyof NotificationPreferences) => { const newPrefs = { ...prefs, [key]: !prefs[key] }; setPrefs(newPrefs); onUpdate({ notificationPreferences: newPrefs }); };
    const handleRadiusChange = (r: number) => { setSearchRadius(r); onUpdate({ searchRadius: r }); };
    const handleFilterChange = (f: 'ALL' | 'FOOD' | 'CLOTHES') => { setDonationFilter(f); onUpdate({ donationTypeFilter: f }); };
    const handleSortChange = (s: 'NEWEST' | 'CLOSEST' | 'EXPIRY') => { setSortBy(s); onUpdate({ sortBy: s }); };
    const handleLanguageChange = (l: string) => { setLanguage(l); onUpdate({ language: l }); localStorage.setItem('app_language', l); };

    const SettingRow = ({ icon, label, sub, children }: { icon: string, label: string, sub?: string, children?: React.ReactNode }) => (
        <div className="flex items-center justify-between py-5 border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/30 dark:hover:bg-slate-100/30 dark:bg-slate-800/30 px-4 -mx-4 rounded-2xl transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100/50 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xl shadow-inner">{icon}</div>
                <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{label}</p>
                    {sub && <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{sub}</p>}
                </div>
            </div>
            {children}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto pb-20 animate-fade-in-up">
            <button onClick={onBack} className="mb-8 flex items-center text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group">
                <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Back to Dashboard
            </button>

            <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">Preferences</h2>
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 dark:bg-white text-slate-900 dark:text-white dark:text-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-300 text-[10px] font-black uppercase tracking-widest shadow-md">
                    v2.0
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Story Link */}
                {onStoryClick && (
                    <div onClick={onStoryClick} className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-900 dark:to-teal-900 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)] dark:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.1)] border border-emerald-400/30 p-6 text-slate-900 dark:text-white cursor-pointer hover:scale-[1.02] transition-all flex flex-col justify-between h-36 relative overflow-hidden group/story">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 dark:bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover/story:opacity-100"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 bg-black/10 dark:bg-black/30 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-slate-300 dark:border-white/20 text-2xl shadow-inner group-hover/story:scale-110 transition-transform">📖</div>
                            <svg className="w-5 h-5 text-slate-900 dark:text-white/50 group-hover/story:translate-x-1 transition-transform group-hover/story:text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black tracking-tight drop-shadow-md">Our Mission</h3>
                            <p className="text-emerald-50 max-w-[150px] text-xs font-bold opacity-80 mt-1">Discover the impact behind MEALers</p>
                        </div>
                    </div>
                )}

                {/* Creators Link */}
                {onAboutClick && (
                    <div onClick={onAboutClick} className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-slate-900 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-700/50 p-6 text-slate-900 dark:text-white cursor-pointer hover:scale-[1.02] transition-all flex flex-col justify-between h-36 relative overflow-hidden group/team">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-slate-200 dark:border-white/10 text-2xl shadow-inner group-hover/team:scale-110 transition-transform">👨‍💻</div>
                            <svg className="w-5 h-5 text-slate-900 dark:text-white/50 group-hover/team:translate-x-1 transition-transform group-hover/team:text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black tracking-tight drop-shadow-md dark:text-white">The Creators</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-xs font-bold opacity-80 mt-1">Meet the visionaries</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-white/50 dark:border-white/10 overflow-hidden mb-8">
                <div className="px-8 py-4">
                    <SettingRow icon="🌐" label="Language" sub="Application localization">
                        <select value={language} onChange={e => handleLanguageChange(e.target.value)} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner hover:bg-white dark:hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                            <option value="English">English</option><option value="Hindi">Hindi</option><option value="Marathi">Marathi</option>
                        </select>
                    </SettingRow>
                    <SettingRow icon="🌗" label="Theme" sub="Visual appearance">
                        <select value={theme} onChange={e => setTheme(e.target.value)} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner hover:bg-white dark:hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                            <option>Light</option><option>Dark</option><option>System</option>
                        </select>
                    </SettingRow>
                </div>
            </div>

            {(user.role === UserRole.REQUESTER || user.role === UserRole.VOLUNTEER) && (
                <div className="mb-8">
                    <h3 className="px-6 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 glow glow-slate-400/20">Discovery Parameters</h3>
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-white/50 dark:border-white/10 overflow-hidden">
                        <div className="px-8 py-4">
                            <SettingRow icon="📍" label="Search Radius" sub="Geographic boundary limit">
                                <select value={searchRadius} onChange={e => handleRadiusChange(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner hover:bg-white dark:hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                                    <option value={1}>1 km</option><option value={5}>5 km</option><option value={10}>10 km</option><option value={20}>20 km</option><option value={50}>50 km</option>
                                </select>
                            </SettingRow>
                            <SettingRow icon="🔃" label="Sort Algorithm" sub="Primary display ordering">
                                <select value={sortBy} onChange={e => handleSortChange(e.target.value as any)} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner hover:bg-white dark:hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                                    <option value="NEWEST">Newest First</option><option value="CLOSEST">Nearest Distance</option><option value="EXPIRY">Urgent Expiry</option>
                                </select>
                            </SettingRow>
                            <SettingRow icon="🍱" label="Item Classification" sub="Material preference">
                                <select value={donationFilter} onChange={e => handleFilterChange(e.target.value as any)} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner hover:bg-white dark:hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                                    <option value="ALL">All Categories</option><option value="FOOD">Sustenance Only</option><option value="CLOTHES">Apparel Only</option>
                                </select>
                            </SettingRow>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-12">
                <h3 className="px-6 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 glow glow-slate-400/20">Communication Subscriptions</h3>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-white/50 dark:border-white/10 overflow-hidden">
                    <div className="px-8 py-4">
                        {user.role === UserRole.VOLUNTEER && (
                            <SettingRow icon="📡" label="Surplus Radar" sub="Instant alerts for nearby availability">
                                <button onClick={() => togglePref('newPostings')} className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 border ${prefs.newPostings ? 'bg-gradient-to-r from-emerald-400 to-teal-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-inner'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${prefs.newPostings ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
                            </SettingRow>
                        )}
                        <SettingRow icon="🚀" label="Mission Telemetry" sub="Live status changes and tracking">
                            <button onClick={() => togglePref('missionUpdates')} className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 border ${prefs.missionUpdates ? 'bg-gradient-to-r from-emerald-400 to-teal-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-inner'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${prefs.missionUpdates ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
                        </SettingRow>
                        <SettingRow icon="💬" label="Encrypted Comm" sub="Direct messages and pings">
                            <button onClick={() => togglePref('messages')} className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 border ${prefs.messages ? 'bg-gradient-to-r from-emerald-400 to-teal-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-inner'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${prefs.messages ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
                        </SettingRow>
                    </div>
                </div>
            </div>

            <div className="bg-rose-500/10 dark:bg-rose-900/20 backdrop-blur-md rounded-[2.5rem] border border-rose-500/20 dark:border-rose-500/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                <div>
                    <p className="text-rose-600 dark:text-rose-400 font-black text-lg tracking-tight">Purge Identity</p>
                    <p className="text-rose-700/70 dark:text-rose-400/70 text-sm mt-1 font-medium">Permanently expunge all associated data records.</p>
                </div>
                <button onClick={() => setShowDeleteConfirm(true)} className="px-6 py-4 w-full md:w-auto bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:bg-rose-500 hover:text-slate-900 dark:text-white dark:hover:text-slate-900 dark:text-white transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap">Execute Purge</button>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] border border-slate-300 dark:border-white/20 p-10 w-full max-w-sm text-center shadow-[0_0_50px_rgba(244,63,94,0.15)] animate-fade-in-up">
                        <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_0_30px_rgba(244,63,94,0.3)]">⚠️</div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 drop-shadow-md">Irreversible Action</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-8 leading-relaxed">This will permanently dismantle your digital identity.</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { setShowDeleteConfirm(false); onDelete(); }} className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-white shadow-[0_10px_20px_-10px_rgba(225,29,72,0.5)] border border-rose-400/50 hover:-translate-y-1 transition-transform">Confirm Purge</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-white/10 border border-slate-300 dark:border-white/20 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-white hover:bg-white/20 transition-colors">Abort Sequence</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
