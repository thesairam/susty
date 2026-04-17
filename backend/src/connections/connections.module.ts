import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Delete, Param, UseGuards, Request, BadRequestException,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Connection, User } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
class ConnectionsService {
  constructor(
    @InjectRepository(Connection) private repo: Repository<Connection>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async sendRequest(requesterId: number, recipientId: number) {
    if (requesterId === recipientId) throw new BadRequestException('Cannot connect with yourself');
    const existing = await this.repo.findOne({
      where: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });
    if (existing) {
      if (existing.status === 'accepted') throw new BadRequestException('Already connected');
      throw new BadRequestException('Request already exists');
    }
    const conn = this.repo.create({ requesterId, recipientId, status: 'pending' });
    const saved = await this.repo.save(conn);
    return this.repo.findOne({ where: { id: saved.id }, relations: ['requester', 'recipient'] });
  }

  async acceptRequest(connectionId: number, userId: number) {
    const conn = await this.repo.findOne({ where: { id: connectionId }, relations: ['requester', 'recipient'] });
    if (!conn) throw new BadRequestException('Request not found');
    if (conn.recipientId !== userId) throw new BadRequestException('Not authorized');
    conn.status = 'accepted';
    return this.repo.save(conn);
  }

  async rejectOrRemove(connectionId: number, userId: number) {
    const conn = await this.repo.findOne({ where: { id: connectionId } });
    if (!conn) throw new BadRequestException('Not found');
    if (conn.requesterId !== userId && conn.recipientId !== userId) throw new BadRequestException('Not authorized');
    await this.repo.remove(conn);
    return { success: true };
  }

  async getRoots(userId: number) {
    const connections = await this.repo.find({
      where: [
        { requesterId: userId, status: 'accepted' },
        { recipientId: userId, status: 'accepted' },
      ],
      relations: ['requester', 'recipient'],
    });
    return connections.map(c => ({
      connectionId: c.id,
      user: c.requesterId === userId ? c.recipient : c.requester,
      since: c.createdAt,
    }));
  }

  async getPendingRequests(userId: number) {
    return this.repo.find({
      where: { recipientId: userId, status: 'pending' },
      relations: ['requester', 'recipient'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSentRequests(userId: number) {
    return this.repo.find({
      where: { requesterId: userId, status: 'pending' },
      relations: ['requester', 'recipient'],
      order: { createdAt: 'DESC' },
    });
  }

  async getConnectionStatus(userId: number, otherUserId: number) {
    const conn = await this.repo.findOne({
      where: [
        { requesterId: userId, recipientId: otherUserId },
        { requesterId: otherUserId, recipientId: userId },
      ],
    });
    if (!conn) return { status: 'none', connectionId: null };
    return { status: conn.status, connectionId: conn.id, isRequester: conn.requesterId === userId };
  }

  async isConnected(userId: number, otherUserId: number): Promise<boolean> {
    const conn = await this.repo.findOne({
      where: [
        { requesterId: userId, recipientId: otherUserId, status: 'accepted' },
        { requesterId: otherUserId, recipientId: userId, status: 'accepted' },
      ],
    });
    return !!conn;
  }

  async getRootIds(userId: number): Promise<number[]> {
    const connections = await this.repo.find({
      where: [
        { requesterId: userId, status: 'accepted' },
        { recipientId: userId, status: 'accepted' },
      ],
    });
    return connections.map(c => c.requesterId === userId ? c.recipientId : c.requesterId);
  }
}

@Controller('connections')
@UseGuards(JwtAuthGuard)
class ConnectionsController {
  constructor(private svc: ConnectionsService) {}

  @Get('roots')
  getRoots(@Request() req) {
    return this.svc.getRoots(req.user.id);
  }

  @Get('pending')
  getPending(@Request() req) {
    return this.svc.getPendingRequests(req.user.id);
  }

  @Get('sent')
  getSent(@Request() req) {
    return this.svc.getSentRequests(req.user.id);
  }

  @Get('status/:userId')
  getStatus(@Param('userId') userId: number, @Request() req) {
    return this.svc.getConnectionStatus(req.user.id, userId);
  }

  @HttpPost('request/:userId')
  sendRequest(@Param('userId') userId: number, @Request() req) {
    return this.svc.sendRequest(req.user.id, userId);
  }

  @HttpPost(':id/accept')
  accept(@Param('id') id: number, @Request() req) {
    return this.svc.acceptRequest(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @Request() req) {
    return this.svc.rejectOrRemove(id, req.user.id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Connection, User])],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
