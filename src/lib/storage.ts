import { db, isFirebaseConfigured } from "./firebase/config";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from "firebase/firestore";
import { Task, Goal, Habit, DailySchedule, UserProfile, NotificationItem } from "@/types";

// Local storage keys
const KEYS = {
  TASKS: "lastminute_tasks",
  GOALS: "lastminute_goals",
  HABITS: "lastminute_habits",
  SCHEDULES: "lastminute_schedules",
  USER: "lastminute_user_profile",
  NOTIFICATIONS: "lastminute_notifications"
};

// Helper: read from localStorage
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
}

// Helper: write to localStorage
function setLocal<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// --- USER PROFILE ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
    } catch (e) {
      console.error("Firestore getUserProfile error, falling back to local:", e);
    }
  }
  
  // Fallback
  const cachedUser = getLocal<UserProfile | null>(KEYS.USER, null);
  if (cachedUser && cachedUser.uid === uid) {
    return cachedUser;
  }
  
  // Return default profile for new user
  const defaultProfile: UserProfile = {
    uid,
    email: "demo@lastminute.ai",
    displayName: "Productive User",
    photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=LastMinute",
    xp: 120,
    level: 1,
    streak: 3,
    lastActive: new Date().toISOString(),
    badges: ["First Step", "Early Bird"]
  };
  setLocal(KEYS.USER, defaultProfile);
  return defaultProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "users", profile.uid), profile);
      return;
    } catch (e) {
      console.error("Firestore saveUserProfile error:", e);
    }
  }
  setLocal(KEYS.USER, profile);
}

// --- TASKS ---
export async function getTasks(userId: string): Promise<Task[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "tasks"), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      return tasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (e) {
      console.error("Firestore getTasks error, falling back to local:", e);
    }
  }
  
  // Fallback
  const tasks = getLocal<Task[]>(KEYS.TASKS, []);
  return tasks.filter(t => t.userId === userId);
}

export async function saveTask(task: Task): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "tasks", task.id), task);
      return;
    } catch (e) {
      console.error("Firestore saveTask error:", e);
    }
  }
  
  const tasks = getLocal<Task[]>(KEYS.TASKS, []);
  const index = tasks.findIndex(t => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  setLocal(KEYS.TASKS, tasks);
}

export async function deleteTask(taskId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      return;
    } catch (e) {
      console.error("Firestore deleteTask error:", e);
    }
  }
  
  const tasks = getLocal<Task[]>(KEYS.TASKS, []);
  setLocal(KEYS.TASKS, tasks.filter(t => t.id !== taskId));
}

// --- GOALS ---
export async function getGoals(userId: string): Promise<Goal[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "goals"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const goals: Goal[] = [];
      querySnapshot.forEach((doc) => {
        goals.push({ id: doc.id, ...doc.data() } as Goal);
      });
      return goals;
    } catch (e) {
      console.error("Firestore getGoals error, falling back to local:", e);
    }
  }
  
  const goals = getLocal<Goal[]>(KEYS.GOALS, []);
  return goals.filter(g => g.userId === userId);
}

export async function saveGoal(goal: Goal): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "goals", goal.id), goal);
      return;
    } catch (e) {
      console.error("Firestore saveGoal error:", e);
    }
  }
  
  const goals = getLocal<Goal[]>(KEYS.GOALS, []);
  const index = goals.findIndex(g => g.id === goal.id);
  if (index >= 0) {
    goals[index] = goal;
  } else {
    goals.push(goal);
  }
  setLocal(KEYS.GOALS, goals);
}

export async function deleteGoal(goalId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "goals", goalId));
      return;
    } catch (e) {
      console.error("Firestore deleteGoal error:", e);
    }
  }
  
  const goals = getLocal<Goal[]>(KEYS.GOALS, []);
  setLocal(KEYS.GOALS, goals.filter(g => g.id !== goalId));
}

// --- HABITS ---
export async function getHabits(userId: string): Promise<Habit[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "habits"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const habits: Habit[] = [];
      querySnapshot.forEach((doc) => {
        habits.push({ id: doc.id, ...doc.data() } as Habit);
      });
      return habits;
    } catch (e) {
      console.error("Firestore getHabits error, falling back to local:", e);
    }
  }
  
  const habits = getLocal<Habit[]>(KEYS.HABITS, []);
  return habits.filter(h => h.userId === userId);
}

export async function saveHabit(habit: Habit): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "habits", habit.id), habit);
      return;
    } catch (e) {
      console.error("Firestore saveHabit error:", e);
    }
  }
  
  const habits = getLocal<Habit[]>(KEYS.HABITS, []);
  const index = habits.findIndex(h => h.id === habit.id);
  if (index >= 0) {
    habits[index] = habit;
  } else {
    habits.push(habit);
  }
  setLocal(KEYS.HABITS, habits);
}

export async function deleteHabit(habitId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "habits", habitId));
      return;
    } catch (e) {
      console.error("Firestore deleteHabit error:", e);
    }
  }
  
  const habits = getLocal<Habit[]>(KEYS.HABITS, []);
  setLocal(KEYS.HABITS, habits.filter(h => h.id !== habitId));
}

// --- SCHEDULES ---
export async function getSchedule(userId: string, dateStr: string): Promise<DailySchedule | null> {
  const docId = `${userId}_${dateStr}`;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "schedules", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as DailySchedule;
      }
    } catch (e) {
      console.error("Firestore getSchedule error, falling back to local:", e);
    }
  }
  
  const schedules = getLocal<DailySchedule[]>(KEYS.SCHEDULES, []);
  return schedules.find(s => s.id === docId) || null;
}

export async function saveSchedule(schedule: DailySchedule): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "schedules", schedule.id), schedule);
      return;
    } catch (e) {
      console.error("Firestore saveSchedule error:", e);
    }
  }
  
  const schedules = getLocal<DailySchedule[]>(KEYS.SCHEDULES, []);
  const index = schedules.findIndex(s => s.id === schedule.id);
  if (index >= 0) {
    schedules[index] = schedule;
  } else {
    schedules.push(schedule);
  }
  setLocal(KEYS.SCHEDULES, schedules);
}

// --- NOTIFICATIONS ---
export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "notifications"), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const list: NotificationItem[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as NotificationItem);
      });
      return list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    } catch (e) {
      console.error("Firestore getNotifications error:", e);
    }
  }
  
  const list = getLocal<NotificationItem[]>(KEYS.NOTIFICATIONS, []);
  return list.filter(n => n.userId === userId).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

export async function saveNotification(notification: NotificationItem): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "notifications", notification.id), notification);
      return;
    } catch (e) {
      console.error("Firestore saveNotification error:", e);
    }
  }
  
  const list = getLocal<NotificationItem[]>(KEYS.NOTIFICATIONS, []);
  list.push(notification);
  setLocal(KEYS.NOTIFICATIONS, list);
}
