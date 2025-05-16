import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

interface UserPayload {
  userId: string;
  username: string;
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isUserPayload(obj: unknown): obj is UserPayload {
  return (
    isNonNullObject(obj) &&
    typeof obj.userId === 'string' &&
    typeof obj.username === 'string'
  );
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserPayload | undefined => {
    const ctx: GqlExecutionContext = GqlExecutionContext.create(context);
    const contextObject: unknown = ctx.getContext();

    if (isNonNullObject(contextObject) && 'req' in contextObject) {
      const request: unknown = contextObject.req;

      if (isNonNullObject(request) && 'user' in request) {
        const user: unknown = request.user;

        if (isUserPayload(user)) {
          return {
            userId: user.userId,
            username: user.username,
          };
        }
      }
    }

    return undefined;
  },
);
