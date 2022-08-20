import { Tokens } from '../types/tokens.type';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { map, Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Response } from 'express';

@Injectable()
export class RTInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Tokens> {
    const ctx = GqlExecutionContext.create(context);
    const response = ctx.getContext().res as Response;

    return next.handle().pipe(
      map((data: Tokens) => {
        response.cookie(
          '__pchub_refresh_token__',
          'Bearer ' + data.refresh_token,
        );
        return data;
      }),
    );
  }
}
