import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation, DonationRequest } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class CreateDonationDto {
  @IsString() name: string;
  @IsString() category: string;
  @IsString() @IsOptional() condition?: string;
  @IsString() @IsOptional() description?: string;
}

class CreateRequestDto {
  @IsString() name: string;
  @IsString() category: string;
  @IsString() @IsOptional() reason?: string;
}

@Injectable()
class DonationsService {
  constructor(
    @InjectRepository(Donation) private donationsRepo: Repository<Donation>,
    @InjectRepository(DonationRequest) private requestsRepo: Repository<DonationRequest>,
  ) {}

  findDonations(category?: string) {
    const where = category ? { category } : {};
    return this.donationsRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['donor'] });
  }

  async createDonation(donorId: number, dto: CreateDonationDto) {
    const donation = this.donationsRepo.create({ ...dto, donorId });
    const saved = await this.donationsRepo.save(donation);
    return this.donationsRepo.findOne({ where: { id: saved.id }, relations: ['donor'] });
  }

  async claimDonation(id: number, userId: number) {
    const donation = await this.donationsRepo.findOne({ where: { id } });
    if (!donation || donation.claimed) return null;
    donation.claimed = true;
    donation.claimedById = userId;
    return this.donationsRepo.save(donation);
  }

  findRequests(category?: string) {
    const where = category ? { category } : {};
    return this.requestsRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['requester'] });
  }

  async createRequest(requesterId: number, dto: CreateRequestDto) {
    const request = this.requestsRepo.create({ ...dto, requesterId });
    const saved = await this.requestsRepo.save(request);
    return this.requestsRepo.findOne({ where: { id: saved.id }, relations: ['requester'] });
  }

  async fulfillRequest(id: number, userId: number) {
    const request = await this.requestsRepo.findOne({ where: { id } });
    if (!request || request.fulfilled) return null;
    request.fulfilled = true;
    request.fulfilledById = userId;
    return this.requestsRepo.save(request);
  }

  async stats() {
    const donations = await this.donationsRepo.count();
    const claimed = await this.donationsRepo.count({ where: { claimed: true } });
    const requests = await this.requestsRepo.count();
    const fulfilled = await this.requestsRepo.count({ where: { fulfilled: true } });
    return { donations, claimed, requests, fulfilled };
  }

  countByUser(userId: number) {
    return this.donationsRepo.count({ where: { donorId: userId } });
  }
}

@Controller('donations')
class DonationsController {
  constructor(private svc: DonationsService) {}

  @Get()
  findDonations(@Query('category') category: string) {
    return this.svc.findDonations(category);
  }

  @Get('stats')
  stats() {
    return this.svc.stats();
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreateDonationDto, @Request() req) {
    return this.svc.createDonation(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/claim')
  claim(@Param('id') id: number, @Request() req) {
    return this.svc.claimDonation(id, req.user.id);
  }

  @Get('requests')
  findRequests(@Query('category') category: string) {
    return this.svc.findRequests(category);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost('requests')
  createRequest(@Body() dto: CreateRequestDto, @Request() req) {
    return this.svc.createRequest(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost('requests/:id/fulfill')
  fulfill(@Param('id') id: number, @Request() req) {
    return this.svc.fulfillRequest(id, req.user.id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Donation, DonationRequest])],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
