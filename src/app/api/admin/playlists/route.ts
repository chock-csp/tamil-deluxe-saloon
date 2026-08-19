import { NextResponse } from 'next/server';
import { getAdminSession, requireAdminWithCsrf, requireJsonContentType } from '@/lib/auth';
import { getStorageDataAsync, saveStorageDataAsync } from '@/lib/storage';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getStorageDataAsync();
  return NextResponse.json({ playlists: data.rows });
}

export async function PUT(request: Request) {
  const ctError = requireJsonContentType(request);
  if (ctError) return ctError;

  const session = await requireAdminWithCsrf(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const incomingRows = Array.isArray(body.rows)
      ? body.rows
      : Array.isArray(body.playlists)
      ? body.playlists
      : Array.isArray(body)
      ? body
      : null;

    if (!incomingRows) {
      return NextResponse.json({ error: 'Rows array is required' }, { status: 400 });
    }

    const updated = await saveStorageDataAsync({ rows: incomingRows });
    return NextResponse.json({ success: true, playlists: updated.rows });
  } catch (error) {
    console.error('API PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update playlists in JSON file' },
      { status: 500 }
    );
  }
}
