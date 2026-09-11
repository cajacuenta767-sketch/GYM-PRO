import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  id: string;
  email: string;
  name: string;
  role: string;
  memberId?: string | null;
  staffId?: string | null;
  permissions: string[];
}

export const CurrentUser = createParamDecorator((data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user: JwtUser = request.user;
  return data ? user?.[data] : user;
});
