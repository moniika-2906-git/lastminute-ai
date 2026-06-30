"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { saveUserProfile } from "@/lib/storage";
import { 
  Settings as SettingsIcon, 
  User, 
  Sun, 
  Moon, 
  Download, 
  Trash2, 
  Award,
  Sparkles,
  Save,
  HelpCircle
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  
  // States
  const [displayName, setDisplayName] = useState("");
  const [theme, setTheme] = useState("dark");
  const [strictMode, setStrictMode] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sync state with profile details
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      const isLight = typeof document !== "undefined" && document.documentElement.classList.contains("theme-light");
      setTheme(isLight ? "light" : "dark");
    }
  }, [user]);

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;
    setSaving(true);
    
    const updated = {
      ...user,
      displayName
    };
    await saveUserProfile(updated);
    setSaving(false);
    alert("Profile settings updated successfully!");
    window.location.reload(); // Refresh to update layouts
  };

  // Toggle Theme class
  const toggleTheme = (targetTheme: string) => {
    if (typeof document === "undefined") return;
    setTheme(targetTheme);
    if (targetTheme === "light") {
      document.documentElement.classList.add("theme-light");
    } else {
      document.documentElement.classList.remove("theme-light");
    }
  };

  // Production-grade JSON Data Exporter
  const handleExportData = () => {
    if (typeof window === "undefined") return;
    const data = {
      tasks: JSON.parse(localStorage.getItem("lastminute_tasks") || "[]"),
      goals: JSON.parse(localStorage.getItem("lastminute_goals") || "[]"),
      habits: JSON.parse(localStorage.getItem("lastminute_habits") || "[]"),
      schedules: JSON.parse(localStorage.getItem("lastminute_schedules") || "[]"),
      profile: JSON.parse(localStorage.getItem("lastminute_user_profile") || "null"),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lastminute_ai_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear data backlog
  const handleWipeData = () => {
    if (confirm("WARNING: This will permanently delete your local task backlog, streaks, and achievements. Continue?")) {
      localStorage.clear();
      alert("All data wiped. Refreshing session...");
      window.location.href = "/";
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize AI strictness, manage visual theme parameters, and export workspace databases.
          </p>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Profile & Theme (Col Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Profile Form */}
          <div className="glass-panel p-6">
            <h2 className="text-sm font-bold text-white pb-2 border-b border-white/5 flex items-center gap-2 mb-4">
              <User className="w-4.5 h-4.5 text-violet-400" /> User Profile Info
            </h2>
            
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase text-[9px]">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-white/5 text-slate-500 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase text-[9px]">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <Save className="w-4 h-4" /> Save Profile Details
              </button>
            </form>
          </div>

          {/* Theme & AI strictness preferences */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white pb-2 border-b border-white/5 flex items-center gap-2">
              <SettingsIcon className="w-4.5 h-4.5 text-cyan-400" /> Personal Preferences
            </h2>

            <div className="flex flex-col gap-4 text-xs text-slate-300">
              {/* Theme toggler */}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <span className="font-bold text-white block">Visual Theme Mode</span>
                  <span className="text-[10px] text-slate-500">Toggle between light glass and dark glass formats.</span>
                </div>
                <div className="flex border border-white/10 rounded-lg p-0.5 bg-slate-950">
                  <button
                    onClick={() => toggleTheme("dark")}
                    className={`p-1.5 rounded-md flex items-center gap-1 transition-all ${
                      theme === 'dark' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Dark
                  </button>
                  <button
                    onClick={() => toggleTheme("light")}
                    className={`p-1.5 rounded-md flex items-center gap-1 transition-all ${
                      theme === 'light' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Light
                  </button>
                </div>
              </div>

              {/* Strict Mode */}
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-bold text-white block">AI Strict Coaching</span>
                  <span className="text-[10px] text-slate-500">Increases risk warning levels for deadlines below 48 hours.</span>
                </div>
                <button
                  onClick={() => setStrictMode(!strictMode)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                    strictMode ? "bg-cyan-500" : "bg-slate-850 border border-white/10"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    strictMode ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Achievements & Exporters (Col Span 1) */}
        <div className="glass-panel p-6 flex flex-col gap-6">
          {/* Achievements */}
          <div>
            <h2 className="text-sm font-bold text-white pb-2 border-b border-white/5 flex items-center gap-2 mb-3">
              <Award className="w-4.5 h-4.5 text-rose-500" /> Unlockable Badges ({user.badges.length})
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {user.badges.map((badge, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider"
                >
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Backup Database */}
          <div className="mt-auto flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white pb-2 border-b border-white/5 flex items-center gap-1.5">
              <Download className="w-4.5 h-4.5 text-emerald-400" /> Database Administration
            </h2>
            <button
              onClick={handleExportData}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
            >
              <Download className="w-4 h-4" /> Export Backup (JSON)
            </button>
            <button
              onClick={handleWipeData}
              className="py-2.5 bg-rose-900/10 hover:bg-rose-900/25 border border-rose-500/20 text-rose-400 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Wipe Local Workspace
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
