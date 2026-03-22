import {
  Body,
  Controller,
  Delete,
  Query,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // --- ACȚIUNI SPECIFICE (Trebuie să fie SUS pentru a evita conflicte) ---

  // RUTA: DELETE /rooms/action/end/:id?nickname=...
  @Delete('action/end/:id')
  async endRoom(
    @Param('id') id: string, 
    @Query('nickname') nickname: string
  ) {
    console.log(`Request to end room ${id} by ${nickname}`);
    return this.roomsService.endRoom(id, nickname);
  }

  // RUTA: DELETE /rooms/action/leave/:id/:userId
  @Delete('action/leave/:id/:userId')
  async leave(
    @Param('id') id: string, 
    @Param('userId') userId: string
  ) {
    return this.roomsService.leaveRoom(id, userId);
  }

  // RUTA: POST /rooms/action/join/:id
  @Post('action/join/:id')
  async join(
    @Param('id') id: string, 
    @Body() participantDto: any
  ) {
    return this.roomsService.joinRoom(id, participantDto);
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
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }
}