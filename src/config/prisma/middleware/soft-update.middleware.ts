// An example of such a middleware.
import { Prisma } from '@prisma/client';
import { selectUser } from 'src/common/helpers';

export function SoftUpdateMiddlware<
  T extends Prisma.BatchPayload = Prisma.BatchPayload,
>(): Prisma.Middleware {
  return async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<T>,
  ): Promise<T> => {
    if (params.model == 'User') {
      if (params.action == 'update') {
        // Change to updateMany - you cannot filter
        // by anything except ID / unique with findUnique
        params.action = 'updateMany';
        // Add 'deleted' filter
        // ID filter maintained
        params.args.where['deleted'] = false;
      }
      if (params.action == 'updateMany') {
        if (params.args.where != undefined) {
          params.args.where['deleted'] = false;
        } else {
          params.args['where'] = { deleted: false };
        }
      }
    }
    return await next(params);
  };
}
