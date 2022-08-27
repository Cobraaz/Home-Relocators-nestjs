// An example of such a middleware.
import { Prisma } from '@prisma/client';

export function SoftFetchMiddlware<
  T extends Prisma.BatchPayload = Prisma.BatchPayload,
>(): Prisma.Middleware {
  return async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<T>,
  ): Promise<T> => {
    if (params.model == 'User') {
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        // Change to findFirst - you cannot filter
        // by anything except ID / unique with findUnique
        params.action = 'findFirst';
        // Add 'deleted' filter
        // ID filter maintained
        params.args.where['deleted'] = false;
      }
      if (params.action === 'findMany') {
        // Find many queries
        if (params.args.where) {
          if (params.args.where.deleted == undefined) {
            // Exclude deleted records if they have not been explicitly requested
            params.args.where['deleted'] = false;
          }
        } else {
          params.args['where'] = { deleted: false };
        }
      }
    }
    return await next(params);
  };
}
