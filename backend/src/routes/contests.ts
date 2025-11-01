import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { validatePagination } from "../utils/validation";
import { asyncHandler, createError } from "../middleware/error";
import { Contest, CreateContestData } from "../types";

const router = Router();

// 공모전 목록 조회
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { page = "1", limit = "10", region, topic, skills } = req.query;
    const {
      page: pageNum,
      limit: limitNum,
      offset,
    } = validatePagination(page as string, limit as string);

    let whereClause = "";
    const params: any[] = [];
    const conditions: string[] = [];

    if (region) {
      conditions.push("region = ?");
      params.push(region);
    }

    if (topic) {
      conditions.push("topic = ?");
      params.push(topic);
    }

    // skills 필터링 추가 - 쉼표로 구분된 스킬들을 OR 조건으로 검색
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      const skillConditions = skillsArray.map(() => "required_skills LIKE ?");
      conditions.push(`(${skillConditions.join(" OR ")})`);
      skillsArray.forEach((skill) => {
        params.push(`%${String(skill)}%`);
      });
    }

    if (conditions.length > 0) {
      whereClause = "WHERE " + conditions.join(" AND ");
    }

    // 전체 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM contests ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, params);
    const total = (countResult as any[])[0].total;

    // 공모전 목록 조회 (관심 등록 여부 포함)
    const userId = req.user?.userId;

    let contestsQuery: string;
    let queryParams: any[];

    if (userId) {
      // 로그인된 사용자: 관심 등록 여부 포함
      contestsQuery = `SELECT c.id, c.title, c.topic, c.region, c.deadline, c.description, c.host, c.format, c.features, c.required_skills, c.team_composition, c.image_url, c.created_at, c.updated_at,
       f.id as favorite_id
       FROM contests c 
       LEFT JOIN favorites f ON c.id = f.contest_id AND f.user_id = ?
       ${whereClause} 
       ORDER BY c.created_at DESC 
       LIMIT ${limitNum} OFFSET ${offset}`;
      queryParams = [userId, ...params];
    } else {
      // 로그인하지 않은 사용자: 관심 등록 여부 없이 조회
      contestsQuery = `SELECT c.id, c.title, c.topic, c.region, c.deadline, c.description, c.host, c.format, c.features, c.required_skills, c.team_composition, c.image_url, c.created_at, c.updated_at,
       NULL as favorite_id
       FROM contests c 
       ${whereClause} 
       ORDER BY c.created_at DESC 
       LIMIT ${limitNum} OFFSET ${offset}`;
      queryParams = params;
    }

    const [contests] = await pool.execute(contestsQuery, queryParams);

    // 관심 등록 여부를 포함하여 포맷팅
    const formattedContests = (contests as any[]).map((contest: any) => {
      let deadlineStr: string | null = null;

      if (contest.deadline) {
        if (contest.deadline instanceof Date) {
          // Date 객체인 경우
          deadlineStr = contest.deadline.toISOString().split("T")[0];
        } else if (typeof contest.deadline === "string") {
          // 문자열인 경우 (이미 YYYY-MM-DD 형식이거나 다른 형식일 수 있음)
          const dateMatch = contest.deadline.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            deadlineStr = dateMatch[0]; // YYYY-MM-DD 부분만 추출
          } else {
            // 다른 형식의 문자열인 경우 Date로 파싱 시도
            const parsedDate = new Date(contest.deadline);
            if (!isNaN(parsedDate.getTime())) {
              deadlineStr = parsedDate.toISOString().split("T")[0];
            }
          }
        } else {
          // 기타 타입인 경우 문자열로 변환 후 처리
          const dateStr = String(contest.deadline);
          const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            deadlineStr = dateMatch[0];
          }
        }
      }

      return {
        ...contest,
        deadline: deadlineStr,
        is_favorited: !!contest.favorite_id,
        favorite_id: contest.favorite_id || null,
      };
    });

    res.json({
      success: true,
      data: { contests: formattedContests },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// 공모전 상세 조회
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    let contestQuery: string;
    let queryParams: any[];

    if (userId) {
      // 로그인된 사용자: 관심 등록 여부 포함
      contestQuery = `SELECT c.id, c.title, c.topic, c.region, c.deadline, c.description, c.host, c.format, c.features, c.required_skills, c.team_composition, c.image_url, c.created_at, c.updated_at,
       f.id as favorite_id
       FROM contests c 
       LEFT JOIN favorites f ON c.id = f.contest_id AND f.user_id = ?
       WHERE c.id = ?`;
      queryParams = [userId, id];
    } else {
      // 로그인하지 않은 사용자: 관심 등록 여부 없이 조회
      contestQuery = `SELECT c.id, c.title, c.topic, c.region, c.deadline, c.description, c.host, c.format, c.features, c.required_skills, c.team_composition, c.image_url, c.created_at, c.updated_at,
       NULL as favorite_id
       FROM contests c 
       WHERE c.id = ?`;
      queryParams = [id];
    }

    const [contests] = await pool.execute(contestQuery, queryParams);

    const contest = Array.isArray(contests) ? (contests[0] as any) : null;

    if (!contest) {
      throw createError("공모전을 찾을 수 없습니다", 404);
    }

    // 관심 등록 여부를 포함하여 포맷팅
    let deadlineStr: string | null = null;

    if (contest.deadline) {
      if (contest.deadline instanceof Date) {
        deadlineStr = contest.deadline.toISOString().split("T")[0];
      } else if (typeof contest.deadline === "string") {
        const dateMatch = contest.deadline.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          deadlineStr = dateMatch[0];
        } else {
          const parsedDate = new Date(contest.deadline);
          if (!isNaN(parsedDate.getTime())) {
            deadlineStr = parsedDate.toISOString().split("T")[0];
          }
        }
      } else {
        const dateStr = String(contest.deadline);
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          deadlineStr = dateMatch[0];
        }
      }
    }

    const formattedContest = {
      ...contest,
      deadline: deadlineStr,
      is_favorited: !!contest.favorite_id,
      favorite_id: contest.favorite_id || null,
    };

    // 공모전에 참가하는 팀 조회
    const [teams] = await pool.execute(
      `SELECT t.id, t.name, t.area, t.region, t.description, t.purpose, t.seeking_members, 
       t.current_team_composition, t.ideal_candidate, t.collaboration_style, t.max_members, 
       t.current_members, t.deadline, t.project_title, t.image_url 
       FROM teams t 
       WHERE t.area = (SELECT topic FROM contests WHERE id = ?) 
       OR t.region = (SELECT region FROM contests WHERE id = ?)`,
      [id, id]
    );

    // 팀 멤버 조회
    let members: any[] = [];
    if (teams && Array.isArray(teams) && teams.length > 0) {
      const teamIds = teams.map((team: any) => team.id);
      const [teamMembers] = await pool.execute(
        `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.status,
         u.name, u.school, u.major, u.job_field, u.skills, u.github_url, u.figma_url
         FROM team_members tm
         INNER JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id IN (${teamIds.map(() => "?").join(",")})
         AND tm.status = 'accepted'`,
        teamIds
      );
      members = teamMembers as any[];
    }

    res.json({
      success: true,
      data: {
        contest: formattedContest,
        teams: teams || [],
        members: members || [],
      },
    });
  })
);

