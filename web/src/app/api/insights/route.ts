import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin from request headers
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
  const type = searchParams.get('type'); // decision, learning, workitem
  const projectId = searchParams.get('projectId');
  const sessionId = searchParams.get('sessionId');
  const startAfter = searchParams.get('startAfter');

  try {
    let query = db
      .collection('insights')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (type) {
      query = query.where('type', '==', type);
    }

    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    if (sessionId) {
      query = query.where('sessionId', '==', sessionId);
    }

    if (startAfter) {
      const cursor = await db.collection('insights').doc(startAfter).get();
      if (cursor.exists) {
        query = query.startAfter(cursor);
      }
    }

    const snapshot = await query.get();

    const insights = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        sessionId: data.sessionId,
        projectId: data.projectId,
        projectName: data.projectName,
        type: data.type,
        title: data.title,
        content: data.content,
        confidence: data.confidence,
        timestamp: data.timestamp?.toDate()?.toISOString(),
      };
    });

    return NextResponse.json({
      insights,
      count: insights.length,
      hasMore: insights.length === limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
