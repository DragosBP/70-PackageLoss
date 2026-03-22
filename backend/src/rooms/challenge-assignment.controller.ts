import { Controller, Post, Patch, Get, Param, Body } from '@nestjs/common';
import { ChallengeAssignmentService } from './challenge-assignment.service';
import { MarkChallengeCompleteDto } from './dto/challenge-assignment.dto';

@Controller('rooms/:roomId')
export class ChallengeAssignmentController {
  constructor(
    private readonly challengeAssignmentService: ChallengeAssignmentService,
  ) {}

  /**
   * POST /rooms/:roomId/start-game
   * Admin starts the game - assigns first challenges and starts 30-minute timer
   */
  @Post('start-game')
  async startGame(@Param('roomId') roomId: string) {
    return this.challengeAssignmentService.startGame(roomId);
  }

  /**
   * POST /rooms/:roomId/stop-game
   * Admin stops the game - halts the regeneration timer
   */
  @Post('stop-game')
  async stopGame(@Param('roomId') roomId: string) {
    return this.challengeAssignmentService.stopGame(roomId);
  }

  /**
   * POST /rooms/:roomId/challenges/regenerate
   * Manually trigger challenge regeneration for a room (admin action)
   */
  @Post('challenges/regenerate')
  async regenerate(@Param('roomId') roomId: string) {
    return this.challengeAssignmentService.regenerateChallenges(roomId);
  }

  /**
   * PATCH /rooms/:roomId/challenges/complete
   * Mark a user's challenge as completed
   */
  @Patch('challenges/complete')
  async markComplete(
    @Param('roomId') roomId: string,
    @Body() body: MarkChallengeCompleteDto,
  ) {
    return this.challengeAssignmentService.markChallengeComplete(
      roomId,
      body.user_id,
    );
  }

  /**
   * GET /rooms/:roomId/challenges/status/:userId
   * Get challenge status for a specific participant
   */
  @Get('challenges/status/:userId')
  async getStatus(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ) {
    return this.challengeAssignmentService.getChallengeStatus(roomId, userId);
  }

  /**
   * GET /rooms/:roomId/challenges/statuses
   * Get challenge statuses for all participants (admin view)
   */
  @Get('challenges/statuses')
  async getAllStatuses(@Param('roomId') roomId: string) {
    return this.challengeAssignmentService.getAllChallengeStatuses(roomId);
  }
}
