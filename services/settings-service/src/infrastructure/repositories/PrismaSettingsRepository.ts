import prisma from '../database/prisma.js';
import { getTenantContext } from '@barbershop/tenant-context';

const tenantId = () => getTenantContext()?.tenantId || 'tenant_seu_carlos';

export interface SettingsRow {
  id: string; minNoticeHours: number; maxDaysAhead: number;
  companyName: string;
  heroText: string | null; heroImageUrl: string | null;
}

export class PrismaSettingsRepository {
  async get(): Promise<SettingsRow> {
    let s = await prisma.settings.findFirst();
    if (!s) {
      s = await prisma.settings.create({
        data: { id: 'default', tenantId: tenantId(), minNoticeHours: 2, maxDaysAhead: 60, companyName: 'Seu Carlos Barbearia', heroText: null, heroImageUrl: null },
      });
    }
    return s;
  }

  async update(data: { minNoticeHours?: number; maxDaysAhead?: number; companyName?: string; heroText?: string | null; heroImageUrl?: string | null; }): Promise<SettingsRow> {
    const current = await this.get();
    return prisma.settings.update({ where: { tenantId_id: { tenantId: tenantId(), id: current.id } }, data });
  }
}
