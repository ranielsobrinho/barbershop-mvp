import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaBusinessHoursRepository } from '../../../infrastructure/repositories/PrismaBusinessHoursRepository.js';
export declare class BusinessHoursController {
    private readonly repo;
    constructor(repo: PrismaBusinessHoursRepository);
    get(_req: FastifyRequest, reply: FastifyReply): Promise<void>;
    update(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
