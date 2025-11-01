import express, { Request, Response } from "express";
import { pool } from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler, createError } from "../utils/validation";

const router = express.Router();

// 프로필 상세 조회 (인증 불필요)
router.get(
  "/profiles/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // 사용자 기본 정보 조회
    const [users] = await pool.execute(
      "SELECT id, name, region, school, major, birth_date, job_field, skills, github_url, figma_url FROM users WHERE id = ?",
      [id]
    );

    if (!Array.isArray(users) || users.length === 0) {
      throw createError("사용자를 찾을 수 없습니다", 404);
    }

    const user = users[0] as any;

    // 수상경력 조회
    const [awards] = await pool.execute(
      "SELECT id, title, awarded_at as awardedAt, description, `rank`, participation_type, roles, result_link, result_images FROM awards WHERE user_id = ? ORDER BY awarded_at DESC",
      [id]
    );

    // 성향 조회
    const [traits] = await pool.execute(
      "SELECT category, trait FROM user_traits WHERE user_id = ?",
      [id]
    );

    // 성향을 평탄화된 리스트로 변환
    const traitsList = (traits as any[]).map((t) => t.trait);

    // 스킬 파싱
    const skillsList = user.skills
      ? user.skills.split(",").map((s: string) => s.trim())
      : [];

    // 태그 생성 (job_field, region 등을 태그로 사용)
    const tags = [];
    if (user.job_field) tags.push(user.job_field);
    if (user.region) tags.push(user.region);
    if (user.school) tags.push(user.school);
    if (user.major) tags.push(user.major);

    res.json({
      success: true,
      data: {
        profile: {
          id: user.id,
          bio: `${user.region}에 거주하는 ${user.job_field}입니다.`,
          skills: skillsList,
          traits: traitsList,
          tags: tags,
          githubUrl: user.github_url || null,
          figmaUrl: user.figma_url || null,
          user: {
            name: user.name,
          },
          awards: awards || [],
          portfolioItems: [], // 포트폴리오는 별도로 구현 필요
        },
      },
    });
  })
);

// 수상경력 저장
router.post(
  "/awards",
  authenticateToken,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user?.userId;
    const { awards } = req.body;

    if (!userId) {
      throw createError("인증이 필요합니다", 401);
    }

    if (!Array.isArray(awards)) {
      throw createError("수상경력 데이터가 올바르지 않습니다", 400);
    }

    // 기존 수상경력 삭제
    await pool.execute("DELETE FROM awards WHERE user_id = ?", [userId]);

    // 새로운 수상경력 추가
    if (awards.length > 0) {
      const values = awards.map((award: any) => [
        userId,
        award.title,
        award.awardedAt,
        award.description || null,
        award.rank || null,
        award.participation_type || null,
        award.roles
          ? Array.isArray(award.roles)
            ? JSON.stringify(award.roles)
            : award.roles
          : null,
        award.result_link || null,
        award.result_images
          ? Array.isArray(award.result_images)
            ? JSON.stringify(award.result_images)
            : award.result_images
          : null,
      ]);

      const placeholders = awards
        .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .join(", ");
      await pool.execute(
        `INSERT INTO awards (user_id, title, awarded_at, description, \`rank\`, participation_type, roles, result_link, result_images) VALUES ${placeholders}`,
        values.flat()
      );
    }

    res.json({
      success: true,
      message: "수상경력이 성공적으로 저장되었습니다",
    });
  })
);

// 수상경력 조회
router.get(
  "/awards",
  authenticateToken,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("인증이 필요합니다", 401);
    }

    const [awards] = await pool.execute(
      "SELECT id, title, awarded_at as awardedAt, description, `rank`, participation_type, roles, result_link, result_images FROM awards WHERE user_id = ? ORDER BY awarded_at DESC",
      [userId]
    );

    // roles와 result_images를 파싱 (JSON 문자열인 경우)
    const parsedAwards = (awards as any[]).map((award: any) => {
      let roles = award.roles;
      let resultImages = award.result_images;

      if (roles) {
        try {
          roles = JSON.parse(roles);
        } catch {
          // JSON이 아니면 콤마로 구분된 문자열로 처리
          roles = roles
            .split(",")
            .map((r: string) => r.trim())
            .filter((r: string) => r);
        }
      }

      if (resultImages) {
        try {
          resultImages = JSON.parse(resultImages);
        } catch {
          // JSON이 아니면 콤마로 구분된 문자열로 처리
          resultImages = resultImages
            .split(",")
            .map((img: string) => img.trim())
            .filter((img: string) => img);
        }
      }

      return {
        ...award,
        roles: roles || [],
        result_images: resultImages || [],
      };
    });

    res.json({
      success: true,
      data: { awards: parsedAwards },
    });
  })
);

