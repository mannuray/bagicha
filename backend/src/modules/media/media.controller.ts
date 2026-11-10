import {
  BadRequestException,
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
import { MAX_UPLOAD_BYTES, MEDIA_KINDS, MediaKind } from './media.config';
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
    @Request() req,
    @Body('kind') kindRaw: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const kind = this.parseKind(kindRaw);
    const result = await this.mediaService.uploadImage(file, kind, req.user.id);
    return { success: true, data: result };
  }

  @Get('download-url/*key')
  async getDownloadUrl(
    @Request() req,
    @Param('key') keyParam: string | string[],
    @Query('expires') expires?: string,
  ) {
    const seconds = expires
      ? Math.min(Math.max(parseInt(expires, 10), 60), 86400)
      : 3600;
    // Express 5 wildcards arrive as path segments.
    const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;
    const url = await this.mediaService.getDownloadUrlFor(
      req.user.id,
      key,
      seconds,
    );
    return { success: true, data: { url, expires_in_seconds: seconds } };
  }

  private parseKind(raw: string | undefined): MediaKind {
    if (!raw || !MEDIA_KINDS.includes(raw as MediaKind)) {
      throw new BadRequestException(
        `kind must be one of: ${MEDIA_KINDS.join(', ')}`,
      );
    }
    return raw as MediaKind;
  }
}
