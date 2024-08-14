import { Module, DynamicModule, Global } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

@Global()
@Module({})
export class RedisModule {
    static forRoot(options: RedisOptions): DynamicModule {
        return {
            module: RedisModule,
            providers: [
                {
                    provide: 'REDIS_OPTIONS',
                    useValue: options,
                },
                {
                    provide: 'REDIS_CLIENT',
                    useFactory: (redisOptions: RedisOptions) => new Redis(redisOptions),
                    inject: ['REDIS_OPTIONS'],
                },
            ],
            exports: ['REDIS_CLIENT'],
        };
    }
}
