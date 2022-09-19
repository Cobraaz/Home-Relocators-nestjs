import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { GraphQLError } from 'graphql';
import { APP_GUARD } from '@nestjs/core';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { ApolloServerPluginCacheControl } from 'apollo-server-core/dist/plugin/cacheControl';

import { UsersModule } from './users/users.module';
import { PrismaModule } from './config/database/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './common/guards/at.guard';
import { RolesGuard } from './common/guards/role.guard';
import { CacheModule } from './config/cache/cache.module';
import { MailModule } from './services/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      sortSchema: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // playground: process.env.NODE_ENV === 'development',
      playground: true,
      introspection: true,
      cache: 'bounded',
      formatError: (err: GraphQLError) => {
        // if (err.originalError instanceof ArgumentValidationError) {
        // const errorMessage = err.extensions?.exception.validationErrors;

        // CustomError(errorMessage);
        // }
        return err;
      },
      cors: {
        credentials: true,
        origin: true,
      },
      context: ({ req, res }) => ({ req, res }),
      plugins: [
        ApolloServerPluginCacheControl({ defaultMaxAge: 10 }), // optional
        responseCachePlugin(),
      ],
    }),
    UsersModule,
    PrismaModule,
    AuthModule,
    CacheModule,
    MailModule,
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
