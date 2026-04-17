export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  imageUrl: string;
  bannerUrl: string;
  ownerId: string;
}

export interface Challenge {
  id: string;
  title: string;
  description:string;
  communityId: string;
  creatorId: string;
  participantCount: number;
  createdAt: {
      seconds: number;
      nanoseconds: number;
  };
  duration: number; // in days
  startDate: {
    seconds: number;
    nanoseconds: number;
  };
  endDate: {
    seconds: number;
    nanoseconds: number;
  };
  xp: number;
  category?: string;
}

export interface User {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  avatarUrl: string;
  xp: number;
  bio?: string;
  level: number;
}

export interface UserChallenge {
    id: string;
    userId: string;
    challengeId: string;
    communityId: string;
    progress: number; // For now, this will be used for leaderboard ranking
    xpGained: number;
    joinedAt: {
        seconds: number;
        nanoseconds: number;
    };
    completedAt: {
        seconds: number;
        nanoseconds: number;
    } | null;
}

export interface UserHabit {
    id: string;
    userId: string;
    habitId: string;
    name: string;
    lastCheckIn: {
        seconds: number;
        nanoseconds: number;
    };
}

export interface Message {
  id: string;
  text: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  userId: string;
  userName: string;
  userAvatar: string;
}
