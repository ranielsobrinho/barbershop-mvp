import { PrismaClient } from './generated/client/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const defaultTenantId = 'tenant_seu_carlos'

async function main() {
  console.log('🌱 Seeding database...')

  const tenant = await prisma.tenant.upsert({
    where: { id: defaultTenantId },
    update: {},
    create: {
      id: defaultTenantId,
      name: 'Seu Carlos Barbearia',
      slug: 'seu-carlos',
    },
  })
  console.log('✅ Default tenant ready:', tenant.slug)

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

  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: defaultTenantId, userId: admin.id } },
    update: { role: 'OWNER' },
    create: { tenantId: defaultTenantId, userId: admin.id, role: 'OWNER' },
  })

  const barber = await prisma.barber.upsert({
    where: { id: 'barber_seu_carlos' },
    update: {},
    create: {
      id: 'barber_seu_carlos',
      tenantId: defaultTenantId,
      name: 'Seu Carlos',
    },
  })

  // Create default services
  const services = [
    { name: 'Corte', description: 'Corte de cabelo masculino', priceCents: 3000, slotMin: 30 },
    { name: 'Barba', description: 'Aparar e modelar barba', priceCents: 2000, slotMin: 30 },
    { name: 'Corte + Barba', description: 'Corte de cabelo e barba completo', priceCents: 4500, slotMin: 60 },
    { name: 'Sobrancelha', description: 'Design de sobrancelha masculina', priceCents: 1500, slotMin: 15 },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { tenantId_name: { tenantId: defaultTenantId, name: service.name } },
      update: {},
      create: { ...service, tenantId: defaultTenantId },
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
      where: { tenantId_weekday: { tenantId: defaultTenantId, weekday: bh.weekday } },
      update: bh,
      create: { ...bh, tenantId: defaultTenantId },
    })
  }
  console.log('✅ Default business hours created')

  for (const bh of businessHours) {
    await prisma.barberBusinessHours.upsert({
      where: { barberId_weekday: { barberId: barber.id, weekday: bh.weekday } },
      update: { ...bh, tenantId: defaultTenantId },
      create: { ...bh, tenantId: defaultTenantId, barberId: barber.id },
    })
  }
  console.log('✅ Default barber hours created')

  // Create default settings
  await prisma.settings.upsert({
    where: { tenantId_id: { tenantId: defaultTenantId, id: 'default' } },
    update: {},
    create: {
      id: 'default',
      tenantId: defaultTenantId,
      minNoticeHours: 2,
      maxDaysAhead: 60,
      companyName: 'Seu Carlos Barbearia',
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
