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

  try {
    const snapshot = await db
      .collection('projects')
      .orderBy('lastActivity', 'desc')
      .get();

    const projects = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        path: data.path,
        sessionCount: data.sessionCount || 0,
        lastActivity: data.lastActivity?.toDate()?.toISOString(),
      };
    });

    return NextResponse.json({
      projects,
      count: projects.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
