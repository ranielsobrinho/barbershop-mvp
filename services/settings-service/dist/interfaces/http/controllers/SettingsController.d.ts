import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaSettingsRepository } from '../../../infrastructure/repositories/PrismaSettingsRepository.js';
export declare class SettingsController {
    private readonly repo;
    constructor(repo: PrismaSettingsRepository);
    get(_req: FastifyRequest, reply: FastifyReply): Promise<void>;
    update(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
