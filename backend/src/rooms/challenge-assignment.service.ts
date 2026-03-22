import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument, Participant } from './schemas/room.schema';
import {
  Challenge,
  ChallengeDocument,
} from '../challenges/schemas/challenge.schema';
import { ParticipantChallengeStatus } from './dto/challenge-assignment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChallengeAssignmentService {
  private readonly logger = new Logger(ChallengeAssignmentService.name);

  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Challenge.name)
    private readonly challengeModel: Model<ChallengeDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Admin starts the game - assigns first challenges and starts the 30-minute timer
   */
  async startGame(roomId: string): Promise<Room> {
    this.logger.log(`Starting game for room ${roomId}`);

    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.game_started) {
      throw new BadRequestException('Game already started');
    }

    if (room.expires_at < new Date()) {
      throw new BadRequestException('Room has expired');
    }

    if (!room.participants || room.participants.length === 0) {
      throw new BadRequestException('Cannot start game with no participants');
    }

    // Get challenges
    const challenges = await this.getChallenges();
    if (challenges.length === 0) {
      throw new BadRequestException(
        'No challenges available. Please add challenges first.',
      );
    }

    // Assign first batch of challenges
    const updatedParticipants = this.assignChallengesAndTargets(
      room.participants,
      challenges,
    );

    // Set timer fields
    const now = new Date();
    const nextRegen = new Date(now.getTime() + 30 * 60 * 1000); // +30 minutes

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          participants: updatedParticipants,
          game_started: true,
          game_started_at: now,
          last_challenge_regeneration: now,
          next_challenge_regeneration: nextRegen,
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedRoom) {
      throw new NotFoundException('Room not found after update');
    }

    this.logger.log(
      `Game started for room ${roomId}. Next regeneration at ${nextRegen.toISOString()}`,
    );

    // Send push notifications to all participants
    await this.sendChallengeNotifications(updatedRoom, challenges);

    return updatedRoom;
  }

  /**
   * Admin stops the game - halts the regeneration timer
   */
  async stopGame(roomId: string): Promise<Room> {
    this.logger.log(`Stopping game for room ${roomId}`);

    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.game_started) {
      throw new BadRequestException('Game has not started');
    }

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          game_started: false,
          next_challenge_regeneration: null,
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedRoom) {
      throw new NotFoundException('Room not found after update');
    }

    this.logger.log(`Game stopped for room ${roomId}`);

    return updatedRoom;
  }

  /**
   * Main method to regenerate challenges and targets for all participants in a room
   */
  async regenerateChallenges(roomId: string): Promise<Room> {
    this.logger.log(`Regenerating challenges for room ${roomId}`);

    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.expires_at < new Date()) {
      throw new BadRequestException('Room has expired');
    }

    if (!room.participants || room.participants.length === 0) {
      throw new BadRequestException('Cannot assign challenges to empty room');
    }

    const challenges = await this.getChallenges();
    if (challenges.length === 0) {
      throw new BadRequestException(
        'No challenges available. Please add challenges first.',
      );
    }

    // Assign challenges and targets
    const updatedParticipants = this.assignChallengesAndTargets(
      room.participants,
      challenges,
    );

    // Update timer fields for next regeneration
    const now = new Date();
    const nextRegen = new Date(now.getTime() + 30 * 60 * 1000);

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          participants: updatedParticipants,
          last_challenge_regeneration: now,
          next_challenge_regeneration: nextRegen,
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedRoom) {
      throw new NotFoundException('Room not found after update');
    }

    this.logger.log(
      `Successfully regenerated challenges for ${updatedParticipants.length} participants in room ${roomId}`,
    );

    // Send push notifications to all participants
    await this.sendChallengeNotifications(updatedRoom, challenges);

    return updatedRoom;
  }

  /**
   * Mark a user's challenge as completed
   */
  async markChallengeComplete(roomId: string, userId: string): Promise<Room> {
    this.logger.log(
      `Marking challenge complete for user ${userId} in room ${roomId}`,
    );

    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const participantIndex = room.participants.findIndex(
      (p) => p.user_id === userId,
    );

    if (participantIndex === -1) {
      throw new NotFoundException('User not found in room');
    }

    room.participants[participantIndex].is_challenge_completed = true;

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        roomId,
        { participants: room.participants },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedRoom) {
      throw new NotFoundException('Room not found after update');
    }

    this.logger.log(`Challenge marked complete for user ${userId}`);

    return updatedRoom;
  }

  /**
   * Get challenge status for a specific participant
   */
  async getChallengeStatus(
    roomId: string,
    userId: string,
  ): Promise<ParticipantChallengeStatus> {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const participant = room.participants.find((p) => p.user_id === userId);
    if (!participant) {
      throw new NotFoundException('User not found in room');
    }

    // Fetch the full challenge
    let assignedChallenge: {
      _id: string;
      title: string;
      description: string;
    } | null = null;
    if (participant.assigned_challenge_id) {
      const challenge = await this.challengeModel
        .findById(participant.assigned_challenge_id)
        .exec();
      if (challenge) {
        assignedChallenge = {
          _id: challenge._id.toString(),
          title: challenge.title,
          description: challenge.description,
        };
      }
    }

    // Find target nickname
    const targetParticipant = room.participants.find(
      (p) => p.user_id === participant.target_user_id,
    );

    return {
      user_id: participant.user_id,
      nickname: participant.nickname,
      assigned_challenge: assignedChallenge,
      target_user_id: participant.target_user_id,
      target_nickname: targetParticipant ? targetParticipant.nickname : null,
      challenge_assigned_at: participant.challenge_assigned_at,
      is_challenge_completed: participant.is_challenge_completed,
    };
  }

  /**
   * Get challenge statuses for all participants (admin view)
   */
  async getAllChallengeStatuses(
    roomId: string,
  ): Promise<ParticipantChallengeStatus[]> {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Get all unique challenge IDs
    const challengeIds = room.participants
      .map((p) => p.assigned_challenge_id)
      .filter((id) => id !== null);

    // Fetch all challenges at once
    const challenges = await this.challengeModel
      .find({ _id: { $in: challengeIds } })
      .exec();

    const challengeMap = new Map(challenges.map((c) => [c._id.toString(), c]));

    return room.participants.map((participant) => {
      const targetParticipant = room.participants.find(
        (p) => p.user_id === participant.target_user_id,
      );

      let assignedChallenge: {
        _id: string;
        title: string;
        description: string;
      } | null = null;
      if (participant.assigned_challenge_id) {
        const challenge = challengeMap.get(
          participant.assigned_challenge_id.toString(),
        );
        if (challenge) {
          assignedChallenge = {
            _id: challenge._id.toString(),
            title: challenge.title,
            description: challenge.description,
          };
        }
      }

      return {
        user_id: participant.user_id,
        nickname: participant.nickname,
        assigned_challenge: assignedChallenge,
        target_user_id: participant.target_user_id,
        target_nickname: targetParticipant ? targetParticipant.nickname : null,
        challenge_assigned_at: participant.challenge_assigned_at,
        is_challenge_completed: participant.is_challenge_completed,
      };
    });
  }

  /**
   * Private helper: Get all challenges from the database
   */
  private async getChallenges(): Promise<ChallengeDocument[]> {
    return this.challengeModel.find().exec();
  }

  /**
   * Private helper: Assign challenges and shuffle targets
   */
  private assignChallengesAndTargets(
    participants: Participant[],
    challenges: ChallengeDocument[],
  ): Participant[] {
    // Get shuffled target assignments
    const targetUserIds = this.shuffleTargets(participants);

    // Assign challenges and targets to each participant
    // Convert to plain objects to avoid Mongoose subdocument issues
    return participants.map((participant, index) => {
      const randomChallenge = this.getRandomChallenge(challenges);

      // Convert Mongoose subdocument to plain object if needed
      const plainParticipant =
        typeof (participant as any).toObject === 'function'
          ? (participant as any).toObject()
          : { ...participant };

      return {
        user_id: plainParticipant.user_id,
        nickname: plainParticipant.nickname,
        pfp_base64: plainParticipant.pfp_base64 || '',
        pfp_url: plainParticipant.pfp_url || '',
        fcm_token: plainParticipant.fcm_token || '',
        last_active: plainParticipant.last_active || new Date(),
        assigned_challenge_id: randomChallenge._id,
        target_user_id: targetUserIds[index],
        previous_target_id: plainParticipant.target_user_id || null,
        challenge_assigned_at: new Date(),
        is_challenge_completed: false,
      };
    });
  }

  /**
   * Private helper: Shuffle targets using offset approach
   * Guarantees no self-targeting by using modular arithmetic
   */
  private shuffleTargets(participants: Participant[]): string[] {
    const n = participants.length;

    if (n === 0) return [];

    if (n === 1) {
      this.logger.warn('Only 1 participant - self-targeting unavoidable');
      return [participants[0].user_id];
    }

    // 1. Shuffle the participants array (Fisher-Yates)
    const shuffled = [...participants];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 2. Pick random offset k in [1, N-1] - guarantees no self-targeting
    const k = 1 + Math.floor(Math.random() * (n - 1));

    // 3. Build target array: user at index i targets user at (i + k) % n
    const targetUserIds = Array.from<string>({ length: n });
    for (let i = 0; i < n; i++) {
      const originalIndex = participants.findIndex(
        (p) => p.user_id === shuffled[i].user_id,
      );
      const targetIndex = (i + k) % n;
      targetUserIds[originalIndex] = shuffled[targetIndex].user_id;
    }

    return targetUserIds;
  }

  /**
   * Private helper: Get a random challenge
   */
  private getRandomChallenge(
    challenges: ChallengeDocument[],
  ): ChallengeDocument {
    const randomIndex = Math.floor(Math.random() * challenges.length);
    return challenges[randomIndex];
  }

  /**
   * Private helper: Send push notifications to all participants with their new challenges
   */
  private async sendChallengeNotifications(
    room: Room,
    challenges: ChallengeDocument[],
  ): Promise<void> {
    const challengeMap = new Map(
      challenges.map((c) => [(c._id as Types.ObjectId).toString(), c]),
    );

    const notificationData = room.participants
      .filter((p) => p.fcm_token && p.assigned_challenge_id)
      .map((participant) => {
        const challenge = challengeMap.get(
          participant.assigned_challenge_id!.toString(),
        );
        const target = room.participants.find(
          (p) => p.user_id === participant.target_user_id,
        );

        return {
          fcmToken: participant.fcm_token,
          targetNickname: target?.nickname || 'Unknown',
          challengeTitle: challenge?.title || 'New Challenge',
          challengeDescription: challenge?.description || '',
        };
      });

    if (notificationData.length > 0) {
      await this.notificationsService.sendBulkChallengeNotifications(
        notificationData,
      );
    }
  }
}
