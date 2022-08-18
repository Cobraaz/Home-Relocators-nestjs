import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import CryptoJS from 'crypto-js';
import { JwtPayload } from '../types';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('AT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    let { email, sub, role } = payload;
    const decryptedEmail = CryptoJS.AES.decrypt(
      email,
      this.config.get<string>('CRYPTO_KEY'),
    ).toString(CryptoJS.enc.Utf8);
    return {
      email: decryptedEmail,
      role,
      sub,
    };
  }
}
