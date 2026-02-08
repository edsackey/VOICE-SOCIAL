
/**
 * VOICE SOCIAL Global Application Types
 */

export enum UserRole {
  HOST = 'HOST',
  MODERATOR = 'MODERATOR',
  ADVERTISER = 'ADVERTISER',
  SPEAKER = 'SPEAKER',
  LISTENER = 'LISTENER'
}

export type Locale = 'en' | 'fr' | 'es';

export interface DBUser {
  id: string; 
  username: string;
  email: string;
  createdAt: number;
  displayName: string;
  bio?: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  preferredLocale?: Locale;
  preferredCurrency?: string;
}

export interface DBDonation {
  id: string;
  senderId: string;
  roomId: string;
  amount: number;
  currency: string;
  message?: string;
  paymentMethod: 'DPO_CARD' | 'MTN_MOMO' | 'PAYPAL' | 'LOCAL_WALLET';
  phoneNumber?: string; 
  createdAt: number;
}

// Added missing DBFollow interface to fix storage service error
export interface DBFollow {
  followerId: string;
  followedId: string;
  createdAt: number;
}

// Added missing DBLike interface to fix storage service and postcard errors
export interface DBLike {
  userId: string;
  postId: string;
  createdAt: number;
}

// Added missing DBComment interface to fix storage service and postcard errors
export interface DBComment {
  id: string;
  userId: string;
  postId: string;
  text: string;
  createdAt: number;
}

// Added missing DBSubscription interface to fix storage service error
export interface DBSubscription {
  subscriberId: string;
  targetUserId: string;
  createdAt: number;
}

export interface AttendanceRecord {
  userId: string;
  userName: string;
  joinTime: number;
  leaveTime?: number;
  duration?: number;
}

export interface EchoGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
}

export interface DBPost {
  id: string;
  authorId: string;
  content: string;
  createdAt: number;
  postType: 'text' | 'image' | 'audio' | 'video';
  imageUrl?: string;
  videoUrl?: string;
}

export interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  hostName: string;
  hostAvatar: string;
  startTime: number;
  duration: string;
  tags: string[];
  capacity: number;
  bookedCount: number;
  posterUrl?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  isMuted: boolean;
  handRaised: boolean;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  profileImages?: string[];
  bannerImage?: string;
  pastRooms?: { id: string; title: string; date: string }[];
  welcomeVoiceNote?: string;
}

export interface PlaylistTrack {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Room {
  id: string;
  title: string;
  description: string;
  participantCount: number;
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'intense' | 'controversial';
  speakers: User[];
  listeners: User[];
  playlist?: PlaylistTrack[];
  isLive?: boolean;
  startTime?: number;
  posterUrl?: string;
}

export interface TranscriptionEntry {
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface PodcastRecord {
  id: string;
  title: string;
  date: string;
  duration: string;
  speakers: string[];
  minutes: string;
  audioUrl: string;
}

export type MediaType = 'scripture' | 'lyric' | 'slide' | 'screenshare' | 'none';

export interface MediaState {
  type: MediaType;
  content?: string;
  reference?: string;
  imageUrl?: string;
  title?: string;
  isPulsing?: boolean;
}

export interface BackgroundAudio {
  id: string;
  name: string;
  url: string;
  isPlaying: boolean;
  volume: number;
  loop?: boolean;
}
