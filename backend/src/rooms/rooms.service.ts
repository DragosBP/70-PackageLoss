import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    const shortId = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = createRoomDto.expires_at 
      ? new Date(createRoomDto.expires_at) 
      : new Date(Date.now() + 8 * 60 * 60 * 1000);

    this.assertTtlLimit(expiresAt);

    const participants = (createRoomDto.participants ?? []).map((p) => ({
      ...p,
      last_active: p.last_active ? new Date(p.last_active) : new Date(),
      assigned_challenge_id: null,
      target_user_id: null,
      previous_target_id: null,
      challenge_assigned_at: null,
      is_challenge_completed: false,
    }));

    if (participants.length === 0) {
      participants.push({
        user_id: `admin-${Math.random().toString(36).substring(2, 9)}`,
        nickname: createRoomDto.admin_nickname,
        pfp_base64: '',
        fcm_token: '',
        last_active: new Date(),
        assigned_challenge_id: null,
        target_user_id: null,
        previous_target_id: null,
        challenge_assigned_at: null,
        is_challenge_completed: false,
      });
    }

    const room = new this.roomModel({
      _id: shortId,
      ...createRoomDto,
      expires_at: expiresAt,
      participants,
    });

    return room.save();
  }

  async findAll(): Promise<Room[]> {
    return this.roomModel.find().exec();
  }

  async findOne(id: string): Promise<Room> {
    const cleanId = id.replace(':', '').trim();
    this.assertValidId(cleanId);
    const room = await this.roomModel.findById(cleanId).exec();
    if (!room) throw new NotFoundException(`Room with ID ${cleanId} not found`);
    return room;
  }

  async startGame(id: string): Promise<Room> {
    const cleanId = id.replace(':', '').trim();
    this.assertValidId(cleanId);

    const room = await this.roomModel.findByIdAndUpdate(
      cleanId,
      { game_started: true, game_started_at: new Date() },
      { new: true, runValidators: true }
    ).exec();

    if (!room) throw new NotFoundException(`Room ${cleanId} not found`);
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const cleanId = id.replace(':', '').trim();
    this.assertValidId(cleanId);

    const { participants, ...rest } = updateRoomDto;
    const updatePayload: any = { ...rest };

    if (updateRoomDto.expires_at) {
      const expiresAt = new Date(updateRoomDto.expires_at);
      this.assertTtlLimit(expiresAt);
      updatePayload.expires_at = expiresAt;
    }

    if (participants) {
      updatePayload.participants = participants.map((p) => ({
        ...p,
        last_active: p.last_active ? new Date(p.last_active) : new Date(),
      }));
    }

    const room = await this.roomModel
      .findByIdAndUpdate(cleanId, updatePayload, { new: true, runValidators: true })
      .exec();

    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async endRoom(id: string, nickname: string): Promise<Room | null> {
    const cleanId = id.replace(':', '').trim();
    this.assertValidId(cleanId);
    const room = await this.findOne(cleanId);
    if (room.admin_nickname !== nickname) {
      throw new BadRequestException('Only the admin can end this party!');
    }
    return this.roomModel.findByIdAndDelete(cleanId).exec();
  }

  async leaveRoom(id: string, userId: string): Promise<void> {
    const cleanId = id.replace(':', '').trim();
    this.assertValidId(cleanId);
    const result = await this.roomModel.updateOne(
      { _id: cleanId },
      { $pull: { participants: { user_id: userId } } }
    ).exec();
    if (result.matchedCount === 0) throw new NotFoundException('Room not found');
  }

  async joinRoom(id: string, participantData: any): Promise<Room> {
    const cleanId = id.replace(':', '').trim();
    this.assertValidId(cleanId);

    const { user_id } = participantData;
    if (!user_id) throw new BadRequestException('user_id is required');

    const existingRoom = await this.roomModel.findOne({ 'participants.user_id': user_id }).exec();
    if (existingRoom) {
      if (existingRoom._id.toString() === cleanId) return existingRoom;
      throw new BadRequestException(`User already in another room: ${existingRoom.room_name}`);
    }

    const newParticipant = { ...participantData, last_active: new Date(), is_challenge_completed: false };
    const room = await this.roomModel
      .findByIdAndUpdate(cleanId, { $addToSet: { participants: newParticipant } }, { new: true })
      .exec();

    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  private assertValidId(id: string): void {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`ID-ul [${id}] nu este valid. Folosește doar cifre.`);
    }
  }

  private assertTtlLimit(expiresAt: Date): void {
    if (Number.isNaN(expiresAt.getTime())) throw new BadRequestException('Invalid date');
    const ttl = expiresAt.getTime() - Date.now();
    if (ttl <= 0 || ttl > RoomsService.MAX_TTL_MS) throw new BadRequestException('Invalid TTL');
  }
}