import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { SoftDeleteMiddlware } from './middleware/soft-delete.middleware';
import { SoftFetchMiddlware } from './middleware/soft-fetch.middleware';
import { SoftUpdateMiddlware } from './middleware/soft-update.middleware';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const url = config.get<string>('DATABASE_URL');

    super({
      datasources: {
        db: {
          url,
        },
      },
    });
    // this.$use(SoftDeleteMiddlware());
    // this.$use(SoftFetchMiddlware());
    // this.$use(SoftUpdateMiddlware());
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // async middlware(params, next) {
  //   // Check incoming query type
  //   if (params.model == 'User') {
  //     if (params.action == 'delete') {
  //       // Delete queries
  //       // Change action to an update
  //       params.action = 'update';
  //       params.args['data'] = { deleted: true, deletedAt: new Date() };
  //     }
  //     if (params.action == 'deleteMany') {
  //       // Delete many queries
  //       params.action = 'updateMany';
  //       if (params.args.data != undefined) {
  //         params.args.data['deleted'] = true;
  //       } else {
  //         params.args['data'] = { deleted: true, deletedAt: new Date() };
  //       }
  //     }
  //   }
  //   return next(params);
  // }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // teardown logic
    return Promise.all([this.user.deleteMany()]);
  }
}
