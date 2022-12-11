import express from 'express';

declare global {
  interface GqlExecutionContext {
    req: express.Request;
    res: express.Response;
  }
}
