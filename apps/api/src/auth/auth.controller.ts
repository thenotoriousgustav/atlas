import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN') || 'localhost';
    const isProd = process.env.NODE_ENV === 'production';
    const domain = cookieDomain === 'localhost' ? undefined : cookieDomain;

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearCookies(res: Response) {
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN') || 'localhost';
    const domain = cookieDomain === 'localhost' ? undefined : cookieDomain;

    res.clearCookie('access_token', { domain, httpOnly: true, sameSite: 'lax' });
    res.clearCookie('refresh_token', { domain, httpOnly: true, sameSite: 'lax' });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and set cookies' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(loginDto);
    const tokens = await this.authService.login(user);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: tokens.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear auth cookies' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    await this.authService.logout(refreshToken);
    this.clearCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: tokens.user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser() user: any) {
    return this.userService.findById(user.id);
  }

  @Get('passkey/register-options')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate registration options for a new Passkey' })
  async generateRegisterOptions(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const options = await this.authService.generatePasskeyRegistrationOptions(user.id);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('reg_challenge', options.challenge, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5 mins
    });
    return options;
  }

  @Post('passkey/register-verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify and register a new Passkey' })
  async verifyRegister(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const expectedChallenge = req.cookies?.reg_challenge;
    const result = await this.authService.verifyPasskeyRegistration(
      user.id,
      body.response,
      expectedChallenge,
    );
    res.clearCookie('reg_challenge');
    return result;
  }

  @Get('passkey/login-options')
  @ApiOperation({ summary: 'Generate authentication options for login' })
  @ApiQuery({ name: 'email', required: true })
  async generateLoginOptions(
    @Query('email') email: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const options = await this.authService.generatePasskeyAuthenticationOptions(email);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('login_challenge', options.challenge, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5 mins
    });
    return options;
  }

  @Post('passkey/login-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Passkey login and set auth cookies' })
  async verifyLogin(
    @Req() req: Request,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const expectedChallenge = req.cookies?.login_challenge;
    const tokens = await this.authService.verifyPasskeyAuthentication(
      body.email,
      body.response,
      expectedChallenge,
    );
    res.clearCookie('login_challenge');
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: tokens.user };
  }
}
