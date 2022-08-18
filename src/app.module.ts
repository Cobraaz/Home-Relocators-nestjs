import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { GraphQLError } from 'graphql';
import { ValidationError } from 'class-validator';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from './common/guards';
import { RolesGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      formatError: (err: GraphQLError) => {
        // if (err.originalError instanceof ArgumentValidationError) {
        // const errorMessage = err.extensions?.exception.validationErrors;

        // CustomError(errorMessage);
        // }
        return err;
      },
    }),
    UsersModule,
    PrismaModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
