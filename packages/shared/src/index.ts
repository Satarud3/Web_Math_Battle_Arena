export interface UserDto {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface MatchStats {
  id: string;
  mode: 'practice' | 'duel' | 'tournament' | 'battle_royale';
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  winnerId?: string;
  startedAt?: Date;
  endedAt?: Date;
}

export const DEFAULT_RATING = 1000;
export const WIN_POINT = 25;
export const LOSE_POINT = 10;
