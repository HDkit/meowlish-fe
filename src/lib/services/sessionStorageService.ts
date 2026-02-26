// Client-side only storage service
// Uses localStorage and sessionStorage - must be used with 'use client'

import { SpeakingTestData } from '@/components/SpeakingTest';

export interface SessionHistory {
  id: string;
  timestamp: Date;
  part: 1 | 2 | 3;
  duration: number;
  questionCount: number;
  completed: boolean;
  overallScore?: number;
}

export interface StoredSession extends SpeakingTestData {
  id: string;
  overallScore?: number;
  feedback?: any;
}

const STORAGE_KEYS = {
  SESSIONS: 'speaking_sessions',
  HISTORY: 'speaking_history',
  PREFERENCES: 'speaking_preferences'
};

export class SessionStorageService {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Save a completed session
  saveSession(sessionData: SpeakingTestData, feedback?: any): string {
    if (!this.isAvailable()) {
      console.warn('localStorage not available');
      return '';
    }

    const sessionId = this.generateSessionId();
    const storedSession: StoredSession = {
      ...sessionData,
      id: sessionId,
      feedback
    };

    // Save full session data
    const sessions = this.getAllSessions();
    sessions[sessionId] = storedSession;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    // Add to history
    const historyEntry: SessionHistory = {
      id: sessionId,
      timestamp: sessionData.endTime || new Date(),
      part: sessionData.part,
      duration: sessionData.totalDuration,
      questionCount: sessionData.userAnswers.length,
      completed: true,
      overallScore: feedback?.overallScore
    };

    const history = this.getHistory();
    history.unshift(historyEntry);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

    return sessionId;
  }

  // Get all stored sessions
  getAllSessions(): Record<string, StoredSession> {
    if (!this.isAvailable()) return {};
    
    const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return stored ? JSON.parse(stored) : {};
  }

  // Get specific session
  getSession(sessionId: string): StoredSession | null {
    const sessions = this.getAllSessions();
    return sessions[sessionId] || null;
  }

  // Get session history
  getHistory(): SessionHistory[] {
    if (!this.isAvailable()) return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
  }

  // Delete session
  deleteSession(sessionId: string): void {
    if (!this.isAvailable()) return;

    const sessions = this.getAllSessions();
    delete sessions[sessionId];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    const history = this.getHistory().filter(h => h.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  // Clear all sessions
  clearAll(): void {
    if (!this.isAvailable()) return;
    
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save/load preferences
  savePreferences(preferences: any): void {
    if (!this.isAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  }

  getPreferences(): any {
    if (!this.isAvailable()) return null;
    
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return stored ? JSON.parse(stored) : null;
  }

  // Auto-save progress (for in-progress sessions)
  saveProgress(sessionData: Partial<SpeakingTestData>): void {
    if (!this.isAvailable()) return;
    
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('current_session_progress', JSON.stringify(sessionData));
    }
  }

  loadProgress(): Partial<SpeakingTestData> | null {
    if (!this.isAvailable() || typeof sessionStorage === 'undefined') return null;
    
    const stored = sessionStorage.getItem('current_session_progress');
    return stored ? JSON.parse(stored) : null;
  }

  clearProgress(): void {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('current_session_progress');
    }
  }
}

// Helper to create service instance
export function createSessionStorageService(): SessionStorageService {
  return new SessionStorageService();
}
