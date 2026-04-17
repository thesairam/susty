import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Param, Body, Query, UseGuards, Request,
  BadRequestException,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, Connection } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber } from 'class-validator';

class SendMessageDto {
  @IsNumber() receiverId: number;
  @IsString() text: string;
}

@Injectable()
class MessagesService {
  constructor(
    @InjectRepository(Message) private repo: Repository<Message>,
    @InjectRepository(Connection) private connectionsRepo: Repository<Connection>,
  ) {}

  async getConversations(userId: number) {
    const messages = await this.repo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      order: { createdAt: 'DESC' },
      relations: ['sender', 'receiver'],
    });
    return messages;
  }

  async getConversation(userId: number, otherUserId: number) {
    return this.repo.find({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'receiver'],
    });
  }

  async isConnected(userId: number, otherUserId: number): Promise<boolean> {
    const conn = await this.connectionsRepo.findOne({
      where: [
        { requesterId: userId, recipientId: otherUserId, status: 'accepted' },
        { requesterId: otherUserId, recipientId: userId, status: 'accepted' },
      ],
    });
    return !!conn;
  }

  async send(senderId: number, dto: SendMessageDto) {
    const connected = await this.isConnected(senderId, dto.receiverId);
    if (!connected) throw new BadRequestException('You can only message your Roots (connected users)');
    const msg = this.repo.create({ senderId, receiverId: dto.receiverId, text: dto.text });
    const saved = await this.repo.save(msg);
    return this.repo.findOne({ where: { id: saved.id }, relations: ['sender', 'receiver'] });
  }
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
class MessagesController {
  constructor(private svc: MessagesService) {}

  @Get()
  getConversations(@Request() req) {
    return this.svc.getConversations(req.user.id);
  }

  @Get(':userId')
  getConversation(@Param('userId') userId: number, @Request() req) {
    return this.svc.getConversation(req.user.id, userId);
  }

  @HttpPost()
  send(@Body() dto: SendMessageDto, @Request() req) {
    return this.svc.send(req.user.id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Message, Connection])],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
