import { LoginUserInput } from './dto/login-user.input';
import { ForbiddenException, Injectable } from '@nestjs/common';
import argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService, // private jwtService: JwtService,
  ) // private config: ConfigService,
  {}
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

    // const tokens = await this.getTokens(user.id, user.email);
    const tokens = {
      access_token: 'access_token',
      refresh_token: 'refresh_token',
    };
    // await this.updateRtHash(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user,
    };
  }
}
