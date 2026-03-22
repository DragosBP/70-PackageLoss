import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  @MaxLength(600000)
  pfp_base64?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  pfp_url?: string;

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
