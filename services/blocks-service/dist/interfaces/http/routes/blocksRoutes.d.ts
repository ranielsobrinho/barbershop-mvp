import { FastifyInstance } from 'fastify';
import { BlocksController } from '../controllers/BlocksController.js';
export declare function publicRoutes(app: FastifyInstance, c: BlocksController): Promise<void>;
export declare function adminRoutes(app: FastifyInstance, c: BlocksController): Promise<void>;
