import { createServerClient, type NextRequest } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Obtenemos la sesión del usuario
  const { data: { user } } = await supabase.auth.getUser()

  const isLandingPage = request.nextUrl.pathname === '/'
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  // 2. Lógica de Redirección para Rutas del Sur
  
  // SI NO HAY USUARIO: Solo puede ver la Landing (/) y el Login (/login)
  if (!user && !isLandingPage && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // SI YA ESTÁ LOGUEADO: Si intenta ir a la Landing o al Login, lo mandamos al Dashboard
  if (user && (isLandingPage || isLoginPage)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Vigila todas las rutas excepto las de Next.js (_next/static, _next/image, etc)
     * y los archivos públicos (favicon, etc).
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}