// 성향 저장
router.post(
  "/traits",
  authenticateToken,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user?.userId;
    const { traits } = req.body;

    if (!userId) {
      throw createError("인증이 필요합니다", 401);
    }

    if (!traits || typeof traits !== "object") {
      throw createError("성향 데이터가 올바르지 않습니다", 400);
    }

    // 기존 성향 삭제
    await pool.execute("DELETE FROM user_traits WHERE user_id = ?", [userId]);

    // 새로운 성향 추가
    const traitEntries = Object.entries(traits);
    if (traitEntries.length > 0) {
      const values: any[] = [];
      for (const [category, traitList] of traitEntries) {
        if (Array.isArray(traitList)) {
          for (const trait of traitList) {
            values.push([userId, category, trait]);
          }
        }
      }

      if (values.length > 0) {
        const placeholders = values.map(() => "(?, ?, ?)").join(", ");
        await pool.execute(
          `INSERT INTO user_traits (user_id, category, trait) VALUES ${placeholders}`,
          values.flat()
        );
      }
    }

    res.json({
      success: true,
      message: "성향이 성공적으로 저장되었습니다",
    });
  })
);

// 성향 조회
router.get(
  "/traits",
  authenticateToken,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("인증이 필요합니다", 401);
    }

    const [traits] = await pool.execute(
      "SELECT category, trait FROM user_traits WHERE user_id = ?",
      [userId]
    );

    // 성향을 카테고리별로 그룹화
    const groupedTraits: Record<string, string[]> = {};
    (traits as any[]).forEach((trait: any) => {
      if (!groupedTraits[trait.category]) {
        groupedTraits[trait.category] = [];
      }
      groupedTraits[trait.category].push(trait.trait);
    });

    res.json({
      success: true,
      data: { traits: groupedTraits },
    });
  })
);

// 포트폴리오 저장
router.post(
  "/portfolios",
  authenticateToken,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user?.userId;
    const { portfolios } = req.body;

    if (!userId) {
      throw createError("인증이 필요합니다", 401);
    }

    if (!Array.isArray(portfolios)) {
      throw createError("포트폴리오 데이터가 올바르지 않습니다", 400);
    }

    // 기존 포트폴리오 삭제
    await pool.execute("DELETE FROM portfolios WHERE user_id = ?", [userId]);

    // 새로운 포트폴리오 추가
    if (portfolios.length > 0) {
      const values = portfolios.map((portfolio: any) => [
        userId,
        portfolio.project_name,
        portfolio.start_date || null,
        portfolio.end_date || null,
        portfolio.is_ongoing || false,
        portfolio.participation_type || null,
        portfolio.roles
          ? Array.isArray(portfolio.roles)
            ? JSON.stringify(portfolio.roles)
            : portfolio.roles
          : null,
        portfolio.contribution_detail || null,
        portfolio.goal || null,
        portfolio.problem_definition || null,
        portfolio.result_summary || null,
        portfolio.tech_stack
          ? Array.isArray(portfolio.tech_stack)
            ? JSON.stringify(portfolio.tech_stack)
            : portfolio.tech_stack
          : null,
        portfolio.images
          ? Array.isArray(portfolio.images)
            ? JSON.stringify(portfolio.images)
            : portfolio.images
          : null,
        portfolio.github_link || null,
        portfolio.figma_link || null,
        portfolio.other_links
          ? Array.isArray(portfolio.other_links)
            ? JSON.stringify(portfolio.other_links)
            : portfolio.other_links
          : null,
        portfolio.certifications
          ? Array.isArray(portfolio.certifications)
            ? JSON.stringify(portfolio.certifications)
            : portfolio.certifications
          : null,
      ]);

      const placeholders = portfolios
        .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .join(", ");
      await pool.execute(
        `INSERT INTO portfolios (user_id, project_name, start_date, end_date, is_ongoing, participation_type, roles, contribution_detail, goal, problem_definition, result_summary, tech_stack, images, github_link, figma_link, other_links, certifications) VALUES ${placeholders}`,
        values.flat()
      );
    }

    res.json({
      success: true,
      message: "포트폴리오가 성공적으로 저장되었습니다",
    });
  })
);

