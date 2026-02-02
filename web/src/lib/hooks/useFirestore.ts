'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { getDb, isFirebaseInitialized } from '../firebase';
import type { Project, Session, Insight, Message, SessionFilters, InsightFilters } from '../types';

/**
 * Hook to fetch and subscribe to projects
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseInitialized()) {
      setLoading(false);
      return;
    }

    const db = getDb();
    const q = query(collection(db, 'projects'), orderBy('lastActivity', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          lastActivity: (doc.data().lastActivity as Timestamp)?.toDate() || new Date(),
          createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        })) as Project[];
        setProjects(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { projects, loading, error };
}

/**
 * Hook to fetch and subscribe to sessions
 */
export function useSessions(filters?: SessionFilters, limitCount = 50) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseInitialized()) {
      setLoading(false);
      return;
    }

    const db = getDb();
    const constraints: QueryConstraint[] = [orderBy('startedAt', 'desc'), limit(limitCount)];

    if (filters?.projectId) {
      constraints.unshift(where('projectId', '==', filters.projectId));
    }
    if (filters?.dateFrom) {
      constraints.push(where('startedAt', '>=', Timestamp.fromDate(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      constraints.push(where('startedAt', '<=', Timestamp.fromDate(filters.dateTo)));
    }

    const q = query(collection(db, 'sessions'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          startedAt: (doc.data().startedAt as Timestamp)?.toDate() || new Date(),
          endedAt: (doc.data().endedAt as Timestamp)?.toDate() || new Date(),
          syncedAt: (doc.data().syncedAt as Timestamp)?.toDate() || new Date(),
        })) as Session[];
        setSessions(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters?.projectId, filters?.dateFrom?.toISOString(), filters?.dateTo?.toISOString(), limitCount]);

  return { sessions, loading, error };
}

/**
 * Hook to fetch a single session
 */
export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !isFirebaseInitialized()) {
      setLoading(false);
      return;
    }

    const db = getDb();
    const docRef = doc(db, 'sessions', sessionId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSession({
            id: snapshot.id,
            ...data,
            startedAt: (data.startedAt as Timestamp)?.toDate() || new Date(),
            endedAt: (data.endedAt as Timestamp)?.toDate() || new Date(),
            syncedAt: (data.syncedAt as Timestamp)?.toDate() || new Date(),
          } as Session);
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return { session, loading, error };
}

/**
 * Hook to fetch and subscribe to insights
 */
export function useInsights(filters?: InsightFilters, limitCount = 100) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseInitialized()) {
      setLoading(false);
      return;
    }

    const db = getDb();
    const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc'), limit(limitCount)];

    if (filters?.projectId) {
      constraints.unshift(where('projectId', '==', filters.projectId));
    }
    if (filters?.sessionId) {
      constraints.unshift(where('sessionId', '==', filters.sessionId));
    }
    if (filters?.type) {
      constraints.unshift(where('type', '==', filters.type));
    }

    const q = query(collection(db, 'insights'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date(),
          createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        })) as Insight[];
        setInsights(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters?.projectId, filters?.sessionId, filters?.type, limitCount]);

  return { insights, loading, error };
}

/**
 * Hook to fetch messages for a session
 */
export function useMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !isFirebaseInitialized()) {
      setLoading(false);
      return;
    }

    const db = getDb();
    const q = query(
      collection(db, 'messages'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date(),
        })) as Message[];
        setMessages(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return { messages, loading, error };
}

/**
 * Fetch messages for a single session (non-reactive, for bulk operations)
 */
export async function fetchMessages(sessionId: string): Promise<Message[]> {
  if (!isFirebaseInitialized()) return [];

  const db = getDb();
  const q = query(
    collection(db, 'messages'),
    where('sessionId', '==', sessionId),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date(),
  })) as Message[];
}

/**
 * Hook to get analytics data
 */
export function useAnalytics() {
  const { sessions } = useSessions(undefined, 500);
  const { insights } = useInsights(undefined, 1000);

  // Compute daily stats
  const dailyStats = computeDailyStats(sessions, insights);

  // Compute project stats
  const projectStats = computeProjectStats(sessions, insights);

  // Compute insight type distribution
  const insightsByType = {
    summary: insights.filter((i) => i.type === 'summary').length,
    decision: insights.filter((i) => i.type === 'decision').length,
    learning: insights.filter((i) => i.type === 'learning').length,
    technique: insights.filter((i) => i.type === 'technique').length,
  };

  return {
    dailyStats,
    projectStats,
    insightsByType,
    totalSessions: sessions.length,
    totalInsights: insights.length,
  };
}

function computeDailyStats(sessions: Session[], insights: Insight[]) {
  const stats: Record<string, { sessionCount: number; messageCount: number; insightCount: number }> = {};

  for (const session of sessions) {
    const date = session.startedAt.toISOString().split('T')[0];
    if (!stats[date]) {
      stats[date] = { sessionCount: 0, messageCount: 0, insightCount: 0 };
    }
    stats[date].sessionCount++;
    stats[date].messageCount += session.messageCount;
  }

  for (const insight of insights) {
    const date = insight.timestamp.toISOString().split('T')[0];
    if (stats[date]) {
      stats[date].insightCount++;
    }
  }

  return Object.entries(stats)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days
}

function computeProjectStats(sessions: Session[], insights: Insight[]) {
  const stats: Record<string, {
    projectName: string;
    sessionCount: number;
    totalDuration: number;
    insightCounts: { summary: number; decision: number; learning: number; technique: number };
  }> = {};

  for (const session of sessions) {
    if (!stats[session.projectId]) {
      stats[session.projectId] = {
        projectName: session.projectName,
        sessionCount: 0,
        totalDuration: 0,
        insightCounts: { summary: 0, decision: 0, learning: 0, technique: 0 },
      };
    }
    stats[session.projectId].sessionCount++;
    stats[session.projectId].totalDuration +=
      (session.endedAt.getTime() - session.startedAt.getTime()) / 60000;
  }

  for (const insight of insights) {
    if (stats[insight.projectId] && stats[insight.projectId].insightCounts[insight.type] !== undefined) {
      stats[insight.projectId].insightCounts[insight.type]++;
    }
  }

  return Object.entries(stats).map(([projectId, data]) => ({
    projectId,
    ...data,
  }));
}
