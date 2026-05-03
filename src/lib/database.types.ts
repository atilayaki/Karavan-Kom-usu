// Database types inferred from Supabase schema

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  caravan_type: string | null;
  xp: number;
  level?: number;
  battery_capacity?: string | null;
  solar_panel?: string | null;
  water_tank?: string | null;
  heating_system?: string | null;
  share_location?: boolean;
  is_verified?: boolean;
  created_at?: string;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  badge_color?: string;
}

export interface UserAchievement {
  achievement_id: number;
  earned_at: string;
  achievements?: Achievement[] | Achievement | null;
}

export interface WeatherCurrent {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

export interface SpotAttributes {
  water?: boolean;
  electricity?: boolean;
  wc?: boolean;
  pet_friendly?: boolean;
}

export interface Spot {
  id: number;
  title: string;
  address: string | null;
  category: string;
  lat: number;
  lng: number;
  image_url?: string | null;
  description?: string | null;
  attributes?: SpotAttributes | null;
  created_at?: string;
}

export interface GeographicNote {
  id: number;
  user_id: string;
  note: string;
  location_name: string | null;
  location?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  profiles?: Pick<Profile, 'full_name'>;
  profile_full_name?: string | null;
}

export interface Route {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  start_location_name: string | null;
  end_location_name: string | null;
  path?: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  created_at: string;
  profile_full_name?: string | null;
  profiles?: Pick<Profile, 'full_name'> | null;
}

export interface Post {
  id: number;
  user_id: string;
  caption: string;
  location_name: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  profiles?: Pick<Profile, 'full_name'>;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: Pick<Profile, 'full_name'>;
}

export interface Message {
  id: number;
  user_id: string;
  channel: string;
  text: string;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'is_verified'> | null;
}

export interface MarketplaceItem {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  location_name: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'full_name'>;
}

export interface Bookmark {
  id: number;
  user_id: string;
  item_type: string;
  item_id: number;
  created_at?: string;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  location_name: string | null;
  category: string;
  created_by: string;
  attendees_count?: number;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>;
  event_attendees?: Array<{ count: number }>;
}

export interface EventAttendee {
  id: number;
  event_id: number;
  user_id: string;
  created_at?: string;
}

export interface Friendship {
  id: number;
  user_id: string;
  friend_id: string;
  created_at?: string;
}

export interface SeasonalTip {
  id: number;
  month: number;
  tips: string[];
  created_at?: string;
}

export interface Activity {
  id: number;
  user_id: string;
  activity_type: 'note' | 'route' | 'post' | 'item' | string;
  description: string;
  created_at: string;
  profiles?: Pick<Profile, 'full_name'>;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  ends_at: string;
}

export interface UserChallenge {
  id: number;
  user_id: string;
  challenge_id: number;
  status: 'in_progress' | 'completed';
  created_at?: string;
}
