import { Body, Controller, Delete, Query, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // --- ACȚIUNI SPECIFICE ---

  // NOTE: start-game endpoint moved to ChallengeAssignmentController
  // to ensure proper challenge assignment on game start

  @Delete('action/end/:id')
  async endRoom(@Param('id') id: string, @Query('nickname') nickname: string) {
    const cleanId = id.replace(':', '').trim();
    return this.roomsService.endRoom(cleanId, nickname);
  }

  @Delete('action/leave/:id/:userId')
  async leave(@Param('id') id: string, @Param('userId') userId: string) {
    const cleanId = id.replace(':', '').trim();
    return this.roomsService.leaveRoom(cleanId, userId);
  }

  @Post('action/join/:id')
  async join(@Param('id') id: string, @Body() participantDto: any) {
    const cleanId = id.replace(':', '').trim();
    return this.roomsService.joinRoom(cleanId, participantDto);
  }

  // --- CRUD STANDARD ---

  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const cleanId = id.replace(':', '').trim();
    return this.roomsService.findOne(cleanId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    const cleanId = id.replace(':', '').trim();
    return this.roomsService.update(cleanId, updateRoomDto);
  }
}