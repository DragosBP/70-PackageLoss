import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  nickname!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300000)
  @Matches(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, {
    message: 'pfp_base64 must be a valid image data URL',
  })
  pfp_base64?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  fcm_token?: string;

  @IsOptional()
  @IsDateString()
  last_active?: string;
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  room_name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  admin_nickname!: string;

  @IsDateString()
  @IsOptional()
  expires_at!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants?: ParticipantDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  active_alerts?: string[];
}
