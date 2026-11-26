import { MediaModule } from '../media';
import { UserModule } from '../user';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAllowPendingStrategy } from './strategies/jwt-pending.strategy';
import { GoogleAvatarImporter } from './google-avatar';
import {
  GoogleAuthLibraryVerifier,
  GoogleTokenVerifier,
} from './google-token-verifier';

@Module({
  imports: [
    UserModule,
    MediaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d', algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAllowPendingStrategy,
    GoogleAvatarImporter,
    {
      provide: GoogleTokenVerifier,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new GoogleAuthLibraryVerifier(config.get<string>('GOOGLE_CLIENT_ID')),
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
