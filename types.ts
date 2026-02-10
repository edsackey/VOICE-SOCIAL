
/**
 * EchoHub Global Application Types
 */

export enum UserRole {
  HOST = 'HOST',
  MODERATOR = 'MODERATOR',
  ADVERTISER = 'ADVERTISER',
  SPEAKER = 'SPEAKER',
  LISTENER = 'LISTENER'
}

export type Locale = 
  | 'en' | 'fr' | 'es' | 'pt' | 'de' // Western
  | 'tw' | 'sw' | 'yo' | 'zu' | 'am' | 'wo' // African (Twi, Swahili, Yoruba, Zulu, Amharic, Wolof)
  | 'zh'; // Chinese

export type AppTheme = 'midnight' | 'light' | 'blue' | 'sunset';

export type CallType = 'voice' | 'video';

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type MediaType = 'scripture' | 'lyric' | 'slide' | 'screenshare' | 'banner' | 'advert' | 'music_info' | 'none';

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
  nativeLanguage?: Locale;
  preferredCurrency?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  creatorId: string;
}

export interface Room {
  id: string;
  title: string;
  description: string;
  participantCount: number;
  followerCount: number;
  followers: string[]; // User IDs
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'intense' | 'controversial';
  speakers: User[];
  listeners: User[];
  playlist?: PlaylistTrack[];
  isLive?: boolean;
  startTime?: number;
  posterUrl?: string;
  activeTranslationLang?: Locale;
  activePoll?: Poll;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  isMuted: boolean;
  handRaised: boolean;
  nativeLanguage?: Locale;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  profileImages?: string[];
  bannerImage?: string;
  pastRooms?: { id: string; title: string; date: string }[];
  welcomeVoiceNote?: string;
}

export interface CallRecord {
  id: string;
  type: CallType;
  participants: { id: string; name: string; avatar: string }[];
  startTime: number;
  duration: number; // in seconds
}

export interface TranscriptionEntry {
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  language?: Locale;
  translation?: string;
}

export interface ActiveCall {
  id: string;
  type: CallType;
  participants: User[];
  startTime: number;
  translationEnabled?: boolean;
}

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

export interface PodcastRecord {
  id: string;
  roomId: string;
  title: string;
  date: string;
  duration: string;
  speakers: string[];
  minutes: string;
  audioUrl: string;
}

export interface PlaylistTrack {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
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

export interface MonetizedPromo {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl: string;
  audioUrl?: string; 
  startDate: number;
  durationDays: number;
  totalPaid: number;
  status: 'active' | 'expired';
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

export interface EchoGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
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
  recurrence?: RecurrenceType;
  recurringDays?: number[];
  isPrivate?: boolean;
  price?: number;
  currency?: string;
}

export type NotificationType = 'ROOM_START' | 'EVENT_NEW' | 'DIRECT_MESSAGE' | 'FOLLOW' | 'SYSTEM';

export interface EchoNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  link?: string;
  senderId?: string;
  senderAvatar?: string;
}

export interface DBFollow { followerId: string; followedId: string; createdAt: number; }
export interface DBLike { userId: string; postId: string; createdAt: number; }
export interface DBComment { id: string; userId: string; postId: string; text: string; createdAt: number; }
export interface DBSubscription { subscriberId: string; targetUserId: string; createdAt: number; }
export interface AttendanceRecord { userId: string; userName: string; joinTime: number; }
