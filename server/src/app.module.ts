import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { GraphQLError } from 'graphql';
import { ValidationError } from 'class-validator';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
  ],
})
export class AppModule {}