// 포트폴리오 조회
router.get(
  "/portfolios",
  authenticateToken,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("인증이 필요합니다", 401);
    }

    const [portfolios] = await pool.execute(
      "SELECT id, project_name, start_date, end_date, is_ongoing, participation_type, roles, contribution_detail, goal, problem_definition, result_summary, tech_stack, images, github_link, figma_link, other_links, certifications, created_at, updated_at FROM portfolios WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    // JSON 필드들을 파싱
    const parsedPortfolios = (portfolios as any[]).map((portfolio: any) => {
      const parseField = (field: any): any => {
        if (!field) return [];
        try {
          return JSON.parse(field);
        } catch {
          return typeof field === "string"
            ? field
                .split(",")
                .map((s: string) => s.trim())
                .filter((s: string) => s)
            : [];
        }
      };

      return {
        ...portfolio,
        roles: parseField(portfolio.roles),
        tech_stack: parseField(portfolio.tech_stack),
        images: parseField(portfolio.images),
        other_links: parseField(portfolio.other_links),
        certifications: parseField(portfolio.certifications),
      };
    });

    res.json({
      success: true,
      data: { portfolios: parsedPortfolios },
    });
  })
);

export default router;

// 프로필 Big Five 기반 적합도 평가
router.post(
  "/profiles/:id/fit",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // 사용자 존재 체크
    const [users] = await pool.execute(
      "SELECT id, region, job_field, skills FROM users WHERE id = ?",
      [id]
    );
    if (!Array.isArray(users) || users.length === 0) {
      throw createError("사용자를 찾을 수 없습니다", 404);
    }
    const user = users[0] as any;

    // Big Five/Belbin 성향 조회
    const [traits] = await pool.execute(
      "SELECT category, trait FROM user_traits WHERE user_id = ?",
      [id]
    );
    const byCat: Record<string, string[]> = {};
    (traits as any[]).forEach((t) => {
      if (!byCat[t.category]) byCat[t.category] = [];
      byCat[t.category].push(t.trait);
    });

    const big5 = (byCat["big5"] || []) as string[];
    const skillsArray: string[] = user.skills
      ? String(user.skills)
          .split(",")
          .map((s: string) => s.trim())
      : [];

    // Big Five 점수 추출 헬퍼
    const hasHigh = (k: string) =>
      big5.some(
        (t) =>
          new RegExp(`${k}\\s*:\\s*High`, "i").test(t) ||
          new RegExp(`${k}\\s*높음`).test(t)
      );

    const conscientiousnessHigh =
      hasHigh("Conscientiousness") || hasHigh("성실성");
    const agreeablenessHigh = hasHigh("Agreeableness") || hasHigh("우호성");
    const extraversionHigh = hasHigh("Extraversion") || hasHigh("외향성");
    const opennessHigh = hasHigh("Openness") || hasHigh("개방성");
    const neuroticismHigh = hasHigh("Neuroticism") || hasHigh("신경성");

    // 가중치: 성실성(0.5), 우호성(0.3), 나머지(0.2 분배)
    const wCon = 0.5;
    const wAgr = 0.3;
    const wEtcEach = 0.2 / 3; // 외향성/개방성/정서안정(신경성 낮음)

    // 신경성은 낮음이 좋으므로 역가중치 처리: High면 0, 아니면 1로 간주
    const neuroticismGood = neuroticismHigh ? 0 : 1;

    let ratio = 0;
    ratio += conscientiousnessHigh ? wCon : wCon * 0.4; // 미기입/Low면 일부만
    ratio += agreeablenessHigh ? wAgr : wAgr * 0.4;
    ratio += (extraversionHigh ? 1 : 0.4) * wEtcEach;
    ratio += (opennessHigh ? 1 : 0.4) * wEtcEach;
    ratio += neuroticismGood * wEtcEach;

    // 스킬 기입 여부에 따른 소폭 보정
    if (skillsArray.length > 0) ratio = Math.min(1, ratio + 0.05);

    const score10 = Math.round(ratio * 100) / 10; // 0~10 한자리 소수

    let level: "excellent" | "good" | "fair" | "poor";
    if (score10 >= 8.5) level = "excellent";
    else if (score10 >= 7) level = "good";
    else if (score10 >= 5.5) level = "fair";
    else level = "poor";

    const reasons: string[] = [];
    if (conscientiousnessHigh)
      reasons.push("성실성 높음 → 일정 준수/품질 관리 기대");
    if (agreeablenessHigh) reasons.push("우호성 높음 → 협업/갈등 완화에 유리");
    if (extraversionHigh)
      reasons.push("외향성 높음 → 커뮤니케이션/리더십 기여 가능");
    if (opennessHigh) reasons.push("개방성 높음 → 아이디어/창의적 접근에 강점");
    if (!neuroticismHigh)
      reasons.push("정서 안정적 → 스트레스 상황에서 안정적 수행");
    if (reasons.length === 0)
      reasons.push("성향 데이터가 부족해 기본치를 적용했어요");

    res.json({
      success: true,
      data: {
        score: score10,
        level,
        reasons: reasons.slice(0, 5),
        signals: {
          conscientiousnessHigh,
          agreeablenessHigh,
          extraversionHigh,
          opennessHigh,
          neuroticismHigh,
        },
      },
    });
  })
);

