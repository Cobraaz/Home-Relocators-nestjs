import { LoginUserInput } from './dto/login-user.input';
import { ForbiddenException, Injectable } from '@nestjs/common';
import argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Tokens, JwtPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}
  async signinLocal(loginUserInput: LoginUserInput) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginUserInput.email,
      },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches = await argon.verify(
      user.password,
      loginUserInput.password,
    );
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const { access_token, refresh_token } = await this.getTokens(
      user.uniqueID,
      user.email,
    );
    await this.updateRtHash(user.uniqueID, access_token, refresh_token);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  async updateRtHash(uniqueID: string, at: string, rt: string): Promise<void> {
    const hashedRt = await argon.hash(rt);
    const hashedAt = await argon.hash(at);
    await this.prisma.user.update({
      where: {
        uniqueID,
      },
      data: {
        hashedRt,
        hashedAt,
      },
    });
  }

  async getTokens(uniqueID: string, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: uniqueID,
      email: email,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('AT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('RT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
