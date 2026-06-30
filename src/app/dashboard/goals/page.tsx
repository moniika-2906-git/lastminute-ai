"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { getGoals, saveGoal, deleteGoal } from "@/lib/storage";
import { Goal } from "@/types";
import { 
  Plus, 
  Target, 
  Trash2, 
  Save, 
  Award,
  Sparkles,
  TrendingUp,
  FolderPlus,
  Edit3
} from "lucide-react";

export default function GoalsPage() {
  const { user, updateXP } = useAuth();
  
  // States
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // New Goal states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Study");
  const [newTarget, setNewTarget] = useState("4.0");
  const [newUnit, setNewUnit] = useState("GPA");
  const [newDeadline, setNewDeadline] = useState("");

  // Log progress states
  const [loggingGoalId, setLoggingGoalId] = useState<string | null>(null);
  const [logValue, setLogValue] = useState("");

  // Load goals
  useEffect(() => {
    if (user) {
      getGoals(user.uid).then((list) => {
        if (list.length === 0) {
          // Initialize mock goals
          const defaults: Goal[] = [
            { id: "g_gpa", userId: user.uid, title: "Achieve Semester GPA", description: "Targeting a high grade across all technical courses.", category: "Study", targetValue: 4.0, currentValue: 3.5, unit: "GPA", deadline: new Date(Date.now() + 86400000 * 90).toISOString(), completed: false, progressLogs: [], createdAt: new Date().toISOString() },
            { id: "g_books", userId: user.uid, title: "Read Tech Literature", description: "Complete technical architecture, algorithms and business development guides.", category: "Personal", targetValue: 12, currentValue: 4, unit: "books", deadline: new Date(Date.now() + 86400000 * 180).toISOString(), completed: false, progressLogs: [], createdAt: new Date().toISOString() }
          ];
          defaults.forEach(g => saveGoal(g));
          setGoals(defaults);
        } else {
          setGoals(list);
        }
        setLoading(false);
      });
    }
  }, [user]);

  // Create Goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDeadline || !user) return;

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      userId: user.uid,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      targetValue: parseFloat(newTarget) || 10,
      currentValue: 0,
      unit: newUnit,
      deadline: new Date(newDeadline).toISOString(),
      completed: false,
      progressLogs: [{ date: new Date().toISOString(), value: 0 }],
      createdAt: new Date().toISOString()
    };

    await saveGoal(newGoal);
    setGoals(prev => [...prev, newGoal]);
    
    // Reset form fields
    setNewTitle("");
    setNewDesc("");
    setNewTarget("10");
    setNewUnit("units");
    setNewDeadline("");
    setShowForm(false);
  };

  // Log Goal Progress
  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(logValue);
    if (isNaN(val) || !loggingGoalId) return;

    const updated = goals.map(g => {
      if (g.id === loggingGoalId) {
        const isComplete = val >= g.targetValue;
        const goalObj: Goal = {
          ...g,
          currentValue: val,
          completed: isComplete,
          progressLogs: [...g.progressLogs, { date: new Date().toISOString(), value: val }]
        };
        
        if (isComplete && !g.completed) {
          updateXP(100); // Award large XP bonus (+100 XP) on completing a long-term goal!
        }
        
        saveGoal(goalObj);
        return goalObj;
      }
      return g;
    });

    setGoals(updated);
    setLoggingGoalId(null);
    setLogValue("");
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Goal Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">
            Establish long-term milestones. Log incremental progress and earn massive XP bonuses upon completion.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/10 self-start"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {/* Goal creation drawer form */}
      {showForm && (
        <div className="glass-panel p-5 bg-slate-900/40">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FolderPlus className="w-4 h-4 text-violet-400" /> Declare New Long-Term Goal
          </h2>
          <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Goal Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Complete placement prep coursework"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
              >
                <option value="Study">Study</option>
                <option value="Career">Career</option>
                <option value="Fitness">Fitness</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Short Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Describe critical steps to succeed..."
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Target Value</label>
              <input
                type="number"
                step="0.1"
                required
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="4.0"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Unit of Measure</label>
              <input
                type="text"
                required
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="GPA, books, hours, miles"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Goal Deadline</label>
              <input
                type="date"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-all text-xs shadow-md shadow-violet-600/10"
              >
                Confirm Goal Creation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logging progress overlays */}
      {loggingGoalId && (
        <div className="glass-panel p-5 bg-slate-900/60 border-cyan-500/20 max-w-md">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Log Incremental Goal Progress</h3>
          <form onSubmit={handleLogProgress} className="flex gap-3">
            <input
              type="number"
              step="0.1"
              required
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
              placeholder="e.g. 3.8"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs"
            >
              Update Value
            </button>
            <button
              type="button"
              onClick={() => setLoggingGoalId(null)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Goals backlog grid */}
      {loading ? (
        <div className="text-center text-xs text-slate-500 py-10">Syncing goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-center text-xs text-slate-500 py-10">No goals found. Create one above!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = Math.min(100, Math.max(0, Math.round((goal.currentValue / goal.targetValue) * 100)));
            const dlDate = new Date(goal.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
            
            return (
              <div 
                key={goal.id} 
                className={`glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group ${
                  goal.completed ? "opacity-60 border-emerald-500/20" : ""
                }`}
              >
                {/* Background glow when hovered */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-colors" />

                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                      {goal.category}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-2 leading-snug">{goal.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setLoggingGoalId(goal.id)}
                      className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Log Progress"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">{goal.description}</p>

                {/* Progress bar info */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">
                      {goal.currentValue} / {goal.targetValue} <span className="text-[10px] text-slate-400 uppercase tracking-wide font-normal">{goal.unit}</span>
                    </span>
                    <span className="text-violet-400 font-bold">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                    <div 
                      className={`h-full bg-gradient-to-r transition-all duration-1000 ${
                        goal.completed ? "from-emerald-500 to-cyan-400" : "from-violet-600 to-cyan-400"
                      }`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>

                {/* Footer metrics */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-white/5 pt-3 mt-1.5">
                  <span>Target Date: <strong className="text-slate-300">{dlDate}</strong></span>
                  {goal.completed ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Milestone Complete!
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-cyan-400 font-bold">
                      <Target className="w-3.5 h-3.5" /> Active tracking
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
