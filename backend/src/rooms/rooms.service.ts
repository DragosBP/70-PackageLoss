import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room, RoomDocument } from './schemas/room.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RoomsService {
  private static readonly MAX_TTL_MS = 48 * 60 * 60 * 1000;

  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    // 1. Logica de fallback pentru cele 8 ore (dacă lipsește din DTO)
    const expiresAt = createRoomDto.expires_at 
      ? new Date(createRoomDto.expires_at) 
      : new Date(Date.now() + 8 * 60 * 60 * 1000);

    this.assertTtlLimit(expiresAt);

    // De-duplicate participants by user_id to avoid accidental double inserts.
    const seenUserIds = new Set<string>();
    const participants = (createRoomDto.participants ?? [])
      .filter((participant) => {
        if (!participant.user_id || seenUserIds.has(participant.user_id)) {
          return false;
        }
        seenUserIds.add(participant.user_id);
        return true;
      })
      .map((participant) => ({
        user_id: participant.user_id,
        nickname: participant.nickname,
        pfp_base64: participant.pfp_base64 ?? '',
        pfp_url: participant.pfp_url ?? '',
        fcm_token: participant.fcm_token ?? '',
        last_active: participant.last_active
          ? new Date(participant.last_active)
          : new Date(),
      }));

    const room = new this.roomModel({
      ...createRoomDto,
      expires_at: expiresAt,
      participants: participants,
    });

    return room.save();
}

  async findAll(): Promise<Room[]> {
    return this.roomModel.find().exec();
  }

  async findOne(id: string): Promise<Room> {
    this.assertValidObjectId(id);
    const room = await this.roomModel.findById(id).exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    this.assertValidObjectId(id);

    const updatePayload: {
      room_name?: string;
      admin_nickname?: string;
      expires_at?: Date;
      participants?: Array<{
        user_id: string;
        nickname: string;
        pfp_base64: string;
        pfp_url: string;
        fcm_token: string;
        last_active: Date;
      }>;
      active_alerts?: string[];
    } = {};

    if (updateRoomDto.room_name !== undefined) {
      updatePayload.room_name = updateRoomDto.room_name;
    }

    if (updateRoomDto.admin_nickname !== undefined) {
      updatePayload.admin_nickname = updateRoomDto.admin_nickname;
    }

    if (updateRoomDto.active_alerts !== undefined) {
      updatePayload.active_alerts = updateRoomDto.active_alerts;
    }

    if (updateRoomDto.expires_at) {
      const expiresAt = new Date(updateRoomDto.expires_at);
      this.assertTtlLimit(expiresAt);
      updatePayload.expires_at = expiresAt;
    }

    if (updateRoomDto.participants) {
      updatePayload.participants = updateRoomDto.participants.map(
        (participant) => ({
          user_id: participant.user_id,
          nickname: participant.nickname,
          pfp_base64: participant.pfp_base64 ?? '',
          pfp_url: participant.pfp_url ?? '',
          fcm_token: participant.fcm_token ?? '',
          last_active: participant.last_active
            ? new Date(participant.last_active)
            : new Date(),
        }),
      );
    }

    const room = await this.roomModel
      .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
      .exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async endRoom(id: string, requestorNickname: string): Promise<Room | null> { // <--- Adaugă '| null' aici
  this.assertValidObjectId(id);

  const room = await this.roomModel.findById(id).exec();

  if (!room) {
    throw new NotFoundException('Room not found');
  }

  // Verificăm adminul
  if (room.admin_nickname !== requestorNickname) {
    throw new BadRequestException('Forbidden: Only the admin can end this party!');
  }

  // Clean up Firebase Storage images before deleting room
  await this.notificationsService.deleteRoomImages(id);

  // Executăm ștergerea
  return this.roomModel.findByIdAndDelete(id).exec();
}
  async leaveRoom(roomId: string, userId: string): Promise<void> {
  this.assertValidObjectId(roomId);

  const result = await this.roomModel.updateOne(
    { _id: roomId },
    { $pull: { participants: { user_id: userId } } } // Îl scoate din array după UUID
  ).exec();

  if (result.matchedCount === 0) {
    throw new NotFoundException('Room not found');
  }
}
  private assertTtlLimit(expiresAt: Date): void {
    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('expires_at must be a valid date');
    }

    const ttl = expiresAt.getTime() - Date.now();
    if (ttl <= 0) {
      throw new BadRequestException('expires_at must be in the future');
    }

    if (ttl > RoomsService.MAX_TTL_MS) {
      throw new BadRequestException('Room TTL cannot exceed 48 hours');
    }
  }

  private assertValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid room id');
    }
  }
  async joinRoom(id: string, participantData: any): Promise<Room> {
    // 1. Validăm ID-ul camerei (folosind metoda ta existentă)
    this.assertValidObjectId(id);

    const { user_id } = participantData;
    if (!user_id) {
      throw new BadRequestException('user_id is required');
    }

    // 2. Verificăm dacă UUID-ul este deja într-o cameră ACTIVĂ (care nu a expirat)
    // Deoarece avem index TTL, MongoDB va returna doar documentele care încă există
    const existingActiveRoom = await this.roomModel
      .findOne({ 'participants.user_id': user_id })
      .exec();

    if (existingActiveRoom) {
      if (existingActiveRoom._id.toString() === id) {
        return existingActiveRoom;
      }
      throw new BadRequestException(
        `User is already participating in another active room: ${existingActiveRoom.room_name}`,
      );
    }

    const newParticipant = {
      user_id: participantData.user_id,
      nickname: participantData.nickname,
      pfp_base64: participantData.pfp_base64 ?? '',
      pfp_url: participantData.pfp_url ?? '',
      fcm_token: participantData.fcm_token ?? '',
      last_active: new Date(),
    };

    // Atomic update: only push if user_id doesn't already exist in this room.
    const updatedRoom = await this.roomModel
      .findOneAndUpdate(
        { _id: id, 'participants.user_id': { $ne: user_id } },
        { $push: { participants: newParticipant } },
        { new: true, runValidators: true },
      )
      .exec();

    if (updatedRoom) {
      return updatedRoom;
    }

    // If atomic update did not match, either room doesn't exist or user is already in it.
    const existingRoom = await this.roomModel.findById(id).exec();

    if (!existingRoom) {
      throw new NotFoundException('Room not found');
    }

    if (existingRoom.participants.some((participant) => participant.user_id === user_id)) {
      return existingRoom;
    }

    throw new BadRequestException('Unable to join room');
  }
  
}
