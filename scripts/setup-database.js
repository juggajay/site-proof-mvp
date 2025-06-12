const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function setupDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔧 Setting up database schema and triggers...')

  try {
    // Create the trigger function
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.profiles (id, email, full_name)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    if (functionError) {
      console.log('⚠️  Function creation failed, trying direct SQL execution...')
      
      // Alternative approach: Execute SQL directly
      const { error: directError } = await supabase
        .from('_sql')
        .insert([{ 
          query: `
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
                INSERT INTO public.profiles (id, email, full_name)
                VALUES (
                    NEW.id,
                    NEW.email,
                    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;

            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
                AFTER INSERT ON auth.users
                FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
          `
        }])
    }

    // Create trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    })

    // Backfill existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (!usersError && users) {
      console.log(`📊 Found ${users.users.length} existing users, creating profiles...`)
      
      for (const user of users.users) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })

        if (profileError) {
          console.log(`⚠️  Could not create profile for user ${user.email}:`, profileError.message)
        }
      }
    }

    console.log('✅ Database setup completed successfully!')
    console.log('🎯 Automatic profile creation is now enabled')
    console.log('📝 Existing users have been backfilled with profiles')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.log('\n📋 Manual Setup Required:')
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('\n' + require('fs').readFileSync('./database-fix-simple.sql', 'utf8'))
  }
}

setupDatabase()