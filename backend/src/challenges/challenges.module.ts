import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Param, UseGuards, Request,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge, UserChallenge } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
class ChallengesService {
  constructor(
    @InjectRepository(Challenge) private challengesRepo: Repository<Challenge>,
    @InjectRepository(UserChallenge) private ucRepo: Repository<UserChallenge>,
  ) {}

  async onModuleInit() {
    const count = await this.challengesRepo.count();
    if (count === 0) {
      await this.challengesRepo.save([
        { title: 'Plastic-Free Week', description: 'Avoid all single-use plastics for 7 days', type: 'weekly', difficulty: 'Medium', co2Impact: 3.5, icon: '🚫' },
        { title: 'Bike to Work', description: 'Cycle to work every day this week', type: 'weekly', difficulty: 'Easy', co2Impact: 8.2, icon: '🚲' },
        { title: 'Meatless Monday', description: 'Go vegetarian every Monday', type: 'weekly', difficulty: 'Easy', co2Impact: 2.1, icon: '🥗' },
        { title: 'Zero Food Waste', description: 'Plan meals and compost all food scraps', type: 'weekly', difficulty: 'Medium', co2Impact: 4.0, icon: '🍎' },
        { title: '30-Day Minimalism', description: 'Declutter one item per day for 30 days', type: 'monthly', difficulty: 'Hard', co2Impact: 15.0, icon: '📦' },
        { title: 'Energy Audit', description: 'Reduce household energy use by 20%', type: 'monthly', difficulty: 'Medium', co2Impact: 25.0, icon: '⚡' },
        { title: 'Local Food Only', description: 'Eat only locally-sourced food for a month', type: 'monthly', difficulty: 'Hard', co2Impact: 18.5, icon: '🌾' },
        { title: 'Green Commute Month', description: 'Use only public transport or bike for a month', type: 'monthly', difficulty: 'Medium', co2Impact: 30.0, icon: '🚌' },
      ]);
    }
  }

  findAll() {
    return this.challengesRepo.find({ order: { type: 'ASC', difficulty: 'ASC' } });
  }

  async getProgress(userId: number) {
    const ucs = await this.ucRepo.find({ where: { userId }, relations: ['challenge'] });
    const progress: Record<number, string> = {};
    ucs.forEach(uc => { progress[uc.challengeId] = uc.status; });
    return progress;
  }

  async join(challengeId: number, userId: number) {
    const existing = await this.ucRepo.findOne({ where: { challengeId, userId } });
    if (existing) return existing;
    return this.ucRepo.save(this.ucRepo.create({ challengeId, userId, status: 'joined' }));
  }

  async complete(challengeId: number, userId: number) {
    const uc = await this.ucRepo.findOne({ where: { challengeId, userId } });
    if (!uc) return null;
    uc.status = 'completed';
    uc.completedAt = new Date();
    return this.ucRepo.save(uc);
  }

  async leaderboard() {
    const results = await this.ucRepo
      .createQueryBuilder('uc')
      .select('uc.userId', 'userId')
      .addSelect('COUNT(*)', 'completed')
      .leftJoin('uc.user', 'user')
      .addSelect('user.name', 'name')
      .where('uc.status = :status', { status: 'completed' })
      .groupBy('uc.userId')
      .addGroupBy('user.name')
      .orderBy('completed', 'DESC')
      .limit(10)
      .getRawMany();
    return results;
  }
}

@Controller('challenges')
class ChallengesController {
  constructor(private svc: ChallengesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress')
  getProgress(@Request() req) {
    return this.svc.getProgress(req.user.id);
  }

  @Get('leaderboard')
  leaderboard() {
    return this.svc.leaderboard();
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/join')
  join(@Param('id') id: number, @Request() req) {
    return this.svc.join(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/complete')
  complete(@Param('id') id: number, @Request() req) {
    return this.svc.complete(id, req.user.id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, UserChallenge])],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
