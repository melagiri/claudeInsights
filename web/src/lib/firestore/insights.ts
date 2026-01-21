// Firestore helpers for insights

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { getDb, isFirebaseInitialized } from '../firebase';
import type { Insight } from '../types';

/**
 * Save insights to Firestore
 */
export async function saveInsights(insights: Insight[]): Promise<void> {
  if (!isFirebaseInitialized() || insights.length === 0) return;

  const db = getDb();

  // Use batched writes for efficiency (max 500 per batch)
  const batches: ReturnType<typeof writeBatch>[] = [];
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  for (const insight of insights) {
    const insightRef = doc(db, 'insights', insight.id);
    currentBatch.set(insightRef, {
      sessionId: insight.sessionId,
      projectId: insight.projectId,
      projectName: insight.projectName,
      type: insight.type,
      title: insight.title,
      content: insight.content,
      summary: insight.summary,
      bullets: insight.bullets,
      confidence: insight.confidence,
      source: insight.source,
      metadata: insight.metadata,
      timestamp: Timestamp.fromDate(insight.timestamp),
      createdAt: Timestamp.fromDate(insight.createdAt),
      scope: insight.scope,
      analysisVersion: insight.analysisVersion,
    });

    operationCount++;
    if (operationCount >= 500) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  // Execute all batches
  await Promise.all(batches.map((batch) => batch.commit()));
}

/**
 * Delete all insights for a session
 */
export async function deleteSessionInsights(sessionId: string): Promise<void> {
  if (!isFirebaseInitialized()) return;

  const db = getDb();
  const q = query(collection(db, 'insights'), where('sessionId', '==', sessionId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  // Use batched deletes
  const batches: ReturnType<typeof writeBatch>[] = [];
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  for (const docSnap of snapshot.docs) {
    currentBatch.delete(docSnap.ref);
    operationCount++;

    if (operationCount >= 500) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  await Promise.all(batches.map((batch) => batch.commit()));
}

/**
 * Save a single insight
 */
export async function saveInsight(insight: Insight): Promise<void> {
  if (!isFirebaseInitialized()) return;

  const db = getDb();
  const insightRef = doc(db, 'insights', insight.id);

  await setDoc(insightRef, {
    sessionId: insight.sessionId,
    projectId: insight.projectId,
    projectName: insight.projectName,
    type: insight.type,
    title: insight.title,
    content: insight.content,
    summary: insight.summary,
    bullets: insight.bullets,
    confidence: insight.confidence,
    source: insight.source,
    metadata: insight.metadata,
    timestamp: Timestamp.fromDate(insight.timestamp),
    createdAt: Timestamp.fromDate(insight.createdAt),
    scope: insight.scope,
    analysisVersion: insight.analysisVersion,
  });
}

/**
 * Delete a single insight
 */
export async function deleteInsight(insightId: string): Promise<void> {
  if (!isFirebaseInitialized()) return;

  const db = getDb();
  await deleteDoc(doc(db, 'insights', insightId));
}
