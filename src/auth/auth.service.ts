import { UsersService } from './../users/users.service';
import { ONE_HOUR, SEVEN_DAYS } from './../common/constants';
import { CacheService } from '../config/cache/cache.service';
import { LoginUserInput } from './dto/login-user.input';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import argon from 'argon2';
import CryptoJS from 'crypto-js';
import { PrismaService } from '../config/prisma/prisma.service';
import { TokensResponse } from './entities/token.entity-response';
import { JwtPayload } from './types/jwtPayload.type';
import { SignUpUserInput } from './dto/signup-user.input';
import { customError } from '../utils/CustomError';
import { Role, User } from '@prisma/client';
import { EmailActivationResponse } from './entities/emailActivation-response.entity';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { MailService } from 'src/services/mail/mail.service';
import { EmailActivationInput } from './dto/emailActivation.input';
import { ResetPasswordInput } from './dto/resetPassword.input';
import { selectUser } from 'src/common/helpers';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
    private cache: CacheService,
  ) {}

  async signupLocal(
    signUpUserInput: SignUpUserInput,
  ): Promise<EmailActivationResponse> {
    const { name, email } = signUpUserInput;
    let { password } = signUpUserInput;
    const findEmail = await this.prisma.user.findFirst({
      where: { email },
      select: {
        email: true,
      },
    });

    if (findEmail) {
      customError([
        {
          property: 'email',
          constraints: 'Email already exists',
        },
      ]);
    }
    password = await argon.hash(password);

    const activation_token = await this.getActivationToken(email);

    await this.prisma.emailActivation.deleteMany({
      where: {
        email,
      },
    });

    const activationToken = await argon.hash(activation_token);

    await this.prisma.emailActivation.create({
      data: {
        name,
        email,
        password,
        activationToken,
      },
    });

    this.mailService.sendEmailConfirmation(signUpUserInput, activation_token);

    return {
      msg: 'Register Success! Please activate your email to start.',
    };
  }

  async activateAccount(token: EmailActivationInput) {
    const { activation_token } = token;
    console.log(activation_token);
    try {
      const verifyActivationToken: { email: string } =
        await this.jwtService.verifyAsync(activation_token, {
          secret: this.config.get<string>('ACTIVATION_TOKEN_SECRET'),
        });

      if (!verifyActivationToken && !verifyActivationToken.email) {
        throw new ForbiddenException('Token Expired');
      }

      const decryptedEmail = CryptoJS.AES.decrypt(
        verifyActivationToken.email,
        this.config.get<string>('CRYPTO_KEY'),
      ).toString(CryptoJS.enc.Utf8);

      const emailValidationDetail = await this.prisma.emailActivation.delete({
        where: {
          email: decryptedEmail,
        },
      });

      const { name, email, activationToken, password } = emailValidationDetail;

      const verifyTokenWithDB = await argon.verify(
        activationToken,
        activation_token,
      );

      if (!verifyTokenWithDB) {
        throw new ForbiddenException('Access Denied');
      }

      const user = await this.prisma.user
        .create({
          data: {
            name,
            email,
            password,
          },
          select: selectUser,
        })
        .catch((error) => {
          if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
              throw new ForbiddenException('Credentials incorrect');
            }
          }
          throw error;
        });

      this.cache.set(`user_${user.uniqueID}`, user, ONE_HOUR);

      const { access_token, refresh_token } = await this.getTokensResponse(
        user.uniqueID,
        user.email,
        user.role,
      );

      await this.updateHash(user.uniqueID, access_token, refresh_token);

      return {
        access_token,
        refresh_token,
        uniqueID: user.uniqueID,
        msg: 'Account has been activated!',
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async signinLocal(loginUserInput: LoginUserInput) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginUserInput.email,
        deleted: false,
      },
      select: {
        email: true,
        password: true,
        uniqueID: true,
        role: true,
      },
    });

    if (!user) {
      customError([
        {
          property: 'email',
          constraints: 'Email not found',
        },
      ]);
    }

    const passwordMatches = await argon.verify(
      user.password,
      loginUserInput.password,
    );
    if (!passwordMatches) {
      customError([
        {
          property: 'password',
          constraints: 'Password Incorrect',
        },
      ]);
    }

    try {
      const { access_token, refresh_token } = await this.getTokensResponse(
        user.uniqueID,
        user.email,
        user.role,
      );
      await this.updateHash(user.uniqueID, access_token, refresh_token);
      return {
        access_token,
        refresh_token,
        uniqueID: user.uniqueID,
        msg: 'Login Success!',
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Something went wrong.');
    }
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
    this.cache.del(`hashedAT_${uniqueID}`);
    this.cache.del(`hashedRT_${uniqueID}`);
    this.cache.del(`user_${uniqueID}`);

    return true;
  }

  async refreshTokens(uniqueID: string, rt: string): Promise<TokensResponse> {
    let user: Partial<User> = {};
    const cacheToken = await this.cache.get(`hashedRT_${uniqueID}`);
    const cacheUser = (await this.cache.get(`user_${uniqueID}`)) as User;

    if (cacheToken && Object.keys(cacheToken).length && cacheUser.email) {
      user = {
        ...cacheUser,
        hashedRt: cacheToken,
      };
    } else {
      user = await this.prisma.user.findUnique({
        where: {
          uniqueID,
        },
        select: selectUser,
      });

      this.cache.set(`hashedRT_${uniqueID}`, user.hashedRt, SEVEN_DAYS);
      this.cache.set(`hashedAT_${uniqueID}`, user.hashedAt, ONE_HOUR);
      this.cache.set(`user_${uniqueID}`, user, ONE_HOUR);
    }

    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const { access_token, refresh_token } = await this.getTokensResponse(
      user.uniqueID,
      user.email,
      user.role,
    );
    await this.updateHash(user.uniqueID, access_token, refresh_token);

    return {
      access_token,
      refresh_token,
      uniqueID: user.uniqueID,
    };
  }

  async forgetPassword(email: string) {
    const user = await this.prisma.user
      .findFirstOrThrow({
        where: {
          email,
        },
        select: {
          name: true,
          uniqueID: true,
          email: true,
        },
      })
      .catch((error) => {
        console.log(error.code);
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundException('User not found');
          }
        }
        throw error;
      });

    const resetPasswordToken = await this.getResetingToken(user.uniqueID);
    this.mailService.sendResetPasswordConfirmation(user, resetPasswordToken);
    return {
      msg: 'Reset the password, please check your email.',
    };
  }

  async resetPassword(resetPasswordInput: ResetPasswordInput) {
    const { resetPassword_token } = resetPasswordInput;
    let { password } = resetPasswordInput;

    const resetPasswordToken: { sub: string } = await this.jwtService
      .verifyAsync(resetPassword_token, {
        secret: this.config.get<string>('ACTIVATION_TOKEN_SECRET'),
      })
      .catch(() => {
        throw new ForbiddenException('Token Expired');
      });

    if (!resetPasswordToken && !resetPasswordToken.sub) {
      throw new ForbiddenException('Token Expired');
    }
    const { sub: uniqueID } = resetPasswordToken;
    password = await argon.hash(password);
    const user = await this.prisma.user
      .update({
        where: {
          uniqueID,
        },
        data: {
          password,
        },
        select: selectUser,
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('Credentials incorrect');
          }
        }
        throw error;
      });

    try {
      this.cache.set(`user_${user.uniqueID}`, user, ONE_HOUR);

      const { access_token, refresh_token } = await this.getTokensResponse(
        user.uniqueID,
        user.email,
        user.role,
      );

      await this.updateHash(user.uniqueID, access_token, refresh_token);

      return {
        access_token,
        refresh_token,
        uniqueID: user.uniqueID,
        msg: 'Password Reset!',
      };
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async validToken(uniqueID: string, at: string) {
    let hashedAt = '';
    const cacheToken = await this.cache.get(`hashedAT_${uniqueID}`);
    if (cacheToken && Object.keys(cacheToken).length) {
      hashedAt = cacheToken;
    } else {
      const user = await this.prisma.user
        .findFirstOrThrow({
          where: {
            uniqueID,
            deleted: false,
          },
          select: {
            hashedAt: true,
          },
        })
        .catch((error) => {
          if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
              throw new NotFoundException('User not found');
            }
          }
          throw error;
        });
      hashedAt = user.hashedAt;
    }
    try {
      if (hashedAt) {
        const atMatches = await argon.verify(hashedAt, at);
        if (!atMatches) {
          throw new ForbiddenException('Access Denied');
        }
      } else {
        throw new ForbiddenException('Access Denied');
      }
    } catch (error) {
      throw new ForbiddenException('Access Denied');
    }
  }

  private async updateHash(
    uniqueID: string,
    at: string,
    rt: string,
  ): Promise<void> {
    await this.users.findOne({ uniqueID });
    try {
      const hashedRt = await argon.hash(rt);
      const hashedAt = await argon.hash(at);
      const data = {
        hashedRt,
        hashedAt,
      };

      const user = await this.prisma.user.update({
        where: {
          uniqueID,
        },
        data,
        select: { ...selectUser, hashedRt: true, hashedAt: true },
      });

      this.cache.set(`hashedAT_${uniqueID}`, user.hashedAt, ONE_HOUR);
      this.cache.set(`hashedRT_${uniqueID}`, user.hashedRt, SEVEN_DAYS);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  private async getTokensResponse(
    uniqueID: string,
    email: string,
    role: Role,
  ): Promise<Pick<TokensResponse, 'access_token' | 'refresh_token'>> {
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
        expiresIn: this.config.get<string>('AT_EXPIRES'),
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('RT_SECRET'),
        expiresIn: this.config.get<string>('RT_EXPIRES'),
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  private async getActivationToken(email: string): Promise<string> {
    const encryptedEmail = CryptoJS.AES.encrypt(
      email,
      this.config.get<string>('CRYPTO_KEY'),
    ).toString();
    const jwtPayload = {
      email: encryptedEmail,
    };

    const activation_token = await this.jwtService.signAsync(jwtPayload, {
      secret: this.config.get<string>('ACTIVATION_TOKEN_SECRET'),
      expiresIn: this.config.get<string>('ACTIVATION_TOKEN_EXPIRES'),
    });

    return activation_token;
  }
  private async getResetingToken(uniqueID: string): Promise<string> {
    const jwtPayload = {
      sub: uniqueID,
    };

    const activation_token = await this.jwtService.signAsync(jwtPayload, {
      secret: this.config.get<string>('ACTIVATION_TOKEN_SECRET'),
      expiresIn: this.config.get<string>('ACTIVATION_TOKEN_EXPIRES'),
    });

    return activation_token;
  }
}
