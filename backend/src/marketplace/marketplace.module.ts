import {
  Module, Controller, Injectable,
  Get, Post as HttpPost, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';

class CreateListingDto {
  @IsString() name: string;
  @IsNumber() @IsOptional() price?: number;
  @IsString() category: string;
  @IsString() @IsOptional() condition?: string;
  @IsString() @IsOptional() type?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() image?: string;
}

@Injectable()
class MarketplaceService {
  constructor(@InjectRepository(Listing) private repo: Repository<Listing>) {}

  findAll(category?: string, type?: string, search?: string, sort: string = 'newest') {
    const qb = this.repo.createQueryBuilder('l')
      .leftJoinAndSelect('l.seller', 'seller');
    if (category) qb.andWhere('l.category = :category', { category });
    if (type) qb.andWhere('l.type = :type', { type });
    if (search) qb.andWhere('LOWER(l.name) LIKE :search', { search: `%${search.toLowerCase()}%` });
    if (sort === 'price-asc') qb.orderBy('l.price', 'ASC');
    else if (sort === 'price-desc') qb.orderBy('l.price', 'DESC');
    else if (sort === 'rating') qb.orderBy('l.rating', 'DESC');
    else qb.orderBy('l.createdAt', 'DESC');
    return qb.getMany();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['seller'] });
  }

  async create(sellerId: number, dto: CreateListingDto) {
    const carbonSaved = Math.round(Math.random() * 15 + 2);
    const listing = this.repo.create({ ...dto, sellerId, carbonSaved, rating: 5.0 });
    const saved = await this.repo.save(listing);
    return this.findOne(saved.id);
  }

  async remove(id: number, userId: number) {
    const listing = await this.repo.findOne({ where: { id } });
    if (listing && listing.sellerId === userId) {
      await this.repo.remove(listing);
      return { success: true };
    }
    return { success: false };
  }

  countByUser(userId: number) {
    return this.repo.count({ where: { sellerId: userId } });
  }
}

@Controller('listings')
class MarketplaceController {
  constructor(private svc: MarketplaceService) {}

  @Get()
  findAll(
    @Query('category') category: string,
    @Query('type') type: string,
    @Query('search') search: string,
    @Query('sort') sort: string,
  ) {
    return this.svc.findAll(category, type, search, sort);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreateListingDto, @Request() req) {
    return this.svc.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number, @Request() req) {
    return this.svc.remove(id, req.user.id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Listing])],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
