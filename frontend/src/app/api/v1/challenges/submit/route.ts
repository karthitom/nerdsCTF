import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { challengeId, flag } = body;

        if (!challengeId || !flag) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch challenge flag securely
        // NOTE: In production, the flag should be hashed, and we verify the hash here.
        // For now, we do a direct comparison.
        // To bypass RLS and fetch the flag (if it's hidden), we might need the service role key.
        // But since we didn't hide the flag column in the schema explicitly, we can just fetch it.
        const { data: challenge, error: chalError } = await supabase
            .from('challenges')
            .select('id, flag, points')
            .eq('id', challengeId)
            .single();

        if (chalError || !challenge) {
            return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
        }

        // Basic string match for flag
        if (challenge.flag === flag) {
            // Check if already solved
            const { data: existingSolve } = await supabase
                .from('solves')
                .select('id')
                .eq('user_id', user.id)
                .eq('challenge_id', challengeId)
                .single();
                
            if (existingSolve) {
                return NextResponse.json({ success: false, error: 'Challenge already solved!' }, { status: 400 });
            }

            // Insert solve
            const { error: solveError } = await supabase
                .from('solves')
                .insert({
                    user_id: user.id,
                    challenge_id: challengeId
                });
                
            if (solveError) throw solveError;

            return NextResponse.json({ 
                success: true, 
                message: 'Flag accepted! Challenge solved.',
                pointsAwarded: challenge.points
            });
        } else {
            return NextResponse.json({ success: false, error: 'Incorrect flag.' }, { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
