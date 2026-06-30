"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";
import { getNotifications, saveNotification } from "@/lib/storage";
import { NotificationItem } from "@/types";
import { 
  Brain, 
  Clock, 
  Calendar, 
  MessageSquare, 
  CheckSquare, 
  Activity, 
  Target, 
  Settings, 
  LogOut, 
  Bell, 
  Flame, 
  Menu, 
  X,
  Award,
  Sparkles
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOutUser } = useAuth();
  
  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Auth Protection Guard
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load notifications
  useEffect(() => {
    if (user) {
      getNotifications(user.uid).then(list => {
        // If empty, generate a welcome warning
        if (list.length === 0) {
          const welcomeNotification: NotificationItem = {
            id: `notif_welcome_${Date.now()}`,
            userId: user.uid,
            message: "Welcome to LastMinute AI! Try adding tasks to generate AI risk predictions.",
            type: "info",
            sentAt: new Date().toISOString(),
            read: false
          };
          saveNotification(welcomeNotification);
          setNotifications([welcomeNotification]);
        } else {
          setNotifications(list);
        }
      });
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // In a real app we'd persist this, here we update state
  };

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: Brain },
    { name: "Smart Tasks", path: "/dashboard/tasks", icon: CheckSquare },
    { name: "AI Scheduler", path: "/dashboard/schedule", icon: Clock },
    { name: "AI Calendar", path: "/dashboard/calendar", icon: Calendar },
    { name: "AI Coach Chat", path: "/dashboard/coach", icon: MessageSquare },
    { name: "Habit Heatmap", path: "/dashboard/habits", icon: Activity },
    { name: "Goal Tracker", path: "/dashboard/goals", icon: Target },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Brain className="w-16 h-16 text-violet-400 animate-pulse" />
        <span className="text-sm font-semibold text-slate-300 tracking-widest animate-pulse">
          TUNING AI COACH...
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-slate-950 text-white relative">
      {/* Background glow elements */}
      <div className="fixed top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-900/60 backdrop-blur-xl border-r border-white/5 flex-col shrink-0 fixed top-0 bottom-0 left-0 z-30">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
          <span className="text-lg font-bold tracking-tight text-white">LastMinute <span className="text-cyan-400">AI</span></span>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isActive 
                    ? "bg-violet-600/20 text-violet-300 border-l-2 border-violet-500 shadow-md"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-violet-400" : ""}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User stats widget in sidebar bottom */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={user.photoURL} 
              alt={user.displayName} 
              className="w-10 h-10 rounded-full border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate text-white">{user.displayName}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-cyan-400" /> Lvl {user.level}</span>
              <span className="text-violet-400 font-bold">{user.xp} XP</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              {/* Level Equation progress math */}
              {(() => {
                const nextLevelXp = Math.pow(user.level, 2) * 100;
                const currentLevelXp = Math.pow(user.level - 1, 2) * 100;
                const progress = ((user.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
                return <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.min(100, Math.max(5, progress))}%` }} />;
              })()}
            </div>
          </div>

          <button 
            onClick={signOutUser}
            className="flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 py-1 px-1 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-20 px-6 flex justify-between items-center">
          {/* Mobile drawer button */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-1.5 bg-white/5 rounded border border-white/10 text-slate-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden lg:block text-sm font-semibold text-slate-400">
            Welcome back! Let's get things done today.
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold shadow-lg shadow-orange-500/5">
              <Flame className="w-4.5 h-4.5 animate-bounce text-orange-500 fill-orange-500" />
              <span>{user.streak} DAY STREAK</span>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border border-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 glass-panel border border-white/10 shadow-2xl p-4 flex flex-col gap-3 max-h-[400px] z-50">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="font-bold text-xs">Notifications</span>
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-violet-400 hover:text-violet-300 font-bold"
                    >
                      Mark all read
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-6">
                        No notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-2.5 rounded-lg text-xs leading-relaxed border transition-colors ${
                            !n.read 
                              ? "bg-violet-950/20 border-violet-900/30 text-slate-200" 
                              : "bg-white/2 border-white/5 text-slate-400"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1 font-bold">
                            <span className={`uppercase text-[9px] ${
                              n.type === 'critical' ? 'text-rose-400' :
                              n.type === 'warning' ? 'text-amber-400' :
                              n.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'
                            }`}>
                              {n.type}
                            </span>
                            <span className="text-[9px] text-slate-500 font-normal">
                              {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Profile info */}
            <div className="lg:hidden flex items-center gap-2">
              <img 
                src={user.photoURL} 
                alt={user.displayName} 
                className="w-8 h-8 rounded-full border border-white/10"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Pages Mount */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Slide-out Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden flex">
          <div className="w-72 bg-slate-900 border-r border-white/5 flex flex-col p-6 h-full relative">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/5 border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-8 mt-2">
              <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
              <span className="text-lg font-bold tracking-tight text-white">LastMinute <span className="text-cyan-400">AI</span></span>
            </div>

            <nav className="flex-1 flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                      isActive 
                        ? "bg-violet-600/20 text-violet-300 border-l-2 border-violet-500 shadow-md"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-white/5 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-10 h-10 rounded-full border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate text-white">{user.displayName}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOutUser();
                }}
                className="flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 py-1 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
