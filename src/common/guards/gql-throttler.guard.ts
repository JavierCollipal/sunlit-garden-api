import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';

interface GqlContext {
  req: Request;
  res: Response;
}

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const skipResult = await super.shouldSkip(context);
    return skipResult;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    { limit, ttl }: ThrottlerLimitDetail,
  ): Promise<void> {
    await Promise.reject(
      new ThrottlerException(
        `Too many requests. Limit: ${limit} requests per ${ttl}ms`,
      ),
    );
  }

  getRequestResponse(context: ExecutionContext): {
    req: Request;
    res: Response;
  } {
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<GqlContext>();
      return { req: ctx.req, res: ctx.res };
    }
    const http = context.switchToHttp();
    return {
      req: http.getRequest(),
      res: http.getResponse(),
    };
  }
}
