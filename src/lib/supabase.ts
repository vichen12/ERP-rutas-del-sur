import { createBrowserClient } from '@supabase/ssr'

export const getSupabase = () => {
  // Este log te confirmará en la consola si la URL se está leyendo bien
  console.log("Intentando conectar a:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}