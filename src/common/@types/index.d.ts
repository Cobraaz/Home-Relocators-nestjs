import express from 'express';

declare global {
  interface GqlExecutionContext {
    req: express.Request;
    res: express.Response;
  }

  interface Request {
    cookies: {
      __pchub_refresh_token__?: string;
    };
  }
}
