import {
  Module, Controller, Injectable,
  Get, Query, UseGuards, Request,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User, Post, SustyEvent, Listing, CommunityPost, Article } from '../entities';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
class SearchService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Post) private postsRepo: Repository<Post>,
    @InjectRepository(SustyEvent) private eventsRepo: Repository<SustyEvent>,
    @InjectRepository(Listing) private listingsRepo: Repository<Listing>,
    @InjectRepository(CommunityPost) private communityRepo: Repository<CommunityPost>,
    @InjectRepository(Article) private articlesRepo: Repository<Article>,
  ) {}

  async search(q: string, type?: string) {
    if (!q || q.trim().length < 2) return { users: [], posts: [], events: [], listings: [], community: [], articles: [] };

    const pattern = `%${q.trim()}%`;
    const results: any = {};

    if (!type || type === 'people') {
      results.users = await this.usersRepo.find({
        where: [
          { name: ILike(pattern) },
          { username: ILike(pattern) },
          { bio: ILike(pattern) },
        ],
        take: 20,
        order: { name: 'ASC' },
      });
    } else {
      results.users = [];
    }

    if (!type || type === 'posts') {
      results.posts = await this.postsRepo.find({
        where: { content: ILike(pattern) },
        take: 20,
        order: { createdAt: 'DESC' },
        relations: ['author', 'replies'],
      });
    } else {
      results.posts = [];
    }

    if (!type || type === 'events') {
      results.events = await this.eventsRepo.find({
        where: [
          { title: ILike(pattern) },
          { description: ILike(pattern) },
          { location: ILike(pattern) },
        ],
        take: 20,
        order: { date: 'DESC' },
        relations: ['creator'],
      });
    } else {
      results.events = [];
    }

    if (!type || type === 'marketplace') {
      results.listings = await this.listingsRepo.find({
        where: [
          { name: ILike(pattern) },
          { description: ILike(pattern) },
          { category: ILike(pattern) },
        ],
        take: 20,
        order: { createdAt: 'DESC' },
        relations: ['seller'],
      });
    } else {
      results.listings = [];
    }

    if (!type || type === 'community') {
      results.community = await this.communityRepo.find({
        where: [
          { title: ILike(pattern) },
          { content: ILike(pattern) },
        ],
        take: 20,
        order: { createdAt: 'DESC' },
        relations: ['author'],
      });
    } else {
      results.community = [];
    }

    if (!type || type === 'articles') {
      results.articles = await this.articlesRepo.find({
        where: [
          { title: ILike(pattern) },
          { content: ILike(pattern) },
        ],
        take: 20,
        order: { createdAt: 'DESC' },
      });
    } else {
      results.articles = [];
    }

    return results;
  }
}

@Controller('search')
class SearchController {
  constructor(private svc: SearchService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  search(@Query('q') q: string, @Query('type') type: string) {
    return this.svc.search(q, type);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User, Post, SustyEvent, Listing, CommunityPost, Article])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
