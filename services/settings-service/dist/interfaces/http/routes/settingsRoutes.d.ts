import { FastifyInstance } from 'fastify';
import { SettingsController } from '../controllers/SettingsController.js';
export declare function publicRoutes(app: FastifyInstance, c: SettingsController): Promise<void>;
export declare function adminRoutes(app: FastifyInstance, c: SettingsController): Promise<void>;
