import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const logger = new Logger();

async function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('FindTruman Co-Creation Api')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  logger.log('Swagger API Doc enabled at "/api-doc"');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: { origin: '*' } });

  const configService = app.get(ConfigService);

  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', {
    infer: true,
  });
  if (swaggerEnabled) {
    setupSwagger(app);
  }

  const port = configService.get<number>('PORT', { infer: true });
  await app.listen(port, () => {
    logger.log(`server listen at ${port}`);
  });
}
bootstrap();
