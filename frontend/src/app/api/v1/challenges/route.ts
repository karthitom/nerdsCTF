import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Fetch challenges
        const { data: challenges, error: chalError } = await supabase
            .from('challenges')
            .select('id, title, description, category, difficulty, points, estimated_time, environment_url');
        
        if (chalError) throw chalError;

        // Fetch user solves to mark challenges as solved
        const { data: { user } } = await supabase.auth.getUser();
        
        let mappedChallenges = challenges;
        if (user) {
            const { data: solves } = await supabase
                .from('solves')
                .select('challenge_id')
                .eq('user_id', user.id);
                
            const solvedIds = new Set(solves?.map(s => s.challenge_id));
            
            mappedChallenges = challenges.map(c => ({
                ...c,
                estimatedTime: c.estimated_time, // map snake_case to camelCase
                solved: solvedIds.has(c.id)
            }));
        } else {
            mappedChallenges = challenges.map(c => ({
                ...c,
                estimatedTime: c.estimated_time,
                solved: false
            }));
        }

        return NextResponse.json({ success: true, challenges: mappedChallenges });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
