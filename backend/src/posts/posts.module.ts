import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, Reply } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  ) {}

  findAll(sort: string = 'latest') {
    const order = sort === 'trending' ? { likes: 'DESC' as const } : { createdAt: 'DESC' as const };
    return this.postsRepo.find({ order, relations: ['author', 'replies', 'replies.author'] });
  }

  findOne(id: number) {
    return this.postsRepo.findOne({ where: { id }, relations: ['author', 'replies', 'replies.author'] });
  }

  async create(authorId: number, dto: CreatePostDto) {
    const hashtags = (dto.content.match(/#(\w+)/g) || []).map(h => h.slice(1));
    const post = this.postsRepo.create({ ...dto, authorId, hashtags });
    const saved = await this.postsRepo.save(post);
    return this.findOne(saved.id);
  }

  async remove(id: number, userId: number) {
    const post = await this.postsRepo.findOne({ where: { id } });
    if (post && post.authorId === userId) {
      await this.postsRepo.remove(post);
      return { success: true };
    }
    return { success: false };
  }

  async like(id: number) {
    await this.postsRepo.increment({ id }, 'likes', 1);
    return this.findOne(id);
  }

  async repost(id: number) {
    await this.postsRepo.increment({ id }, 'reposts', 1);
    return this.findOne(id);
  }

  async addReply(postId: number, authorId: number, dto: CreateReplyDto) {
    const reply = this.repliesRepo.create({ postId, authorId, content: dto.content });
    await this.repliesRepo.save(reply);
    return this.findOne(postId);
  }

  countByUser(userId: number) {
    return this.postsRepo.count({ where: { authorId: userId } });
  }
}

@Controller('posts')
class PostsController {
  constructor(private svc: PostsService) {}

  @Get()
  findAll(@Query('sort') sort: string) {
    return this.svc.findAll(sort);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.svc.findOne(id);
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
  like(@Param('id') id: number) {
    return this.svc.like(id);
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
  imports: [TypeOrmModule.forFeature([Post, Reply])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
