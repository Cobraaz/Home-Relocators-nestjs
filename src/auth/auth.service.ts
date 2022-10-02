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
import { PrismaService } from '../config/database/prisma/prisma.service';
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
import otpGenerator from 'otp-generator';
import { otpExpirationTime } from 'src/common/helpers/helperFunctions';

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
      where: { email, deleted: false },
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

    const generatedActivationOtp = await this.getActivationOtp();
    const expirationAt = otpExpirationTime(10);

    await this.prisma.emailActivation.deleteMany({
      where: {
        email,
      },
    });

    const activationOtp = await argon.hash(generatedActivationOtp);

    await this.prisma.emailActivation.create({
      data: {
        name,
        email,
        password,
        activationOtp,
        expirationAt,
      },
    });

    this.mailService.sendEmailConfirmation(
      signUpUserInput,
      generatedActivationOtp,
    );

    return {
      msg: 'Register Success! Please activate your email to start.',
    };
  }

  async activateAccount(emailActivationInput: EmailActivationInput) {
    console.log(emailActivationInput);

    const findEmailActivation = await this.prisma.emailActivation
      .findUniqueOrThrow({
        where: {
          email: emailActivationInput.email,
        },
      })
      .catch((error) => {
        console.error(error);
        throw new InternalServerErrorException();
      });

    if (
      !findEmailActivation ||
      new Date() > new Date(findEmailActivation.expirationAt)
    ) {
      customError([
        {
          property: 'activationOtp',
          constraints: 'OTP Expired',
        },
      ]);
    }

    const { name, email, activationOtp, password } = findEmailActivation;

    const verifyOtp = await argon.verify(
      activationOtp,
      emailActivationInput.activationOtp,
    );

    if (!verifyOtp) {
      customError([
        {
          property: 'activationOtp',
          constraints: 'Incorrect OTP',
        },
      ]);
    }

    await this.prisma.emailActivation
      .delete({
        where: {
          email: emailActivationInput.email,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new ForbiddenException('Access Denied');
          }
        }
        console.error(error);
        throw new InternalServerErrorException();
      });

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
        throw new InternalServerErrorException();
      });

    try {
      this.cache.set(`user_${user.id}`, user, ONE_HOUR);

      const { access_token, refresh_token } = await this.getTokensResponse(
        user.id,
        user.email,
        user.role,
      );

      await this.updateHash(user.id, access_token, refresh_token);

      return {
        access_token,
        refresh_token,
        id: user.id,
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
        id: true,
        role: true,
      },
    });

    if (!user) {
      customError([
        {
          property: 'email',
          constraints: "Email doesn't exists",
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
        user.id,
        user.email,
        user.role,
      );
      await this.updateHash(user.id, access_token, refresh_token);
      return {
        access_token,
        refresh_token,
        id: user.id,
        msg: 'Login Success!',
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  async logout(id: string): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id,
      },
      data: {
        hashedRt: null,
        hashedAt: null,
      },
    });
    this.cache.del(`hashedAT_${id}`);
    this.cache.del(`hashedRT_${id}`);
    this.cache.del(`user_${id}`);

    return true;
  }

  async refreshTokens(id: string, rt: string): Promise<TokensResponse> {
    let user: Partial<User> = {};
    const cacheToken = await this.cache.get(`hashedRT_${id}`);
    const cacheUser = (await this.cache.get(`user_${id}`)) as User;

    if (cacheToken && Object.keys(cacheToken).length && cacheUser.email) {
      user = {
        ...cacheUser,
        hashedRt: cacheToken,
      };
    } else {
      user = await this.prisma.user.findFirst({
        where: {
          id,
          deleted: false,
        },
        select: selectUser,
      });

      this.cache.set(`hashedRT_${id}`, user.hashedRt, SEVEN_DAYS);
      this.cache.set(`hashedAT_${id}`, user.hashedAt, ONE_HOUR);
      this.cache.set(`user_${id}`, user, ONE_HOUR);
    }

    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const { access_token, refresh_token } = await this.getTokensResponse(
      user.id,
      user.email,
      user.role,
    );
    await this.updateHash(user.id, access_token, refresh_token);

    return {
      access_token,
      refresh_token,
      id: user.id,
    };
  }

  async forgetPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deleted: false,
      },
      select: {
        name: true,
        id: true,
        email: true,
      },
    });

    if (!user) {
      customError([
        {
          property: 'email',
          constraints: "Email doesn't exists",
        },
      ]);
    }

    await this.prisma.forgetPassword.deleteMany({
      where: {
        userEmail: user.email,
      },
    });

    const resetPasswordOtp = await this.getResetingOtp();
    const resetingOtp = await argon.hash(resetPasswordOtp);
    const expirationAt = otpExpirationTime(10);
    await this.prisma.forgetPassword.create({
      data: {
        userEmail: user.email,
        resetingOtp,
        expirationAt,
      },
    });

    this.mailService.sendResetPasswordConfirmation(user, resetPasswordOtp);
    return {
      msg: 'Reset the password, please check your email.',
    };
  }

  async resetPassword(resetPasswordInput: ResetPasswordInput) {
    const findEmailReseting = await this.prisma.forgetPassword
      .findUniqueOrThrow({
        where: {
          userEmail: resetPasswordInput.email,
        },
        select: {
          resetingOtp: true,
          expirationAt: true,
          user: {
            select: { id: true },
          },
        },
      })
      .catch((error) => {
        console.error(error);
        throw new InternalServerErrorException();
      });

    if (
      !findEmailReseting ||
      new Date() > new Date(findEmailReseting.expirationAt)
    ) {
      customError([
        {
          property: 'resetingOtp',
          constraints: 'OTP Expired',
        },
      ]);
    }

    let { password } = resetPasswordInput;

    const verifyOtp = await argon.verify(
      findEmailReseting.resetingOtp,
      resetPasswordInput.resetingOtp,
    );

    if (!verifyOtp) {
      customError([
        {
          property: 'resetingOtp',
          constraints: 'Incorrect OTP',
        },
      ]);
    }

    const { id } = findEmailReseting.user;
    await this.users.findOne({ id });
    password = await argon.hash(password);

    await this.prisma.forgetPassword
      .delete({
        where: {
          userEmail: resetPasswordInput.email,
        },
      })
      .catch((error) => {
        console.error(error);
        throw new InternalServerErrorException();
      });

    const user = await this.prisma.user
      .update({
        where: {
          id,
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
      this.cache.set(`user_${user.id}`, user, ONE_HOUR);

      const { access_token, refresh_token } = await this.getTokensResponse(
        user.id,
        user.email,
        user.role,
      );

      await this.updateHash(user.id, access_token, refresh_token);

      return {
        access_token,
        refresh_token,
        id: user.id,
        msg: 'Password Reset!',
      };
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async validToken(id: string, at: string) {
    let hashedAt = '';
    const cacheToken = await this.cache.get(`hashedAT_${id}`);
    if (cacheToken && Object.keys(cacheToken).length) {
      hashedAt = cacheToken;
    } else {
      const user = await this.prisma.user
        .findFirstOrThrow({
          where: {
            id,
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

  private async updateHash(id: string, at: string, rt: string): Promise<void> {
    await this.users.findOne({ id });
    try {
      const hashedRt = await argon.hash(rt);
      const hashedAt = await argon.hash(at);
      const data = {
        hashedRt,
        hashedAt,
      };

      const user = await this.prisma.user.update({
        where: {
          id,
        },
        data,
        select: { ...selectUser, hashedRt: true, hashedAt: true },
      });

      this.cache.set(`hashedAT_${id}`, user.hashedAt, ONE_HOUR);
      this.cache.set(`hashedRT_${id}`, user.hashedRt, SEVEN_DAYS);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  private async getTokensResponse(
    id: string,
    email: string,
    role: Role,
  ): Promise<Pick<TokensResponse, 'access_token' | 'refresh_token'>> {
    const encryptedEmail = CryptoJS.AES.encrypt(
      email,
      this.config.get<string>('CRYPTO_KEY'),
    ).toString();

    const jwtPayload: JwtPayload = {
      sub: id,
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

  private async getActivationOtp(): Promise<string> {
    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    }) as string;

    return otp;
  }

  private async getResetingOtp(): Promise<string> {
    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    }) as string;

    return otp;
  }
}
