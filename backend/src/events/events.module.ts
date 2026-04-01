import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SustyEvent, EventRsvp } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';

class CreateEventDto {
  @IsString() title: string;
  @IsString() @IsOptional() description?: string;
  @IsString() date: string;
  @IsString() @IsOptional() time?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() category: string;
  @IsString() @IsOptional() ticketType?: string;
  @IsNumber() @IsOptional() capacity?: number;
}

@Injectable()
class EventsService {
  constructor(
    @InjectRepository(SustyEvent) private eventsRepo: Repository<SustyEvent>,
    @InjectRepository(EventRsvp) private rsvpRepo: Repository<EventRsvp>,
  ) {}

  findAll(category?: string, view: string = 'upcoming') {
    const qb = this.eventsRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.creator', 'creator')
      .leftJoinAndSelect('e.rsvps', 'rsvps')
      .leftJoinAndSelect('rsvps.user', 'rsvpUser');
    if (category) qb.andWhere('e.category = :category', { category });
    if (view === 'upcoming') qb.andWhere('e.date >= :now', { now: new Date().toISOString().split('T')[0] });
    else if (view === 'past') qb.andWhere('e.date < :now', { now: new Date().toISOString().split('T')[0] });
    qb.orderBy('e.date', 'ASC');
    return qb.getMany();
  }

  findOne(id: number) {
    return this.eventsRepo.findOne({ where: { id }, relations: ['creator', 'rsvps', 'rsvps.user'] });
  }

  async create(creatorId: number, dto: CreateEventDto) {
    const event = this.eventsRepo.create({ ...dto, creatorId });
    const saved = await this.eventsRepo.save(event);
    return this.findOne(saved.id);
  }

  async rsvp(eventId: number, userId: number) {
    const existing = await this.rsvpRepo.findOne({ where: { eventId, userId } });
    if (existing) return this.findOne(eventId);
    await this.rsvpRepo.save(this.rsvpRepo.create({ eventId, userId }));
    return this.findOne(eventId);
  }

  async cancelRsvp(eventId: number, userId: number) {
    await this.rsvpRepo.delete({ eventId, userId });
    return this.findOne(eventId);
  }

  async countRsvpsByUser(userId: number) {
    return this.rsvpRepo.count({ where: { userId } });
  }
}

@Controller('events')
class EventsController {
  constructor(private svc: EventsService) {}

  @Get()
  findAll(@Query('category') category: string, @Query('view') view: string) {
    return this.svc.findAll(category, view);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreateEventDto, @Request() req) {
    return this.svc.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/rsvp')
  rsvp(@Param('id') id: number, @Request() req) {
    return this.svc.rsvp(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/rsvp')
  cancelRsvp(@Param('id') id: number, @Request() req) {
    return this.svc.cancelRsvp(id, req.user.id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([SustyEvent, EventRsvp])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
