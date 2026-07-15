import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    if (loginDto.email !== 'rhezagustam@gmail.com') {
      throw new UnauthorizedException('Invalid credentials');
    }
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

  async generatePasskeyRegistrationOptions(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const credentials = await this.prisma.userCredential.findMany({
      where: { userId },
    });

    const rpID = this.configService.get<string>('RP_ID') || 'localhost';

    const options = await generateRegistrationOptions({
      rpName: 'Atlas Platform',
      rpID,
      userID: Buffer.from(user.id),
      userName: user.email,
      userDisplayName: user.name,
      // Exclude already registered credentials
      excludeCredentials: credentials.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: cred.transports as any[],
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    return options;
  }

  async verifyPasskeyRegistration(userId: string, responseBody: any, expectedChallenge: string) {
    const rpID = this.configService.get<string>('RP_ID') || 'localhost';
    const origin = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const verification = await verifyRegistrationResponse({
      response: responseBody,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      throw new UnauthorizedException('Registration verification failed');
    }

    const { credential } = registrationInfo;
    const { id, publicKey, counter, transports } = credential;

    // Save public key as bytes (Buffer)
    const publicKeyBuffer = Buffer.from(publicKey);

    await this.prisma.userCredential.create({
      data: {
        userId,
        credentialId: id,
        publicKey: publicKeyBuffer,
        counter: BigInt(counter),
        transports: transports || [],
      },
    });

    return { success: true };
  }

  async checkUserHasPasskey(email: string): Promise<boolean> {
    if (email !== 'rhezagustam@gmail.com') {
      return false;
    }
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return false;
    }
    const count = await this.prisma.userCredential.count({
      where: { userId: user.id },
    });
    return count > 0;
  }

  async generatePasskeyAuthenticationOptions(email: string) {
    if (email !== 'rhezagustam@gmail.com') {
      throw new UnauthorizedException('Access denied');
    }
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const credentials = await this.prisma.userCredential.findMany({
      where: { userId: user.id },
    });

    const rpID = this.configService.get<string>('RP_ID') || 'localhost';

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: cred.transports as any[],
      })),
      userVerification: 'preferred',
    });

    return options;
  }

  async verifyPasskeyAuthentication(email: string, responseBody: any, expectedChallenge: string) {
    if (email !== 'rhezagustam@gmail.com') {
      throw new UnauthorizedException('Access denied');
    }
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Find the credential
    const credential = await this.prisma.userCredential.findUnique({
      where: { credentialId: responseBody.id },
    });

    if (!credential || credential.userId !== user.id) {
      throw new UnauthorizedException('Credential not found or not owned by user');
    }

    const rpID = this.configService.get<string>('RP_ID') || 'localhost';
    const origin = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const verification = await verifyAuthenticationResponse({
      response: responseBody,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.credentialId,
        publicKey: credential.publicKey,
        counter: Number(credential.counter),
        transports: credential.transports as any[],
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified || !authenticationInfo) {
      throw new UnauthorizedException('Authentication verification failed');
    }

    // Update counter
    await this.prisma.userCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(authenticationInfo.newCounter),
      },
    });

    // Log the user in
    return this.login(user);
  }
}
