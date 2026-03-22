import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
}
