import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface GraphQLContext {
  req?: Request;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GraphQLContext>();
    return gqlContext.req as Request;
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = this.getRequest(context);
    const authorization = request.headers?.authorization;

    // Explicitly check for JWT token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        error: 'Unauthorized',
        statusCode: 401,
      });
    }

    return super.canActivate(context);
  }

  handleRequest(
    err: any,
    user: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _info?: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context?: ExecutionContext,
  ): any {
    if (err || !user) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        error: 'Unauthorized',
        statusCode: 401,
      });
    }
    return user;
  }
}
