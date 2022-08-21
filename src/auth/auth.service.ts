import { LoginUserInput } from './dto/login-user.input';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  // BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import argon from 'argon2';
import CryptoJS from 'crypto-js';
import { PrismaService } from '../prisma/prisma.service';
import { TokensResponse } from './entities/token.entity-response';
import { JwtPayload } from './types/jwtPayload.type';
import { SignUpUserInput } from './dto/signup-user.input';
import { customError } from '../utils/CustomError';
import { Role } from '@prisma/client';
import { EmailActivationResponse } from './entities/emailActivation-response.entity';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { MailService } from 'src/mail/mail.service';
import { EmailActivationInput } from './dto/emailActivation.input';
import { ResetPasswordInput } from './dto/resetPassword.input';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async signupLocal(
    signUpUserInput: SignUpUserInput,
  ): Promise<EmailActivationResponse> {
    const { name, email } = signUpUserInput;
    let { password } = signUpUserInput;
    const findEmail = await this.userService.findOne(
      {
        email,
      },
      {
        email: true,
      },
    );

    console.log('findEmail', findEmail);

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
        })
        .catch((error) => {
          if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
              throw new ForbiddenException('Credentials incorrect');
            }
          }
          throw error;
        });

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
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginUserInput.email,
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

  async refreshTokens(uniqueID: string, rt: string): Promise<TokensResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        uniqueID,
      },
    });
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
    const user = await this.prisma.user.findFirstOrThrow({
      where: {
        email,
      },
    });
    const resetPasswordToken = await this.getActivationToken(user.email);
    this.mailService.sendResetPasswordConfirmation(user, resetPasswordToken);

    return {
      msg: 'Reset the password, please check your email.',
    };
  }

  async resetPassword(resetPasswordInput: ResetPasswordInput) {
    const { resetPassword_token, password } = resetPasswordInput;

    try {
      const resetPasswordToken: { email: string } =
        await this.jwtService.verifyAsync(resetPassword_token, {
          secret: this.config.get<string>('ACTIVATION_TOKEN_SECRET'),
        });

      if (!resetPasswordToken && !resetPasswordToken.email) {
        throw new ForbiddenException('Token Expired');
      }

      const decryptedEmail = CryptoJS.AES.decrypt(
        resetPasswordToken.email,
        this.config.get<string>('CRYPTO_KEY'),
      ).toString(CryptoJS.enc.Utf8);

      const user = await this.prisma.user
        .update({
          where: {
            email: decryptedEmail,
          },
          data: {
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

  private async updateHash(
    uniqueID: string,
    at: string,
    rt: string,
  ): Promise<void> {
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

  async validToken(email: string, at: string) {
    try {
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
    } catch (error) {
      throw new ForbiddenException('Access Denied');
    }
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
}
