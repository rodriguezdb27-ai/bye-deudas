import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export async function middleware(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }
  
  return Response.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/registrar/:path*", "/analisis/:path*", "/presupuesto/:path*", "/ahorro/:path*", "/configuracion/:path*"]
}
