import { IsIn } from 'class-validator';
import { MEDIA_KINDS, type MediaKind } from '../media.config';

/** The text fields of POST media/images (the file itself is the multipart `file`). */
export class UploadImageDto {
  @IsIn(MEDIA_KINDS)
  kind: MediaKind;
}
