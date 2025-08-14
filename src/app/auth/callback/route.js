import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key);

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Redirect to dashboard or specified next page
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/auth/supabase/sign-in?error=auth_callback_error`);
      }
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(`${origin}/auth/supabase/sign-in?error=auth_callback_error`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/supabase/sign-in?error=no_code_provided`);
}
