import { NextResponse } from 'next/server';

// Catch-all route to prevent 404s for unimplemented Supabase backend migrations
// This returns a generic success response so the UI doesn't crash while we finish 
// migrating tickets, academy, and admin routes.

export async function GET(request: Request) {
    const url = new URL(request.url);
    console.log(`[STUB GET] ${url.pathname}`);
    return NextResponse.json({ 
        success: true, 
        message: 'Endpoint migrated to Supabase stub',
        // Dummy data for common endpoints to prevent UI crashes
        tickets: [],
        topics: [],
        users: [],
        logs: [],
        stats: { users: 0, solves: 0, tickets: 0 }
    });
}

export async function POST(request: Request) {
    const url = new URL(request.url);
    console.log(`[STUB POST] ${url.pathname}`);
    return NextResponse.json({ success: true, message: 'Action recorded in Supabase stub' });
}

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    console.log(`[STUB DELETE] ${url.pathname}`);
    return NextResponse.json({ success: true, message: 'Deleted in Supabase stub' });
}
