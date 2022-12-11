import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwtPayload.type';
import { JwtPayloadWithRt } from '../types/jwtPayloadWithRt.type';
import { Request } from 'express';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('RT_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: JwtPayload): JwtPayloadWithRt {
    const refreshToken = request.headers.authorization.split(' ')[1];

    if (!refreshToken) throw new ForbiddenException('Refresh token malformed');

    return {
      ...payload,
      refreshToken,
    };
  }
}
