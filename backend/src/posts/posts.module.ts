import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Delete, Param, Body, Query, UseGuards, Request,
  ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, Reply, PostLike } from '../entities';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class CreatePostDto {
  @IsString() content: string;
  @IsString() @IsOptional() mediaType?: string;
  @IsString() @IsOptional() mediaUrl?: string;
}

class CreateReplyDto {
  @IsString() content: string;
}

@Injectable()
class PostsService {
  constructor(
    @InjectRepository(Post) private postsRepo: Repository<Post>,
    @InjectRepository(Reply) private repliesRepo: Repository<Reply>,
    @InjectRepository(PostLike) private likesRepo: Repository<PostLike>,
  ) {}

  private async attachLiked(post: any, userId?: number) {
    if (!post || !userId) return post;
    const like = await this.likesRepo.findOne({ where: { postId: post.id, userId } });
    post.liked = !!like;
    return post;
  }

  private async attachLikedMany(posts: any[], userId?: number) {
    if (!posts.length || !userId) return posts;
    const likes = await this.likesRepo.find({ where: posts.map(p => ({ postId: p.id, userId })) });
    const likedIds = new Set(likes.map(l => l.postId));
    for (const p of posts) p.liked = likedIds.has(p.id);
    return posts;
  }

  async findAll(sort: string = 'latest', userId?: number) {
    const order = sort === 'trending' ? { likes: 'DESC' as const } : { createdAt: 'DESC' as const };
    const posts = await this.postsRepo.find({ order, relations: ['author', 'replies', 'replies.author'] });
    return this.attachLikedMany(posts, userId);
  }

  async findOne(id: number, userId?: number) {
    const post = await this.postsRepo.findOne({ where: { id }, relations: ['author', 'replies', 'replies.author'] });
    return this.attachLiked(post, userId);
  }

  async create(authorId: number, dto: CreatePostDto) {
    const hashtags = (dto.content.match(/#(\w+)/g) || []).map(h => h.slice(1));
    const post = this.postsRepo.create({ ...dto, authorId, hashtags });
    const saved = await this.postsRepo.save(post);
    return this.findOne(saved.id, authorId);
  }

  async remove(id: number, userId: number) {
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('You can only delete your own posts');
    await this.postsRepo.remove(post);
    return { success: true };
  }

  async like(id: number, userId: number) {
    const existing = await this.likesRepo.findOne({ where: { postId: id, userId } });
    if (existing) {
      await this.likesRepo.remove(existing);
      await this.postsRepo.decrement({ id }, 'likes', 1);
    } else {
      await this.likesRepo.save({ postId: id, userId });
      await this.postsRepo.increment({ id }, 'likes', 1);
    }
    return this.findOne(id, userId);
  }

  async repost(id: number) {
    await this.postsRepo.increment({ id }, 'reposts', 1);
    return this.findOne(id);
  }

  async addReply(postId: number, authorId: number, dto: CreateReplyDto) {
    const reply = this.repliesRepo.create({ postId, authorId, content: dto.content });
    await this.repliesRepo.save(reply);
    return this.findOne(postId, authorId);
  }

  countByUser(userId: number) {
    return this.postsRepo.count({ where: { authorId: userId } });
  }
}

@Controller('posts')
class PostsController {
  constructor(private svc: PostsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query('sort') sort: string, @Request() req) {
    const userId = req?.user?.id;
    return this.svc.findAll(sort, userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: number, @Request() req) {
    const userId = req?.user?.id;
    return this.svc.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreatePostDto, @Request() req) {
    return this.svc.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number, @Request() req) {
    return this.svc.remove(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/like')
  like(@Param('id') id: number, @Request() req) {
    return this.svc.like(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/repost')
  repost(@Param('id') id: number) {
    return this.svc.repost(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/replies')
  addReply(@Param('id') id: number, @Body() dto: CreateReplyDto, @Request() req) {
    return this.svc.addReply(id, req.user.id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Post, Reply, PostLike])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
