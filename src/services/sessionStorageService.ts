// Session storage and history management
import { SpeakingTestData } from '../components/SpeakingTest';

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
  // Save a completed session
  saveSession(sessionData: SpeakingTestData, feedback?: any): string {
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

    this.addToHistory(historyEntry);
    return sessionId;
  }

  // Get all sessions
  getAllSessions(): Record<string, StoredSession> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading sessions:', error);
      return {};
    }
  }

  // Get a specific session
  getSession(sessionId: string): StoredSession | null {
    const sessions = this.getAllSessions();
    return sessions[sessionId] || null;
  }

  // Get session history
  getHistory(): SessionHistory[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const history = stored ? JSON.parse(stored) : [];
      
      // Convert timestamp strings back to Date objects and sort by most recent
      return history
        .map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        .sort((a: SessionHistory, b: SessionHistory) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  // Add entry to history
  private addToHistory(entry: SessionHistory): void {
    const history = this.getHistory();
    history.unshift(entry); // Add to beginning
    
    // Keep only last 50 sessions
    const trimmedHistory = history.slice(0, 50);
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmedHistory));
  }

  // Delete a session
  deleteSession(sessionId: string): boolean {
    try {
      // Remove from sessions
      const sessions = this.getAllSessions();
      delete sessions[sessionId];
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

      // Remove from history
      const history = this.getHistory();
      const filteredHistory = history.filter(item => item.id !== sessionId);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filteredHistory));

      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Get statistics
  getStatistics(): {
    totalSessions: number;
    averageScore: number;
    totalTime: number;
    partBreakdown: Record<1 | 2 | 3, number>;
    recentPerformance: Array<{ date: Date; score: number }>;
  } {
    const history = this.getHistory();
    const completedSessions = history.filter(s => s.completed && s.overallScore);

    const totalSessions = completedSessions.length;
    const averageScore = totalSessions > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / totalSessions 
      : 0;
    
    const totalTime = history.reduce((sum, s) => sum + s.duration, 0);
    
    const partBreakdown = {
      1: history.filter(s => s.part === 1).length,
      2: history.filter(s => s.part === 2).length,
      3: history.filter(s => s.part === 3).length,
    } as Record<1 | 2 | 3, number>;

    const recentPerformance = completedSessions
      .slice(0, 10)
      .map(s => ({
        date: s.timestamp,
        score: s.overallScore || 0
      }));

    return {
      totalSessions,
      averageScore,
      totalTime,
      partBreakdown,
      recentPerformance
    };
  }

  // Export sessions data
  exportSessions(): string {
    const sessions = this.getAllSessions();
    const history = this.getHistory();
    
    const exportData = {
      sessions,
      history,
      exportDate: new Date(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import sessions data
  importSessions(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.sessions) {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(importData.sessions));
      }
      
      if (importData.history) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(importData.history));
      }

      return true;
    } catch (error) {
      console.error('Error importing sessions:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
  }

  // Save user preferences
  savePreferences(preferences: {
    whisperEnabled?: boolean;
    autoSpeak?: boolean;
    language?: string;
    difficultyLevel?: string;
  }): void {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  }

  // Get user preferences
  getPreferences(): any {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading preferences:', error);
      return {};
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Auto-save current session progress (for crash recovery)
  saveProgressSession(sessionData: Partial<SpeakingTestData>): void {
    const progressKey = `progress_${sessionData.part}`;
    const progressData = {
      ...sessionData,
      lastUpdated: new Date(),
      isProgress: true
    };
    
    sessionStorage.setItem(progressKey, JSON.stringify(progressData));
  }

  // Get saved progress session
  getProgressSession(part: 1 | 2 | 3): Partial<SpeakingTestData> | null {
    try {
      const progressKey = `progress_${part}`;
      const stored = sessionStorage.getItem(progressKey);
      
      if (stored) {
        const progress = JSON.parse(stored);
        
        // Check if progress is recent (within last hour)
        const lastUpdated = new Date(progress.lastUpdated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastUpdated > oneHourAgo) {
          return progress;
        } else {
          // Remove old progress
          sessionStorage.removeItem(progressKey);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading progress session:', error);
      return null;
    }
  }

  // Clear progress session
  clearProgressSession(part: 1 | 2 | 3): void {
    const progressKey = `progress_${part}`;
    sessionStorage.removeItem(progressKey);
  }
}

export const sessionStorageService = new SessionStorageService();