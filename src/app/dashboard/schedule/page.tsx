"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { getTasks, getSchedule, saveSchedule } from "@/lib/storage";
import { Task, DailySchedule, TimeBlock } from "@/types";
import { 
  Sparkles, 
  Clock, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Calendar,
  Save,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export default function SchedulePage() {
  const { user } = useAuth();
  
  // States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<DailySchedule | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Edit blocks state
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("09:00");
  const [editEnd, setEditEnd] = useState("10:30");
  const [editColor, setEditColor] = useState("violet");

  // Load tasks and schedule on date change
  useEffect(() => {
    if (user) {
      setLoadingTasks(true);
      Promise.all([
        getTasks(user.uid),
        getSchedule(user.uid, selectedDate)
      ]).then(([taskList, activeSchedule]) => {
        setTasks(taskList.filter(t => !t.completed));
        
        if (activeSchedule) {
          setSchedule(activeSchedule);
        } else {
          // Initialize empty schedule
          const emptySched: DailySchedule = {
            id: `${user.uid}_${selectedDate}`,
            userId: user.uid,
            date: selectedDate,
            timeBlocks: [
              { id: "b_break_1", taskId: null, title: "Morning Pacing Break", startTime: "10:30", endTime: "10:45", color: "emerald" },
              { id: "b_lunch", taskId: null, title: "Lunch Break & Relax", startTime: "12:00", endTime: "13:00", color: "emerald" }
            ]
          };
          setSchedule(emptySched);
          saveSchedule(emptySched);
        }
        setLoadingTasks(false);
      });
    }
  }, [user, selectedDate]);

  // Request Gemini schedule optimization
  const handleOptimizeSchedule = async () => {
    if (!schedule || tasks.length === 0) {
      alert("Please add active tasks in the Smart Task Backlog first!");
      return;
    }
    setOptimizing(true);
    try {
      const res = await fetch("/api/ai/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tasks, 
          date: selectedDate 
        }),
      });
      const data = await res.json();
      
      const updatedSchedule = {
        ...schedule,
        timeBlocks: data.timeBlocks
      };
      setSchedule(updatedSchedule);
      await saveSchedule(updatedSchedule);
    } catch (e) {
      console.error(e);
      alert("Failed to optimize schedule with Gemini.");
    } finally {
      setOptimizing(false);
    }
  };

  // Add Custom block
  const handleAddCustomBlock = async () => {
    if (!schedule) return;
    const newBlock: TimeBlock = {
      id: `block_${Date.now()}`,
      taskId: null,
      title: "New Block",
      startTime: "14:00",
      endTime: "15:00",
      color: "slate"
    };
    
    const updated = {
      ...schedule,
      timeBlocks: [...schedule.timeBlocks, newBlock].sort((a, b) => a.startTime.localeCompare(b.startTime))
    };
    setSchedule(updated);
    await saveSchedule(updated);
  };

  // Delete Block
  const handleDeleteBlock = async (blockId: string) => {
    if (!schedule) return;
    const updated = {
      ...schedule,
      timeBlocks: schedule.timeBlocks.filter(b => b.id !== blockId)
    };
    setSchedule(updated);
    await saveSchedule(updated);
  };

  // Move block (simulate drag shift)
  const shiftBlock = async (blockIdx: number, direction: 'up' | 'down') => {
    if (!schedule) return;
    const blocks = [...schedule.timeBlocks];
    if (direction === 'up' && blockIdx > 0) {
      const temp = blocks[blockIdx];
      blocks[blockIdx] = blocks[blockIdx - 1];
      blocks[blockIdx - 1] = temp;
    } else if (direction === 'down' && blockIdx < blocks.length - 1) {
      const temp = blocks[blockIdx];
      blocks[blockIdx] = blocks[blockIdx + 1];
      blocks[blockIdx + 1] = temp;
    }

    // Auto update start/end times incrementally based on new index positions
    const updatedBlocks = blocks.map((block, i) => {
      const baseHour = 8 + i * 2;
      return {
        ...block,
        startTime: `${String(baseHour).padStart(2, "0")}:00`,
        endTime: `${String(baseHour + 1).padStart(2, "0")}:30`
      };
    });

    const updated = {
      ...schedule,
      timeBlocks: updatedBlocks
    };
    setSchedule(updated);
    await saveSchedule(updated);
  };

  // Save Block Changes
  const handleSaveBlockEdit = async () => {
    if (!schedule || !editingBlock) return;
    const updatedBlocks = schedule.timeBlocks.map(b => {
      if (b.id === editingBlock) {
        return {
          ...b,
          title: editTitle,
          startTime: editStart,
          endTime: editEnd,
          color: editColor
        };
      }
      return b;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const updated = {
      ...schedule,
      timeBlocks: updatedBlocks
    };
    setSchedule(updated);
    await saveSchedule(updated);
    setEditingBlock(null);
  };

  // Open block editor modal
  const openBlockEditor = (block: TimeBlock) => {
    setEditingBlock(block.id);
    setEditTitle(block.title);
    setEditStart(block.startTime);
    setEditEnd(block.endTime);
    setEditColor(block.color);
  };

  const colors: { [key: string]: string } = {
    rose: "bg-rose-500/20 border-rose-500/30 text-rose-300",
    violet: "bg-violet-500/20 border-violet-500/30 text-violet-300",
    cyan: "bg-cyan-500/20 border-cyan-500/30 text-cyan-300",
    emerald: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
    amber: "bg-amber-500/20 border-amber-500/30 text-amber-300",
    slate: "bg-slate-500/20 border-slate-500/30 text-slate-300",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">AI Daily Scheduler</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build your hourly agenda. Click blocks to modify, and use Gemini to structure study pacing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
          />
          <button
            onClick={handleOptimizeSchedule}
            disabled={optimizing || tasks.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:from-violet-850 disabled:to-cyan-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {optimizing ? "Optimizing..." : "Gemini Optimize"}
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Hour Blocks Grid */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-violet-400" /> Agenda for {selectedDate}
            </h2>
            <button
              onClick={handleAddCustomBlock}
              className="text-[10px] px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-bold text-slate-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Block
            </button>
          </div>

          {loadingTasks ? (
            <div className="text-center text-xs text-slate-500 py-10">Syncing Schedule Blocks...</div>
          ) : !schedule || schedule.timeBlocks.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-10">No items scheduled. Try Gemini Optimize!</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {schedule.timeBlocks.map((block, idx) => {
                const colorClass = colors[block.color] || colors.slate;
                return (
                  <div 
                    key={block.id} 
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:bg-white/2 cursor-pointer ${colorClass}`}
                    onClick={() => openBlockEditor(block)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-white/5 min-w-[70px]">
                        <span className="text-[10px] font-bold text-white">{block.startTime}</span>
                        <span className="text-[8px] text-slate-400 font-medium">to {block.endTime}</span>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white leading-snug">{block.title}</h3>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                          {block.taskId ? "Linked Task" : "Personal Pacing"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Drag Shift Simulators */}
                      <button 
                        onClick={() => shiftBlock(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-white/10 text-slate-400 disabled:opacity-30 rounded"
                        title="Shift Block Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => shiftBlock(idx, 'down')}
                        disabled={idx === schedule.timeBlocks.length - 1}
                        className="p-1 hover:bg-white/10 text-slate-400 disabled:opacity-30 rounded"
                        title="Shift Block Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBlock(block.id)}
                        className="p-1 hover:bg-white/10 text-rose-400 rounded ml-1"
                        title="Delete Block"
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

        {/* Sidebar Block Editor Modals/Details */}
        <div className="glass-panel p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-white pb-2 border-b border-white/5">
            Block Properties
          </h2>

          {editingBlock ? (
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase text-[9px]">Block Name / Focus</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase text-[9px]">Start Time</label>
                  <input
                    type="time"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase text-[9px]">End Time</label>
                  <input
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase text-[9px]">Indicator Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {Object.keys(colors).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`h-6 rounded border transition-all ${
                        editColor === c 
                          ? "border-white scale-110 shadow-lg" 
                          : "border-transparent"
                      } ${
                        c === 'rose' ? 'bg-rose-500' :
                        c === 'violet' ? 'bg-violet-500' :
                        c === 'cyan' ? 'bg-cyan-500' :
                        c === 'emerald' ? 'bg-emerald-500' :
                        c === 'amber' ? 'bg-amber-500' : 'bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => setEditingBlock(null)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBlockEdit}
                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-slate-500 gap-2">
              <Clock className="w-10 h-10 text-slate-700 mb-1" />
              <p>Select any schedule item in the agenda to edit its duration details, change labels, or shift focus colors.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
