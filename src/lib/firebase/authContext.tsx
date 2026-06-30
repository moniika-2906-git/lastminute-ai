"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./config";
import { getUserProfile, saveUserProfile } from "../storage";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateXP: (xpToAdd: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile when auth state changes (for real Firebase)
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Local Mock Auth: Retrieve or create a local mock user profile
      const localUserKey = "lastminute_mock_uid";
      let localUid = typeof window !== "undefined" ? localStorage.getItem(localUserKey) : null;
      if (!localUid) {
        localUid = "mock_user_123";
        if (typeof window !== "undefined") localStorage.setItem(localUserKey, localUid);
      }
      
      getUserProfile(localUid).then((profile) => {
        setUser(profile);
        setLoading(false);
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          // Create new profile
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
            xp: 0,
            level: 1,
            streak: 1,
            lastActive: new Date().toISOString(),
            badges: ["Fresh Start"]
          };
          await saveUserProfile(profile);
        } else {
          // Check streak increments
          const lastActiveDate = new Date(profile.lastActive).toDateString();
          const todayDate = new Date().toDateString();
          if (lastActiveDate !== todayDate) {
            const lastActiveTime = new Date(profile.lastActive).getTime();
            const todayTime = new Date().getTime();
            const oneDayMs = 86400000;
            
            let newStreak = profile.streak;
            if (todayTime - lastActiveTime < oneDayMs * 2) {
              newStreak += 1;
            } else {
              newStreak = 1; // Reset streak if missed a day
            }
            
            profile = {
              ...profile,
              streak: newStreak,
              lastActive: new Date().toISOString()
            };
            await saveUserProfile(profile);
          }
        }
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      // Simulate Google Login
      setLoading(true);
      const mockProfile: UserProfile = {
        uid: "mock_google_user",
        email: "google.demo@lastminute.ai",
        displayName: "Google User",
        photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=GoogleUser",
        xp: 150,
        level: 2,
        streak: 5,
        lastActive: new Date().toISOString(),
        badges: ["First Step", "Early Bird", "Google Connect"]
      };
      await saveUserProfile(mockProfile);
      setUser(mockProfile);
      setLoading(false);
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      // Simulate Email Login
      setLoading(true);
      const cleanEmail = email.toLowerCase().trim();
      const seed = cleanEmail.split("@")[0];
      const mockProfile: UserProfile = {
        uid: `mock_${seed}`,
        email: cleanEmail,
        displayName: seed.charAt(0).toUpperCase() + seed.slice(1),
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
        xp: 80,
        level: 1,
        streak: 2,
        lastActive: new Date().toISOString(),
        badges: ["First Step"]
      };
      await saveUserProfile(mockProfile);
      setUser(mockProfile);
      setLoading(false);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured || !auth) {
      // Simulate Email Signup
      setLoading(true);
      const cleanEmail = email.toLowerCase().trim();
      const mockProfile: UserProfile = {
        uid: `mock_${name.toLowerCase().replace(/\s+/g, '_')}`,
        email: cleanEmail,
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
        xp: 0,
        level: 1,
        streak: 1,
        lastActive: new Date().toISOString(),
        badges: ["Fresh Start"]
      };
      await saveUserProfile(mockProfile);
      setUser(mockProfile);
      setLoading(false);
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile: UserProfile = {
      uid: cred.user.uid,
      email: email,
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
      xp: 0,
      level: 1,
      streak: 1,
      lastActive: new Date().toISOString(),
      badges: ["Fresh Start"]
    };
    await saveUserProfile(profile);
  };

  const signOutUser = async () => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  const updateXP = async (xpToAdd: number) => {
    if (!user) return;
    const newXP = user.xp + xpToAdd;
    // XP equation for Level: level = floor(sqrt(xp / 100)) + 1
    // e.g. lvl 1: 0-99 XP, lvl 2: 100-399 XP, lvl 3: 400-899 XP, etc.
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
    const leveledUp = newLevel > user.level;
    
    const updatedBadges = [...user.badges];
    if (leveledUp) {
      updatedBadges.push(`Level ${newLevel}`);
    }
    if (newXP >= 500 && !updatedBadges.includes("XP Gladiator")) {
      updatedBadges.push("XP Gladiator");
    }

    const updatedProfile: UserProfile = {
      ...user,
      xp: newXP,
      level: newLevel,
      badges: updatedBadges
    };
    
    await saveUserProfile(updatedProfile);
    setUser(updatedProfile);

    // Trigger standard browser notification for Level Up / XP Earned
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(leveledUp ? `Level Up! 🎉 You are now Level ${newLevel}!` : `XP Gained! +${xpToAdd} XP`);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        updateXP
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
