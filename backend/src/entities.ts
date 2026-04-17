import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Unique,
} from 'typeorm';

// ─── User ───────────────────────────────────────────
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column({ default: '' })
  bio: string;

  @Column({ default: '' })
  avatar: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Connection (Roots) ─────────────────────────────
@Entity('connections')
@Unique(['requesterId', 'recipientId'])
export class Connection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requesterId: number;

  @Column()
  recipientId: number;

  @Column({ default: 'pending' })
  status: string; // pending | accepted

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Post ───────────────────────────────────────────
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  authorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column('text')
  content: string;

  @Column({ default: '' })
  mediaType: string;

  @Column({ default: '' })
  mediaUrl: string;

  @Column('simple-array', { default: '' })
  hashtags: string[];

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  reposts: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reply, (r) => r.post, { eager: true })
  replies: Reply[];
}

// ─── Reply ──────────────────────────────────────────
@Entity('replies')
export class Reply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @ManyToOne(() => Post, (p) => p.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  authorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── PostLike ───────────────────────────────────────
@Entity('post_likes')
@Unique(['userId', 'postId'])
export class PostLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  postId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Listing (Marketplace) ──────────────────────────
@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sellerId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number;

  @Column()
  category: string;

  @Column({ default: 'Good' })
  condition: string;

  @Column({ default: 'sell' })
  type: string;

  @Column({ default: '' })
  location: string;

  @Column('text', { default: '' })
  description: string;

  @Column('decimal', { precision: 5, scale: 1, default: 0 })
  carbonSaved: number;

  @Column('decimal', { precision: 3, scale: 1, default: 5.0 })
  rating: number;

  @Column({ default: '' })
  image: string;

  @Column({ default: false })
  favorited: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Event ──────────────────────────────────────────
@Entity('events')
export class SustyEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  creatorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  title: string;

  @Column('text', { default: '' })
  description: string;

  @Column()
  date: string;

  @Column({ default: '' })
  time: string;

  @Column({ default: '' })
  location: string;

  @Column()
  category: string;

  @Column({ default: 'free' })
  ticketType: string;

  @Column({ default: 0 })
  capacity: number;

  @Column({ default: '' })
  image: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => EventRsvp, (r) => r.event, { eager: true })
  rsvps: EventRsvp[];
}

// ─── EventRsvp ──────────────────────────────────────
@Entity('event_rsvps')
export class EventRsvp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column()
  userId: number;

  @ManyToOne(() => SustyEvent, (e) => e.rsvps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: SustyEvent;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Message ────────────────────────────────────────
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  senderId: number;

  @Column()
  receiverId: number;

  @Column('text')
  text: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Community Group ────────────────────────────────
@Entity('community_groups')
export class CommunityGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { default: '' })
  description: string;

  @Column({ default: '' })
  city: string;

  @Column({ default: '' })
  icon: string;

  @Column({ default: 0 })
  memberCount: number;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Community Post ─────────────────────────────────
@Entity('community_posts')
export class CommunityPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  groupId: number;

  @Column()
  authorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ default: '' })
  title: string;

  @Column('text')
  content: string;

  @Column({ default: 0 })
  likes: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => CommunityComment, (c) => c.post, { eager: true })
  comments: CommunityComment[];
}

// ─── Community Comment ──────────────────────────────
@Entity('community_comments')
export class CommunityComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @ManyToOne(() => CommunityPost, (p) => p.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: CommunityPost;

  @Column()
  authorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── CommunityPostLike ──────────────────────────────
@Entity('community_post_likes')
@Unique(['userId', 'postId'])
export class CommunityPostLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  postId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: CommunityPost;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Challenge ──────────────────────────────────────
@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  type: string; // weekly | monthly

  @Column({ default: 'Easy' })
  difficulty: string;

  @Column('decimal', { precision: 5, scale: 1, default: 0 })
  co2Impact: number;

  @Column({ default: '' })
  icon: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── UserChallenge ──────────────────────────────────
@Entity('user_challenges')
export class UserChallenge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  challengeId: number;

  @Column({ default: 'joined' })
  status: string; // joined | completed

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Challenge, { eager: true })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}

// ─── Article (Knowledge Hub) ────────────────────────
@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  authorId: number;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column({ default: 'Beginner' })
  difficulty: string;

  @Column('text')
  content: string;

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  views: number;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Donation ───────────────────────────────────────
@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  donorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'donorId' })
  donor: User;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ default: 'Good' })
  condition: string;

  @Column('text', { default: '' })
  description: string;

  @Column({ default: false })
  claimed: boolean;

  @Column({ nullable: true })
  claimedById: number;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── DonationRequest ────────────────────────────────
@Entity('donation_requests')
export class DonationRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requesterId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column('text', { default: '' })
  reason: string;

  @Column({ default: false })
  fulfilled: boolean;

  @Column({ nullable: true })
  fulfilledById: number;

  @CreateDateColumn()
  createdAt: Date;
}
