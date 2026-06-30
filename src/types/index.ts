export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  streak: number;
  lastActive: string; // ISO String
  badges: string[];
}

export interface SubTask {
  title: string;
  completed: boolean;
}

export interface RiskAnalysis {
  riskScore: number; // 0 - 100
  warningText: string;
  suggestions: string[];
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'Work' | 'Study' | 'Personal' | 'Fitness' | 'Bills' | 'Other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  deadline: string; // ISO String
  estimatedDuration: number; // in hours (e.g., 2.5)
  subtasks: SubTask[];
  completed: boolean;
  completedAt: string | null; // ISO String or null
  suggestedSchedule: string; // e.g. "09:00 - 10:30"
  createdAt: string; // ISO String
  riskAnalysis?: RiskAnalysis;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: string;
  logs: { [dateStr: string]: boolean }; // YYYY-MM-DD -> completed
  streak: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g. "GPA", "hours", "books"
  deadline: string; // ISO String
  completed: boolean;
  progressLogs: { date: string; value: number }[];
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  taskId: string | null;
  taskTitle: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  color: string; // Tailwind color name or hex
}

export interface DailySchedule {
  id: string; // Format: userId_YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  timeBlocks: TimeBlock[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  sentAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string; // ISO String
}

export interface ChatThread {
  userId: string;
  messages: Message[];
}

export interface DailyReflection {
  id: string; // Format: userId_YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  completedTasks: string[];
  missedTasks: { taskId: string; title: string; reason: string }[];
  reflectionText: string;
  xpEarned: number;
  createdAt: string;
}

export interface ProductivityAnalytics {
  completedTasksCount: number;
  focusTimeMinutes: number;
  totalTasksCount: number;
  xpEarned: number;
}