// 특정 사용자가 속한 팀 목록 조회 (인증 불필요)
router.get(
  "/profiles/:id/teams",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // 사용자 존재 확인
    const [users] = await pool.execute("SELECT id FROM users WHERE id = ?", [
      id,
    ]);
    if (!Array.isArray(users) || users.length === 0) {
      throw createError("사용자를 찾을 수 없습니다", 404);
    }

    const [rows] = await pool.execute(
      `SELECT t.id, t.name, t.region, t.area, t.description, t.project_title, t.image_url,
              tm.role, tm.status, tm.joined_at
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = ? AND tm.status = 'accepted'
       ORDER BY tm.joined_at DESC`,
      [id]
    );

    res.json({ success: true, data: { teams: rows || [] } });
  })
);

// 특정 사용자(프로필 대상)에 대한 팀 리뷰 조회 (인증 불필요)
router.get(
  "/profiles/:id/reviews",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params; // 프로필 사용자 id

    // 사용자 존재 확인
    const [users] = await pool.execute("SELECT id FROM users WHERE id = ?", [
      id,
    ]);
    if (!Array.isArray(users) || users.length === 0) {
      throw createError("사용자를 찾을 수 없습니다", 404);
    }

    // 리뷰 테이블이 없을 수 있으니 best-effort 조회
    try {
      const [rows] = await pool.execute(
        `SELECT tr.id, tr.team_id as teamId, tr.member_id as memberId, tr.reviewer_user_id as reviewerUserId,
                tr.rating, tr.comment, tr.created_at as createdAt,
                t.name as teamName, u.name as reviewerName
         FROM team_reviews tr
         LEFT JOIN teams t ON t.id = tr.team_id
         LEFT JOIN users u ON u.id = tr.reviewer_user_id
         WHERE tr.member_id IN (
           SELECT tm.id FROM team_members tm WHERE tm.user_id = ?
         )
         ORDER BY tr.created_at DESC
        `,
        [id]
      );

      res.json({ success: true, data: { reviews: rows || [] } });
    } catch (e) {
      // 테이블 없음 등
      res.json({ success: true, data: { reviews: [] } });
    }
  })
);
