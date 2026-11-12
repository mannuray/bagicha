import type { AuthedRequest } from '../../common/auth/authed-request';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { MediaService } from './media.service';
import { MAX_UPLOAD_BYTES } from './media.config';
import { UploadImageDto } from './dto/upload-image.dto';
import { RateLimit } from '../../common/rate-limit';

@Controller('media')
@UseGuards(AuthGuard('jwt'))
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('images')
  @RateLimit('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async uploadImage(
    @Request() req: AuthedRequest,
    @Body() dto: UploadImageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadImage(file, dto.kind, req.user.id);
  }

  @Get('download-url/*key')
  async getDownloadUrl(
    @Request() req: AuthedRequest,
    @Param('key') keyParam: string | string[],
    @Query('expires') expires?: string,
  ) {
    const requested = expires ? Number.parseInt(expires, 10) : NaN;
    const seconds = Number.isFinite(requested)
      ? Math.min(Math.max(requested, 60), 86400)
      : 3600;
    // Express 5 wildcards arrive as path segments.
    const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;
    const url = await this.mediaService.getDownloadUrlFor(
      req.user.id,
      key,
      seconds,
    );
    return { url, expires_in_seconds: seconds };
  }
}
