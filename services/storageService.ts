
import { DBUser, DBPost, DBFollow, DBLike, DBComment, DBSubscription, DBDonation, AttendanceRecord, EchoGroup, ScheduledEvent, MonetizedPromo, PodcastRecord, EchoNotification, CallRecord } from '../types';

const KEYS = {
  USERS: 'vrl_db_users',
  POSTS: 'vrl_db_posts',
  FOLLOWS: 'vrl_db_follows',
  SUBS: 'vrl_db_subscriptions',
  LIKES: 'vrl_db_likes',
  COMMENTS: 'vrl_db_comments',
  DONATIONS: 'vrl_db_donations',
  ATTENDANCE: 'vrl_db_attendance',
  GROUPS: 'vrl_db_groups',
  SCHEDULE: 'vrl_db_schedule',
  PROMOS: 'vrl_db_monetized_promos',
  PODCASTS: 'voiceroomlive_podcasts',
  NOTIFICATIONS: 'chat_chap_notifications',
  CALL_HISTORY: 'chat_chap_call_history'
};

const get = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    console.error("Storage Read Error:", e);
    return [];
  }
};

const set = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn("Storage Quota Exceeded. Purging old room records...");
      const keysToPurge = Object.keys(localStorage).filter(k => k.startsWith('vrl_db_attendance_'));
      keysToPurge.forEach(k => localStorage.removeItem(k));
      try {
        localStorage.setItem(key, JSON.stringify(data.slice(-50)));
      } catch (retryError) {
        console.error("Critical Storage Error: Could not save even after purge.");
      }
    }
  }
};

