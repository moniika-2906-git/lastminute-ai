"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { getTasks } from "@/lib/storage";
import { Task } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function CalendarPage() {
  const { user } = useAuth();
  
  // States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Load tasks on mount
  useEffect(() => {
    if (user) {
      getTasks(user.uid).then(list => {
        setTasks(list.filter(t => !t.completed));
        setLoading(false);
      });
    }
  }, [user]);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday

  const prevMonthDays = new Date(year, month, 0).getDate();

  // Create grid days
  const calendarCells = [];

  // Previous month padding cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthDays - i);
    calendarCells.push({
      dateStr: prevDate.toISOString().split("T")[0],
      dayNum: prevMonthDays - i,
      isCurrentMonth: false
    });
  }

  // Current month cells
  for (let i = 1; i <= daysInMonth; i++) {
    const currDate = new Date(year, month, i);
    calendarCells.push({
      dateStr: currDate.toISOString().split("T")[0],
      dayNum: i,
      isCurrentMonth: true
    });
  }

  // Next month padding cells
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    calendarCells.push({
      dateStr: nextDate.toISOString().split("T")[0],
      dayNum: i,
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get tasks matching date
  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(t => t.deadline.split("T")[0] === dateStr);
  };

  // Selected day items
  const selectedDayTasks = tasks.filter(t => t.deadline.split("T")[0] === selectedDay);

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">AI Calendar</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse deadlines monthly. Select days to view impending exams, deliverables, and assignments.
          </p>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Monthly Grid (Col Span 2) */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-5">
          {/* Header Month Navigation */}
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4.5 h-4.5 text-violet-400" /> {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="text-[10px] px-2.5 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white font-bold"
              >
                Today
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Layout header days */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid Cells */}
          {loading ? (
            <div className="text-center text-xs text-slate-500 py-10">Loading Calendar Grid...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                const cellTasks = getTasksForDate(cell.dateStr);
                const isSelected = selectedDay === cell.dateStr;
                const isToday = cell.dateStr === new Date().toISOString().split("T")[0];
                
                // Color dots based on task priorities
                const hasCritical = cellTasks.some(t => t.priority === "critical");
                const hasHigh = cellTasks.some(t => t.priority === "high");
                const hasMedium = cellTasks.some(t => t.priority === "medium");

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(cell.dateStr)}
                    className={`aspect-square p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none ${
                      cell.isCurrentMonth 
                        ? "bg-white/2 hover:bg-white/5 border-white/5 text-white" 
                        : "bg-transparent border-transparent text-slate-650"
                    } ${
                      isSelected 
                        ? "border-violet-500 bg-violet-950/20 shadow-md shadow-violet-500/5 text-violet-300" 
                        : ""
                    } ${
                      isToday && !isSelected
                        ? "border-cyan-500 text-cyan-400" 
                        : ""
                    }`}
                  >
                    <span className="text-[10px] font-bold">{cell.dayNum}</span>
                    
                    {/* Priority markers */}
                    <div className="flex gap-1 justify-center mt-1">
                      {hasCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Critical Deadline" />}
                      {hasHigh && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="High Priority" />}
                      {hasMedium && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" title="Medium Priority" />}
                      {!hasCritical && !hasHigh && !hasMedium && cellTasks.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Day Events Drawer */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white pb-2 border-b border-white/5">
            Deadlines for {new Date(selectedDay).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </h2>

          <div className="flex-1 flex flex-col gap-3">
            {selectedDayTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-slate-500 gap-2">
                <Clock className="w-10 h-10 text-slate-700 mb-1" />
                <p>No deadlines scheduled for this day. You are all set!</p>
              </div>
            ) : (
              selectedDayTasks.map((t) => {
                const dl = new Date(t.deadline);
                return (
                  <div key={t.id} className="p-3 bg-white/2 border border-white/5 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-xs text-white truncate">{t.title}</h3>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        t.priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/25' :
                        t.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/25' :
                        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/25'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/5 pt-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" /> {dl.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>Est: {t.estimatedDuration} hrs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-3 bg-violet-950/20 border border-violet-900/30 rounded-xl text-[10px] text-violet-300 leading-normal flex items-start gap-1.5 mt-auto">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Select days with flashing red dots first; they represent critical AI risk scores that require immediate focus blocks.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
