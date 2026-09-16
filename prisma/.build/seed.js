"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Sembrando datos de prueba...');
    // Crear usuario demo
    const hashedPassword = await bcryptjs_1.default.hash('demo1234', 12);
    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@finanzas.app' },
        update: {},
        create: {
            email: 'demo@finanzas.app',
            password: hashedPassword,
            name: 'Usuario Demo',
            isDemo: true,
        },
    });
    console.log(`✅ Usuario demo creado: ${demoUser.email}`);
    // Crear configuración
    await prisma.settings.upsert({
        where: { userId: demoUser.id },
        update: {},
        create: {
            userId: demoUser.id,
            currency: 'MXN',
            firstDayOfWeek: 1,
            notifications: true,
            darkMode: false,
        },
    });
    // Obtener categorías del usuario
    const categories = await prisma.category.findMany({
        where: { userId: demoUser.id }
    });
    const getCat = (slug) => categories.find(c => c.slug === slug)?.id || '';
    // Fechas para los datos
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const transactions = [];
    // Generar ~300 transacciones distribuidas en 6 meses
    for (let i = 0; i < 180; i++) {
        const date = new Date(sixMonthsAgo);
        date.setDate(date.getDate() + i);
        // Sueldo quincenal (días 1 y 15)
        if (date.getDate() === 1 || date.getDate() === 15) {
            const amountCents = 1500000; // $15,000 MXN
            transactions.push({
                userId: demoUser.id,
                type: 'INGRESO',
                amountCents,
                categoryId: getCat('sueldo'),
                description: 'Sueldo quincenal',
                date,
                hour: '09:00',
                month: date.getMonth(),
                year: date.getFullYear(),
                dayOfWeek: date.getDay(),
            });
        }
        // Comida variable ($150-300 diario, con un gasto inusual de $1200)
        if (i % 1 === 0) {
            let amountCents = Math.floor(Math.random() * 15000) + 15000; // 150-300
            // Gasto inusual provocado en el día 90
            if (i === 90) {
                amountCents = 120000; // $1,200 gasto inusual
            }
            transactions.push({
                userId: demoUser.id,
                type: 'GASTO',
                amountCents,
                categoryId: getCat('comida'),
                description: i === 90 ? 'Comida especial evento' : 'Comida del día',
                date,
                hour: `${12 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                month: date.getMonth(),
                year: date.getFullYear(),
                dayOfWeek: date.getDay(),
            });
        }
        // Transporte ($50-150)
        if (i % 2 === 0) {
            transactions.push({
                userId: demoUser.id,
                type: 'GASTO',
                amountCents: Math.floor(Math.random() * 10000) + 5000,
                categoryId: getCat('transporte'),
                description: 'Transporte público / Gasolina',
                date,
                hour: '08:00',
                month: date.getMonth(),
                year: date.getFullYear(),
                dayOfWeek: date.getDay(),
            });
        }
        // Recibos fijos (renta ~$8000 a principios de mes)
        if (date.getDate() === 3) {
            transactions.push({
                userId: demoUser.id,
                type: 'GASTO',
                amountCents: 800000,
                categoryId: getCat('recibos'),
                description: 'Renta mensual',
                date,
                hour: '10:00',
                month: date.getMonth(),
                year: date.getFullYear(),
                dayOfWeek: date.getDay(),
            });
        }
        // Entretenimiento variable
        if (i % 5 === 0) {
            transactions.push({
                userId: demoUser.id,
                type: 'GASTO',
                amountCents: Math.floor(Math.random() * 50000) + 10000,
                categoryId: getCat('entretenimiento'),
                description: 'Salida fin de semana',
                date,
                hour: '20:00',
                month: date.getMonth(),
                year: date.getFullYear(),
                dayOfWeek: date.getDay(),
            });
        }
        // Compras variables
        if (i % 7 === 0) {
            transactions.push({
                userId: demoUser.id,
                type: 'GASTO',
                amountCents: Math.floor(Math.random() * 100000) + 20000,
                categoryId: getCat('compras'),
                description: 'Compras varias',
                date,
                hour: '16:00',
                month: date.getMonth(),
                year: date.getFullYear(),
                dayOfWeek: date.getDay(),
            });
        }
    }
    // Crear transacciones en lotes
    await prisma.transaction.createMany({
        data: transactions
    });
    console.log(`✅ ${transactions.length} transacciones creadas`);
    // Crear presupuestos
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    // Presupuesto comida al ~84%
    await prisma.budget.upsert({
        where: {
            userId_categoryId_month_year: {
                userId: demoUser.id,
                categoryId: getCat('comida'),
                month: currentMonth,
                year: currentYear
            }
        },
        update: {},
        create: {
            userId: demoUser.id,
            categoryId: getCat('comida'),
            amountCents: 500000, // $5,000 presupuesto
            month: currentMonth,
            year: currentYear
        }
    });
    // Presupuesto transporte excedido
    await prisma.budget.upsert({
        where: {
            userId_categoryId_month_year: {
                userId: demoUser.id,
                categoryId: getCat('transporte'),
                month: currentMonth,
                year: currentYear
            }
        },
        update: {},
        create: {
            userId: demoUser.id,
            categoryId: getCat('transporte'),
            amountCents: 200000, // $2,000 presupuesto (probablemente excedido)
            month: currentMonth,
            year: currentYear
        }
    });
    // Objetivo de ahorro $50,000
    await prisma.savingsGoal.create({
        data: {
            userId: demoUser.id,
            name: 'Fondo de Emergencia',
            targetAmountCents: 5000000, // $50,000
            currentAmountCents: 1850000, // $18,500 actuales (37%)
            deadline: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
            isActive: true
        }
    });
    console.log('✅ Presupuestos y objetivo de ahorro creados');
    console.log('🎉 Seed completado exitosamente!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
