import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** The Google ID token the app got from Google Identity Services or Credential Manager. */
export class GoogleSignInDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  id_token!: string;
}
