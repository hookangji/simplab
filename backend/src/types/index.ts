// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  region?: string;
  school?: string;
  major?: string;
  birth_date?: string;
  job_field?: string;
  skills?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  region?: string;
  school?: string;
  major?: string;
  birth_date?: string;
  job_field?: string;
  skills?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// 공모전 관련 타입
export interface Contest {
  id: string;
  title: string;
  topic?: string;
  region?: string;
  deadline?: string;
  description?: string;
  host?: string;
  format?: string;
  features?: string;
  required_skills?: string;
  team_composition?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContestData {
  title: string;
  topic?: string;
  region?: string;
  deadline?: string;
  description?: string;
  host?: string;
  format?: string;
  features?: string;
}

// 팀 관련 타입
export interface Team {
  id: string;
  name: string;
  region?: string;
  area?: string;
  description?: string;
  purpose?: string;
  seeking_members?: string;
  current_team_composition?: string;
  ideal_candidate?: string;
  collaboration_style?: string;
  collaboration_tools?: string;
  max_members: number;
  current_members: number;
  deadline?: string;
  project_title?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamData {
  name: string;
  region?: string;
  area?: string;
  description?: string;
  purpose?: string;
  seeking_members?: string;
  current_team_composition?: string;
  ideal_candidate?: string;
  collaboration_style?: string;
  collaboration_tools?: string;
  max_members?: number;
  deadline?: string;
  project_title?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role?: string;
  status: "pending" | "accepted" | "rejected";
  joined_at: string;
}

// 관심사 관련 타입
export interface Favorite {
  id: string;
  user_id: string;
  contest_id?: string;
  team_id?: string;
  created_at: string;
}

// 메시지 관련 타입
export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  team_id?: string;
  content: string;
  message_type: "direct" | "team";
  created_at: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 인증 관련 타입
export interface AuthResponse {
  user: User;
  token: string;
}

// JWT 페이로드 타입
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
