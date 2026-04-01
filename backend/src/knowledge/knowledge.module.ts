import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional, IsArray } from 'class-validator';

class CreateArticleDto {
  @IsString() title: string;
  @IsString() category: string;
  @IsString() @IsOptional() difficulty?: string;
  @IsString() content: string;
  @IsArray() @IsOptional() tags?: string[];
}

@Injectable()
class KnowledgeService {
  constructor(@InjectRepository(Article) private repo: Repository<Article>) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save([
        { authorId: null, title: 'Getting Started with Composting', category: 'composting', difficulty: 'Beginner', content: 'Composting is nature\'s way of recycling organic matter into rich soil. Start with a simple bin in your backyard or even under your kitchen sink with a worm bin. Layer green materials (food scraps, grass) with brown materials (leaves, cardboard) in a 1:3 ratio. Keep it moist and turn weekly. In 2-3 months you\'ll have rich compost for your garden.', tags: ['composting', 'beginner', 'garden'], likes: 24, views: 156 },
        { authorId: null, title: 'The Minimalist Lifestyle Guide', category: 'minimalism', difficulty: 'Beginner', content: 'Minimalism isn\'t about owning nothing — it\'s about owning only what adds value. Start by decluttering one room at a time. Ask yourself: Does this spark joy? Have I used it in the last year? For each item you remove, you reduce your environmental footprint. Donate usable items, recycle the rest.', tags: ['minimalism', 'lifestyle', 'declutter'], likes: 42, views: 289 },
        { authorId: null, title: 'Home Energy Saving Tips', category: 'energy', difficulty: 'Intermediate', content: 'Reduce your energy bill and carbon footprint with these proven strategies: Switch to LED bulbs (75% less energy), unplug phantom loads, use a programmable thermostat, seal air leaks around windows and doors, and wash clothes in cold water. These simple changes can cut your energy use by 20-30%.', tags: ['energy', 'home', 'savings'], likes: 31, views: 198 },
        { authorId: null, title: 'Sustainable Fashion 101', category: 'fashion', difficulty: 'Beginner', content: 'The fashion industry produces 10% of global carbon emissions. Fight fast fashion by buying secondhand, choosing quality over quantity, learning basic repairs (buttons, hems), and supporting ethical brands. A capsule wardrobe of 30-40 versatile pieces can replace hundreds of trendy items.', tags: ['fashion', 'sustainable', 'secondhand'], likes: 18, views: 134 },
        { authorId: null, title: 'Water Conservation at Home', category: 'water', difficulty: 'Beginner', content: 'The average person uses 80-100 gallons of water daily. Cut that in half with low-flow fixtures, shorter showers, fixing leaks promptly, and collecting rainwater for gardens. A dripping faucet wastes 3,000 gallons per year. Every drop counts toward water security.', tags: ['water', 'conservation', 'home'], likes: 15, views: 112 },
        { authorId: null, title: 'DIY Electronics Repair', category: 'diy', difficulty: 'Advanced', content: 'Before throwing away broken electronics, try repairing them. Common fixes include replacing batteries in devices, re-soldering loose connections, cleaning corroded contacts, and replacing screens. You\'ll need basic tools: a precision screwdriver set, multimeter, and soldering iron. Online communities and iFixit guides can walk you through most repairs.', tags: ['electronics', 'repair', 'diy'], likes: 27, views: 203 },
      ]);
    }
  }

  findAll(category?: string) {
    const where = category ? { category } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' }, relations: ['author'] });
  }

  async findOne(id: number) {
    await this.repo.increment({ id }, 'views', 1);
    return this.repo.findOne({ where: { id }, relations: ['author'] });
  }

  async create(authorId: number, dto: CreateArticleDto) {
    const article = this.repo.create({ ...dto, authorId });
    const saved = await this.repo.save(article);
    return this.repo.findOne({ where: { id: saved.id }, relations: ['author'] });
  }

  async like(id: number) {
    await this.repo.increment({ id }, 'likes', 1);
    return this.repo.findOne({ where: { id }, relations: ['author'] });
  }
}

@Controller('articles')
class KnowledgeController {
  constructor(private svc: KnowledgeService) {}

  @Get()
  findAll(@Query('category') category: string) {
    return this.svc.findAll(category);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreateArticleDto, @Request() req) {
    return this.svc.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/like')
  like(@Param('id') id: number) {
    return this.svc.like(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
