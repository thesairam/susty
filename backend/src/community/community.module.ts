import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityGroup, CommunityPost, CommunityComment, CommunityPostLike } from '../entities';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';

class CreateCommunityPostDto {
  @IsString() content: string;
  @IsString() @IsOptional() title?: string;
  @IsNumber() @IsOptional() groupId?: number;
}

class CreateCommentDto {
  @IsString() content: string;
}

@Injectable()
class CommunityService {
  constructor(
    @InjectRepository(CommunityGroup) private groupsRepo: Repository<CommunityGroup>,
    @InjectRepository(CommunityPost) private postsRepo: Repository<CommunityPost>,
    @InjectRepository(CommunityComment) private commentsRepo: Repository<CommunityComment>,
    @InjectRepository(CommunityPostLike) private likesRepo: Repository<CommunityPostLike>,
  ) {}

  async onModuleInit() {
    const count = await this.groupsRepo.count();
    if (count === 0) {
      await this.groupsRepo.save([
        { name: 'Berlin Green', description: 'Sustainability community in Berlin', city: 'Berlin', icon: '🇩🇪', memberCount: 234 },
        { name: 'NYC Zero Waste', description: 'Zero waste living in New York City', city: 'New York', icon: '🗽', memberCount: 567 },
        { name: 'London Repair Café', description: 'Fix things together in London', city: 'London', icon: '🔧', memberCount: 189 },
        { name: 'Tokyo Eco', description: 'Eco-friendly living in Tokyo', city: 'Tokyo', icon: '🗼', memberCount: 312 },
      ]);
    }
  }

  getGroups() {
    return this.groupsRepo.find({ order: { memberCount: 'DESC' } });
  }

  async joinGroup(id: number) {
    await this.groupsRepo.increment({ id }, 'memberCount', 1);
    return this.groupsRepo.findOne({ where: { id } });
  }

  getPosts(groupId?: number, userId?: number) {
    const where = groupId ? { groupId } : {};
    return this.postsRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['author', 'comments', 'comments.author'] })
      .then(posts => this.attachLikedMany(posts, userId));
  }

  private async attachLikedMany(posts: any[], userId?: number) {
    if (!posts.length || !userId) return posts;
    const likes = await this.likesRepo.find({ where: posts.map(p => ({ postId: p.id, userId })) });
    const likedIds = new Set(likes.map(l => l.postId));
    for (const p of posts) p.liked = likedIds.has(p.id);
    return posts;
  }

  async createPost(authorId: number, dto: CreateCommunityPostDto) {
    const post = this.postsRepo.create({ authorId, content: dto.content, title: dto.title || '', groupId: dto.groupId });
    const saved = await this.postsRepo.save(post);
    return this.postsRepo.findOne({ where: { id: saved.id }, relations: ['author', 'comments', 'comments.author'] });
  }

  async likePost(id: number, userId: number) {
    const existing = await this.likesRepo.findOne({ where: { postId: id, userId } });
    if (existing) {
      await this.likesRepo.remove(existing);
      await this.postsRepo.decrement({ id }, 'likes', 1);
    } else {
      await this.likesRepo.save({ postId: id, userId });
      await this.postsRepo.increment({ id }, 'likes', 1);
    }
    const post = await this.postsRepo.findOne({ where: { id }, relations: ['author', 'comments', 'comments.author'] });
    if (post) post['liked'] = !existing;
    return post;
  }

  async addComment(postId: number, authorId: number, dto: CreateCommentDto) {
    const comment = this.commentsRepo.create({ postId, authorId, content: dto.content });
    await this.commentsRepo.save(comment);
    return this.postsRepo.findOne({ where: { id: postId }, relations: ['author', 'comments', 'comments.author'] });
  }

  countByUser(userId: number) {
    return this.postsRepo.count({ where: { authorId: userId } });
  }
}

@Controller('community')
class CommunityController {
  constructor(private svc: CommunityService) {}

  @Get('groups')
  getGroups() {
    return this.svc.getGroups();
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost('groups/:id/join')
  joinGroup(@Param('id') id: number) {
    return this.svc.joinGroup(id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts')
  getPosts(@Query('groupId') groupId: number, @Request() req) {
    return this.svc.getPosts(groupId, req?.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost('posts')
  createPost(@Body() dto: CreateCommunityPostDto, @Request() req) {
    return this.svc.createPost(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost('posts/:id/like')
  likePost(@Param('id') id: number, @Request() req) {
    return this.svc.likePost(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost('posts/:id/comments')
  addComment(@Param('id') id: number, @Body() dto: CreateCommentDto, @Request() req) {
    return this.svc.addComment(id, req.user.id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([CommunityGroup, CommunityPost, CommunityComment, CommunityPostLike])],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
