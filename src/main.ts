import { ValidationError } from 'class-validator';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { AppModule } from './app.module';
import { CustomError } from './utils/CustomError';
import { json, urlencoded } from 'express';

const formatValidationError = (errors: ValidationError[]) => {
  return CustomError(errors, new BadRequestException());

  // return new BadRequestException({});
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
    },
  });
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT');

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: formatValidationError,
      forbidUnknownValues: false,
    }),
  );
  app.use(compression());

  await app.listen(PORT);
}
bootstrap();
