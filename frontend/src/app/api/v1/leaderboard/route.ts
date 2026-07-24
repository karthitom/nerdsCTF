import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Fetch all users and their solves to calculate points
        // In a real production app with thousands of users, this should be a Postgres Materialized View or RPC function.
        // For now, we do a basic aggregation.
        
        const { data: profiles, error: profError } = await supabase
            .from('profiles')
            .select('id, username, avatar, country');
            
        if (profError) throw profError;

        const { data: solves, error: solvesError } = await supabase
            .from('solves')
            .select('user_id, challenge_id, challenges(points)');

        if (solvesError) throw solvesError;

        // Aggregate points
        const userPoints: Record<string, number> = {};
        solves.forEach(solve => {
            const points = (solve.challenges as any)?.points || 0;
            userPoints[solve.user_id] = (userPoints[solve.user_id] || 0) + points;
        });

        // Format leaderboard
        const leaderboard = profiles.map(profile => ({
            id: profile.id,
            username: profile.username,
            avatar: profile.avatar,
            country: profile.country,
            points: userPoints[profile.id] || 0
        }))
        .sort((a, b) => b.points - a.points); // Sort descending

        return NextResponse.json({ success: true, leaderboard });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
