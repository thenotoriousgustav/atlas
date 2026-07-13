import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password, loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') as any,
    });

    const refreshTokenString = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') as any,
    });

    // Save refresh token to db
    const durationStr = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    // Parse duration (simple parser for d, h, m)
    const expiresAt = new Date();
    if (durationStr.endsWith('d')) {
      const days = parseInt(durationStr.slice(0, -1), 10);
      expiresAt.setDate(expiresAt.getDate() + days);
    } else if (durationStr.endsWith('h')) {
      const hours = parseInt(durationStr.slice(0, -1), 10);
      expiresAt.setHours(expiresAt.getHours() + hours);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
    }

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user,
    };
  }

  async logout(refreshTokenString: string) {
    if (refreshTokenString) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshTokenString },
      });
    }
  }

  async refreshTokens(refreshTokenString: string) {
    try {
      const payload = this.jwtService.verify(refreshTokenString, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Verify token exists in database and is not expired
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenString },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Find user
      const user = await this.userService.findById(payload.sub);

      // Delete old refresh token (rotation)
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Generate new tokens
      return this.login(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyAccessToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      return null;
    }
  }
}
