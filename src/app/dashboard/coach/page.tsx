"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { getTasks, getGoals } from "@/lib/storage";
import { Task, Goal, Message } from "@/types";
import { 
  Sparkles, 
  MessageSquare, 
  Send, 
  Brain, 
  Award,
  ChevronRight,
  TrendingUp,
  Smile,
  Compass
} from "lucide-react";

export default function CoachPage() {
  const { user } = useAuth();
  
  // Context states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  // Chat thread states
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hello! I am your AI Productivity Coach. I've reviewed your current task backlog and goal trackers. What are we tackling first? You can ask me to help prioritize, plan your evening, or break down a stressful assignment.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load active tasks & goals on mount
  useEffect(() => {
    if (user) {
      Promise.all([
        getTasks(user.uid),
        getGoals(user.uid)
      ]).then(([taskList, goalList]) => {
        setTasks(taskList.filter(t => !t.completed));
        setGoals(goalList.filter(g => !g.completed));
        setLoadingContext(false);
      });
    }
  }, [user]);

  // Scroll to bottom of message logs
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Submit chat turn
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || sending) return;
    
    setInputMsg("");
    setSending(true);

    const userMessage: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Map history for Gemini API routes
      const history = [...messages, userMessage].map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'model' as const,
        text: m.text
      }));

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          activeTasks: tasks,
          activeGoals: goals
        })
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        sender: "ai",
        text: data.reply,
        timestamp: new Date().toISOString()
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        sender: "ai",
        text: "My apologies, I ran into a connection timeout trying to analyze your schedule. What was that task again?",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Quick questions shortcut list
  const shortcuts = [
    "What should I do now?",
    "Can I finish everything today?",
    "Plan my evening strategy.",
    "Help me reduce stress."
  ];

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">AI Productivity Coach</h1>
        <p className="text-xs text-slate-400 mt-1">
          Chat with Gemini about your backlog, goals, and study strategies.
        </p>
      </div>

      {/* Main split grid layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Left Column: Chat log stream (Col Span 3) */}
        <div className="lg:col-span-3 glass-panel p-4 flex flex-col min-h-0 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Messages box */}
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 mb-4">
            {messages.map((m, idx) => {
              const isAi = m.sender === "ai";
              return (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] ${isAi ? "self-start" : "self-end flex-row-reverse"}`}
                >
                  {isAi && (
                    <div className="w-8 h-8 rounded-full bg-violet-950 border border-violet-900/50 flex items-center justify-center text-violet-400 shrink-0 shadow-lg">
                      <Brain className="w-4.5 h-4.5 animate-pulse" />
                    </div>
                  )}
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    isAi 
                      ? "bg-slate-900/60 border-white/5 text-slate-200 rounded-tl-sm" 
                      : "bg-violet-600/20 border-violet-500/30 text-white rounded-tr-sm"
                  }`}>
                    {/* Preserve markdown structure */}
                    <div className="whitespace-pre-line font-medium">{m.text}</div>
                    <span className="text-[8px] text-slate-500 block mt-1.5 text-right font-normal">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex gap-3 max-w-[80%] self-start">
                <div className="w-8 h-8 rounded-full bg-violet-950 border border-violet-900/50 flex items-center justify-center text-violet-400 shrink-0">
                  <Brain className="w-4.5 h-4.5 animate-bounce" />
                </div>
                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl rounded-tl-sm text-xs text-slate-500 italic">
                  Coach is reviewing your task progress...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Shortcuts pills list */}
          <div className="flex flex-wrap gap-2 mb-3">
            {shortcuts.map((text, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(text)}
                disabled={sending}
                className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors disabled:opacity-40"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Input messaging container */}
          <div className="flex gap-2 border-t border-white/5 pt-3">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Ask your coach anything..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={sending || !inputMsg.trim()}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Coach Context Sidebar (Col Span 1) */}
        <div className="hidden lg:flex flex-col gap-4 glass-panel p-4 overflow-y-auto">
          <div className="pb-2 border-b border-white/5">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" /> Active Review Context
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Context currently loaded into coach memories.</p>
          </div>

          {loadingContext ? (
            <div className="text-center text-xs text-slate-500 py-6">Syncing Coach memories...</div>
          ) : (
            <div className="flex flex-col gap-4 text-xs">
              {/* Active tasks */}
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Active Backlog ({tasks.length})</span>
                <div className="flex flex-col gap-2 mt-2">
                  {tasks.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">No active tasks.</span>
                  ) : (
                    tasks.map(t => (
                      <div key={t.id} className="p-2 bg-white/2 border border-white/5 rounded-lg flex flex-col gap-1">
                        <div className="font-bold text-[11px] text-white truncate">{t.title}</div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold uppercase">
                          <span>{t.priority}</span>
                          <span>Est: {t.estimatedDuration} hrs</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Goals */}
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Active Goals ({goals.length})</span>
                <div className="flex flex-col gap-2 mt-2">
                  {goals.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">No active goals.</span>
                  ) : (
                    goals.map(g => (
                      <div key={g.id} className="p-2 bg-white/2 border border-white/5 rounded-lg flex flex-col gap-1">
                        <div className="font-bold text-[11px] text-white truncate">{g.title}</div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold">
                          <span>Progress: {g.currentValue} / {g.targetValue}</span>
                          <span>{g.unit}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3 bg-violet-950/20 border border-violet-900/30 rounded-xl text-[10px] text-violet-300 leading-normal">
                💡 **Proactive Tip:** Let your coach know if you are stuck or experiencing test anxiety. It can propose stress-relief pacing methods!
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
