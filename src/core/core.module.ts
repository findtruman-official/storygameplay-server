import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { Web3Service } from './web3/web3.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mysql',
          host: configService.get('DB_HOST'),
          port: configService.get<number>('DB_PORT', { infer: true }),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: configService.get<boolean>('DB_SYNC', { infer: true }),
        };
      },
    }),

    ScheduleModule.forRoot(),
  ],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
