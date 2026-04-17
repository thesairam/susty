import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private async generateUsername(name: string): Promise<string> {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
    let username = base;
    let counter = 0;
    while (await this.usersRepo.findOne({ where: { username } })) {
      counter++;
      username = `${base}${counter}`;
    }
    return username;
  }

  async register(email: string, password: string, name: string) {
    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(password, 10);
    const username = await this.generateUsername(name);
    const user = this.usersRepo.create({ email, password: hash, name, username });
    await this.usersRepo.save(user);

    return this.buildResponse(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.buildResponse(user);
  }

  async findById(id: number) {
    return this.usersRepo.findOne({ where: { id } });
  }

  private buildResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, username: user.username, bio: user.bio, avatar: user.avatar },
    };
  }
}
