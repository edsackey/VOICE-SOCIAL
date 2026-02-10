
import { DBUser, DBPost, DBFollow, DBLike, DBComment, DBSubscription, DBDonation, AttendanceRecord, EchoGroup, ScheduledEvent, MonetizedPromo, PodcastRecord, EchoNotification, CallRecord, Room, PlaylistTrack, ChatMessage } from '../types';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc,
  deleteDoc,
  getDocs,
  orderBy,
  limit,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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
  CALL_HISTORY: 'chat_chap_call_history',
  ROOM_FOLLOWS: 'chat_chap_room_follows',
  ACTIVE_ROOM_ID: 'chat_chap_active_room_id'
};

const getLocal = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage write error", e);
  }
};

export const StorageService = {
  // --- SESSION MANAGEMENT ---
  setActiveRoomId: (id: string | null) => {
    if (id) localStorage.setItem(KEYS.ACTIVE_ROOM_ID, id);
    else localStorage.removeItem(KEYS.ACTIVE_ROOM_ID);
  },
  getActiveRoomId: () => localStorage.getItem(KEYS.ACTIVE_ROOM_ID),

  // --- FIREBASE ROOMS (Real Backend) ---
  subscribeToLiveRooms: (callback: (rooms: Room[]) => void) => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      callback(rooms);
    });
  },

  getRoom: async (roomId: string): Promise<Room | null> => {
    const roomDoc = await getDoc(doc(db, "rooms", roomId));
    return roomDoc.exists() ? { id: roomDoc.id, ...roomDoc.data() } as Room : null;
  },

  createRoomFirebase: async (roomData: Omit<Room, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        ...roomData,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Firebase Room Creation Failed:", error);
      throw error;
    }
  },

  updateRoomFirebase: async (roomId: string, updates: Partial<Room>) => {
    try {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, updates);
    } catch (error) {
      console.error("Firebase Room Update Failed:", error);
    }
  },

  closeRoomFirebase: async (roomId: string) => {
    try {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, { isLive: false, endTime: Date.now() });
    } catch (error) {
      console.error("Firebase Room Close Failed:", error);
    }
  },

  deleteRoomFirebase: async (roomId: string) => {
    try {
      await deleteDoc(doc(db, "rooms", roomId));
    } catch (error) {
      console.error("Firebase Room Deletion Failed:", error);
    }
  },

  // --- CHAT SYSTEM (SYNCED) ---
  subscribeToRoomChat: (roomId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, `rooms/${roomId}/messages`), 
      orderBy("timestamp", "asc"),
      limit(200)
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      callback(messages);
    });
  },

  sendChatMessage: async (roomId: string, message: Omit<ChatMessage, 'id'>) => {
    try {
      await addDoc(collection(db, `rooms/${roomId}/messages`), message);
    } catch (error) {
      console.error("Chat send failed", error);
    }
  },

  // --- MEDIA LIBRARY (SURVIVES REFRESH) ---
  saveMediaToLibrary: async (userId: string, track: PlaylistTrack) => {
    await addDoc(collection(db, `users/${userId}/library`), {
      ...track,
      addedAt: Date.now()
    });
  },

  getMediaLibrary: async (userId: string): Promise<PlaylistTrack[]> => {
    const q = query(collection(db, `users/${userId}/library`), orderBy("addedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlaylistTrack));
  },

  // --- PODCASTS / RECORDINGS ---
  getPodcasts: (roomId?: string) => {
    const all = getLocal<PodcastRecord>(KEYS.PODCASTS);
    return roomId ? all.filter(p => p.roomId === roomId) : all;
  },
  savePodcast: (podcast: PodcastRecord) => {
    const current = getLocal<PodcastRecord>(KEYS.PODCASTS);
    setLocal(KEYS.PODCASTS, [podcast, ...current].slice(0, 100)); 
  },

  // --- USERS & SOCIAL ---
  saveUser: (user: DBUser) => {
    const users = getLocal<DBUser>(KEYS.USERS);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx > -1) users[idx] = user;
    else users.push(user);
    setLocal(KEYS.USERS, users);
  },
  getUser: (id: string) => getLocal<DBUser>(KEYS.USERS).find(u => u.id === id),

  getPosts: () => getLocal<DBPost>(KEYS.POSTS).sort((a, b) => b.createdAt - a.createdAt),
  
  savePost: (post: DBPost) => {
    const posts = getLocal<DBPost>(KEYS.POSTS);
    setLocal(KEYS.POSTS, [post, ...posts]);
  },

  getLikesForPost: (postId: string) => getLocal<DBLike>(KEYS.LIKES).filter(l => l.postId === postId),

  toggleLike: (userId: string, postId: string) => {
    let likes = getLocal<DBLike>(KEYS.LIKES);
    const existingIdx = likes.findIndex(l => l.userId === userId && l.postId === postId);
    if (existingIdx > -1) {
      likes.splice(existingIdx, 1);
    } else {
      likes.push({ userId, postId, createdAt: Date.now() });
    }
    setLocal(KEYS.LIKES, likes);
  },

  getCommentsForPost: (postId: string) => getLocal<DBComment>(KEYS.COMMENTS).filter(c => c.postId === postId),

  addComment: (comment: DBComment) => {
    const comments = getLocal<DBComment>(KEYS.COMMENTS);
    setLocal(KEYS.COMMENTS, [...comments, comment]);
  },

  // --- NOTIFICATIONS ---
  getNotifications: () => getLocal<EchoNotification>(KEYS.NOTIFICATIONS).sort((a, b) => b.timestamp - a.timestamp),
  saveNotification: (notification: EchoNotification) => {
    const current = getLocal<EchoNotification>(KEYS.NOTIFICATIONS);
    const updated = [notification, ...current].slice(0, 100);
    setLocal(KEYS.NOTIFICATIONS, updated);
    window.dispatchEvent(new CustomEvent('echo_new_notification', { detail: notification }));
  },
  markAsRead: (id: string) => {
    const current = getLocal<EchoNotification>(KEYS.NOTIFICATIONS);
    setLocal(KEYS.NOTIFICATIONS, current.map(n => n.id === id ? { ...n, isRead: true } : n));
  },
  markAllAsRead: () => {
    const current = getLocal<EchoNotification>(KEYS.NOTIFICATIONS);
    setLocal(KEYS.NOTIFICATIONS, current.map(n => ({ ...n, isRead: true })));
  },
  clearNotifications: () => setLocal(KEYS.NOTIFICATIONS, []),

  // --- ATTENDANCE ---
  recordJoin: (roomId: string, user: { id: string; name: string }) => {
    const key = `${KEYS.ATTENDANCE}_${roomId}`;
    const attendance = getLocal<AttendanceRecord>(key);
    if (!attendance.find(a => a.userId === user.id)) {
      attendance.push({ userId: user.id, userName: user.name, joinTime: Date.now() });
      setLocal(key, attendance);
    }
  },
  getAttendance: (roomId: string) => getLocal<AttendanceRecord>(`${KEYS.ATTENDANCE}_${roomId}`),

  // --- SCHEDULE & GROUPS ---
  getScheduledEvents: () => getLocal<ScheduledEvent>(KEYS.SCHEDULE),
  saveScheduledEvent: (event: ScheduledEvent) => {
    const events = getLocal<ScheduledEvent>(KEYS.SCHEDULE);
    setLocal(KEYS.SCHEDULE, [event, ...events]);
  },
  getGroups: () => getLocal<EchoGroup>(KEYS.GROUPS),
  saveGroup: (group: EchoGroup) => {
    const current = getLocal<EchoGroup>(KEYS.GROUPS);
    setLocal(KEYS.GROUPS, [...current, group]);
  },

  // --- PROMOS ---
  getPromos: () => getLocal<MonetizedPromo>(KEYS.PROMOS),
  savePromo: (promo: MonetizedPromo) => {
    const current = getLocal<MonetizedPromo>(KEYS.PROMOS);
    setLocal(KEYS.PROMOS, [promo, ...current]);
  },

  // --- DONATIONS ---
  getAllDonations: () => getLocal<DBDonation>(KEYS.DONATIONS),
  saveDonation: (donation: DBDonation) => {
    const current = getLocal<DBDonation>(KEYS.DONATIONS);
    setLocal(KEYS.DONATIONS, [...current, donation]);
  },

  // --- FOLLOWS ---
  toggleFollow: (followerId: string, followedId: string) => {
    if (followerId === followedId) return;
    let follows = getLocal<DBFollow>(KEYS.FOLLOWS);
    const existing = follows.find(f => f.followerId === followerId && f.followedId === followedId);
    if (existing) {
      follows = follows.filter(f => !(f.followerId === followerId && f.followedId === followedId));
    } else {
      follows.push({ followerId, followedId, createdAt: Date.now() });
    }
    setLocal(KEYS.FOLLOWS, follows);
  },
  isFollowing: (followerId: string, followedId: string) => 
    getLocal<DBFollow>(KEYS.FOLLOWS).some(f => f.followerId === followerId && f.followedId === followedId),
  getFollowers: (userId: string) => getLocal<DBFollow>(KEYS.FOLLOWS).filter(f => f.followedId === userId),
  getFollowing: (userId: string) => getLocal<DBFollow>(KEYS.FOLLOWS).filter(f => f.followerId === userId),

  // --- CALLS ---
  getCallHistory: (userId: string) => getLocal<CallRecord>(KEYS.CALL_HISTORY).filter(c => c.participants.some(p => p.id === userId)).sort((a, b) => b.startTime - a.startTime),
  saveCallRecord: (record: CallRecord) => {
    const history = getLocal<CallRecord>(KEYS.CALL_HISTORY);
    setLocal(KEYS.CALL_HISTORY, [record, ...history]);
  },
  
  // --- ROOM FOLLOWS ---
  isFollowingRoom: (userId: string, roomId: string) => getLocal<{userId: string, roomId: string}>(KEYS.ROOM_FOLLOWS).some(f => f.userId === userId && f.roomId === roomId),
  toggleFollowRoom: (userId: string, roomId: string) => {
    let follows = getLocal<{userId: string, roomId: string}>(KEYS.ROOM_FOLLOWS);
    const existing = follows.find(f => f.userId === userId && f.roomId === roomId);
    if (existing) {
      follows = follows.filter(f => !(f.userId === userId && f.roomId === roomId));
    } else {
      follows.push({ userId, roomId });
    }
    setLocal(KEYS.ROOM_FOLLOWS, follows);
  }
};
