import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { ChallengeAssignmentService } from './challenge-assignment.service';

@Injectable()
export class ChallengeSchedulerService {
  private readonly logger = new Logger(ChallengeSchedulerService.name);

  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    private readonly challengeAssignmentService: ChallengeAssignmentService,
  ) {}

  /**
   * Cron job that runs every minute to check which rooms are due for challenge regeneration
   * Each room has its own independent 30-minute timer
   */
  @Cron('* * * * *') // Every minute
  async checkAndRegenerateChallenges() {
    const now = new Date();

    try {
      // Find rooms where:
      // - Game is started
      // - Next regeneration time has passed
      // - Room hasn't expired
      const roomsDue = await this.roomModel
        .find({
          game_started: true,
          next_challenge_regeneration: { $lte: now },
          expires_at: { $gt: now },
        })
        .exec();

      if (roomsDue.length === 0) {
        return; // No rooms due, skip logging to reduce noise
      }

      this.logger.log(
        `Found ${roomsDue.length} room(s) due for challenge regeneration`,
      );

      let successCount = 0;
      let failureCount = 0;

      for (const room of roomsDue) {
        try {
          await this.challengeAssignmentService.regenerateChallenges(
            room._id.toString(),
          );
          successCount++;
          this.logger.log(
            `✓ Regenerated challenges for room "${room.room_name}" (${room._id})`,
          );
        } catch (error) {
          failureCount++;
          this.logger.error(
            `✗ Failed to regenerate for room ${room._id}:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      this.logger.log(
        `Challenge regeneration complete - Success: ${successCount}, Failed: ${failureCount}`,
      );
    } catch (error) {
      this.logger.error(
        'Error checking for rooms due for regeneration:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
