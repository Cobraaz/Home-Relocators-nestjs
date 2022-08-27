// An example of such a middleware.
import { Prisma } from '@prisma/client';

export function SoftDeleteMiddlware<
  T extends Prisma.BatchPayload = Prisma.BatchPayload,
>(): Prisma.Middleware {
  return async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<T>,
  ): Promise<T> => {
    if (params.model == 'User') {
      if (params.action == 'delete') {
        // Delete queries
        // Change action to an update
        params.action = 'update';
        params.args['data'] = { deleted: true, deletedAt: new Date() };
      }
      if (params.action == 'deleteMany') {
        // Delete many queries
        params.action = 'updateMany';
        if (params.args.data != undefined) {
          params.args.data['deleted'] = true;
        } else {
          params.args['data'] = { deleted: true, deletedAt: new Date() };
        }
      }
    }
    return await next(params);
  };
}
