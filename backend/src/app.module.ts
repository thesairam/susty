import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User, Post, Reply, Listing, SustyEvent, EventRsvp, Message,
  CommunityGroup, CommunityPost, CommunityComment,
  Challenge, UserChallenge, Article, Donation, DonationRequest,
} from './entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { EventsModule } from './events/events.module';
import { MessagesModule } from './messages/messages.module';
import { CommunityModule } from './community/community.module';
import { ChallengesModule } from './challenges/challenges.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { DonationsModule } from './donations/donations.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://susty:susty_dev@localhost:5432/susty',
      entities: [
        User, Post, Reply, Listing, SustyEvent, EventRsvp, Message,
        CommunityGroup, CommunityPost, CommunityComment,
        Challenge, UserChallenge, Article, Donation, DonationRequest,
      ],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    MarketplaceModule,
    EventsModule,
    MessagesModule,
    CommunityModule,
    ChallengesModule,
    KnowledgeModule,
    DonationsModule,
  ],
})
export class AppModule {}
