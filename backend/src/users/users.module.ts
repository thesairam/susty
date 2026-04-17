import { Module, Controller, Injectable, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Post, Listing, SustyEvent, EventRsvp, UserChallenge, Donation, CommunityPost, Connection } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class UpdateUserDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() username?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() avatar?: string;
}

@Injectable()
class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(Post) private postsRepo: Repository<Post>,
    @InjectRepository(Listing) private listingsRepo: Repository<Listing>,
    @InjectRepository(EventRsvp) private rsvpRepo: Repository<EventRsvp>,
    @InjectRepository(UserChallenge) private ucRepo: Repository<UserChallenge>,
    @InjectRepository(Donation) private donationsRepo: Repository<Donation>,
    @InjectRepository(CommunityPost) private communityPostsRepo: Repository<CommunityPost>,
    @InjectRepository(Connection) private connectionsRepo: Repository<Connection>,
  ) {}

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async getStats(userId: number) {
    const [posts, listings, rsvps, completedChallenges, donations, communityPosts, rootCount] = await Promise.all([
      this.postsRepo.count({ where: { authorId: userId } }),
      this.listingsRepo.count({ where: { sellerId: userId } }),
      this.rsvpRepo.count({ where: { userId } }),
      this.ucRepo.count({ where: { userId, status: 'completed' } }),
      this.donationsRepo.count({ where: { donorId: userId } }),
      this.communityPostsRepo.count({ where: { authorId: userId } }),
      this.connectionsRepo.count({ where: [
        { requesterId: userId, status: 'accepted' },
        { recipientId: userId, status: 'accepted' },
      ]}),
    ]);
    const co2 = (listings * 8) + (posts * 0.3) + (completedChallenges * 5) + (rsvps * 3);
    const waste = listings * 3 + completedChallenges * 2;
    const water = completedChallenges * 50 + posts * 5 + rsvps * 10;
    return {
      activity: { posts, marketplaceItems: listings, eventsAttended: rsvps, challengesCompleted: completedChallenges, donations, communityPosts, roots: rootCount },
      impact: { co2Saved: co2.toFixed(1), wasteReduced: waste.toFixed(1), waterSaved: water.toFixed(0), treesEquiv: (co2 / 22).toFixed(1) },
    };
  }
}

@Controller('users')
class UsersController {
  constructor(private svc: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.svc.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  getMyStats(@Request() req) {
    return this.svc.getStats(req.user.id);
  }

  @Get(':id')
  getUser(@Param('id') id: number) {
    return this.svc.findOne(id);
  }

  @Get(':id/stats')
  getUserStats(@Param('id') id: number) {
    return this.svc.getStats(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateUser(@Param('id') id: number, @Body() dto: UpdateUserDto, @Request() req) {
    if (req.user.id !== +id) return { error: 'Forbidden' };
    return this.svc.update(id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User, Post, Listing, EventRsvp, UserChallenge, Donation, CommunityPost, Connection])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
