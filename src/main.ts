import { ValidationError } from 'class-validator';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomError } from './utils/CustomError';

const formatValidationError = (errors: ValidationError[]) => {
  return CustomError(errors, new BadRequestException());

  // return new BadRequestException({});
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: formatValidationError,
      forbidUnknownValues: false,
    }),
  );
  const PORT = configService.get<number>('PORT');
  await app.listen(PORT);
}
bootstrap();
