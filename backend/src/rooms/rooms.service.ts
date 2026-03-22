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

@Injectable()
export class RoomsService {
  private static readonly MAX_TTL_MS = 48 * 60 * 60 * 1000;

  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const expiresAt = new Date(createRoomDto.expires_at);
    this.assertTtlLimit(expiresAt);

    const room = new this.roomModel({
      ...createRoomDto,
      expires_at: expiresAt,
      participants: (createRoomDto.participants ?? []).map((participant) => ({
        user_id: participant.user_id,
        nickname: participant.nickname,
        pfp_base64: participant.pfp_base64 ?? '',
        fcm_token: participant.fcm_token ?? '',
        last_active: participant.last_active
          ? new Date(participant.last_active)
          : new Date(),
      })),
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

  async remove(id: string): Promise<Room> {
    this.assertValidObjectId(id);
    const room = await this.roomModel.findByIdAndDelete(id).exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
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
}
