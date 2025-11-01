-- Simplab 데이터베이스 스키마

-- 데이터베이스 생성은 마이그레이션 스크립트에서 처리

-- 사용자 테이블
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    school VARCHAR(100),
    major VARCHAR(100),
    birth_date DATE,
    job_field VARCHAR(100),
    skills TEXT,
    github_url VARCHAR(500),
    figma_url VARCHAR(500),
    available_time VARCHAR(255) COMMENT '일주일 내 가용 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 공모전/대회 테이블
CREATE TABLE contests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255),
    region VARCHAR(100),
    deadline DATE,
    description TEXT,
    host VARCHAR(255),
    format VARCHAR(100),
    features TEXT,
    required_skills TEXT COMMENT '필요한 역량',
    team_composition TEXT COMMENT '팀 구성 추천',
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 팀 테이블
CREATE TABLE teams (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    area VARCHAR(100),
    description TEXT,
    purpose TEXT COMMENT '프로젝트 목적',
    seeking_members TEXT COMMENT '구하는 팀원 설명',
    current_team_composition TEXT COMMENT '현재 팀원 구성 설명',
    ideal_candidate TEXT COMMENT '원하는 팀원 인재상',
    collaboration_style TEXT COMMENT '협업 방식',
    collaboration_tools TEXT COMMENT '협업 툴 (콤마 구분)',
    max_members INT DEFAULT 6,
    current_members INT DEFAULT 1,
    deadline DATE,
    project_title VARCHAR(255),
    image_url VARCHAR(500),
    area_keywords TEXT COMMENT '분야 키워드 (JSON 배열 또는 콤마 구분)',
    progress_stage VARCHAR(100) COMMENT '진행 단계 (아이디어 구상, 초기 개발, 프로토타입 완성, 운영 중, 기타)',
    meeting_schedule TEXT COMMENT '회의 주기 및 방식',
    available_time_slots TEXT COMMENT '팀 활동 가능 시간대 (JSON 배열 또는 콤마 구분)',
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 팀 프로젝트 테이블
CREATE TABLE team_projects (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    team_id VARCHAR(36) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT FALSE,
    summary TEXT COMMENT '활용 요약',
    tech_stack TEXT COMMENT '사용 기술 스택 (JSON 배열 또는 콤마 구분)',
    result_link VARCHAR(500) COMMENT '결과물 링크',
    performance_indicators TEXT COMMENT '성과 지표',
    images TEXT COMMENT '이미지 URL (JSON 배열 또는 콤마 구분)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 팀 멤버 테이블
CREATE TABLE team_members (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    team_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(100),
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_user (team_id, user_id)
);

-- 관심사 테이블 (사용자 관심 공모전/팀)
CREATE TABLE favorites (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    contest_id VARCHAR(36),
    team_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((contest_id IS NOT NULL AND team_id IS NULL) OR (contest_id IS NULL AND team_id IS NOT NULL))
);

-- 메시지 테이블 (채팅 기능)
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36),
    team_id VARCHAR(36),
    content TEXT NOT NULL,
    message_type ENUM('direct', 'team') DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((receiver_id IS NOT NULL AND team_id IS NULL) OR (receiver_id IS NULL AND team_id IS NOT NULL))
);

-- 수상경력 테이블
CREATE TABLE awards (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    awarded_at DATE NOT NULL,
    description TEXT,
    rank VARCHAR(100) COMMENT '수상/등급 (대상, 최우수상, 우수상, 장려상, 입선, 기타)',
    participation_type VARCHAR(100) COMMENT '참여 형태 (개인, 팀, 공모전, 연구, 과제, 기타)',
    roles TEXT COMMENT '내 역할 (JSON 배열 또는 콤마 구분)',
    result_link VARCHAR(500) COMMENT '결과물 링크',
    result_images TEXT COMMENT '이미지 URL (JSON 배열 또는 콤마 구분)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 사용자 성향 테이블
CREATE TABLE user_traits (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    category VARCHAR(100) NOT NULL,
    trait VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 포트폴리오 테이블
CREATE TABLE portfolios (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT FALSE,
    participation_type VARCHAR(100) COMMENT '팀 프로젝트, 개인, 대회, 수업, 사이드 프로젝트',
    roles TEXT COMMENT '직무 선택 (JSON 배열 또는 콤마 구분)',
    contribution_detail TEXT COMMENT '상세 기여 내용',
    goal TEXT COMMENT '핵심 목표',
    problem_definition TEXT COMMENT '문제 정의',
    result_summary TEXT COMMENT '결과 요약',
    tech_stack TEXT COMMENT '기술 스택 (JSON 배열 또는 콤마 구분)',
    images TEXT COMMENT '이미지 URL (JSON 배열 또는 콤마 구분)',
    github_link VARCHAR(500),
    figma_link VARCHAR(500),
    other_links TEXT COMMENT '기타 링크 (JSON 배열 또는 콤마 구분)',
    certifications TEXT COMMENT '자격증 (JSON 배열 또는 콤마 구분)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 찔러보기(nudge) 테이블
CREATE TABLE nudges (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    from_user_id VARCHAR(36) NOT NULL,
    to_user_id VARCHAR(36) NOT NULL,
    contest_id VARCHAR(36),
    team_id VARCHAR(36),
    message TEXT,
    status ENUM('sent', 'read', 'responded') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CHECK ((contest_id IS NOT NULL AND team_id IS NULL) OR (contest_id IS NULL AND team_id IS NOT NULL))
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contests_region ON contests(region);
CREATE INDEX idx_contests_deadline ON contests(deadline);
CREATE INDEX idx_teams_region ON teams(region);
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_team_id ON messages(team_id);
CREATE INDEX idx_awards_user_id ON awards(user_id);
CREATE INDEX idx_user_traits_user_id ON user_traits(user_id);
CREATE INDEX idx_nudges_from_user_id ON nudges(from_user_id);
CREATE INDEX idx_nudges_to_user_id ON nudges(to_user_id);
CREATE INDEX idx_nudges_contest_id ON nudges(contest_id);
CREATE INDEX idx_nudges_team_id ON nudges(team_id);
CREATE INDEX idx_team_projects_team_id ON team_projects(team_id);
