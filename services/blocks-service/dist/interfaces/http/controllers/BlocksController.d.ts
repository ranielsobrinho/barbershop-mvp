import { FastifyRequest, FastifyReply } from 'fastify';
import { ListBlocksUseCase } from '../../../usecases/ListBlocksUseCase.js';
import { CreateBlockUseCase } from '../../../usecases/CreateBlockUseCase.js';
import { DeleteBlockUseCase } from '../../../usecases/DeleteBlockUseCase.js';
export declare class BlocksController {
    private readonly list;
    private readonly create;
    private readonly remove;
    constructor(list: ListBlocksUseCase, create: CreateBlockUseCase, remove: DeleteBlockUseCase);
    listAll(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    createBlock(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    deleteBlock(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
