import { FastifyInstance } from 'fastify';
import { SchedulingController } from '../controllers/SchedulingController.js';
export declare function publicRoutes(app: FastifyInstance, c: SchedulingController): Promise<void>;
export declare function adminRoutes(app: FastifyInstance, c: SchedulingController): Promise<void>;
