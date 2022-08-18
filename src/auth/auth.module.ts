import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy, RtStrategy } from './strategies';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  providers: [AuthResolver, AuthService, AtStrategy, RtStrategy],
})
export class AuthModule {}