// 공모전 생성 (관리자용)
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      topic,
      region,
      deadline,
      description,
      host,
      format,
      features,
    }: CreateContestData = req.body;

    if (!title) {
      throw createError("제목은 필수입니다", 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO contests (title, topic, region, deadline, description, host, format, features) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, topic, region, deadline, description, host, format, features]
    );

    const insertResult = result as any;
    const contestId = insertResult.insertId;

    // 생성된 공모전 정보 조회
    const [contests] = await pool.execute(
      "SELECT id, title, topic, region, deadline, description, host, format, features, image_url, created_at, updated_at FROM contests WHERE id = ?",
      [contestId]
    );

    const contest = Array.isArray(contests) ? (contests[0] as any) : null;

    res.status(201).json({
      success: true,
      data: { contest },
      message: "공모전이 생성되었습니다",
    });
  })
);

// 공모전 수정 (관리자용)
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      title,
      topic,
      region,
      deadline,
      description,
      host,
      format,
      features,
    }: CreateContestData = req.body;

    // 공모전 존재 확인
    const [existingContests] = await pool.execute(
      "SELECT id FROM contests WHERE id = ?",
      [id]
    );

    if (!Array.isArray(existingContests) || existingContests.length === 0) {
      throw createError("공모전을 찾을 수 없습니다", 404);
    }

    await pool.execute(
      `UPDATE contests 
     SET title = ?, topic = ?, region = ?, deadline = ?, description = ?, host = ?, format = ?, features = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
      [title, topic, region, deadline, description, host, format, features, id]
    );

    // 수정된 공모전 정보 조회
    const [contests] = await pool.execute(
      "SELECT id, title, topic, region, deadline, description, host, format, features, image_url, created_at, updated_at FROM contests WHERE id = ?",
      [id]
    );

    const contest = Array.isArray(contests) ? (contests[0] as any) : null;

    res.json({
      success: true,
      data: { contest },
      message: "공모전이 수정되었습니다",
    });
  })
);

// 공모전 삭제 (관리자용)
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // 공모전 존재 확인
    const [existingContests] = await pool.execute(
      "SELECT id FROM contests WHERE id = ?",
      [id]
    );

    if (!Array.isArray(existingContests) || existingContests.length === 0) {
      throw createError("공모전을 찾을 수 없습니다", 404);
    }

    await pool.execute("DELETE FROM contests WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "공모전이 삭제되었습니다",
    });
  })
);

// 공모전 추천 사용자 조회
router.get(
  "/:id/recommended-users",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // 공모전 정보 조회
    const [contests] = await pool.execute(
      "SELECT required_skills, topic, region FROM contests WHERE id = ?",
      [id]
    );

    const contest = Array.isArray(contests) ? (contests[0] as any) : null;

    if (!contest) {
      throw createError("공모전을 찾을 수 없습니다", 404);
    }

    // 추천 사용자 조회 (스킬, 지역, 분야 기반으로 추천)
    let recommendedUsers = [];

    if (contest.required_skills) {
      // 필요한 스킬이 있는 사용자들 조회
      const skills = contest.required_skills
        .split(",")
        .map((s: string) => s.trim());
      const skillConditions = skills.map(() => "skills LIKE ?").join(" OR ");
      const skillParams = skills.map((skill: string) => `%${skill}%`);

      const [usersWithSkills] = await pool.execute(
        `SELECT id, name, email, region, school, major, job_field, skills, 
               CASE 
                 WHEN region = ? THEN 3
                 WHEN job_field = ? THEN 2
                 ELSE 1
               END as match_score
         FROM users 
         WHERE (${skillConditions}) 
         ORDER BY match_score DESC, created_at DESC
         LIMIT 3`,
        [contest.region, contest.topic, ...skillParams]
      );

      recommendedUsers = usersWithSkills as any[];
    } else {
      // 스킬 정보가 없는 경우 지역과 분야 기반으로 추천
      const [usersByRegion] = await pool.execute(
        `SELECT id, name, email, region, school, major, job_field, skills,
               CASE 
                 WHEN region = ? THEN 2
                 ELSE 1
               END as match_score
         FROM users 
         WHERE region = ? OR job_field = ?
         ORDER BY match_score DESC, created_at DESC
         LIMIT 3`,
        [contest.region, contest.region, contest.topic]
      );

      recommendedUsers = usersByRegion as any[];
    }

    // 사용자 정보 포맷팅
    const formattedUsers = recommendedUsers.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      region: user.region,
      school: user.school,
      major: user.major,
      job_field: user.job_field,
      skills: user.skills
        ? user.skills.split(",").map((s: string) => s.trim())
        : [],
      match_score: user.match_score || 1,
    }));

    res.json({
      success: true,
      data: {
        recommendedUsers: formattedUsers,
        contest: {
          id,
          topic: contest.topic,
          region: contest.region,
          required_skills: contest.required_skills,
        },
      },
    });
  })
);

export default router;
