import { TokensResponse } from '../entities/token.entity-response';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Response } from 'express';

@Injectable()
export class RTClearInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TokensResponse> {
    const ctx = GqlExecutionContext.create(context);
    const response = ctx.getContext().res as Response;
    response.clearCookie('__pchub_refresh_token__', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(1),
    });
    return next.handle();
  }
}
