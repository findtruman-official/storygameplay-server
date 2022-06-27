import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const svc = app.get(ConfigService);
  const port = svc.get<number>('PORT', { infer: true });
  await app.listen(port, () => {
    logger.log(`server listen at ${port}`);
  });
}
bootstrap();
