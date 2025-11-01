import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/database";
import { generateToken } from "../utils/jwt";
import { authenticateToken } from "../middleware/auth";
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "../utils/validation";
import { asyncHandler, createError } from "../middleware/error";
import { CreateUserData, LoginData, AuthResponse } from "../types";

const router = Router();

// 회원가입
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      email,
      password,
      name,
      region,
      school,
      major,
      birth_date,
      job_field,
      skills,
    }: CreateUserData = req.body;

    // 필수 필드 검증
    const requiredValidation = validateRequired(req.body, [
      "email",
      "password",
      "name",
    ]);
    if (!requiredValidation.isValid) {
      throw createError(
        `필수 필드가 누락되었습니다: ${requiredValidation.missingFields?.join(
          ", "
        )}`,
        400
      );
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      throw createError("올바른 이메일 형식이 아닙니다", 400);
    }

    // 비밀번호 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw createError(passwordValidation.message!, 400);
    }

    // 이메일 중복 확인
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      throw createError("이미 존재하는 이메일입니다", 409);
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    await pool.execute(
      `INSERT INTO users (email, password, name, region, school, major, birth_date, job_field, skills) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        hashedPassword,
        name,
        region || null,
        school || null,
        major || null,
        birth_date || null,
        job_field || null,
        skills || null,
      ]
    );

    // 생성된 사용자 정보 조회 (이메일로 조회)
    const [users] = await pool.execute(
      "SELECT id, email, name, region, school, major, birth_date, job_field, skills, created_at, updated_at FROM users WHERE email = ?",
      [email]
    );

    const user =
      Array.isArray(users) && users.length > 0 ? (users[0] as any) : null;

    if (!user) {
      throw createError("사용자 정보를 찾을 수 없습니다", 500);
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        region: user.region,
        school: user.school,
        major: user.major,
        birth_date: user.birth_date,
        job_field: user.job_field,
        skills: user.skills,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      token,
    };

    res.status(201).json({
      success: true,
      data: response,
      message: "회원가입이 완료되었습니다",
    });
  })
);

// 로그인
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginData = req.body;

    // 필수 필드 검증
    const requiredValidation = validateRequired(req.body, [
      "email",
      "password",
    ]);
    if (!requiredValidation.isValid) {
      throw createError(
        `필수 필드가 누락되었습니다: ${requiredValidation.missingFields?.join(
          ", "
        )}`,
        400
      );
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      throw createError("올바른 이메일 형식이 아닙니다", 400);
    }

    // 사용자 조회
    const [users] = await pool.execute(
      "SELECT id, email, password, name, region, school, major, birth_date, job_field, skills, github_url, created_at, updated_at FROM users WHERE email = ?",
      [email]
    );

    const user = Array.isArray(users) ? (users[0] as any) : null;

    if (!user) {
      throw createError("이메일 또는 비밀번호가 올바르지 않습니다", 401);
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError("이메일 또는 비밀번호가 올바르지 않습니다", 401);
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        region: user.region,
        school: user.school,
        major: user.major,
        birth_date: user.birth_date,
        job_field: user.job_field,
        skills: user.skills,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      token,
    };

    res.json({
      success: true,
      data: response,
      message: "로그인 성공",
    });
  })
);

// 내 정보 조회
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("인증이 필요합니다", 401);
    }

    // 사용자 정보 조회
    const [users] = await pool.execute(
      "SELECT id, email, name, region, school, major, birth_date, job_field, skills, github_url, figma_url, available_time, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    const user = Array.isArray(users) ? (users[0] as any) : null;

    if (!user) {
      throw createError("사용자를 찾을 수 없습니다", 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  })
);

// 사용자 프로필 조회 (공개)
router.get(
  "/profiles/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw createError("사용자 ID가 필요합니다", 400);
    }

    // 사용자 기본 정보 조회
    const [users] = await pool.execute(
      "SELECT id, name, region, school, major, job_field, skills FROM users WHERE id = ?",
      [id]
    );

    const user = Array.isArray(users) ? (users[0] as any) : null;

    if (!user) {
      throw createError("사용자를 찾을 수 없습니다", 404);
    }

    // 프로필 데이터 구성
    const skills = user.skills
      ? user.skills.split(",").map((s: string) => s.trim())
      : [];
    const tags = [];

    // 태그 구성 (지역, 전공, 직무 분야)
    if (user.region) tags.push(user.region);
    if (user.major) tags.push(user.major);
    if (user.job_field) tags.push(user.job_field);
    if (user.school) tags.push(user.school);

    // 성향/작업방식 (직무 분야 기반으로 추정)
    const traits = [];
    if (user.job_field) {
      switch (user.job_field) {
        case "프론트엔드":
          traits.push("사용자 경험 중시", "디테일한 구현", "창의적 사고");
          break;
        case "백엔드":
          traits.push("체계적 설계", "성능 최적화", "안정성 중시");
          break;
        case "풀스택":
          traits.push("전체적인 관점", "유연한 사고", "다양한 기술");
          break;
        case "AI/ML 엔지니어":
          traits.push("데이터 분석", "알고리즘 연구", "지속적 학습");
          break;
        case "UI/UX 디자이너":
          traits.push("사용자 중심 사고", "직관적 디자인", "협업 능력");
          break;
        default:
          traits.push("문제 해결 능력", "팀워크", "지속적 성장");
      }
    }

    const profile = {
      id: user.id,
      bio: `${user.region || "전국"} 출신의 ${user.major || "IT"} 전공자로, ${
        user.job_field || "개발"
      } 분야에서 활동하고 있습니다.`,
      skills: skills,
      traits: traits,
      tags: tags,
      user: {
        name: user.name,
      },
      awards: [], // 향후 awards 테이블 추가 예정
      portfolioItems: [], // 향후 portfolio 테이블 추가 예정
    };

    res.json({
      success: true,
      data: { profile },
    });
  })
);

// 내 정보 수정
router.put(
  "/me",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const {
      name,
      region,
      school,
      major,
      birth_date,
      job_field,
      skills,
      github_url,
      figma_url,
      available_time,
    } = req.body;

    if (!userId) {
      throw createError("인증이 필요합니다", 401);
    }

    // 사용자 존재 확인 및 기존 정보 조회
    const [existingUsers] = await pool.execute(
      "SELECT id, name, region, school, major, birth_date, job_field, skills, github_url, figma_url, available_time FROM users WHERE id = ?",
      [userId]
    );

    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      throw createError("사용자를 찾을 수 없습니다", 404);
    }

    const existingUser = existingUsers[0] as any;

    // 사용자 정보 업데이트 (전달된 값이 있으면 사용, 없으면 기존 값 유지)
    await pool.execute(
      `UPDATE users 
       SET name = ?, region = ?, school = ?, major = ?, birth_date = ?, job_field = ?, skills = ?, github_url = ?, figma_url = ?, available_time = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        name !== undefined ? name || null : existingUser.name,
        region !== undefined ? region || null : existingUser.region,
        school !== undefined ? school || null : existingUser.school,
        major !== undefined ? major || null : existingUser.major,
        birth_date !== undefined ? birth_date || null : existingUser.birth_date,
        job_field !== undefined ? job_field || null : existingUser.job_field,
        skills !== undefined ? skills || null : existingUser.skills,
        github_url !== undefined ? github_url || null : existingUser.github_url,
        figma_url !== undefined ? figma_url || null : existingUser.figma_url,
        available_time !== undefined
          ? available_time || null
          : existingUser.available_time,
        userId,
      ]
    );

    // 업데이트된 사용자 정보 조회
    const [users] = await pool.execute(
      "SELECT id, email, name, region, school, major, birth_date, job_field, skills, github_url, figma_url, available_time, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    const user = Array.isArray(users) ? (users[0] as any) : null;

    res.json({
      success: true,
      data: { user },
      message: "사용자 정보가 성공적으로 수정되었습니다",
    });
  })
);

export default router;
