import { FastifyInstance } from 'fastify';
import { BusinessHoursController } from '../controllers/BusinessHoursController.js';
export declare function publicRoutes(app: FastifyInstance, c: BusinessHoursController): Promise<void>;
export declare function adminRoutes(app: FastifyInstance, c: BusinessHoursController): Promise<void>;
