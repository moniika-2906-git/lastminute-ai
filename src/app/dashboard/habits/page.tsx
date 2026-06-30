"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { getHabits, saveHabit, deleteHabit } from "@/lib/storage";
import { Habit } from "@/types";
import { 
  Plus, 
  Activity, 
  Flame, 
  Trash2, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Award
} from "lucide-react";

export default function HabitsPage() {
  const { user, updateXP } = useAuth();
  
  // States
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState("Study");

  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Load habits
  useEffect(() => {
    if (user) {
      getHabits(user.uid).then((list) => {
        if (list.length === 0) {
          // Initialize default habits
          const defaults: Habit[] = [
            { id: "h_water", userId: user.uid, name: "Drink Water (8 glasses)", category: "Health", logs: { [todayStr]: false }, streak: 3, createdAt: new Date().toISOString() },
            { id: "h_code", userId: user.uid, name: "Coding Practice", category: "Study", logs: { [todayStr]: false }, streak: 5, createdAt: new Date().toISOString() },
            { id: "h_exercise", userId: user.uid, name: "30-min Exercise", category: "Fitness", logs: { [todayStr]: false }, streak: 1, createdAt: new Date().toISOString() },
            { id: "h_read", userId: user.uid, name: "Read Books / Papers", category: "Study", logs: { [todayStr]: false }, streak: 0, createdAt: new Date().toISOString() }
          ];
          defaults.forEach(h => saveHabit(h));
          setHabits(defaults);
        } else {
          setHabits(list);
        }
        setLoading(false);
      });
    }
  }, [user]);

  // Create Custom Habit
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || !user) return;

    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      userId: user.uid,
      name: newHabitName,
      category: newHabitCategory,
      logs: { [todayStr]: false },
      streak: 0,
      createdAt: new Date().toISOString()
    };

    await saveHabit(newHabit);
    setHabits(prev => [...prev, newHabit]);
    setNewHabitName("");
  };

  // Toggle Habit completion for today
  const toggleHabitForToday = async (habit: Habit) => {
    const isCompletedNow = !habit.logs[todayStr];
    
    // Update logs map
    const logs = { ...habit.logs };
    logs[todayStr] = isCompletedNow;

    // Calculate streak
    let newStreak = habit.streak;
    if (isCompletedNow) {
      newStreak += 1;
      updateXP(10); // Award small XP (+10 XP) for daily habit check-in!
    } else {
      newStreak = Math.max(0, newStreak - 1);
    }

    const updatedHabit = {
      ...habit,
      logs,
      streak: newStreak
    };

    const updatedList = habits.map(h => h.id === habit.id ? updatedHabit : h);
    setHabits(updatedList);
    await saveHabit(updatedHabit);
  };

  // Delete Habit
  const handleDeleteHabit = async (habitId: string) => {
    if (confirm("Are you sure you want to delete this habit?")) {
      await deleteHabit(habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  };

  // Generate date array for past 42 days (heatmap grid)
  const getHeatmapDays = () => {
    const arr = [];
    for (let i = 41; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split("T")[0]);
    }
    return arr;
  };
  const heatmapDays = getHeatmapDays();

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Habit Heatmap</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build discipline. Check in daily habits and view your consistency patterns.
          </p>
        </div>
      </div>

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Checklist & Custom Habit Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Custom habit form */}
          <div className="glass-panel p-5 bg-slate-900/40">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Custom Habit</h2>
            <form onSubmit={handleCreateHabit} className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                required
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g. Meditate for 10 minutes"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              />
              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="Study">Study</option>
                <option value="Health">Health</option>
                <option value="Fitness">Fitness</option>
                <option value="Personal">Personal</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Habit
              </button>
            </form>
          </div>

          {/* Checklist list */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white pb-2 border-b border-white/5 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-cyan-400 animate-pulse" /> Today's Habit Check-in
            </h2>

            {loading ? (
              <div className="text-center text-xs text-slate-500 py-6">Syncing Habits...</div>
            ) : habits.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-6">No habits. Add one above!</div>
            ) : (
              <div className="flex flex-col gap-3">
                {habits.map((habit) => {
                  const isChecked = !!habit.logs[todayStr];
                  return (
                    <div 
                      key={habit.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        isChecked 
                          ? "bg-emerald-950/10 border-emerald-500/20 text-slate-200" 
                          : "bg-white/2 border-white/5 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleHabitForToday(habit)}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isChecked 
                              ? "bg-emerald-600 border-emerald-500 text-white" 
                              : "border-white/20 hover:border-emerald-400"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-4.5 h-4.5" />}
                        </button>
                        <div>
                          <h3 className={`text-xs font-bold ${isChecked ? "line-through text-slate-500" : "text-white"}`}>
                            {habit.name}
                          </h3>
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                            {habit.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-orange-400 text-xs font-bold flex items-center gap-0.5">
                          <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" /> {habit.streak}d Streak
                        </span>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Habit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Heatmaps visualization */}
        <div className="glass-panel p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-white pb-2 border-b border-white/5 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-violet-400" /> Consistency Maps (42 Days)
          </h2>

          <div className="flex flex-col gap-6">
            {habits.map((habit) => {
              // Count completed days out of 42
              const completedCount = heatmapDays.filter(day => habit.logs[day]).length;
              const completedPct = Math.round((completedCount / 42) * 100);

              return (
                <div key={habit.id} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white truncate max-w-[170px]">{habit.name}</span>
                    <span className="text-[10px] text-cyan-400 font-semibold">{completedPct}% consistency</span>
                  </div>

                  {/* GitHub Heatmap style grid */}
                  <div className="grid grid-cols-7 gap-1 bg-slate-950 p-2.5 rounded-lg border border-white/5">
                    {heatmapDays.map((day) => {
                      const done = !!habit.logs[day];
                      const isToday = day === todayStr;
                      return (
                        <div
                          key={day}
                          className={`heatmap-cell w-full rounded-[3px] border ${
                            done 
                              ? "bg-emerald-500/80 border-emerald-500 shadow-md shadow-emerald-500/10" 
                              : "bg-white/5 border-transparent"
                          } ${isToday ? "border-violet-500" : ""}`}
                          title={`${new Date(day).toLocaleDateString()}: ${done ? "Done" : "Missed"}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-3 bg-violet-950/20 border border-violet-900/30 rounded-xl text-[10px] text-violet-300 leading-normal flex items-start gap-2 mt-auto">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Habit heatmaps update in real-time. Unlocking streaks boosts your productivity levels twice as fast!</span>
          </div>
        </div>

      </div>
    </div>
  );
}
