import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

interface UserEmailContext {
  name: string;
  email: string;
}

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmailConfirmation(user: UserEmailContext, otp: string) {
    const info = await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Nice App! Confirm your Email',
      template: './emailVerified', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.name,
        title: 'PcHub',
        otp,
      },
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  async sendResetPasswordConfirmation(user: UserEmailContext, otp: string) {
    const info = await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Reset Your Password',
      template: './resetPassword', // `.hbs` extension is appended automatically
      context: {
        name: user.name,
        title: 'PcHub',
        otp,
      },
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
}
