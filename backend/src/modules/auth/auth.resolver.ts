import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput, AuthPayload, UserPayload, LogoutPayload, ChangePasswordInput, ChangePasswordPayload, RegisterUserInput, RegisterUserPayload } from './dto/auth.dto';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { Audit } from '../../decorators/audit.decorator';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  @Audit({ 
    action: 'LOGIN', 
    description: 'User attempted to login',
    includeRequest: false 
  })
  async login(@Args('input') loginInput: LoginInput): Promise<AuthPayload> {
    return this.authService.login(loginInput);
  }

  @Query(() => UserPayload)
  @UseGuards(GqlAuthGuard)
  async me(@Context() context: any): Promise<UserPayload> {
    return context.req.user;
  }

  @Mutation(() => AuthPayload)
  @UseGuards(GqlAuthGuard)
  async refreshToken(@Context() context: any): Promise<AuthPayload> {
    const userId = context.req.user.id;
    return this.authService.refreshToken(userId);
  }

  @Mutation(() => LogoutPayload)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'LOGOUT', 
    description: 'User logged out',
    includeRequest: false 
  })
  async logout(@Context() context: any): Promise<LogoutPayload> {
    // In a JWT-based system, logout is typically handled client-side
    // But we can log the logout event or invalidate tokens if needed
    const userId = context.req.user.id;
    console.log(`User ${userId} logged out at ${new Date().toISOString()}`);
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  @Mutation(() => ChangePasswordPayload)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'PASSWORD_CHANGE', 
    description: 'User changed their password',
    includeRequest: false 
  })
  async changePassword(
    @Args('input') changePasswordInput: ChangePasswordInput,
    @Context() context: any
  ): Promise<ChangePasswordPayload> {
    const userId = context.req.user.id;
    return this.authService.changePassword(userId, changePasswordInput);
  }

  @Mutation(() => ChangePasswordPayload)
  @UseGuards(GqlAuthGuard)
  async forcePasswordChange(
    @Args('input') changePasswordInput: ChangePasswordInput,
    @Context() context: any
  ): Promise<ChangePasswordPayload> {
    const userId = context.req.user.id;
    return this.authService.forcePasswordChange(userId, changePasswordInput);
  }

  @Mutation(() => RegisterUserPayload)
  @UseGuards(GqlAuthGuard)
  async registerUser(
    @Args('input') registerUserInput: RegisterUserInput,
    @Context() context: any
  ): Promise<RegisterUserPayload> {
    const createdById = context.req.user.id;
    return this.authService.registerUser(registerUserInput, createdById);
  }
}
