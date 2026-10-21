import { ISettingsRepository, SettingsSnapshot } from '../../domain/repositories/ISettingsRepository.js';
export declare class PrismaSettingsRepository implements ISettingsRepository {
    get(): Promise<SettingsSnapshot>;
}
