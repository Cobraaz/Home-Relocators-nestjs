import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import CryptoJS from 'crypto-js';
import { JwtPayload } from '../types/jwtPayload.type';
import { AuthService } from '../auth.service';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private config: ConfigService, private moduleRef: ModuleRef) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('AT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtPayload) {
    const accessToken = request.headers.authorization.split(' ')[1];
    const { email, sub, role } = payload;
    const decryptedEmail = CryptoJS.AES.decrypt(
      email,
      this.config.get<string>('CRYPTO_KEY'),
    ).toString(CryptoJS.enc.Utf8);

    const contextId = ContextIdFactory.getByRequest(request);
    const authService = await this.moduleRef.resolve(AuthService, contextId);
    await authService.validToken(decryptedEmail, accessToken);

    return {
      email: decryptedEmail,
      role,
      sub,
    };
  }
}