export const StorageService = {
  // Users
  getUsers: () => get<DBUser>(KEYS.USERS),
  getUser: (id: string) => get<DBUser>(KEYS.USERS).find(u => u.id === id),
  saveUser: (user: DBUser) => {
    const users = get<DBUser>(KEYS.USERS);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx > -1) users[idx] = user;
    else users.push(user);
    set(KEYS.USERS, users);
  },

  // Donations
  getDonations: (roomId?: string) => {
    const all = get<DBDonation>(KEYS.DONATIONS);
    return roomId ? all.filter(d => d.roomId === roomId) : all;
  },
  getAllDonations: () => get<DBDonation>(KEYS.DONATIONS),
  saveDonation: (donation: DBDonation) => {
    const current = get<DBDonation>(KEYS.DONATIONS);
    current.push(donation);
    set(KEYS.DONATIONS, current);
  },

  // Attendance
  recordJoin: (roomId: string, user: { id: string; name: string }) => {
    const key = `${KEYS.ATTENDANCE}_${roomId}`;
    const attendance = get<AttendanceRecord>(key);
    if (!attendance.find(a => a.userId === user.id)) {
      attendance.push({
        userId: user.id,
        userName: user.name,
        joinTime: Date.now()
      });
      set(key, attendance);
    }
  },
  getAttendance: (roomId: string) => get<AttendanceRecord>(`${KEYS.ATTENDANCE}_${roomId}`),
  
  // Groups
  getGroups: () => get<EchoGroup>(KEYS.GROUPS),
  saveGroup: (group: EchoGroup) => {
    const current = get<EchoGroup>(KEYS.GROUPS);
    const idx = current.findIndex(g => g.id === group.id);
    if (idx > -1) current[idx] = group;
    else current.push(group);
    set(KEYS.GROUPS, current);
  },

  // Posts
  getPosts: () => get<DBPost>(KEYS.POSTS).sort((a, b) => b.createdAt - a.createdAt),
  savePost: (post: DBPost) => {
    const posts = get<DBPost>(KEYS.POSTS);
    posts.push(post);
    set(KEYS.POSTS, posts);
  },

  // Follows
  getFollowers: (userId: string) => get<DBFollow>(KEYS.FOLLOWS).filter(f => f.followedId === userId),
  getFollowing: (userId: string) => get<DBFollow>(KEYS.FOLLOWS).filter(f => f.followerId === userId),
  isFollowing: (followerId: string, followedId: string) => 
    get<DBFollow>(KEYS.FOLLOWS).some(f => f.followerId === followerId && f.followedId === followedId),
  toggleFollow: (followerId: string, followedId: string) => {
    if (followerId === followedId) return;
    let follows = get<DBFollow>(KEYS.FOLLOWS);
    const existing = follows.find(f => f.followerId === followerId && f.followedId === followedId);
    if (existing) {
      follows = follows.filter(f => !(f.followerId === followerId && f.followedId === followedId));
    } else {
      follows.push({ followerId, followedId, createdAt: Date.now() });
    }
    set(KEYS.FOLLOWS, follows);
  },

  // Subscriptions
  isSubscribed: (subId: string, targetId: string) => 
    get<DBSubscription>(KEYS.SUBS).some(s => s.subscriberId === subId && s.targetUserId === targetId),
  toggleSubscription: (subId: string, targetId: string) => {
    let subs = get<DBSubscription>(KEYS.SUBS);
    const existing = subs.find(s => s.subscriberId === subId && s.targetUserId === targetId);
    if (existing) {
      subs = subs.filter(s => !(s.subscriberId === subId && s.targetUserId === targetId));
    } else {
      subs.push({ subscriberId: subId, targetUserId: targetId, createdAt: Date.now() });
    }
    set(KEYS.SUBS, subs);
  },

  // Likes/Comments
  getLikesForPost: (postId: string) => get<DBLike>(KEYS.LIKES).filter(l => l.postId === postId),
  toggleLike: (userId: string, postId: string) => {
    let likes = get<DBLike>(KEYS.LIKES);
    const existing = likes.find(l => l.userId === userId && l.postId === postId);
    if (existing) {
      likes = likes.filter(l => !(l.userId === userId && l.postId === postId));
    } else {
      likes.push({ userId, postId, createdAt: Date.now() });
    }
    set(KEYS.LIKES, likes);
  },
  getCommentsForPost: (postId: string) => get<DBComment>(KEYS.COMMENTS).filter(c => c.postId === postId),
  addComment: (comment: DBComment) => {
    const comments = get<DBComment>(KEYS.COMMENTS);
    comments.push(comment);
    set(KEYS.COMMENTS, comments);
  },

  // Schedule
  getScheduledEvents: () => get<ScheduledEvent>(KEYS.SCHEDULE),
  saveScheduledEvent: (event: ScheduledEvent) => {
    const events = get<ScheduledEvent>(KEYS.SCHEDULE);
    events.push(event);
    set(KEYS.SCHEDULE, events);
  },

  // Promos
  getPromos: () => get<MonetizedPromo>(KEYS.PROMOS),
  savePromo: (promo: MonetizedPromo) => {
    const current = get<MonetizedPromo>(KEYS.PROMOS);
    current.push(promo);
    set(KEYS.PROMOS, current);
  },

  // Podcasts & Recordings
  getPodcasts: () => get<PodcastRecord>(KEYS.PODCASTS),
  savePodcast: (podcast: PodcastRecord) => {
    const current = get<PodcastRecord>(KEYS.PODCASTS);
    set(KEYS.PODCASTS, [podcast, ...current].slice(0, 20)); 
  },

  // Notifications
  getNotifications: () => get<EchoNotification>(KEYS.NOTIFICATIONS).sort((a, b) => b.timestamp - a.timestamp),
  saveNotification: (notification: EchoNotification) => {
    const current = get<EchoNotification>(KEYS.NOTIFICATIONS);
    // Keep last 100
    const updated = [notification, ...current].slice(0, 100);
    set(KEYS.NOTIFICATIONS, updated);
    // Emit custom event for real-time reactivity in-tab
    window.dispatchEvent(new CustomEvent('echo_new_notification', { detail: notification }));
  },
  markAsRead: (id: string) => {
    const current = get<EchoNotification>(KEYS.NOTIFICATIONS);
    const updated = current.map(n => n.id === id ? { ...n, isRead: true } : n);
    set(KEYS.NOTIFICATIONS, updated);
  },
  markAllAsRead: () => {
    const current = get<EchoNotification>(KEYS.NOTIFICATIONS);
    const updated = current.map(n => ({ ...n, isRead: true }));
    set(KEYS.NOTIFICATIONS, updated);
  },
  clearNotifications: () => set(KEYS.NOTIFICATIONS, []),

  // Call History
  getCallHistory: (userId: string) => {
    const all = get<CallRecord>(KEYS.CALL_HISTORY);
    // Return history where the user was a participant
    return all.filter(c => c.participants.some(p => p.id === userId)).sort((a, b) => b.startTime - a.startTime);
  },
  saveCallRecord: (record: CallRecord) => {
    const history = get<CallRecord>(KEYS.CALL_HISTORY);
    history.push(record);
    set(KEYS.CALL_HISTORY, history);
  }
};
