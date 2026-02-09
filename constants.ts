
import { Room, UserRole, User, ScheduledEvent } from './types';

export const MOCK_ROOMS: Room[] = [
  {
    id: 'room-1',
    title: 'Future of Generative AI in Web Dev',
    description: 'Discussing the impact of Gemini and LLMs on daily coding workflows.',
    participantCount: 452,
    followerCount: 1240,
    followers: ['u1', 'u2', 'u3', 'u4'],
    tags: ['Tech', 'AI', 'Coding'],
    sentiment: 'positive',
    isLive: true,
    posterUrl: 'https://picsum.photos/seed/ai-future/800/400',
    speakers: [
      { id: 'u1', name: 'Alex Rivera', avatar: 'https://picsum.photos/seed/u1/200', role: UserRole.MODERATOR, isMuted: false, handRaised: false },
      { id: 'u2', name: 'Sarah Chen', avatar: 'https://picsum.photos/seed/u2/200', role: UserRole.SPEAKER, isMuted: true, handRaised: false },
      { id: 'u3', name: 'Live AI', avatar: 'https://picsum.photos/seed/ai/200', role: UserRole.SPEAKER, isMuted: false, handRaised: false },
    ],
    listeners: []
  },
  {
    id: 'room-2',
    title: 'Startup Fundraising in 2024',
    description: 'Seed rounds, VCs, and the shift toward profitability.',
    participantCount: 120,
    followerCount: 890,
    followers: ['u4', 'u5'],
    tags: ['Business', 'Venture Capital'],
    sentiment: 'neutral',
    isLive: true,
    posterUrl: 'https://picsum.photos/seed/startup-vc/800/400',
    speakers: [
      { id: 'u4', name: 'Marcus Gold', avatar: 'https://picsum.photos/seed/u4/200', role: UserRole.MODERATOR, isMuted: false, handRaised: false }
    ],
    listeners: []
  },
  {
    id: 'room-3',
    title: 'Mental Health in a Digital World',
    description: 'Exploring the balance between connection and isolation.',
    participantCount: 89,
    followerCount: 560,
    followers: ['u6', 'u1'],
    tags: ['Health', 'Lifestyle'],
    sentiment: 'positive',
    isLive: false,
    startTime: Date.now() + 3600000 * 5, // 5 hours later
    posterUrl: 'https://picsum.photos/seed/mental-health/800/400',
    speakers: [
      { id: 'u5', name: 'Dr. Jane Smith', avatar: 'https://picsum.photos/seed/u5/200', role: UserRole.MODERATOR, isMuted: false, handRaised: false }
    ],
    listeners: []
  },
  {
    id: 'room-4',
    title: 'Global AI Summit: Africa Perspective',
    description: 'A deep dive into how emerging tech is shaping the continent.',
    participantCount: 0,
    followerCount: 3400,
    followers: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
    tags: ['AI', 'Tech', 'Africa'],
    sentiment: 'neutral',
    isLive: false,
    startTime: Date.now() + 86400000 * 2, // 2 days later
    posterUrl: 'https://picsum.photos/seed/poster1/1200/600',
    speakers: [
      { id: 'u6', name: 'Dr. Kwame Mensah', avatar: 'https://picsum.photos/seed/kwa/200', role: UserRole.MODERATOR, isMuted: false, handRaised: false }
    ],
    listeners: []
  }
];

export const MOCK_SCHEDULE: ScheduledEvent[] = [
  {
    id: 'e1',
    title: 'Global AI Summit: The African Perspective',
    description: 'A deep dive into how emerging tech is shaping the continent.',
    hostName: 'Dr. Kwame Mensah',
    hostAvatar: 'https://picsum.photos/seed/kwa/200',
    startTime: Date.now() + 86400000 * 2, // 2 days later
    duration: '90 min',
    tags: ['AI', 'Tech', 'Africa'],
    capacity: 1000,
    bookedCount: 452,
    posterUrl: 'https://picsum.photos/seed/poster1/1200/600'
  },
  {
    id: 'e2',
    title: 'Creative Coding with Gemini Pro',
    description: 'Live workshop on building next-gen apps with multimodal AI.',
    hostName: 'Dev Sarah',
    hostAvatar: 'https://picsum.photos/seed/sar/200',
    startTime: Date.now() + 86400000 * 3, // 3 days later
    duration: '60 min',
    tags: ['Coding', 'AI', 'Development'],
    capacity: 500,
    bookedCount: 120,
    posterUrl: 'https://picsum.photos/seed/poster2/1200/600'
  }
];

export const CURRENT_USER: User = {
  id: 'me',
  name: 'John Doe',
  avatar: 'https://picsum.photos/seed/me/200',
  role: UserRole.LISTENER,
  isMuted: true,
  handRaised: false,
  bio: "Passionate about voice technology and AI. Building the future of social audio with VOICE ROOM LIVE! 🎙️✨",
  followersCount: 1240,
  followingCount: 48,
  profileImages: ['', '', ''],
  bannerImage: 'https://picsum.photos/seed/john_banner/1200/600',
  pastRooms: [
    { id: 'pr1', title: 'Why Audio is the Future', date: '2 days ago' },
    { id: 'pr2', title: 'Gemini API Deep Dive', date: '5 days ago' }
  ]
};
