import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy } from './strategies/at.strategy';
import { RtStrategy } from './strategies/rt.strategy';
import { UsersModule } from '../users/users.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [JwtModule.register({}), UsersModule, MailModule],
  providers: [AuthResolver, AuthService, AtStrategy, RtStrategy],
})
export class AuthModule {}
