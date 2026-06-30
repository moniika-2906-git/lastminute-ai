"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";
import { getTasks, getGoals, getHabits, saveNotification } from "@/lib/storage";
import { Task, Goal, Habit, NotificationItem } from "@/types";
import { 
  Sparkles, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Brain, 
  ArrowRight,
  BookOpen,
  Calendar,
  Compass,
  AlertCircle
} from "lucide-react";

export default function DashboardOverview() {
  const { user } = useAuth();
  
  // Dashboard states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [quote, setQuote] = useState({ quote: "Loading inspiration...", author: "Gemini" });
  
  // Morning planner state
  const [morningPlan, setMorningPlan] = useState<any>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      // Fetch tasks, goals, habits
      Promise.all([
        getTasks(user.uid),
        getGoals(user.uid),
        getHabits(user.uid)
      ]).then(([taskList, goalList, habitList]) => {
        setTasks(taskList);
        setGoals(goalList);
        setHabits(habitList);
        
        // Fetch AI morning plan if tasks exist
        if (taskList.length > 0) {
          triggerMorningPlan(taskList, habitList);
        }
      });

      // Fetch motivational quote
      fetch("/api/ai/quote")
        .then(res => res.json())
        .then(data => setQuote(data))
        .catch(err => console.error("Error loading quote:", err));
    }
  }, [user]);

  // Request Gemini morning brief
  const triggerMorningPlan = async (currentTasks: Task[], currentHabits: Habit[]) => {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/plan-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tasks: currentTasks.filter(t => !t.completed), 
          habits: currentHabits 
        }),
      });
      const data = await res.json();
      setMorningPlan(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  // Derive helper metrics
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  // Predict critical tasks
  const urgentTasks = activeTasks
    .filter(t => {
      const diffMs = new Date(t.deadline).getTime() - new Date().getTime();
      return diffMs > 0 && diffMs < 86400000 * 2; // due within 48 hours
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Find next upcoming deadline
  const nextDeadlineTask = activeTasks
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

  // AI suggestions list
  const getAISuggestion = () => {
    if (activeTasks.length === 0) {
      return {
        text: "Your workspace is clear! Use the Task Manager to declare new assignments or exams.",
        badge: "Status Healthy",
        color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/10"
      };
    }

    const highRiskTask = activeTasks.find(t => t.riskAnalysis && t.riskAnalysis.riskScore > 70);
    if (highRiskTask) {
      return {
        text: `CRITICAL ALERT: "${highRiskTask.title}" has a high delay risk (${highRiskTask.riskAnalysis?.riskScore}%). Gemini recommends: ${highRiskTask.riskAnalysis?.suggestions[0] || "Start immediately!"}`,
        badge: "Action Recommended",
        color: "text-rose-400 border-rose-500/20 bg-rose-950/10"
      };
    }

    if (nextDeadlineTask) {
      return {
        text: `Proactive coaching: Your next deadline is "${nextDeadlineTask.title}" in less than ${Math.round((new Date(nextDeadlineTask.deadline).getTime() - new Date().getTime()) / 3600000)} hours. Starting now ensures a calm delivery.`,
        badge: "Coach Insight",
        color: "text-cyan-400 border-cyan-500/20 bg-cyan-950/10"
      };
    }

    return {
      text: "All deadlines are structured. Review your optimized daily schedule to stay ahead.",
      badge: "On Track",
      color: "text-violet-400 border-violet-500/20 bg-violet-950/10"
    };
  };

  const suggestion = getAISuggestion();

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Let's coordinate your efforts and protect your streaks.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-300">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Local Session Time</div>
        </div>
      </div>

      {/* Motivational Quote Widget */}
      <div className="glass-panel p-5 relative overflow-hidden bg-gradient-to-r from-violet-950/20 to-slate-900/40 border-l-4 border-l-violet-500">
        <div className="absolute top-2 right-4 text-violet-500/30">
          <Brain className="w-12 h-12" />
        </div>
        <p className="text-sm italic text-slate-200 pr-10">"{quote.quote}"</p>
        <div className="text-xs text-slate-400 mt-2 font-semibold">— {quote.author} (via Gemini)</div>
      </div>

      {/* AI Proactive Suggestion Warning Card */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${suggestion.color}`}>
        <div className="flex gap-2.5 items-start">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">{suggestion.badge}</span>
            <p className="text-xs md:text-sm font-medium leading-relaxed">{suggestion.text}</p>
          </div>
        </div>
        <Link 
          href="/dashboard/tasks" 
          className="shrink-0 text-xs font-bold px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-1 text-white transition-colors"
        >
          Manage Tasks <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick Metrics & Gages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1: Completion Circular Indicator */}
        <div className="glass-panel p-5 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completion %</span>
            <div className="text-2xl font-bold text-white">{completionPercentage}%</div>
            <span className="text-[10px] text-slate-500">{completedTasks.length} of {totalTasks} finished</span>
          </div>
          {/* SVG Circular Progress */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-95" viewBox="0 0 36 36">
              <path
                className="text-white/5"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-violet-500 transition-all duration-500"
                strokeWidth="3.5"
                strokeDasharray={`${completionPercentage}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-violet-300">
              {completionPercentage}%
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Focus */}
        <div className="glass-panel p-5 flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Today's Focus</span>
          <div className="text-xl font-bold text-cyan-400 truncate mt-1">
            {nextDeadlineTask ? nextDeadlineTask.title : "None Scheduled"}
          </div>
          <span className="text-[10px] text-slate-500">
            {nextDeadlineTask ? `Est. time: ${nextDeadlineTask.estimatedDuration} hrs` : "No pending items"}
          </span>
        </div>

        {/* Metric 3: Active Goals */}
        <div className="glass-panel p-5 flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Goals</span>
          <div className="text-xl font-bold text-violet-400 mt-1">
            {goals.length} Goals
          </div>
          <span className="text-[10px] text-slate-500">
            {goals.filter(g => g.completed).length} completed milestones
          </span>
        </div>

        {/* Metric 4: Streak and level */}
        <div className="glass-panel p-5 flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Productivity Level</span>
          <div className="text-xl font-bold text-rose-400 mt-1 flex items-center gap-1.5">
            Lvl {user?.level} <span className="text-xs text-slate-400">({user?.xp} XP)</span>
          </div>
          <span className="text-[10px] text-slate-500">
            🔥 {user?.streak}-day consistency streak
          </span>
        </div>
      </div>

      {/* Main Grid: AI Morning Plan vs Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: AI Morning Plan & Strategic Tips */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" /> Proactive AI Daily Strategy
            </h2>
            {loadingAI && <span className="text-xs text-violet-400 animate-pulse font-bold">Gemini is planning...</span>}
          </div>

          {activeTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <BookOpen className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 max-w-sm">
                No active tasks to outline. Add your classes, projects, or bill payments in the task manager to receive tailored study strategies.
              </p>
            </div>
          ) : morningPlan ? (
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Action Plan Brief</span>
                <p className="text-xs text-slate-300 mt-1 bg-slate-950/40 p-3 rounded-lg border border-white/5 leading-relaxed">
                  {morningPlan.todayActionPlan}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Top 3 Priorities</span>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {morningPlan.topPriorities.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                        <span className="w-5 h-5 rounded-full bg-violet-950 border border-violet-900/50 flex items-center justify-center text-[10px] text-violet-400 font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Break Schedule</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {morningPlan.suggestedBreaks}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-bold text-cyan-400">AI Daily Study Strategy</span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {morningPlan.studyStrategy}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Daily Hacks</span>
                <ul className="flex flex-col gap-1.5 mt-1.5">
                  {morningPlan.tips.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="text-cyan-400 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
              <p className="text-xs text-slate-400 text-center">
                Click below to request Gemini to compile today's morning action brief.
              </p>
              <button
                onClick={() => triggerMorningPlan(tasks, habits)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                Compile Plan
              </button>
            </div>
          )}
        </div>

        {/* Column 3: Analytics Chart Wrapper */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-white pb-2 border-b border-white/5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" /> Focus Analytics
          </h2>
          
          <div className="flex-1 flex flex-col justify-between min-h-[220px]">
            {/* SVG Visualizing custom Weekly analytics bars */}
            <div className="relative h-44 w-full flex items-end justify-between px-2 pt-4">
              {/* Background grids */}
              <div className="absolute inset-x-0 bottom-0 top-4 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-white/5 w-full h-0" />
                <div className="border-b border-white/5 w-full h-0" />
                <div className="border-b border-white/5 w-full h-0" />
                <div className="border-b border-white/5 w-full h-0" />
              </div>

              {/* Data Columns */}
              {[
                { label: "Mon", tasks: 2, height: "30%" },
                { label: "Tue", tasks: 4, height: "60%" },
                { label: "Wed", tasks: 1, height: "15%" },
                { label: "Thu", tasks: 5, height: "80%" },
                { label: "Fri", tasks: 3, height: "45%" },
                { label: "Sat", tasks: 6, height: "95%" },
                { label: "Sun", tasks: 0, height: "5%" }
              ].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 z-10 w-8">
                  <div className="w-full bg-white/5 rounded-t-md relative group hover:bg-white/10 transition-colors" style={{ height: "120px" }}>
                    <div 
                      className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-violet-600 to-cyan-400 rounded-t-md transition-all duration-1000 origin-bottom" 
                      style={{ height: day.height }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shrink-0 text-white whitespace-nowrap">
                      {day.tasks} tasks
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{day.label}</span>
                </div>
              ))}
            </div>
            
            <div className="text-center text-xs text-slate-400 border-t border-white/5 pt-3">
              Weekly progress trends: <strong className="text-white">21 tasks completed</strong> (+15% vs last week)
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row: Upcoming Urgent Tasks */}
      <div className="glass-panel p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> Upcoming Urgent Deadlines
          </h2>
          <Link href="/dashboard/tasks" className="text-xs text-violet-400 hover:text-violet-300 font-bold flex items-center gap-0.5">
            View All Tasks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {urgentTasks.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-6">
            No critical deadlines in the next 48 hours. Excellent buffer space!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgentTasks.slice(0, 3).map((task) => {
              const diffMs = new Date(task.deadline).getTime() - new Date().getTime();
              const diffHours = Math.round(diffMs / 3600000);
              return (
                <div key={task.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl" />
                  
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                      {task.title}
                    </h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold uppercase shrink-0">
                      {task.priority}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {task.description || "No description provided."}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/5 pt-2 mt-1">
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <Clock className="w-3.5 h-3.5" /> Due in {diffHours} hrs
                    </span>
                    <span>Est: {task.estimatedDuration} hrs</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
