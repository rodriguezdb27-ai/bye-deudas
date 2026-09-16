import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null
      }
    })

    // Crear categorías por defecto para el usuario
    await createDefaultCategories(user.id)

    // Crear configuración por defecto
    await prisma.settings.create({
      data: {
        userId: user.id,
        currency: "MXN"
      }
    })

    return NextResponse.json(
      { 
        message: "Usuario creado exitosamente",
        userId: user.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    )
  }
}

async function createDefaultCategories(userId: string) {
  const expenseCategories = [
    { name: "Comida", slug: "comida", icon: "🍔", color: "#f97316" },
    { name: "Recibos", slug: "recibos", icon: "🏠", color: "#3b82f6" },
    { name: "Escuela", slug: "escuela", icon: "🎓", color: "#8b5cf6" },
    { name: "Transporte", slug: "transporte", icon: "🚗", color: "#ef4444" },
    { name: "Compras", slug: "compras", icon: "🛒", color: "#ec4899" },
    { name: "Salud", slug: "salud", icon: "💊", color: "#14b8a6" },
    { name: "Entretenimiento", slug: "entretenimiento", icon: "🎬", color: "#f59e0b" },
    { name: "Ahorro", slug: "ahorro", icon: "💰", color: "#10b981" },
    { name: "Otros", slug: "otros-gasto", icon: "📦", color: "#6b7280" }
  ]

  const incomeCategories = [
    { name: "Sueldo", slug: "sueldo", icon: "💼", color: "#10b981" },
    { name: "Negocio", slug: "negocio", icon: "🏪", color: "#3b82f6" },
    { name: "Inversiones", slug: "inversiones", icon: "📈", color: "#8b5cf6" },
    { name: "Freelance", slug: "freelance", icon: "💻", color: "#f59e0b" },
    { name: "Regalo", slug: "regalo", icon: "🎁", color: "#ec4899" },
    { name: "Otros", slug: "otros-ingreso", icon: "📥", color: "#6b7280" }
  ]

  const categories = [
    ...expenseCategories.map(c => ({ ...c, type: "GASTO" })),
    ...incomeCategories.map(c => ({ ...c, type: "INGRESO" }))
  ]

  await prisma.category.createMany({
    data: categories.map(cat => ({
      userId,
      name: cat.name,
      slug: cat.slug,
      type: cat.type as "INGRESO" | "GASTO",
      icon: cat.icon,
      color: cat.color,
      isDefault: true
    }))
  })
}
