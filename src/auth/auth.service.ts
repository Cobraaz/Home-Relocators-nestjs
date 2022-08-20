import { LoginUserInput } from './dto/login-user.input';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import argon from 'argon2';
import CryptoJS from 'crypto-js';
import { PrismaService } from '../prisma/prisma.service';
import { Tokens } from './types/tokens.type';
import { JwtPayload } from './types/jwtPayload.type';
import { SignUpUserInput } from './dto/signup-user.input';
import { customError } from '../utils/CustomError';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signupLocal(signUpUserInput: SignUpUserInput): Promise<Tokens | void> {
    let { name, email, password } = signUpUserInput;
    const findEmail = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (findEmail) {
      return customError([
        {
          property: 'email',
          constraints: 'Email already exists',
        },
      ]);
    }
    password = await argon.hash(password);

    const user = await this.prisma.user
      .create({
        data: {
          name,
          email,
          password,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('Credentials incorrect');
          }
        }
        throw error;
      });

    const { access_token, refresh_token } = await this.getTokens(
      user.uniqueID,
      user.email,
      user.role,
    );

    await this.updateRtHash(user.uniqueID, access_token, refresh_token);

    return {
      access_token,
      refresh_token,
      uniqueID: user.uniqueID,
    };
  }
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
      user.role,
    );
    await this.updateRtHash(user.uniqueID, access_token, refresh_token);

    return {
      access_token,
      refresh_token,
      uniqueID: user.uniqueID,
    };
  }

  async logout(uniqueID: string): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        uniqueID,
      },
      data: {
        hashedRt: null,
        hashedAt: null,
      },
    });
    return true;
  }

  async refreshTokens(uniqueID: string, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        uniqueID,
      },
    });
    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const { access_token, refresh_token } = await this.getTokens(
      user.uniqueID,
      user.email,
      user.role,
    );
    await this.updateRtHash(user.uniqueID, access_token, refresh_token);

    return {
      access_token,
      refresh_token,
      uniqueID: user.uniqueID,
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

  async getTokens(
    uniqueID: string,
    email: string,
    role: Role,
  ): Promise<Pick<Tokens, 'access_token' | 'refresh_token'>> {
    const encryptedEmail = CryptoJS.AES.encrypt(
      email,
      this.config.get<string>('CRYPTO_KEY'),
    ).toString();

    const jwtPayload: JwtPayload = {
      sub: uniqueID,
      email: encryptedEmail,
      role,
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

  async validToken(email: string, at: string) {
    const { hashedAt } = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        hashedAt: true,
      },
    });
    const atMatches = await argon.verify(hashedAt, at);
    if (!atMatches) {
      throw new ForbiddenException('Access Denied');
    }
  }
}
