export declare const env: {
    nodeEnv: string;
    port: number;
    logLevel: string;
    grpc: {
        port: number;
        tls: {
            keyPath: string;
            certPath: string;
        } | undefined;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    cookieSecret: string;
    databaseUrl: string;
};
//# sourceMappingURL=env.d.ts.map