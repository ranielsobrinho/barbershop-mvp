export class ListActiveServicesUseCase {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async execute() {
        return this.serviceRepository.findAll(true);
    }
}
//# sourceMappingURL=ListActiveServicesUseCase.js.map