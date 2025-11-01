import { pool } from "../config/database";

const runSeed = async () => {
  try {
    console.log("🌱 데이터베이스 시드를 시작합니다...");

    // 기존 데이터 삭제 (외래키 순서 고려)
    console.log("🗑️ 기존 데이터를 삭제합니다...");
    await pool.execute("DELETE FROM favorites");
    await pool.execute("DELETE FROM team_contests");
    await pool.execute("DELETE FROM team_members");
    await pool.execute("DELETE FROM teams");
    await pool.execute("DELETE FROM contests");
    await pool.execute("DELETE FROM users");
    console.log("✅ 기존 데이터 삭제 완료");

    // 사용자 데이터 삽입
    console.log("👥 사용자 데이터 삽입 중...");
    await pool.execute(`
      INSERT INTO users (id, email, password, name, region, school, major, birth_date, job_field, skills, github_url, figma_url) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '홍길동', '대전', '충남대학교', '컴퓨터공학', '2000-03-15', '프론트엔드', 'React, TypeScript, Tailwind CSS', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440002', 'user2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김철수', '서울', '서울대학교', '소프트웨어학', '1999-07-22', '백엔드', 'Node.js, Python, MySQL', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440003', 'user3@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '이영희', '부산', '부산대학교', '디자인학', '2001-11-08', 'UI/UX 디자이너', 'Figma, Adobe Creative Suite, Sketch', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440004', 'dev@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '박민수', '서울', '연세대학교', '컴퓨터과학', '1998-05-30', '풀스택', 'React, Node.js, AWS, Docker', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440005', 'design@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '정수진', '대구', '경북대학교', '시각디자인', '2002-02-14', 'UI/UX 디자이너', 'Figma, Adobe XD, Principle, After Effects', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440006', 'backend@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '최태호', '인천', '인하대학교', '정보통신공학', '1997-09-18', '백엔드', 'Java, Spring Boot, PostgreSQL, Redis', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440007', 'mobile@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '강소영', '광주', '전남대학교', '컴퓨터공학', '2000-12-25', '모바일 개발', 'Flutter, React Native, Kotlin, Swift', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440008', 'ai@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '윤지훈', '대전', 'KAIST', '인공지능학', '1996-04-09', 'AI/ML 엔지니어', 'Python, TensorFlow, PyTorch, OpenCV', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440009', 'pm@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김현우', '서울', '고려대학교', '경영학', '1995-08-03', '프로덕트 매니저', 'Figma, Notion, Slack, Agile', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440010', 'marketing@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '임다은', '부산', '부경대학교', '마케팅학', '2001-06-19', '마케팅', 'Google Analytics, Facebook Ads, Instagram, Content Marketing', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440011', 'security@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '조성현', '서울', '한양대학교', '정보보안학', '1999-03-28', '보안 엔지니어', 'Penetration Testing, Network Security, Cryptography, OWASP', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440012', 'game@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '한지원', '대구', '경북대학교', '게임공학', '2001-09-12', '게임 프로그래머', 'Unity, Unreal Engine, C#, C++, Game Design Patterns', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440013', 'data@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '서준호', '인천', '인하대학교', '데이터과학', '2000-11-05', '데이터 사이언티스트', 'Python, R, SQL, Machine Learning, Data Visualization', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440014', 'devops@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '노동현', '부산', '부경대학교', '컴퓨터공학', '1998-12-20', 'DevOps 엔지니어', 'Docker, Kubernetes, CI/CD, AWS, Terraform', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0'),
      ('550e8400-e29b-41d4-a716-446655440015', 'doctor@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김의사', '서울', '서울대학교', '의학과', '1995-04-15', '의료 전문가', '의료 영상 처리, 임상 연구, 의료 데이터 분석', 'https://github.com/leehuiseok', 'https://www.figma.com/design/oj5Kv3JBIGnb5Lo1a1LWk7/%EC%8B%AC%ED%94%84%EB%9E%A9-%EC%B4%88%EA%B8%B0-%ED%99%94%EB%A9%B4-%EA%B5%AC%EC%84%B1?node-id=0-1&p=f&t=miSaniq4Y2FfRhYp-0')
    `);
    console.log("✅ 사용자 데이터 삽입 완료");

    // 공모전 데이터 삽입
    console.log("🏆 공모전 데이터 삽입 중...");
    await pool.execute(`
      INSERT INTO contests (id, title, topic, region, deadline, description, host, format, features, required_skills, team_composition, image_url) VALUES
      ('contest-001', 'Us:Code 해커톤 2025 in 의성', '해커톤', '경북 의성', '2025-12-15', '코딩과 창의적 아이디어를 구현하는 해커톤', 'Us:Code', '오프라인 현장형 해커톤', '코딩과 창의적 아이디어 구현,e스포츠 느낌의 게임적 분위기,픽셀 아트 스타일 캐릭터 활용', '프로그래밍 언어 (JavaScript, Python, Java 등), 웹 개발 (React, Vue.js, Node.js), 팀워크, 문제 해결 능력, 창의적 사고', '프론트엔드 개발자 1-2명, 백엔드 개발자 1명, UI/UX 디자이너 1명, 기획자 1명 (총 4-5명)', 'https://raw.githubusercontent.com/leehuiseok/image/70f22ae031f77654d544ba2772b2c81d6bbd3901/contest1.png'),
      ('contest-002', 'AI 챌린지 2025', 'AI/머신러닝', '전국', '2024-11-30', 'AI 기술을 활용한 혁신적인 솔루션 개발', '한국AI협회', '온라인', 'AI 기술 활용,혁신적인 솔루션 개발,데이터 분석', 'Python, TensorFlow/PyTorch, 머신러닝 알고리즘, 데이터 전처리, 모델 최적화, 통계학', 'AI/ML 엔지니어 2명, 데이터 사이언티스트 1명, 도메인 전문가 1명, 프론트엔드 개발자 1명 (총 5명)', 'https://raw.githubusercontent.com/leehuiseok/image/624721ca9b0c823099ba78f98e540d636e616385/contest2.png'),
      ('contest-003', '스타트업 아이디어 공모전', '창업', '서울', '2024-12-20', '창업 아이디어 발굴 및 사업화', '중소벤처기업부', '온오프라인', '창업 아이디어 발굴,사업화 계획 수립,투자 유치', '비즈니스 모델링, 시장 분석, 사업 계획서 작성, 프레젠테이션, 투자 유치 경험', '기획자 1명, 마케팅 전문가 1명, 기술 개발자 1-2명, 비즈니스 개발자 1명 (총 4-5명)', 'https://raw.githubusercontent.com/leehuiseok/image/624721ca9b0c823099ba78f98e540d636e616385/contest3.png'),
      ('contest-004', '웹 개발 경진대회', '웹 개발', '대전', '2025-11-20', '웹 기술을 활용한 서비스 개발', '대전시', '온라인', '웹 개발,사용자 경험,기술 혁신', 'React/Vue.js, Node.js/Python, 데이터베이스 설계, RESTful API, Git 협업, UI/UX 디자인', '프론트엔드 개발자 2명, 백엔드 개발자 1명, UI/UX 디자이너 1명, 기획자 1명 (총 5명)', 'https://github.com/leehuiseok/image/raw/main/contest4.png'),
      ('contest-005', '모바일 앱 개발 대회', '모바일 개발', '부산', '2025-11-25', '모바일 앱 개발 및 출시', '부산시', '오프라인', '모바일 앱 개발,사용자 친화적 인터페이스,혁신적 기능', 'React Native/Flutter, Swift/Kotlin, RESTful API, 앱스토어 배포, 푸시 알림, 모바일 UX', '모바일 개발자 2명, 백엔드 개발자 1명, UI/UX 디자이너 1명, 기획자 1명 (총 5명)', 'https://raw.githubusercontent.com/leehuiseok/image/main/contest5.png'),
      ('contest-006', '블록체인 해커톤 2025', '블록체인', '서울', '2025-12-05', '블록체인 기술을 활용한 혁신 서비스 개발', '한국블록체인협회', '온오프라인', '블록체인 기술,DeFi,스마트 컨트랙트,암호화폐', 'Solidity, Web3.js, 스마트 컨트랙트 개발, 암호화폐 지식, DeFi 프로토콜, 블록체인 아키텍처', '블록체인 개발자 2명, 프론트엔드 개발자 1명, 보안 전문가 1명, 기획자 1명 (총 5명)', 'https://raw.githubusercontent.com/leehuiseok/image/main/contest6.png'),
      ('contest-007', '게임 개발 공모전', '게임 개발', '전국', '2025-12-30', '창의적인 게임 개발 및 출시', '한국게임산업협회', '온라인', '게임 개발,게임 디자인,사용자 경험,스토리텔링', 'Unity/Unreal Engine, C#/C++, 게임 기획, 3D 모델링, 사운드 디자인, 게임 물리', '게임 프로그래머 2명, 게임 기획자 1명, 3D 아티스트 1명, 사운드 디자이너 1명 (총 5명)', 'https://github.com/leehuiseok/image/raw/main/contest7.png'),
      ('contest-008', 'IoT 스마트시티 챌린지', 'IoT', '대전', '2026-01-15', 'IoT 기술을 활용한 스마트시티 솔루션 개발', '대전시청', '오프라인', 'IoT 기술,스마트시티,센서 네트워크,데이터 분석', 'Arduino/Raspberry Pi, 센서 기술, 무선 통신, 클라우드 플랫폼, 하드웨어 설계', 'IoT 개발자 2명, 하드웨어 엔지니어 1명, 클라우드 개발자 1명, 기획자 1명 (총 5명)', 'https://raw.githubusercontent.com/leehuiseok/image/main/contest8.png'),
      ('contest-009', 'AR/VR 콘텐츠 공모전', 'AR/VR', '서울', '2026-02-10', 'AR/VR 기술을 활용한 콘텐츠 제작', '문화체육관광부', '온오프라인', 'AR/VR 기술,3D 모델링,인터랙티브 콘텐츠,게임 개발', 'Unity, C#, ARCore/ARKit, VR SDK, 3D 모델링, 공간 컴퓨팅', 'AR/VR 개발자 2명, 3D 아티스트 1명, UX 디자이너 1명, 기획자 1명 (총 5명)', 'https://raw.githubusercontent.com/leehuiseok/image/2a5807e21b45fa53533aa0c89dd08e0f8225eea5/contest9.png'),
      ('contest-010', '핀테크 창업 아이디어톤', '핀테크', '서울', '2025-11-10', '금융 기술을 활용한 혁신 서비스 아이디어', '금융감독원', '온라인', '핀테크,금융 서비스,결제 시스템,보안', '금융 도메인 지식, 보안 기술, API 개발, 결제 시스템, 규제 준수', '핀테크 개발자 1명, 보안 전문가 1명, 금융 도메인 전문가 1명, 기획자 1명 (총 4명)', 'https://raw.githubusercontent.com/leehuiseok/image/2a5807e21b45fa53533aa0c89dd08e0f8225eea5/contest10.png'),
      ('contest-011', '헬스케어 AI 솔루션 대회', '헬스케어', '전국', '2026-03-05', 'AI를 활용한 헬스케어 솔루션 개발', '보건복지부', '온오프라인', 'AI 기술,헬스케어,의료 데이터,진단 시스템', 'Python, 의료 영상 처리, AI/ML, 의료 데이터 분석, HIPAA 준수, 임상 연구', 'AI/ML 엔지니어 2명, 의료 도메인 전문가 1명, 데이터 사이언티스트 1명, 프론트엔드 개발자 1명 (총 5명)', 'https://raw.githubusercontent.com/leehuiseok/image/2a5807e21b45fa53533aa0c89dd08e0f8225eea5/contest11.png'),
      ('contest-012', '에듀테크 플랫폼 개발', '에듀테크', '대구', '2025-11-25', '교육 기술을 활용한 학습 플랫폼 개발', '교육부', '온라인', '에듀테크,온라인 학습,교육 콘텐츠,학습 분석', 'React/Vue.js, Node.js, 학습 관리 시스템, 교육 콘텐츠 제작, 학습 분석, UX 디자인', '프론트엔드 개발자 2명, 백엔드 개발자 1명, 교육 콘텐츠 기획자 1명, UX 디자이너 1명 (총 5명)', 'https://raw.githubusercontent.com/leehuiseok/image/2a5807e21b45fa53533aa0c89dd08e0f8225eea5/contest12.png'),
      ('contest-013', '그린테크 환경 솔루션', '그린테크', '전국', '2026-01-25', '환경 보호를 위한 기술 솔루션 개발', '환경부', '온오프라인', '그린테크,환경 보호,재생 에너지,친환경 기술', 'IoT 센서 기술, 데이터 분석, 환경 모니터링, 재생 에너지 시스템, 지속가능성 평가', 'IoT 개발자 1명, 환경 공학자 1명, 데이터 분석가 1명, 기획자 1명 (총 4명)', 'https://raw.githubusercontent.com/leehuiseok/image/2a5807e21b45fa53533aa0c89dd08e0f8225eea5/contest13.png'),
      ('contest-014', '소셜 임팩트 해커톤', '소셜 임팩트', '서울', '2025-12-15', '사회 문제 해결을 위한 기술 솔루션', '사회적경제진흥원', '오프라인', '소셜 임팩트,사회 문제 해결,지속가능성,커뮤니티', '사회 문제 분석, 사용자 연구, 프로토타이핑, 커뮤니티 빌딩, 임팩트 측정', '기획자 1명, UX 디자이너 1명, 개발자 1-2명, 사회 문제 전문가 1명 (총 4-5명)', 'https://raw.githubusercontent.com/leehuiseok/image/2a5807e21b45fa53533aa0c89dd08e0f8225eea5/contest14.png'),
      ('contest-015', '푸드테크 스타트업 대회', '푸드테크', '부산', '2025-11-15', '식품 기술을 활용한 혁신 서비스 개발', '농림축산식품부', '온오프라인', '푸드테크,식품 기술,배달 서비스,음식 추천', '모바일 앱 개발, 음식 추천 알고리즘, 배달 시스템, 식품 안전, 사용자 경험', '모바일 개발자 2명, 백엔드 개발자 1명, UX 디자이너 1명, 식품 도메인 전문가 1명 (총 5명)', 'https://raw.githubusercontent.com/leehuiseok/image/2a5807e21b45fa53533aa0c89dd08e0f8225eea5/contes15.png')
    `);
    console.log("✅ 공모전 데이터 삽입 완료");

    // 팀 데이터 삽입
    console.log("👥 팀 데이터 삽입 중...");
    await pool.execute(`
      INSERT INTO teams (id, name, region, area, description, purpose, seeking_members, current_team_composition, ideal_candidate, collaboration_style, collaboration_tools, max_members, current_members, deadline, project_title, image_url, created_by) VALUES
      ('team-001', '코딩 마스터즈', '대전', '해커톤', '해커톤 우승을 목표로 하는 팀입니다. 프론트엔드, 백엔드, 디자이너를 모집합니다.', 'Us:Code 해커톤에서 우승하여 혁신적인 웹 서비스를 개발하고 싶습니다.', 'React/Next.js 경험이 있는 프론트엔드 개발자 1명, Node.js/Express 경험이 있는 백엔드 개발자 1명, Figma를 활용한 UI/UX 디자이너 1명을 모집합니다.', '현재 팀장(풀스택)과 프론트엔드 개발자 1명이 있습니다.', '열정적이고 팀워크가 좋으며, 48시간 동안 집중해서 개발할 수 있는 분을 찾습니다. 해커톤 경험이 있으면 더욱 좋습니다.', '매일 오전 10시에 데일리 스크럼을 진행하며, Slack을 통해 실시간 소통합니다. 역할별로 명확한 책임을 분담하여 효율적으로 진행합니다.', 'Slack, GitHub, Figma', 5, 2, '2025-08-15', '혁신적인 웹 서비스 개발', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300', '550e8400-e29b-41d4-a716-446655440001'),
      ('team-002', 'AI 혁신팀', '서울', 'AI/ML', 'AI 기술을 활용한 사회 문제 해결 프로젝트를 진행합니다.', '의료 분야의 AI 진단 보조 시스템을 개발하여 의료진의 업무 효율성을 높이고 환자의 진료 품질을 향상시키고 싶습니다.', 'Python, TensorFlow/PyTorch 경험이 있는 AI/ML 엔지니어 2명, 의료 도메인 지식이 있는 분 1명을 모집합니다.', '현재 팀장(AI/ML 엔지니어) 1명이 있습니다.', 'AI/ML 분야에 대한 깊은 이해와 실무 경험이 있으며, 의료 분야에 관심이 있는 분을 찾습니다. 논문 읽기와 최신 기술 트렌드 파악에 적극적인 분이면 좋습니다.', '주 3회 온라인 미팅을 통해 프로젝트 진행상황을 공유하고, GitHub를 활용한 코드 리뷰와 협업을 진행합니다.', 'GitHub, Slack, Notion', 4, 1, '2025-07-10', 'AI 기반 의료 진단 서비스', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300', '550e8400-e29b-41d4-a716-446655440002'),
      ('team-003', '크리에이터즈', '부산', '디자인', '창의적인 디자인과 개발을 결합한 프로젝트를 진행합니다.', '사용자 경험을 중시하는 인터랙티브 웹 플랫폼을 개발하여 새로운 형태의 온라인 경험을 제공하고 싶습니다.', 'React/Vue.js 경험이 있는 프론트엔드 개발자 2명, Figma/Adobe XD를 활용한 UI/UX 디자이너 1명을 모집합니다.', '현재 팀장(디자이너), UI/UX 디자이너, 기획자 3명이 있습니다.', '창의적이고 사용자 중심의 사고를 가진 분을 찾습니다. 디자인 시스템 구축 경험이나 컴포넌트 기반 개발 경험이 있으면 더욱 좋습니다.', '디자인 시스템을 먼저 구축한 후 개발을 진행하며, Figma를 통한 디자인 공유와 개발자-디자이너 간의 긴밀한 협업을 중시합니다.', 'Figma, GitHub, Slack', 6, 3, '2025-08-01', '인터랙티브 웹 플랫폼', 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300', '550e8400-e29b-41d4-a716-446655440003'),
      ('team-004', '스타트업 드림팀', '전국', '창업', '스타트업 창업을 목표로 하는 팀입니다.', '개인 금융 관리와 투자 정보를 제공하는 핀테크 서비스를 개발하여 스타트업으로 창업하고 싶습니다.', 'React Native/Flutter 경험이 있는 모바일 개발자 1명을 모집합니다.', '현재 팀원(풀스택), PM 2명이 있습니다.', '창업에 대한 열정과 금융 도메인에 대한 이해가 있는 분을 찾습니다. 스타트업 환경에서 빠르게 성장할 수 있는 분이면 좋습니다.', '애자일 방법론을 적용하여 2주 스프린트로 개발을 진행하며, Notion과 Slack을 활용한 투명한 커뮤니케이션을 중시합니다.', 'Notion, Slack, GitHub', 3, 2, '2025-06-25', '핀테크 서비스', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300', '550e8400-e29b-41d4-a716-446655440001'),
      ('team-005', '모바일 혁신가들', '부산', '모바일', '모바일 앱 개발 전문 팀입니다.', '헬스케어 분야의 모바일 앱을 개발하여 사용자의 건강 관리를 돕고 싶습니다.', 'React Native 또는 Flutter 경험이 있는 모바일 개발자 2명, 헬스케어 도메인 지식이 있는 분 1명을 모집합니다.', '현재 팀장(모바일 개발자) 1명이 있습니다.', '모바일 개발에 대한 전문성과 헬스케어 분야에 대한 관심이 있는 분을 찾습니다. 사용자 경험을 중시하는 개발자면 더욱 좋습니다.', '매일 짧은 스탠드업 미팅을 진행하며, 코드 리뷰와 페어 프로그래밍을 통해 높은 코드 품질을 유지합니다.', 'GitHub, Slack, Notion', 4, 1, '2025-07-30', '헬스케어 모바일 앱', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300', '550e8400-e29b-41d4-a716-446655440002'),
      ('team-006', '블록체인 개발팀', '서울', '블록체인', '블록체인 기술을 활용한 DeFi 플랫폼 개발 팀입니다.', '탈중앙화 금융(DeFi) 플랫폼을 개발하여 전통적인 금융 시스템의 한계를 극복하고 싶습니다.', 'Solidity, Web3.js 경험이 있는 블록체인 개발자 2명, React/Next.js 경험이 있는 프론트엔드 개발자 1명, 보안 전문가 1명을 모집합니다.', '현재 팀장(풀스택 개발자) 1명이 있습니다.', '블록체인과 DeFi에 대한 깊은 이해와 실무 경험이 있는 분을 찾습니다. 보안에 대한 높은 인식과 책임감을 가진 분이면 더욱 좋습니다.', 'GitHub와 Discord를 활용한 실시간 소통과 코드 리뷰를 진행하며, 보안 감사를 정기적으로 실시합니다.', 'GitHub, Discord, Notion', 5, 1, '2025-07-20', '탈중앙화 금융 플랫폼', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300', '550e8400-e29b-41d4-a716-446655440004'),
      ('team-007', '게임 개발 크루', '전국', '게임 개발', '독창적인 게임을 개발하는 크리에이티브 팀입니다.', '멀티플레이어 RPG 게임을 개발하여 전 세계 게이머들에게 새로운 게임 경험을 제공하고 싶습니다.', 'Unity/C# 경험이 있는 게임 개발자 2명, 3D 모델링/애니메이션 전문가 1명, 게임 기획자 1명을 모집합니다.', '현재 팀장(게임 개발자), 게임 디자이너 2명이 있습니다.', '게임 개발에 대한 열정과 창의적 사고를 가진 분을 찾습니다. 멀티플레이어 게임 개발 경험이나 게임 밸런싱 경험이 있으면 더욱 좋습니다.', '애자일 게임 개발 방법론을 적용하여 2주 스프린트로 개발을 진행하며, 플레이테스트를 통한 지속적인 피드백 수집을 중시합니다.', 'GitHub, Discord, Notion', 6, 2, '2025-08-25', '멀티플레이어 RPG 게임', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300', '550e8400-e29b-41d4-a716-446655440007'),
      ('team-008', 'IoT 스마트시티', '대전', 'IoT', 'IoT 기술로 스마트시티를 구현하는 팀입니다.', '스마트 홈 IoT 시스템을 개발하여 사용자의 일상생활을 더욱 편리하게 만들고 싶습니다.', 'Arduino/Raspberry Pi 경험이 있는 IoT 개발자 2명, React Native 경험이 있는 모바일 개발자 1명을 모집합니다.', '현재 팀장(IoT 개발자) 1명이 있습니다.', 'IoT 하드웨어와 소프트웨어 모두에 대한 이해가 있는 분을 찾습니다. 센서 데이터 처리나 임베디드 시스템 경험이 있으면 더욱 좋습니다.', '하드웨어 프로토타이핑과 소프트웨어 개발을 병행하며, 정기적인 데모를 통해 진행상황을 공유합니다.', 'GitHub, Slack, Notion', 4, 1, '2025-09-10', '스마트 홈 IoT 시스템', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300', '550e8400-e29b-41d4-a716-446655440006'),
      ('team-009', 'AR/VR 크리에이터', '서울', 'AR/VR', 'AR/VR 콘텐츠 제작 전문 팀입니다.', '가상현실을 활용한 교육 플랫폼을 개발하여 학습자들에게 몰입감 있는 교육 경험을 제공하고 싶습니다.', 'Unity/Unreal Engine 경험이 있는 AR/VR 개발자 2명, 3D 모델링/애니메이션 전문가 1명을 모집합니다.', '현재 팀장(3D 모델러), 3D 모델러 2명이 있습니다.', 'AR/VR 기술에 대한 전문성과 교육 콘텐츠에 대한 관심이 있는 분을 찾습니다. 사용자 경험 디자인 경험이 있으면 더욱 좋습니다.', '프로토타이핑을 통한 빠른 검증과 사용자 테스트를 중시하며, 교육 전문가들과의 협업을 통해 콘텐츠를 개발합니다.', 'GitHub, Slack, Figma', 5, 2, '2025-08-05', '가상현실 교육 플랫폼', 'https://images.unsplash.com/photo-1592478411213-6153e4c4c8b8?w=300', '550e8400-e29b-41d4-a716-446655440005'),
      ('team-010', '핀테크 스타트업', '서울', '핀테크', '금융 기술 혁신을 목표로 하는 팀입니다.', '개인 금융 관리를 돕는 모바일 앱을 개발하여 사용자의 금융 건강을 개선하고 싶습니다.', 'React Native/Flutter 경험이 있는 모바일 개발자 1명을 모집합니다.', '현재 PM, 풀스택 개발자 2명이 있습니다.', '금융 도메인에 대한 이해와 모바일 개발 전문성이 있는 분을 찾습니다. 사용자 데이터 보안에 대한 높은 인식을 가진 분이면 더욱 좋습니다.', '애자일 방법론을 적용하여 빠른 개발과 배포를 진행하며, 금융 규제 준수와 보안을 최우선으로 고려합니다.', 'Notion, Slack, GitHub', 3, 2, '2025-07-15', '개인 금융 관리 앱', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=300', '550e8400-e29b-41d4-a716-446655440009'),
      ('team-011', '헬스케어 AI', '전국', '헬스케어', 'AI를 활용한 헬스케어 솔루션 개발팀입니다.', 'AI 진단 보조 시스템을 개발하여 의료진의 진단 정확도를 높이고 환자의 치료 결과를 개선하고 싶습니다.', 'Python, 의료 영상 처리 경험이 있는 AI/ML 엔지니어 2명, 의료 도메인 전문가 1명을 모집합니다.', '현재 팀장(AI/ML 엔지니어) 1명이 있습니다.', '의료 AI 분야에 대한 전문성과 의료 데이터 처리 경험이 있는 분을 찾습니다. 의료 윤리와 환자 안전에 대한 높은 인식을 가진 분이면 더욱 좋습니다.', '의료 전문가들과의 긴밀한 협업을 통해 임상 요구사항을 반영하며, 엄격한 데이터 보안과 개인정보 보호를 유지합니다.', 'GitHub, Slack, Notion', 4, 1, '2025-09-01', 'AI 진단 보조 시스템', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300', '550e8400-e29b-41d4-a716-446655440008'),
      ('team-012', '에듀테크 플랫폼', '대구', '에듀테크', '교육 기술 혁신을 위한 팀입니다.', '개인화된 온라인 학습 플랫폼을 개발하여 학습자의 학습 효과를 극대화하고 싶습니다.', 'React/Next.js 경험이 있는 프론트엔드 개발자 1명, 교육 콘텐츠 기획자 1명, UX 디자이너 1명을 모집합니다.', '현재 팀장(풀스택), 백엔드 개발자 2명이 있습니다.', '교육 분야에 대한 이해와 학습자 경험에 대한 관심이 있는 분을 찾습니다. 교육 콘텐츠 제작이나 학습 분석 경험이 있으면 더욱 좋습니다.', '교육 전문가들과의 협업을 통해 학습자 중심의 플랫폼을 개발하며, 학습 데이터 분석을 통한 지속적인 개선을 진행합니다.', 'GitHub, Notion, Slack', 5, 2, '2025-08-20', '온라인 학습 플랫폼', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300', '550e8400-e29b-41d4-a716-446655440004'),
      ('team-013', '그린테크 솔루션', '전국', '그린테크', '환경 보호 기술 개발 팀입니다.', '탄소 발자국 추적 앱을 개발하여 사용자의 환경 친화적 행동을 촉진하고 싶습니다.', 'React Native/Flutter 경험이 있는 모바일 개발자 2명, 환경 데이터 분석 전문가 1명을 모집합니다.', '현재 팀장(마케팅 전문가) 1명이 있습니다.', '환경 보호에 대한 열정과 지속가능성에 대한 이해가 있는 분을 찾습니다. 데이터 분석이나 시각화 경험이 있으면 더욱 좋습니다.', '환경 전문가들과의 협업을 통해 정확한 환경 데이터를 활용하며, 사용자의 행동 변화를 유도하는 UX 설계를 중시합니다.', 'GitHub, Slack, Notion', 4, 1, '2025-09-15', '탄소 발자국 추적 앱', 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=300', '550e8400-e29b-41d4-a716-446655440010'),
      ('team-014', '소셜 임팩트', '서울', '소셜 임팩트', '사회 문제 해결을 위한 기술 팀입니다.', '지역 커뮤니티 플랫폼을 개발하여 지역 주민들 간의 연결과 협력을 강화하고 싶습니다.', 'React/Next.js 경험이 있는 프론트엔드 개발자 1명, Node.js 경험이 있는 백엔드 개발자 1명을 모집합니다.', '현재 PM, 마케팅, 디자이너 3명이 있습니다.', '사회적 가치 창출에 대한 관심과 지역 사회에 대한 이해가 있는 분을 찾습니다. 커뮤니티 플랫폼 개발 경험이나 사회적 기업 경험이 있으면 더욱 좋습니다.', '지역 주민들과의 지속적인 소통을 통해 실제 니즈를 파악하며, 사용자 피드백을 적극적으로 반영하여 플랫폼을 개선합니다.', 'GitHub, Slack, Notion', 6, 3, '2025-07-25', '지역 커뮤니티 플랫폼', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=300', '550e8400-e29b-41d4-a716-446655440009'),
      ('team-015', '푸드테크 스타트업', '부산', '푸드테크', '음식 기술 혁신을 목표로 하는 팀입니다.', '스마트 레시피 추천 앱을 개발하여 사용자의 요리 경험을 개선하고 음식물 쓰레기를 줄이고 싶습니다.', 'React Native/Flutter 경험이 있는 모바일 개발자 1명, 음식/요리 전문가 1명을 모집합니다.', '현재 팀장(마케팅), 모바일 개발자 2명이 있습니다.', '음식과 요리에 대한 관심과 모바일 개발 전문성이 있는 분을 찾습니다. 추천 시스템이나 머신러닝 경험이 있으면 더욱 좋습니다.', '요리 전문가들과의 협업을 통해 정확한 레시피 데이터를 구축하며, 사용자의 취향과 재료 상황을 고려한 개인화된 추천을 제공합니다.', 'GitHub, Slack, Notion', 4, 2, '2025-08-10', '스마트 레시피 추천 앱', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300', '550e8400-e29b-41d4-a716-446655440010'),
      ('team-016', '로보틱스 랩', '대전', '로봇공학', '자율주행 로봇을 연구/개발하는 팀입니다.', '실내 자율주행 서비스 로봇 프로토타입 개발', 'ROS2 경험이 있는 로봇 개발자 2명, SLAM 연구자 1명', '팀장(로봇공학 박사과정) 1명', '수학/최적화에 강하고 프로토타이핑이 빠른 분', '주 2회 오프라인 테스트, 깃 기반 코드 리뷰', 'GitHub, Slack, Notion', 5, 2, '2025-08-22', '실내 자율주행 로봇', 'https://images.unsplash.com/photo-1581091014527-1c49c8f2d6b0?w=300', '550e8400-e29b-41d4-a716-446655440004'),
      ('team-017', '보안 레드팀', '서울', '보안', '웹/모바일 서비스 취약점 분석과 보안 자동화 도구 개발', '내부 보안 진단 자동화 파이프라인 구축', '펜테스트 경험자 1명, Go/Python 보안툴 개발자 1명', '팀장(보안 엔지니어) 1명', 'OWASP/클라우드 보안에 익숙한 분', '주 1회 온라인 세미나, 위키 기반 문서화', 'GitHub, Slack, Notion', 4, 1, '2025-07-28', '보안 진단 자동화', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=300', '550e8400-e29b-41d4-a716-446655440011'),
      ('team-018', '데이터 비주얼라이제이션', '전국', '데이터', '도시 데이터 시각화 대시보드 제작', '공공 데이터 기반 도시 인사이트 발굴', 'D3.js/Mapbox 경험자 1명, 데이터 엔지니어 1명', '팀장(데이터 사이언티스트) 1명', '데이터 스토리텔링에 관심 있는 분', '애자일 2주 스프린트, 데모데이 운영', 'GitHub, Slack, Notion', 4, 2, '2025-08-18', '스마트시티 대시보드', 'https://images.unsplash.com/photo-1517148815978-75f6acaaf32c?w=300', '550e8400-e29b-41d4-a716-446655440013'),
      ('team-019', '클라우드 네이티브', '인천', '클라우드', '쿠버네티스 기반 마이크로서비스 레퍼런스 구축', 'MLOps/DevOps 통합 예시 아키텍처 만들기', 'K8s/Helm 경험자 1명, Terraform 엔지니어 1명', '팀장(DevOps) 1명', 'IaC/관찰가능성 도구에 익숙한 분', '주 2회 코드리뷰, 블로그 아카이브', 'GitHub, Slack, Notion', 5, 2, '2025-09-02', '클라우드 레퍼런스 앱', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300', '550e8400-e29b-41d4-a716-446655440006'),
      ('team-020', '핀테크 리서치', '서울', '핀테크', '온체인 데이터 기반 투자 인사이트 리포트 제작', 'DeFi 프로토콜 데이터 수집/분석 자동화', '데이터 애널리스트 1명, 백엔드 1명', '팀장(퀀트 엔지니어) 1명', 'SQL/파이썬 분석에 능숙한 분', '비동기 협업, 주간 리포트 발행', 'GitHub, Slack, Notion', 4, 1, '2025-07-22', '온체인 인사이트', 'https://images.unsplash.com/photo-1554224155-3a589877462f?w=300', '550e8400-e29b-41d4-a716-446655440002'),
      ('team-021', '모바일 헬스랩', '대구', '모바일', '웨어러블 연동 건강관리 앱 PoC', '센서 데이터 기반 개인 맞춤형 코칭', 'RN/Flutter 개발자 1명, 데이터 과학자 1명', '팀장(모바일) 1명', '헬스케어/프라이버시 고려 가능한 분', '격주 사용자 테스트, HIPAA 참고', 'GitHub, Slack, Notion', 5, 1, '2025-08-12', '웨어러블 코칭 앱', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300', '550e8400-e29b-41d4-a716-446655440008'),
      ('team-022', '웹 접근성 향상팀', '광주', '웹 개발', '공공서비스 접근성 개선 툴킷 제작', '자동 감지 및 수정 가이던스 제공', '프론트엔드 1명, 접근성 전문가 1명', '팀장(프론트엔드) 1명', 'WCAG/스크린리더 친화 개발자', '주 1회 사용자 테스트, 이슈 드리븐', 'GitHub, Slack, Notion', 4, 2, '2025-07-30', 'A11y 툴킷', 'https://images.unsplash.com/photo-1505238680356-667803448bb6?w=300', '550e8400-e29b-41d4-a716-446655440003'),
      ('team-023', '교육용 코딩플랫폼', '세종', '에듀테크', '초중등 대상 브라우저 코딩러너', '교사 대시보드/과제 자동 채점', '프론트엔드 1명, 백엔드 1명', '팀장(풀스택) 1명', '교육 도메인 관심/경험 보유자', '주 2회 1:1 인터뷰, 린 검증', 'GitHub, Slack, Notion', 5, 2, '2025-09-05', '코딩러너', 'https://images.unsplash.com/photo-1514501132521-449b6edec8e9?w=300', '550e8400-e29b-41d4-a716-446655440004'),
      ('team-024', '메타버스 스튜디오', '전국', 'AR/VR', '가벼운 소셜 메타버스 공간 제작', '웹 기반 3D 커뮤니티 실험', 'Three.js 개발자 1명, 3D 디자이너 1명', '팀장(3D) 1명', 'WebGL/성능 최적화 관심자', '프로토타이핑 중심, 주별 데모', 'GitHub, Slack, Figma', 6, 3, '2025-08-28', '소셜 메타버스', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', '550e8400-e29b-41d4-a716-446655440005'),
      ('team-025', '오픈데이터 탐험대', '제주', '데이터', '제주 관광/환경 데이터 분석 프로젝트', '오픈데이터로 가치있는 인사이트 도출', '데이터 분석가 1명, 시각화 1명', '팀장(데이터) 1명', 'SQL/시각화 라이브러리 숙련', '현장/원격 혼합, 문서 우선', 'GitHub, Slack, Notion', 4, 1, '2025-09-12', '제주 인사이트 대시보드', 'https://images.unsplash.com/photo-1451187858576-054e3f2a55f2?w=300', '550e8400-e29b-41d4-a716-446655440006')
    `);
    console.log("✅ 팀 데이터 삽입 완료");

    // 팀-공모전 매핑 데이터 삽입
    console.log("🔗 팀-공모전 매핑 데이터 삽입 중...");
    await pool.execute(`
      INSERT INTO team_contests (team_id, contest_id, role, note) VALUES
      ('team-001', 'contest-001', '참가 예정', '해커톤 준비 중'),
      ('team-002', 'contest-011', '연구/개발', '의료 AI 과제 적합'),
      ('team-003', 'contest-004', '디자인 리드', 'UX/UI 강화 필요'),
      ('team-004', 'contest-010', '서비스 기획', '핀테크 아이디어톤 준비'),
      ('team-006', 'contest-006', '개발', '스마트 컨트랙트 프로토타입'),
      ('team-007', 'contest-007', '게임 개발', '게임 프로토타입 제출 예정'),
      ('team-009', 'contest-009', '콘텐츠 제작', '교육용 VR 콘텐츠'),
      ('team-016', 'contest-004', '로봇/웹', '현장 데모 준비'),
      ('team-018', 'contest-013', '데이터 시각화', '환경 대시보드 샘플'),
      ('team-020', 'contest-006', '데이터 분석', '온체인 데이터 리포트')
    `);
    console.log("✅ 팀-공모전 매핑 데이터 삽입 완료");

    // 팀 멤버 데이터 삽입
    console.log("👥 팀 멤버 데이터 삽입 중...");
    await pool.execute(`
      INSERT INTO team_members (id, team_id, user_id, role, status) VALUES
      ('member-001', 'team-001', '550e8400-e29b-41d4-a716-446655440001', '팀장', 'accepted'),
      ('member-002', 'team-001', '550e8400-e29b-41d4-a716-446655440004', '프론트엔드', 'accepted'),
      ('member-003', 'team-002', '550e8400-e29b-41d4-a716-446655440002', '팀장', 'accepted'),
      ('member-004', 'team-003', '550e8400-e29b-41d4-a716-446655440003', '팀장', 'accepted'),
      ('member-005', 'team-003', '550e8400-e29b-41d4-a716-446655440005', 'UI/UX 디자이너', 'accepted'),
      ('member-006', 'team-003', '550e8400-e29b-41d4-a716-446655440009', '기획자', 'accepted'),
      ('member-007', 'team-004', '550e8400-e29b-41d4-a716-446655440001', '팀원', 'accepted'),
      ('member-008', 'team-004', '550e8400-e29b-41d4-a716-446655440009', 'PM', 'accepted'),
      ('member-009', 'team-005', '550e8400-e29b-41d4-a716-446655440002', '팀장', 'accepted'),
      ('member-010', 'team-006', '550e8400-e29b-41d4-a716-446655440004', '팀장', 'accepted'),
      ('member-011', 'team-007', '550e8400-e29b-41d4-a716-446655440007', '팀장', 'accepted'),
      ('member-012', 'team-007', '550e8400-e29b-41d4-a716-446655440005', '게임 디자이너', 'accepted'),
      ('member-013', 'team-008', '550e8400-e29b-41d4-a716-446655440006', '팀장', 'accepted'),
      ('member-014', 'team-009', '550e8400-e29b-41d4-a716-446655440005', '팀장', 'accepted'),
      ('member-015', 'team-009', '550e8400-e29b-41d4-a716-446655440007', '3D 모델러', 'accepted'),
      ('member-016', 'team-010', '550e8400-e29b-41d4-a716-446655440009', '팀장', 'accepted'),
      ('member-017', 'team-010', '550e8400-e29b-41d4-a716-446655440004', '풀스택 개발자', 'accepted'),
      ('member-018', 'team-011', '550e8400-e29b-41d4-a716-446655440008', '팀장', 'accepted'),
      ('member-019', 'team-012', '550e8400-e29b-41d4-a716-446655440004', '팀장', 'accepted'),
      ('member-020', 'team-012', '550e8400-e29b-41d4-a716-446655440006', '백엔드', 'accepted'),
      ('member-021', 'team-013', '550e8400-e29b-41d4-a716-446655440010', '팀장', 'accepted'),
      ('member-022', 'team-014', '550e8400-e29b-41d4-a716-446655440009', '팀장', 'accepted'),
      ('member-023', 'team-014', '550e8400-e29b-41d4-a716-446655440010', '마케팅', 'accepted'),
      ('member-024', 'team-014', '550e8400-e29b-41d4-a716-446655440003', '디자이너', 'accepted'),
      ('member-025', 'team-015', '550e8400-e29b-41d4-a716-446655440010', '팀장', 'accepted'),
      ('member-026', 'team-015', '550e8400-e29b-41d4-a716-446655440007', '모바일 개발자', 'accepted'),
      ('member-027', 'team-002', '550e8400-e29b-41d4-a716-446655440008', 'AI/ML 엔지니어', 'accepted'),
      ('member-028', 'team-002', '550e8400-e29b-41d4-a716-446655440013', '데이터 사이언티스트', 'accepted'),
      ('member-029', 'team-004', '550e8400-e29b-41d4-a716-446655440004', '풀스택 개발자', 'accepted'),
      ('member-030', 'team-006', '550e8400-e29b-41d4-a716-446655440011', '보안 전문가', 'accepted'),
      ('member-031', 'team-007', '550e8400-e29b-41d4-a716-446655440012', '게임 프로그래머', 'accepted'),
      ('member-032', 'team-008', '550e8400-e29b-41d4-a716-446655440014', '클라우드 개발자', 'accepted'),
      ('member-033', 'team-011', '550e8400-e29b-41d4-a716-446655440015', '의료 도메인 전문가', 'accepted'),
      ('member-034', 'team-011', '550e8400-e29b-41d4-a716-446655440013', '데이터 사이언티스트', 'accepted'),
      ('member-035', 'team-012', '550e8400-e29b-41d4-a716-446655440003', 'UX 디자이너', 'accepted'),
      ('member-036', 'team-013', '550e8400-e29b-41d4-a716-446655440014', 'DevOps 엔지니어', 'accepted'),
      ('member-037', 'team-001', '550e8400-e29b-41d4-a716-446655440003', 'UI/UX 디자이너', 'accepted'),
      ('member-038', 'team-001', '550e8400-e29b-41d4-a716-446655440009', '기획자', 'accepted'),
      ('member-039', 'team-003', '550e8400-e29b-41d4-a716-446655440004', '프론트엔드', 'accepted'),
      ('member-040', 'team-005', '550e8400-e29b-41d4-a716-446655440007', '모바일 개발자', 'accepted'),
      ('member-041', 'team-005', '550e8400-e29b-41d4-a716-446655440015', '의료 도메인 전문가', 'accepted'),
      ('member-042', 'team-009', '550e8400-e29b-41d4-a716-446655440012', '3D 모델러', 'accepted'),
      ('member-043', 'team-010', '550e8400-e29b-41d4-a716-446655440011', '보안 전문가', 'accepted'),
      ('member-044', 'team-015', '550e8400-e29b-41d4-a716-446655440013', '데이터 분석가', 'accepted'),
      ('member-045', 'team-015', '550e8400-e29b-41d4-a716-446655440003', 'UX 디자이너', 'accepted')
    `);
    console.log("✅ 팀 멤버 데이터 삽입 완료");

    // 팀 리뷰 테이블 및 임시 데이터 삽입 (프로필 리뷰용)
    console.log("⭐ 팀 리뷰 임시 데이터 삽입 중...");
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS team_reviews (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        team_id VARCHAR(36) NOT NULL,
        member_id VARCHAR(36) NOT NULL,
        reviewer_user_id VARCHAR(36) NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_team_reviews_team_id (team_id)
      )
    `);
    // 대상 프로필: 550e8400-e29b-41d4-a716-446655440001 → team_members: member-001(team-001 팀장), member-007(team-004 팀원)
    // 리뷰어는 다른 사용자로 설정
    await pool.execute(`
      INSERT INTO team_reviews (team_id, member_id, reviewer_user_id, rating, comment, created_at) VALUES
      ('team-001', 'member-001', '550e8400-e29b-41d4-a716-446655440004', 5, '성실하고 커뮤니케이션이 뛰어나 프로젝트 일정 준수에 크게 기여했습니다.', NOW()),
      ('team-004', 'member-007', '550e8400-e29b-41d4-a716-446655440009', 4, '문제 해결 능력이 좋고 리뷰 피드백 반영이 빠릅니다.', NOW())
    `);
    console.log("✅ 팀 리뷰 임시 데이터 삽입 완료");

    // 관심사 데이터 삽입
    console.log("❤️ 관심사 데이터 삽입 중...");
    await pool.execute(`
      INSERT INTO favorites (id, user_id, contest_id) VALUES
      ('fav-001', '550e8400-e29b-41d4-a716-446655440001', 'contest-001'),
      ('fav-002', '550e8400-e29b-41d4-a716-446655440001', 'contest-004'),
      ('fav-003', '550e8400-e29b-41d4-a716-446655440002', 'contest-002'),
      ('fav-004', '550e8400-e29b-41d4-a716-446655440003', 'contest-005'),
      ('fav-008', '550e8400-e29b-41d4-a716-446655440004', 'contest-006'),
      ('fav-009', '550e8400-e29b-41d4-a716-446655440005', 'contest-009'),
      ('fav-010', '550e8400-e29b-41d4-a716-446655440006', 'contest-008'),
      ('fav-011', '550e8400-e29b-41d4-a716-446655440007', 'contest-007'),
      ('fav-012', '550e8400-e29b-41d4-a716-446655440008', 'contest-011'),
      ('fav-013', '550e8400-e29b-41d4-a716-446655440009', 'contest-010'),
      ('fav-014', '550e8400-e29b-41d4-a716-446655440010', 'contest-014'),
      ('fav-015', '550e8400-e29b-41d4-a716-446655440001', 'contest-002'),
      ('fav-016', '550e8400-e29b-41d4-a716-446655440002', 'contest-006'),
      ('fav-017', '550e8400-e29b-41d4-a716-446655440003', 'contest-009')
    `);
    await pool.execute(`
      INSERT INTO favorites (id, user_id, team_id) VALUES
      ('fav-018', '550e8400-e29b-41d4-a716-446655440001', 'team-002'),
      ('fav-019', '550e8400-e29b-41d4-a716-446655440002', 'team-001'),
      ('fav-020', '550e8400-e29b-41d4-a716-446655440003', 'team-003'),
      ('fav-021', '550e8400-e29b-41d4-a716-446655440004', 'team-006'),
      ('fav-022', '550e8400-e29b-41d4-a716-446655440005', 'team-009'),
      ('fav-023', '550e8400-e29b-41d4-a716-446655440006', 'team-008'),
      ('fav-024', '550e8400-e29b-41d4-a716-446655440007', 'team-007'),
      ('fav-025', '550e8400-e29b-41d4-a716-446655440008', 'team-011'),
      ('fav-026', '550e8400-e29b-41d4-a716-446655440009', 'team-010'),
      ('fav-027', '550e8400-e29b-41d4-a716-446655440010', 'team-014'),
      ('fav-028', '550e8400-e29b-41d4-a716-446655440001', 'team-004'),
      ('fav-029', '550e8400-e29b-41d4-a716-446655440002', 'team-005'),
      ('fav-030', '550e8400-e29b-41d4-a716-446655440003', 'team-012')
    `);
    console.log("✅ 관심사 데이터 삽입 완료");

    // 수상경력 데이터 삽입
    console.log("🏆 수상경력 데이터 삽입 중...");
    await pool.execute(`
      INSERT INTO awards (id, user_id, title, awarded_at, description) VALUES
      ('award-001', '550e8400-e29b-41d4-a716-446655440001', '한이음 공모전 우수상', '2024-08-20', '대학생 팀프로젝트 경진대회에서 우수상을 수상했습니다.'),
      ('award-002', '550e8400-e29b-41d4-a716-446655440001', 'SW개발 경진대회 동상', '2023-11-15', '전국 대학생 소프트웨어 경진대회에서 동상을 수상했습니다.'),
      ('award-003', '550e8400-e29b-41d4-a716-446655440002', 'Korea AI Challenge 본선 진출', '2024-06-10', '한국 AI 경진대회 본선에 진출하여 우수한 성과를 거두었습니다.'),
      ('award-004', '550e8400-e29b-41d4-a716-446655440003', 'Design Award 2024 금상', '2024-09-05', '대한민국 디자인 어워드에서 금상을 수상했습니다.'),
      ('award-005', '550e8400-e29b-41d4-a716-446655440004', '해커톤 그랜드 챔피언', '2024-12-01', '크라우드웍스 해커톤에서 그랜드 챔피언을 수상했습니다.'),
      ('award-006', '550e8400-e29b-41d4-a716-446655440005', 'UX Design Competition 장려상', '2024-03-20', '사용자 경험 디자인 공모전에서 장려상을 수상했습니다.'),
      ('award-007', '550e8400-e29b-41d4-a716-446655440006', '전국 프로그래밍 대회 은상', '2023-10-30', '전국 대학생 프로그래밍 경시대회에서 은상을 수상했습니다.'),
      ('award-008', '550e8400-e29b-41d4-a716-446655440007', '모바일 앱 경진대회 대상', '2024-07-18', '스마트 앱 개발 경진대회에서 대상을 수상했습니다.'),
      ('award-009', '550e8400-e29b-41d4-a716-446655440008', 'AI Research Paper Award', '2024-04-12', '학회에서 발표한 AI 연구 논문이 우수 논문으로 선정되었습니다.'),
      ('award-010', '550e8400-e29b-41d4-a716-446655440009', '프로젝트 관리 우수사례상', '2024-01-25', 'IT 프로젝트 관리 우수사례 공모전에서 수상했습니다.')
    `);
    console.log("✅ 수상경력 데이터 삽입 완료");

    // 사용자 성향 데이터 삽입
    console.log("🎭 사용자 성향 데이터 삽입 중...");
    await pool.execute(`
      INSERT INTO user_traits (id, user_id, category, trait) VALUES
      ('trait-001', '550e8400-e29b-41d4-a716-446655440001', '학습_방식', '시각적 학습자'),
      ('trait-002', '550e8400-e29b-41d4-a716-446655440001', '협업_스타일', '적극적인 커뮤니케이션'),
      ('trait-003', '550e8400-e29b-41d4-a716-446655440001', '작업_시간대', '주간 타입'),
      ('trait-004', '550e8400-e29b-41d4-a716-446655440001', '회의_방식', '대면'),
      ('trait-005', '550e8400-e29b-41d4-a716-446655440002', '학습_방식', '실습 중심'),
      ('trait-006', '550e8400-e29b-41d4-a716-446655440002', '협업_스타일', '문서화 중시'),
      ('trait-007', '550e8400-e29b-41d4-a716-446655440002', '작업_시간대', '저녁 타입'),
      ('trait-008', '550e8400-e29b-41d4-a716-446655440002', '회의_방식', '비대면'),
      ('trait-009', '550e8400-e29b-41d4-a716-446655440003', '학습_방식', '시각적 학습자'),
      ('trait-010', '550e8400-e29b-41d4-a716-446655440003', '협업_스타일', '피드백 중심'),
      ('trait-011', '550e8400-e29b-41d4-a716-446655440003', '작업_시간대', '주간 타입'),
      ('trait-012', '550e8400-e29b-41d4-a716-446655440003', '회의_방식', '대면'),
      ('trait-013', '550e8400-e29b-41d4-a716-446655440004', '학습_방식', '다양한 학습 방식'),
      ('trait-014', '550e8400-e29b-41d4-a716-446655440004', '협업_스타일', '적극적인 커뮤니케이션'),
      ('trait-015', '550e8400-e29b-41d4-a716-446655440004', '작업_시간대', '야간 타입'),
      ('trait-016', '550e8400-e29b-41d4-a716-446655440004', '회의_방식', '혼합'),
      ('trait-017', '550e8400-e29b-41d4-a716-446655440005', '학습_방식', '시각적 학습자'),
      ('trait-018', '550e8400-e29b-41d4-a716-446655440005', '협업_스타일', '크리에이티브 위주'),
      ('trait-019', '550e8400-e29b-41d4-a716-446655440005', '작업_시간대', '주간 타입'),
      ('trait-020', '550e8400-e29b-41d4-a716-446655440005', '회의_방식', '대면'),
      ('trait-021', '550e8400-e29b-41d4-a716-446655440006', '학습_방식', '실습 중심'),
      ('trait-022', '550e8400-e29b-41d4-a716-446655440006', '협업_스타일', '문서화 중시'),
      ('trait-023', '550e8400-e29b-41d4-a716-446655440006', '작업_시간대', '저녁 타입'),
      ('trait-024', '550e8400-e29b-41d4-a716-446655440006', '회의_방식', '비대면'),
      ('trait-025', '550e8400-e29b-41d4-a716-446655440007', '학습_방식', '자율 학습'),
      ('trait-026', '550e8400-e29b-41d4-a716-446655440007', '협업_스타일', '유연한 소통'),
      ('trait-027', '550e8400-e29b-41d4-a716-446655440007', '작업_시간대', '주간 타입'),
      ('trait-028', '550e8400-e29b-41d4-a716-446655440007', '회의_방식', '혼합'),
      ('trait-029', '550e8400-e29b-41d4-a716-446655440008', '학습_방식', '논문 중심'),
      ('trait-030', '550e8400-e29b-41d4-a716-446655440008', '협업_스타일', '연구 중심'),
      ('trait-031', '550e8400-e29b-41d4-a716-446655440008', '작업_시간대', '야간 타입'),
      ('trait-032', '550e8400-e29b-41d4-a716-446655440008', '회의_방식', '비대면'),
      ('trait-033', '550e8400-e29b-41d4-a716-446655440009', '학습_방식', '협업 중심'),
      ('trait-034', '550e8400-e29b-41d4-a716-446655440009', '협업_스타일', '리더십 발휘'),
      ('trait-035', '550e8400-e29b-41d4-a716-446655440009', '작업_시간대', '주간 타입'),
      ('trait-036', '550e8400-e29b-41d4-a716-446655440009', '회의_방식', '대면'),
      ('trait-037', '550e8400-e29b-41d4-a716-446655440010', '학습_방식', '실무 중심'),
      ('trait-038', '550e8400-e29b-41d4-a716-446655440010', '협업_스타일', '네트워킹 중시'),
      ('trait-039', '550e8400-e29b-41d4-a716-446655440010', '작업_시간대', '주간 타입'),
      ('trait-040', '550e8400-e29b-41d4-a716-446655440010', '회의_방식', '혼합')
    `);
    console.log("✅ 사용자 성향 데이터 삽입 완료");

    console.log("🎉 데이터베이스 시드가 완료되었습니다!");
  } catch (error) {
    console.error("❌ 시드 중 오류 발생:", error);
    throw error;
  }
};

// 스크립트로 직접 실행된 경우
if (require.main === module) {
  runSeed()
    .then(() => {
      console.log("시드 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("시드 실패:", error);
      process.exit(1);
    });
}

export default runSeed;
