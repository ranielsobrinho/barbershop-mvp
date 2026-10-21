import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'carlos@barbearia.com' },
    update: {},
    create: {
      email: 'carlos@barbearia.com',
      passwordHash,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create default services
  const services = [
    { name: 'Corte', description: 'Corte de cabelo masculino', priceCents: 3000, slotMin: 30 },
    { name: 'Barba', description: 'Aparar e modelar barba', priceCents: 2000, slotMin: 30 },
    { name: 'Corte + Barba', description: 'Corte de cabelo e barba completo', priceCents: 4500, slotMin: 60 },
    { name: 'Sobrancelha', description: 'Design de sobrancelha masculina', priceCents: 1500, slotMin: 15 },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    })
  }
  console.log('✅ Default services created')

  // Create default business hours (Mon-Sat 9-18, lunch 12-13)
  const businessHours = [
    { weekday: 1, opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true }, // Monday
    { weekday: 2, opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true }, // Tuesday
    { weekday: 3, opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true }, // Wednesday
    { weekday: 4, opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true }, // Thursday
    { weekday: 5, opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true }, // Friday
    { weekday: 6, opensAt: '08:00', closesAt: '14:00', breakStart: null, breakEnd: null, active: true },     // Saturday
    { weekday: 0, opensAt: '00:00', closesAt: '00:00', breakStart: null, breakEnd: null, active: false },   // Sunday (closed)
  ]

  for (const bh of businessHours) {
    await prisma.businessHours.upsert({
      where: { weekday: bh.weekday },
      update: bh,
      create: bh,
    })
  }
  console.log('✅ Default business hours created')

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      minNoticeHours: 2,
      maxDaysAhead: 60,
      heroText: 'Seu Carlos Barbearia - Tradição e estilo no seu corte',
      heroImageUrl: '',
    },
  })
  console.log('✅ Default settings created')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
