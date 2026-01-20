import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin from request headers (user's credentials)
function getFirebaseApp(apiKey: string): App | null {
  try {
    const credentials = JSON.parse(Buffer.from(apiKey, 'base64').toString());
    const appName = `api-${credentials.projectId}`;

    const existingApp = getApps().find((app) => app.name === appName);
    if (existingApp) {
      return existingApp;
    }

    return initializeApp(
      {
        credential: cert({
          projectId: credentials.projectId,
          clientEmail: credentials.clientEmail,
          privateKey: credentials.privateKey.replace(/\\n/g, '\n'),
        }),
      },
      appName
    );
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Get API key from header
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing x-api-key header. Use base64 encoded Firebase credentials.' },
      { status: 401 }
    );
  }

  const app = getFirebaseApp(apiKey);
  if (!app) {
    return NextResponse.json(
      { error: 'Invalid API key or Firebase credentials.' },
      { status: 401 }
    );
  }

  const db = getFirestore(app);

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const projectId = searchParams.get('projectId');
  const startAfter = searchParams.get('startAfter');

  try {
    let query = db
      .collection('sessions')
      .orderBy('endedAt', 'desc')
      .limit(limit);

    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    if (startAfter) {
      const cursor = await db.collection('sessions').doc(startAfter).get();
      if (cursor.exists) {
        query = query.startAfter(cursor);
      }
    }

    const snapshot = await query.get();

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        projectId: data.projectId,
        projectName: data.projectName,
        summary: data.summary,
        startedAt: data.startedAt?.toDate()?.toISOString(),
        endedAt: data.endedAt?.toDate()?.toISOString(),
        messageCount: data.messageCount,
        toolCallCount: data.toolCallCount,
        gitBranch: data.gitBranch,
      };
    });

    return NextResponse.json({
      sessions,
      count: sessions.length,
      hasMore: sessions.length === limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
