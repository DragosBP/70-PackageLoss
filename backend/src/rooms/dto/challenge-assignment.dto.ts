import { IsString, IsNotEmpty } from 'class-validator';

export class MarkChallengeCompleteDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;
}

export interface ParticipantChallengeStatus {
  user_id: string;
  nickname: string;
  assigned_challenge: {
    _id: string;
    title: string;
    description: string;
  } | null;
  target_user_id: string | null;
  target_nickname: string | null;
  challenge_assigned_at: Date | null;
  is_challenge_completed: boolean;
}
