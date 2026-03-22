import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParticipantDto } from './create-room.dto';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  room_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  admin_nickname?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;

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
