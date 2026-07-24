require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials in .env.local");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Testing Admin Authentication...");
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@nerdsctf.io',
        password: 'NerdCTFAdminPass123!'
    });

    if (authError) {
        console.error("❌ Authentication Failed:", authError.message);
        process.exit(1);
    }

    console.log("✅ Authenticated successfully as:", authData.user.email);
    console.log("Session token:", authData.session.access_token.substring(0, 15) + "...");

    // Check Role in profiles
    console.log("Checking Admin role in public.profiles...");
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('id', authData.user.id)
        .single();

    if (profileError) {
        console.error("❌ Profile check failed:", profileError.message);
        process.exit(1);
    }

    if (profileData.role === 'ADMIN') {
        console.log(`✅ Admin Role Verified! (Username: ${profileData.username})`);
    } else {
        console.error(`❌ Admin Role Failed. Current role: ${profileData.role}`);
        process.exit(1);
    }

    console.log("Test Completed Successfully.");
}

testAdmin();
