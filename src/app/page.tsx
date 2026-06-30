"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Clock, 
  Brain, 
  Calendar, 
  Mic, 
  TrendingUp, 
  Award, 
  ChevronDown, 
  CheckCircle,
  ArrowRight,
  Shield,
  Smile
} from "lucide-react";

export default function LandingPage() {
  const [demoInput, setDemoInput] = useState("Complete Java project by tomorrow 5 PM, takes 3 hours");
  const [demoResult, setDemoResult] = useState<any>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    setLoadingDemo(true);
    try {
      const res = await fetch("/api/ai/smart-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: demoInput, currentTime: new Date().toISOString() }),
      });
      const data = await res.json();
      setDemoResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const faqs = [
    {
      q: "How does the AI predict if I will miss a deadline?",
      a: "Our AI engine analyzes the estimated duration, proximity of the deadline, and your current pending tasks. It then calculates a Risk Score (0-100%) and warns you proactively to start work or reschedule low-priority tasks."
    },
    {
      q: "Can I use voice commands to add tasks?",
      a: "Yes! LastMinute AI has an integrated Voice Assistant. You can speak naturally, and the app will transcribe your words, extract task parameters using Gemini, and read back the confirmation using Text-to-Speech."
    },
    {
      q: "How is this different from Google Calendar or Todoist?",
      a: "Standard calendars are passive. LastMinute AI is active. It acts as a productivity coach, builds an optimized daily schedule for you, and reminds you dynamically based on how long a task actually takes."
    },
    {
      q: "Is it really free?",
      a: "Yes! LastMinute AI is currently 100% free and open for public use. We want to help students, developers, and professionals manage their deadlines stress-free."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-white">LastMinute <span className="text-cyan-400">AI</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">AI Demo</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Log In
          </Link>
          <Link href="/login?mode=signup" className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all shadow-lg shadow-violet-600/30">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6 md:px-12 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-violet-300 mb-6 backdrop-blur-sm">
            <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
            <span>Meet your proactive AI productivity coach</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Never Miss a Deadline. <br />
            <span className="gradient-text">Conquer Procrastination.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Unlike ordinary reminder apps, LastMinute AI actively guides you to complete tasks. It calculates risk, structures daily schedules, and talks you through high-stress assignments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
              Start Scaling Your Productivity <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              Try Live Demo
            </a>
          </div>
        </motion.div>

        {/* Hero Visual Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.3 }}
          className="w-full max-w-5xl mt-16 md:mt-24 glass-panel p-2 md:p-4 rounded-2xl relative"
        >
          <div className="rounded-xl overflow-hidden bg-slate-900 border border-white/5 aspect-[16/9] shadow-2xl flex flex-col">
            {/* Window bar */}
            <div className="bg-slate-950/60 px-4 py-3 border-b border-white/5 flex justify-between items-center">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="text-xs text-slate-500">app.lastminute.ai/dashboard</div>
              <div className="w-12" />
            </div>

            {/* Content Mockup */}
            <div className="flex-1 bg-slate-950 p-4 md:p-6 text-left grid grid-cols-12 gap-6">
              {/* Left sidebar mockup */}
              <div className="col-span-3 hidden md:flex flex-col gap-3 border-r border-white/5 pr-4">
                <div className="h-8 bg-white/5 rounded-md flex items-center px-3 text-xs text-white gap-2 font-semibold">
                  <Brain className="w-4 h-4 text-violet-400" /> Dashboard
                </div>
                <div className="h-8 hover:bg-white/5 rounded-md flex items-center px-3 text-xs text-slate-400 gap-2">
                  <Clock className="w-4 h-4" /> Daily Schedule
                </div>
                <div className="h-8 hover:bg-white/5 rounded-md flex items-center px-3 text-xs text-slate-400 gap-2">
                  <Calendar className="w-4 h-4" /> Calendar
                </div>
                <div className="h-8 hover:bg-white/5 rounded-md flex items-center px-3 text-xs text-slate-400 gap-2">
                  <Award className="w-4 h-4" /> Badges & XP
                </div>
                <div className="mt-auto p-3 rounded-lg bg-violet-950/30 border border-violet-900/30">
                  <div className="text-[10px] text-violet-400 font-bold uppercase mb-1">XP Level 4</div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 w-3/4" />
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">350 / 400 XP</div>
                </div>
              </div>

              {/* Main dashboard view mockup */}
              <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Productivity Score</div>
                    <div className="text-xl md:text-2xl font-bold text-cyan-400">92%</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Today's Focus</div>
                    <div className="text-xl md:text-2xl font-bold text-violet-400">Deep Coding</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Level Streak</div>
                    <div className="text-xl md:text-2xl font-bold text-rose-500">🔥 7 Days</div>
                  </div>
                </div>

                {/* Main panel */}
                <div className="flex-1 bg-white/5 border border-white/5 rounded-lg p-4 flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> Proactive Coach Suggestions
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Action Needed</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 bg-slate-900/60 p-3 rounded border border-white/5 leading-relaxed">
                    "Your Java project takes around <strong className="text-cyan-400">3 hours</strong>. You are currently scheduled for fitness during its critical block. Starting it now avoids late night rush and secures your <span className="text-violet-400 font-bold">+50 XP completion reward</span>."
                  </p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded">
                      Optimize Schedule
                    </button>
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] rounded">
                      Remind in 15m
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-950/40 relative border-y border-white/5 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Core AI Features</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Everything you need to beat procrastinating and stay on top of your deliverables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Proactive AI Prioritizer</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Evaluates deadlines, difficulty, and your overall weekly workload to calculate a dynamic risk score. Color-codes tasks to indicate immediate attention requirements.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Daily Schedule Optimizer</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Arranges your tasks into hourly time blocks with built-in rests. Includes a drag-and-drop calendar block scheduler to easily fine-tune your work-life balance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Voice Assistant Integration</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Add tasks simply by speaking. Gemini parses details like duration and deadline, then reads back your schedule details using built-in browser speech synthesis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live AI Demo Section */}
      <section id="demo" className="py-20 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] -z-10" />
        <div className="max-w-4xl mx-auto glass-panel p-6 md:p-10 relative">
          <div className="absolute top-4 right-4 text-violet-400 animate-spin">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Try the AI Smart Task Parser</h2>
            <p className="text-xs md:text-sm text-slate-400">
              Type standard text (e.g. what task you have and when it is due) to test the parsing engine live.
            </p>
          </div>

          <form onSubmit={handleDemoSubmit} className="flex flex-col md:flex-row gap-4 mb-8">
            <input
              type="text"
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              placeholder="e.g. study calculus next monday morning for 2 hours"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loadingDemo}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              {loadingDemo ? "Analyzing..." : "Analyze with Gemini"}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {demoResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 rounded-lg bg-slate-950/80 border border-white/10 flex flex-col gap-4 text-left"
              >
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h4 className="text-base font-bold text-white">{demoResult.title}</h4>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30 uppercase">
                      {demoResult.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                      {demoResult.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400 border-y border-white/5 py-3">
                  <div>
                    <strong>Deadline:</strong> <br />
                    <span className="text-white">{new Date(demoResult.deadline).toLocaleString()}</span>
                  </div>
                  <div>
                    <strong>Est. Time:</strong> <br />
                    <span className="text-white">{demoResult.estimatedDuration} hrs</span>
                  </div>
                  <div>
                    <strong>Difficulty:</strong> <br />
                    <span className="text-white uppercase">{demoResult.difficulty}</span>
                  </div>
                </div>

                {demoResult.subtasks && demoResult.subtasks.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-white mb-2">Generated Subtasks:</h5>
                    <div className="flex flex-col gap-1.5">
                      {demoResult.subtasks.map((st: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>{st.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-950/40 border-t border-white/5 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Pricing</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Simplicity is key. We offer premium coaching for free.
            </p>
          </div>

          <div className="max-w-sm mx-auto glass-panel p-8 text-center flex flex-col gap-6 relative border-t-2 border-t-violet-500">
            <span className="absolute top-4 right-4 bg-violet-600/20 text-violet-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-violet-500/20">
              Active Tier
            </span>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Standard Pro</h3>
              <p className="text-xs text-slate-400">Everything you need to crush goals</p>
            </div>

            <div className="text-4xl font-extrabold text-white">
              $0 <span className="text-sm font-medium text-slate-400">/ forever</span>
            </div>

            <ul className="text-left text-sm text-slate-300 flex flex-col gap-3 border-y border-white/5 py-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" /> Unlimited AI Task Extractions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" /> Dynamic Deadline Risk Predictor
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" /> Interactive Daily Planner Grid
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" /> Real-time AI Coach Chatbot
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" /> XP Badges & Streaks Gamification
              </li>
            </ul>

            <Link href="/login?mode=signup" className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors">
              Claim Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">FAQ</h2>
            <p className="text-slate-400">Have questions? We have answers.</p>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-panel overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center text-white hover:text-cyan-400 transition-colors"
                >
                  <span className="font-semibold text-sm md:text-base">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${activeFaq === idx ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="border-t border-white/5"
                    >
                      <p className="px-6 py-5 text-sm text-slate-300 leading-relaxed bg-white/2">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 py-10 px-6 md:px-12 border-t border-white/5 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          &copy; {new Date().getFullYear()} LastMinute AI. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
