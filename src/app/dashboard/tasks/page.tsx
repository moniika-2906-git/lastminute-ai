"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { getTasks, saveTask, deleteTask, saveNotification } from "@/lib/storage";
import { Task, SubTask, NotificationItem } from "@/types";
import { 
  Sparkles, 
  Clock, 
  Trash2, 
  CheckSquare, 
  Mic, 
  MicOff, 
  Volume2, 
  Plus, 
  Calendar,
  AlertTriangle,
  PlayCircle,
  PlusCircle,
  Layers,
  ChevronDown,
  CheckCircle,
  HelpCircle,
  FolderOpen
} from "lucide-react";

export default function TasksPage() {
  const { user, updateXP } = useAuth();
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiPrioritizing, setAiPrioritizing] = useState(false);

  // Form states
  const [smartInput, setSmartInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  
  // Expanded task ID for subtasks view
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Manual creation states toggle
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState<'Work' | 'Study' | 'Personal' | 'Fitness' | 'Bills' | 'Other'>('Study');
  const [manualPriority, setManualPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [manualDeadline, setManualDeadline] = useState("");
  const [manualDuration, setManualDuration] = useState("1.5");

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  // Load tasks on mount
  useEffect(() => {
    if (user) {
      getTasks(user.uid).then((list) => {
        setTasks(list);
        setLoading(false);
      });
    }
  }, [user]);

  // Configure speech recognition hook
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";
        
        rec.onstart = () => {
          setIsRecording(true);
        };
        
        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setSmartInput(text);
          speakText(`I heard: ${text}. Parsing task details now...`);
          // Automatically trigger parsing
          triggerSmartParse(text);
        };
        
        rec.onerror = (e: any) => {
          console.error("Speech Recognition Error:", e);
          setIsRecording(false);
          speakText("Sorry, I could not capture your voice. Please try typing instead.");
        };
        
        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Cancel any existing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge or Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Call API to parse natural language task
  const triggerSmartParse = async (inputText: string) => {
    if (!inputText.trim()) return;
    setAiParsing(true);
    try {
      const res = await fetch("/api/ai/smart-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: inputText, 
          currentTime: new Date().toISOString() 
        }),
      });
      const parsedTask = await res.json();
      
      // Calculate risk and final priority with Gemini
      setAiPrioritizing(true);
      const riskRes = await fetch("/api/ai/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsedTask.title,
          deadline: parsedTask.deadline,
          estimatedDuration: parsedTask.estimatedDuration,
          pendingCount: tasks.filter(t => !t.completed).length
        })
      });
      const riskAnalysis = await riskRes.json();
      setAiPrioritizing(false);

      if (!user) return;

      const newTask: Task = {
        id: `task_${Date.now()}`,
        userId: user.uid,
        title: parsedTask.title,
        description: `Smart extracted from: "${inputText}"`,
        category: parsedTask.category || "Study",
        priority: riskAnalysis.priority || parsedTask.priority || "medium",
        difficulty: parsedTask.difficulty || "medium",
        deadline: parsedTask.deadline,
        estimatedDuration: parsedTask.estimatedDuration || 1,
        subtasks: parsedTask.subtasks || [],
        completed: false,
        completedAt: null,
        suggestedSchedule: parsedTask.suggestedSchedule || "10:00 - 11:30",
        createdAt: new Date().toISOString(),
        riskAnalysis: {
          riskScore: riskAnalysis.riskScore,
          warningText: riskAnalysis.warningText,
          suggestions: riskAnalysis.suggestions
        }
      };

      await saveTask(newTask);
      setTasks(prev => [newTask, ...prev]);
      setSmartInput("");
      
      // Confirm with speech synthesis
      speakText(`Created task: ${newTask.title}. Category: ${newTask.category}. Priority set to ${newTask.priority}. Due on ${new Date(newTask.deadline).toLocaleDateString()}.`);
      
      // Add standard notification if risk is high
      if (newTask.riskAnalysis && newTask.riskAnalysis.riskScore > 65) {
        const notif: NotificationItem = {
          id: `notif_${Date.now()}`,
          userId: user.uid,
          message: `HIGH RISK: "${newTask.title}" is due soon. Gemini advises: ${newTask.riskAnalysis.suggestions[0]}`,
          type: "critical",
          sentAt: new Date().toISOString(),
          read: false
        };
        await saveNotification(notif);
      }

    } catch (e) {
      console.error(e);
      alert("Error parsing smart task. Please check details or write manually.");
    } finally {
      setAiParsing(false);
      setAiPrioritizing(false);
    }
  };

  const handleSmartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSmartParse(smartInput);
  };

  // Add Task manually
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualDeadline) return;
    setLoading(true);

    try {
      if (!user) return;
      
      // Get AI prioritization feedback
      const riskRes = await fetch("/api/ai/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          deadline: new Date(manualDeadline).toISOString(),
          estimatedDuration: parseFloat(manualDuration),
          pendingCount: tasks.filter(t => !t.completed).length
        })
      });
      const riskAnalysis = await riskRes.json();

      const newTask: Task = {
        id: `task_${Date.now()}`,
        userId: user.uid,
        title: manualTitle,
        description: "Manually entered task.",
        category: manualCategory,
        priority: riskAnalysis.priority || manualPriority,
        difficulty: "medium",
        deadline: new Date(manualDeadline).toISOString(),
        estimatedDuration: parseFloat(manualDuration),
        subtasks: [
          { title: "Understand requirements", completed: false },
          { title: "Execute final checklist", completed: false }
        ],
        completed: false,
        completedAt: null,
        suggestedSchedule: "09:00 - 10:30",
        createdAt: new Date().toISOString(),
        riskAnalysis: {
          riskScore: riskAnalysis.riskScore,
          warningText: riskAnalysis.warningText,
          suggestions: riskAnalysis.suggestions
        }
      };

      await saveTask(newTask);
      setTasks(prev => [newTask, ...prev]);
      
      // Reset manual fields
      setManualTitle("");
      setManualDeadline("");
      setManualDuration("1.5");
      setShowManualForm(false);

      speakText(`Successfully added ${newTask.title} to your task backlog.`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Subtask Completion
  const toggleSubtask = async (taskId: string, subtaskIdx: number) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const subtasks = [...t.subtasks];
        subtasks[subtaskIdx] = {
          ...subtasks[subtaskIdx],
          completed: !subtasks[subtaskIdx].completed
        };
        const allCompleted = subtasks.length > 0 && subtasks.every(s => s.completed);
        
        const taskObj = {
          ...t,
          subtasks,
          // Auto-mark parent as completed if all subtasks are finished!
          completed: allCompleted ? true : t.completed,
          completedAt: allCompleted ? new Date().toISOString() : t.completedAt
        };

        // If completed, award XP
        if (allCompleted && !t.completed) {
          const xp = t.priority === "critical" ? 50 : t.priority === "high" ? 40 : 30;
          updateXP(xp);
          speakText(`Boom! Subtasks complete. Task "${t.title}" checked off. Earned ${xp} XP!`);
        }

        saveTask(taskObj);
        return taskObj;
      }
      return t;
    });
    setTasks(updated);
  };

  // Toggle main Task completion
  const toggleTaskComplete = async (task: Task) => {
    const isNowCompleted = !task.completed;
    const taskObj = {
      ...task,
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : null,
      subtasks: task.subtasks.map(s => ({ ...s, completed: isNowCompleted })) // check off all subtasks
    };

    const updated = tasks.map(t => t.id === task.id ? taskObj : t);
    setTasks(updated);
    await saveTask(taskObj);

    if (isNowCompleted) {
      const xp = task.priority === "critical" ? 50 : task.priority === "high" ? 40 : 30;
      updateXP(xp);
      speakText(`Task completed! Earned ${xp} XP!`);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'all') return true;
    return t.priority === activeTab;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Smart Task Backlog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Dictate, parse, and evaluate deadlines dynamically with Google Gemini.
          </p>
        </div>
      </div>

      {/* AI Smart Voice/NLP Creation Grid */}
      <div className="glass-panel p-5 relative overflow-hidden bg-slate-900/40">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
        
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" /> Create Task via Voice or Text
        </h2>

        <form onSubmit={handleSmartSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder='e.g., "I have a Java programming project due this Friday at midnight, taking about 4 hours"'
              disabled={aiParsing}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
            
            {/* Speech Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`px-3.5 py-3 rounded-xl border flex items-center justify-center transition-all ${
                isRecording 
                  ? "bg-rose-600 text-white border-rose-500 animate-pulse scale-105" 
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-slate-500 italic">
              Speak naturally. Gemini will identify subtasks, difficulty, deadlines, and schedule ranges.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline font-semibold"
              >
                Or Enter Manually
              </button>
              <button
                type="submit"
                disabled={aiParsing || !smartInput.trim()}
                className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/10"
              >
                {aiParsing ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    {aiPrioritizing ? "Evaluating Priority..." : "AI Parsing..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Smart Create
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Manual Input Panel Drawer */}
        {showManualForm && (
          <form onSubmit={handleManualSubmit} className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Task Name</label>
              <input
                type="text"
                required
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Calculus Revision"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Category</label>
              <select
                value={manualCategory}
                onChange={(e: any) => setManualCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="Study">Study</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Fitness">Fitness</option>
                <option value="Bills">Bills</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Priority</label>
              <select
                value={manualPriority}
                onChange={(e: any) => setManualPriority(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Deadline Date & Time</label>
              <input
                type="datetime-local"
                required
                value={manualDeadline}
                onChange={(e) => setManualDeadline(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[9px]">Est. Effort (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors text-xs"
              >
                Confirm Add
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Task Filters (Priority Tabs) */}
      <div className="flex border-b border-white/5 gap-4 overflow-x-auto pb-1 text-xs">
        {['all', 'critical', 'high', 'medium', 'low'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2.5 px-2 font-bold uppercase transition-all tracking-wider relative ${
              activeTab === tab ? "text-violet-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-violet-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tasks List rendering */}
      {loading ? (
        <div className="text-center text-xs text-slate-500 py-10">Loading Backlog...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel p-10 text-center flex flex-col items-center justify-center gap-2">
          <FolderOpen className="w-12 h-12 text-slate-600 mb-1" />
          <h3 className="text-sm font-bold text-white">No tasks matching filters</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Add tasks by typing above or speak using the microphone.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTasks.map((task) => {
            const isCritical = task.priority === "critical";
            const isHigh = task.priority === "high";
            const isMedium = task.priority === "medium";
            
            // Format deadline date
            const dl = new Date(task.deadline);
            const formattedDl = dl.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            const risk = task.riskAnalysis;
            
            return (
              <div 
                key={task.id} 
                className={`glass-panel p-5 flex flex-col gap-4 transition-all hover:translate-x-1 ${
                  task.completed ? "opacity-60 border-white/5" : "border-l-4 " + (
                    isCritical ? "border-l-rose-500" :
                    isHigh ? "border-l-amber-500" :
                    isMedium ? "border-l-cyan-500" : "border-l-slate-500"
                  )
                }`}
              >
                {/* Top task row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => toggleTaskComplete(task)}
                      className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                        task.completed 
                          ? "bg-violet-600 border-violet-500 text-white" 
                          : "border-white/20 hover:border-violet-400"
                      }`}
                    >
                      {task.completed && <CheckSquare className="w-4.5 h-4.5" />}
                    </button>
                    <div>
                      <h3 className={`text-sm font-bold text-white ${task.completed ? "line-through text-slate-500" : ""}`}>
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 uppercase">
                          {task.category}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          isCritical ? "bg-rose-500/20 text-rose-400 border border-rose-500/20" :
                          isHigh ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" :
                          isMedium ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/20" : "bg-white/5 text-slate-400"
                        }`}>
                          {task.priority} Priority
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Due: {formattedDl}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      className="p-1 text-slate-500 hover:text-slate-300"
                      title="Expand Subtasks"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedTask === task.id ? "rotate-180" : ""}`} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Risk Predictor Warnings Display */}
                {!task.completed && risk && (
                  <div className={`p-3 text-xs rounded-lg border leading-relaxed flex flex-col gap-2 ${
                    risk.riskScore > 65 
                      ? "bg-rose-950/15 border-rose-900/30 text-rose-300" 
                      : "bg-slate-900/40 border-white/5 text-slate-300"
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Delay Risk: {risk.riskScore}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wider">AI Insight</span>
                    </div>
                    <p>{risk.warningText}</p>
                    {risk.suggestions && risk.suggestions.length > 0 && (
                      <div className="flex flex-col gap-1 border-t border-white/5 pt-2 mt-1.5">
                        <span className="font-bold text-[10px] uppercase text-slate-400">Gemini Strategy:</span>
                        {risk.suggestions.map((s, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-300 leading-normal pl-1">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Subtask Nested checklists Drawer */}
                {expandedTask === task.id && (
                  <div className="pl-8 pr-4 py-3 bg-slate-950/50 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                      <span className="font-bold text-xs text-slate-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Subtask Checklists
                      </span>
                    </div>
                    
                    {task.subtasks && task.subtasks.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {task.subtasks.map((sub, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => toggleSubtask(task.id, idx)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                sub.completed 
                                  ? "bg-violet-600/40 border-violet-500 text-violet-300" 
                                  : "border-white/20 hover:border-violet-500"
                              }`}
                            >
                              {sub.completed && <span className="w-2 h-2 bg-violet-400 rounded-full" />}
                            </button>
                            <span className={`text-slate-300 ${sub.completed ? "line-through text-slate-500" : ""}`}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">No subtasks found for this task.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
