
import React, { useState, useRef, useEffect } from 'react';
import { User, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
  onContactClick: () => void;
  onHelpClick: () => void;
  onSettingsClick: () => void;
  notifications?: Notification[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, user, onLogout, onProfileClick, onLogoClick, onContactClick, onHelpClick, onSettingsClick, notifications = [] 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300 overflow-x-hidden relative">
      
      {/* Animated Deep Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-[140px] animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-bounce-slow"></div>
      </div>

      <header className="fixed top-0 inset-x-0 md:top-6 md:inset-x-0 md:max-w-5xl md:mx-auto z-50 bg-white/80 dark:bg-slate-900/80 md:bg-white/60 md:dark:bg-slate-900/60 backdrop-blur-3xl border-b border-slate-100 dark:border-slate-800 md:border md:border-white/40 md:dark:border-white/10 rounded-none md:rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)] group/nav">
        <div className="px-4 md:px-8 h-14 md:h-[72px] flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-3 md:space-x-4 cursor-pointer group" onClick={onLogoClick}>
            <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden shadow-inner border border-white/50 dark:border-white/10">
                <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="text-xl md:text-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative z-10 leading-none filter drop-shadow-sm">🍃</div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg md:text-xl leading-none text-slate-800 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">MEALers</span>
              <span className="text-[8px] md:text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 uppercase tracking-[0.4em] leading-none mt-0.5 md:mt-1 group-hover:tracking-[0.5em] transition-all duration-500">connect</span>
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2.5 rounded-full relative transition-all duration-300 hover:scale-110 ${showNotifications ? 'bg-slate-100 text-emerald-600 rotate-12' : 'hover:bg-slate-100 text-slate-500 dark:text-slate-400 hover:text-slate-600'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.836L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>}
                </button>
                {showNotifications && (
                   <div className="absolute right-0 mt-4 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] origin-top-right animate-fade-in-up">
                      <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                          <h4 className="font-black text-xs uppercase text-slate-500 dark:text-slate-400 tracking-widest">Notifications</h4>
                          {unreadCount > 0 && <span className="bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-md">{unreadCount} new</span>}
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 px-6 text-slate-500 dark:text-slate-400 text-xs font-bold">All caught up!</div>
                        ) : (
                            notifications.map((n, i) => (
                                <div key={n.id} className={`p-4 rounded-2xl mb-1 transition-all duration-500 delay-[${i * 50}ms] animate-fade-in-up ${n.isRead ? 'opacity-60' : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-1">{n.message}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                </div>
                            ))
                        )}
                      </div>
                   </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)} 
                    className="flex items-center space-x-2 pl-4 border-l border-slate-200 focus:outline-none group"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm ring-2 ring-transparent group-hover:ring-emerald-200 transition-all transform group-hover:scale-105">
                        {user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">{user.name.charAt(0)}</div>
                        )}
                    </div>
                </button>

                {showProfileMenu && (
                    <div className="absolute right-0 mt-4 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] origin-top-right animate-fade-in-up">
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-50 dark:border-slate-800">
                            <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{user.email}</p>
                            <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md">{user.role}</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {['My Profile', 'Settings', 'Support', 'Help & FAQ'].map((item, idx) => {
                                const icons = ['👤', '⚙️', '📞', '❓'];
                                const handlers = [onProfileClick, onSettingsClick, onContactClick, onHelpClick];
                                return (
                                    <button key={item} onClick={() => { setShowProfileMenu(false); handlers[idx](); }} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all flex items-center gap-3 group">
                                        <span className="text-lg opacity-70 group-hover:scale-110 transition-transform">{icons[idx]}</span> {item}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="border-t border-slate-50 dark:border-slate-800 p-2">
                            <button onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }} className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-3 group">
                                <span className="text-lg opacity-70 group-hover:-translate-x-1 transition-transform">🚪</span> Logout
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pt-20 md:pt-32 pb-12 px-4 md:px-6 max-w-7xl mx-auto w-full z-0 relative">
        {children}
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl animate-fade-in-up border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">👋</div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Logging Out?</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Come back soon to make a difference.</p>
                <div className="flex gap-4">
                    <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition-colors uppercase text-xs tracking-widest">Stay</button>
                    <button onClick={() => { setShowLogoutConfirm(false); onLogout(); }} className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl transition-colors shadow-lg shadow-rose-200 dark:shadow-rose-900/20 uppercase text-xs tracking-widest">Logout</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
