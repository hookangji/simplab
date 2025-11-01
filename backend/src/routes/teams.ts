import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { validatePagination } from "../utils/validation";
import { asyncHandler, createError } from "../middleware/error";
import { authenticateToken } from "../middleware/auth";
import { Team, CreateTeamData, TeamMember } from "../types";
import { randomUUID } from "crypto";

const router = Router();

// 팀 목록 조회
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "10",
      region,
      area,
      teamSize,
      recruitmentStatus,
      deadlineStatus,
      traits,
    } = req.query;
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

    if (area) {
      conditions.push("area = ?");
      params.push(area);
    }

    // 팀 규모 필터링
    if (teamSize) {
      switch (teamSize) {
        case "2-3":
          conditions.push("max_members BETWEEN 2 AND 3");
          break;
        case "4-5":
          conditions.push("max_members BETWEEN 4 AND 5");
          break;
        case "6-8":
          conditions.push("max_members BETWEEN 6 AND 8");
          break;
        case "9+":
          conditions.push("max_members >= 9");
          break;
      }
    }

    // 모집 상태 필터링
    if (recruitmentStatus) {
      switch (recruitmentStatus) {
        case "recruiting":
          conditions.push("current_members < max_members");
          break;
        case "almost-full":
          conditions.push(
            "current_members >= max_members - 1 AND current_members < max_members"
          );
          break;
        case "urgent":
          conditions.push("current_members < max_members - 2");
          break;
      }
    }

    // 마감일 상태 필터링
    if (deadlineStatus) {
      const now = new Date();
      switch (deadlineStatus) {
        case "week":
          const oneWeekLater = new Date(
            now.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          conditions.push("deadline IS NOT NULL AND deadline <= ?");
          params.push(oneWeekLater.toISOString().split("T")[0]);
          break;
        case "month":
          const oneMonthLater = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          );
          conditions.push("deadline IS NOT NULL AND deadline <= ?");
          params.push(oneMonthLater.toISOString().split("T")[0]);
          break;
        case "over-month":
          const oneMonthLaterForOver = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          );
          conditions.push("deadline IS NOT NULL AND deadline > ?");
          params.push(oneMonthLaterForOver.toISOString().split("T")[0]);
          break;
        case "no-deadline":
          conditions.push("deadline IS NULL");
          break;
      }
    }

    // 성향 기반 필터링
    let traitJoinClause = "";
    let traitWhereClause = "";
    if (traits) {
      const traitsArray = Array.isArray(traits) ? traits : [traits];
      if (traitsArray.length > 0) {
        // 팀의 멤버 중에 해당 성향을 가진 사람이 있는 팀만 필터링
        const traitConditions = traitsArray.map(() => "ut.trait = ?");
        traitJoinClause = `
          INNER JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'accepted'
          INNER JOIN user_traits ut ON tm.user_id = ut.user_id
        `;
        traitWhereClause = ` AND (${traitConditions.join(" OR ")})`;
        params.push(...traitsArray);
      }
    }

    if (conditions.length > 0) {
      whereClause = "WHERE " + conditions.join(" AND ");
    }

    // 전체 개수 조회
    const countQuery = `SELECT COUNT(DISTINCT t.id) as total 
     FROM teams t ${traitJoinClause} 
     ${whereClause} ${traitWhereClause}`;
    const [countResult] = await pool.execute(countQuery, params);
    const total = (countResult as any[])[0].total;

    // 팀 목록 조회
    const teamsQuery = `SELECT DISTINCT t.id, t.name, t.region, t.area, t.description, t.purpose, t.seeking_members, t.current_team_composition, t.ideal_candidate, t.collaboration_style, t.collaboration_tools, t.max_members, t.current_members, t.deadline, t.project_title, t.image_url, t.created_by, t.created_at, t.updated_at 
     FROM teams t ${traitJoinClause} 
     ${whereClause} ${traitWhereClause} 
     ORDER BY t.created_at DESC 
     LIMIT ${limitNum} OFFSET ${offset}`;
    const [teams] = await pool.execute(teamsQuery, params);

    res.json({
      success: true,
      data: { teams },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// 사용자가 속한 팀 목록 조회 (채팅용)
router.get(
  "/my-teams",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 사용자가 속한 팀 목록 조회
    const [teams] = await pool.execute(
      `SELECT t.id, t.name, t.description, t.current_members, t.max_members, t.created_at, t.updated_at
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = ? AND tm.status = 'accepted'
       ORDER BY t.updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { teams: teams || [] },
    });
  })
);

// 사용자가 만든 팀 목록 조회 (팀 관리용)
router.get(
  "/my-created-teams",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 사용자가 만든 팀 목록 조회
    const [teams] = await pool.execute(
      `SELECT id, name, region, area, description, purpose, seeking_members, current_team_composition, ideal_candidate, collaboration_style, max_members, current_members, deadline, project_title, image_url, created_by, created_at, updated_at
       FROM teams
       WHERE created_by = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { teams: teams || [] },
    });
  })
);

// 팀 상세 조회
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // 팀 정보 조회
    const [teams] = await pool.execute(
      "SELECT id, name, region, area, description, purpose, seeking_members, current_team_composition, ideal_candidate, collaboration_style, collaboration_tools, max_members, current_members, deadline, project_title, image_url, area_keywords, progress_stage, meeting_schedule, available_time_slots, created_by, created_at, updated_at FROM teams WHERE id = ?",
      [id]
    );

    const team = Array.isArray(teams) ? (teams[0] as any) : null;

    if (!team) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    // 팀 멤버 조회
    const [members] = await pool.execute(
      `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.status, tm.joined_at, 
            u.name, u.email, u.job_field, u.skills
     FROM team_members tm 
     JOIN users u ON tm.user_id = u.id 
     WHERE tm.team_id = ?`,
      [id]
    );

    // 팀이 연관된 공모전 조회
    const [teamContests] = await pool.execute(
      `SELECT c.id, c.title, c.topic, c.region, c.deadline, c.description, c.features, c.image_url
       FROM team_contests tc
       JOIN contests c ON tc.contest_id = c.id
       WHERE tc.team_id = ?
       ORDER BY c.deadline IS NULL, c.deadline ASC`,
      [id]
    );

    // 팀 프로젝트 조회
    const [teamProjects] = await pool.execute(
      `SELECT id, team_id, project_name, start_date, end_date, is_ongoing, summary, tech_stack, result_link, performance_indicators, images, created_at, updated_at
       FROM team_projects
       WHERE team_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    // JSON 파싱
    const projects = Array.isArray(teamProjects)
      ? teamProjects.map((p: any) => ({
          ...p,
          tech_stack: p.tech_stack ? JSON.parse(p.tech_stack) : [],
          images: p.images ? JSON.parse(p.images) : [],
        }))
      : [];

    res.json({
      success: true,
      data: {
        team,
        members: members || [],
        contests: teamContests || [],
        projects: projects || [],
      },
    });
  })
);

// 팀 생성
router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    const {
      name,
      region,
      area,
      description,
      max_members = 6,
      deadline,
      project_title,
      collaboration_style,
      collaboration_tools,
    }: CreateTeamData = req.body;

    if (!name) {
      throw createError("팀명은 필수입니다", 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO teams (name, region, area, description, max_members, current_members, deadline, project_title, collaboration_style, collaboration_tools, created_by) 
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
      [
        name,
        region,
        area,
        description,
        max_members,
        deadline,
        project_title,
        collaboration_style,
        collaboration_tools,
        userId,
      ]
    );

    const insertResult = result as any;
    const teamId = insertResult.insertId;

    // 팀장을 멤버로 추가
    await pool.execute(
      "INSERT INTO team_members (team_id, user_id, role, status) VALUES (?, ?, ?, ?)",
      [teamId, userId, "팀장", "accepted"]
    );

    // 생성된 팀 정보 조회
    const [teams] = await pool.execute(
      "SELECT id, name, region, area, description, max_members, current_members, deadline, project_title, image_url, created_by, created_at, updated_at FROM teams WHERE id = ?",
      [teamId]
    );

    const team = Array.isArray(teams) ? (teams[0] as any) : null;

    res.status(201).json({
      success: true,
      data: { team },
      message: "팀이 생성되었습니다",
    });
  })
);

// 팀 수정
router.put(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    const {
      name,
      region,
      area,
      description,
      max_members,
      deadline,
      project_title,
      collaboration_style,
      collaboration_tools,
      area_keywords,
      progress_stage,
      meeting_schedule,
      available_time_slots,
    }: CreateTeamData & {
      area_keywords?: string;
      progress_stage?: string;
      meeting_schedule?: string;
      available_time_slots?: string;
    } = req.body;

    // 팀 존재 확인 및 권한 확인
    const [existingTeams] = await pool.execute(
      "SELECT id, created_by FROM teams WHERE id = ?",
      [id]
    );

    const existingTeam = Array.isArray(existingTeams)
      ? (existingTeams[0] as any)
      : null;

    if (!existingTeam) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    if (existingTeam.created_by !== userId) {
      throw createError("팀 수정 권한이 없습니다", 403);
    }

    // undefined 값을 null로 변환
    await pool.execute(
      `UPDATE teams 
     SET name = ?, region = ?, area = ?, description = ?, max_members = ?, deadline = ?, project_title = ?, collaboration_style = ?, collaboration_tools = ?, area_keywords = ?, progress_stage = ?, meeting_schedule = ?, available_time_slots = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
      [
        name ?? null,
        region ?? null,
        area ?? null,
        description ?? null,
        max_members ?? null,
        deadline ?? null,
        project_title ?? null,
        collaboration_style ?? null,
        collaboration_tools ?? null,
        area_keywords ?? null,
        progress_stage ?? null,
        meeting_schedule ?? null,
        available_time_slots ?? null,
        id,
      ]
    );

    // 수정된 팀 정보 조회
    const [teams] = await pool.execute(
      "SELECT id, name, region, area, description, max_members, current_members, deadline, project_title, image_url, area_keywords, progress_stage, meeting_schedule, available_time_slots, created_by, created_at, updated_at FROM teams WHERE id = ?",
      [id]
    );

    const team = Array.isArray(teams) ? (teams[0] as any) : null;

    res.json({
      success: true,
      data: { team },
      message: "팀이 수정되었습니다",
    });
  })
);

// 팀 삭제
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 팀 존재 확인 및 권한 확인
    const [existingTeams] = await pool.execute(
      "SELECT id, created_by FROM teams WHERE id = ?",
      [id]
    );

    const existingTeam = Array.isArray(existingTeams)
      ? (existingTeams[0] as any)
      : null;

    if (!existingTeam) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    if (existingTeam.created_by !== userId) {
      throw createError("팀 삭제 권한이 없습니다", 403);
    }

    await pool.execute("DELETE FROM teams WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "팀이 삭제되었습니다",
    });
  })
);

// 팀 가입 신청
router.post(
  "/:id/join",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 팀 존재 확인
    const [existingTeams] = await pool.execute(
      "SELECT id, max_members, current_members FROM teams WHERE id = ?",
      [id]
    );

    const existingTeam = Array.isArray(existingTeams)
      ? (existingTeams[0] as any)
      : null;

    if (!existingTeam) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    if (existingTeam.current_members >= existingTeam.max_members) {
      throw createError("팀 정원이 가득 찼습니다", 400);
    }

    // 이미 가입 신청했는지 확인
    const [existingMembers] = await pool.execute(
      "SELECT id FROM team_members WHERE team_id = ? AND user_id = ?",
      [id, userId]
    );

    if (Array.isArray(existingMembers) && existingMembers.length > 0) {
      throw createError("이미 가입 신청한 팀입니다", 400);
    }

    // 가입 신청
    await pool.execute(
      "INSERT INTO team_members (team_id, user_id, status) VALUES (?, ?, ?)",
      [id, userId, "pending"]
    );

    res.json({
      success: true,
      message: "팀 가입 신청이 완료되었습니다",
    });
  })
);

// 팀 가입 승인/거절
router.put(
  "/:id/members/:memberId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, memberId } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    if (!["accepted", "rejected"].includes(status)) {
      throw createError("유효하지 않은 상태입니다", 400);
    }

    // 팀 권한 확인
    const [existingTeams] = await pool.execute(
      "SELECT id, created_by FROM teams WHERE id = ?",
      [id]
    );

    const existingTeam = Array.isArray(existingTeams)
      ? (existingTeams[0] as any)
      : null;

    if (!existingTeam) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    if (existingTeam.created_by !== userId) {
      throw createError("팀 관리 권한이 없습니다", 403);
    }

    // 멤버 존재 확인
    const [existingMembers] = await pool.execute(
      "SELECT id, status FROM team_members WHERE id = ? AND team_id = ?",
      [memberId, id]
    );

    const existingMember = Array.isArray(existingMembers)
      ? (existingMembers[0] as any)
      : null;

    if (!existingMember) {
      throw createError("멤버를 찾을 수 없습니다", 404);
    }

    if (existingMember.status !== "pending") {
      throw createError("이미 처리된 신청입니다", 400);
    }

    // 상태 업데이트
    await pool.execute("UPDATE team_members SET status = ? WHERE id = ?", [
      status,
      memberId,
    ]);

    // 승인된 경우 현재 멤버 수 증가
    if (status === "accepted") {
      await pool.execute(
        "UPDATE teams SET current_members = current_members + 1 WHERE id = ?",
        [id]
      );
    }

    res.json({
      success: true,
      message:
        status === "accepted"
          ? "팀 가입을 승인했습니다"
          : "팀 가입을 거절했습니다",
    });
  })
);

// 팀원 삭제
router.delete(
  "/:id/members/:memberId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, memberId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 팀 권한 확인
    const [existingTeams] = await pool.execute(
      "SELECT id, created_by FROM teams WHERE id = ?",
      [id]
    );

    const existingTeam = Array.isArray(existingTeams)
      ? (existingTeams[0] as any)
      : null;

    if (!existingTeam) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    if (existingTeam.created_by !== userId) {
      throw createError("팀 관리 권한이 없습니다", 403);
    }

    // 멤버 존재 확인
    const [existingMembers] = await pool.execute(
      "SELECT id, status FROM team_members WHERE id = ? AND team_id = ?",
      [memberId, id]
    );

    const existingMember = Array.isArray(existingMembers)
      ? (existingMembers[0] as any)
      : null;

    if (!existingMember) {
      throw createError("멤버를 찾을 수 없습니다", 404);
    }

    // 팀원 삭제 (accepted 상태인 경우에만 current_members 감소)
    if (existingMember.status === "accepted") {
      await pool.execute(
        "UPDATE teams SET current_members = GREATEST(0, current_members - 1) WHERE id = ?",
        [id]
      );
    }

    // 멤버 삭제
    await pool.execute("DELETE FROM team_members WHERE id = ?", [memberId]);

    res.json({
      success: true,
      message: "팀원이 제거되었습니다",
    });
  })
);

export default router;

// 팀 추천: 가중치 기반 스코어링 모델
router.post(
  "/:id/recommendations",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      requiredJobField,
      requiredSkills = [],
      desiredBelbinRoles = [],
      emphasizeConscientiousness = true,
      emphasizeAgreeableness = true,
      limit = 5,
    } = req.body || {};

    // 팀 존재 확인 및 현재 팀 멤버 조회
    const [teams] = await pool.execute(
      "SELECT id, name, region, area, description, purpose, seeking_members, current_team_composition, ideal_candidate, collaboration_style, collaboration_tools, max_members, current_members, deadline, project_title, image_url, created_by, created_at, updated_at FROM teams WHERE id = ?",
      [id]
    );
    const team = Array.isArray(teams) ? (teams[0] as any) : null;
    if (!team) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    const [memberRows] = await pool.execute(
      "SELECT user_id FROM team_members WHERE team_id = ?",
      [id]
    );
    const existingUserIds = (memberRows as any[]).map((m) => m.user_id);

    // 팀 멤버의 성향(특히 Belbin 역할) 분포 조회
    let teamRoleCounts: Record<string, number> = {};
    if (existingUserIds.length > 0) {
      const placeholders = existingUserIds.map(() => "?").join(", ");
      const [teamTraits] = await pool.execute(
        `SELECT user_id, category, trait FROM user_traits WHERE user_id IN (${placeholders})`,
        existingUserIds
      );
      (teamTraits as any[]).forEach((t) => {
        if (t.category === "belbin") {
          teamRoleCounts[t.trait] = (teamRoleCounts[t.trait] || 0) + 1;
        }
      });
    }

    // 보편적인 Belbin 역할 목록
    const belbinRoles = [
      "Plant",
      "Implementer",
      "Completer Finisher",
      "Coordinator",
      "Shaper",
      "Resource Investigator",
      "Teamworker",
      "Monitor Evaluator",
      "Specialist",
    ];

    // 결핍 역할(0명) 우선 + Plant가 과도하면 실행/완결 가중
    const missingRoles = belbinRoles.filter(
      (r) => (teamRoleCounts[r] || 0) === 0
    );
    const plantCount = teamRoleCounts["Plant"] || 0;
    const defaultDesiredRoles =
      missingRoles.length > 0
        ? missingRoles
        : ["Implementer", "Completer Finisher"]; // 기본 보완 역할
    const targetRoles: string[] =
      desiredBelbinRoles.length > 0 ? desiredBelbinRoles : defaultDesiredRoles;

    // 후보 사용자 1차 집합: 팀 미소속 + 직무(옵션)
    const exclusionPlaceholders = existingUserIds.length
      ? existingUserIds.map(() => "?").join(", ")
      : "''"; // 비어있으면 dummy

    let candidatesQuery = `SELECT id, name, email, region, school, major, job_field, skills FROM users WHERE id NOT IN (${exclusionPlaceholders})`;
    const candidatesParams: any[] = existingUserIds.length
      ? [...existingUserIds]
      : [];
    if (requiredJobField) {
      candidatesQuery += " AND job_field = ?";
      candidatesParams.push(requiredJobField);
    }

    // 후보 조회
    const [candidateUsers] = await pool.execute(
      candidatesQuery,
      candidatesParams
    );
    const candidateList = candidateUsers as any[] as any[];

    if (candidateList.length === 0) {
      return res.json({ success: true, data: { recommendations: [] } });
    }

    // 후보들의 성향 일괄 조회
    const candidateIds = candidateList.map((u) => u.id);
    const candPlaceholders = candidateIds.map(() => "?").join(", ");
    const [candidateTraits] = await pool.execute(
      `SELECT user_id, category, trait FROM user_traits WHERE user_id IN (${candPlaceholders})`,
      candidateIds
    );
    const userIdToTraits: Record<string, { [category: string]: string[] }> = {};
    (candidateTraits as any[]).forEach((row) => {
      if (!userIdToTraits[row.user_id]) userIdToTraits[row.user_id] = {};
      if (!userIdToTraits[row.user_id][row.category])
        userIdToTraits[row.user_id][row.category] = [];
      userIdToTraits[row.user_id][row.category].push(row.trait);
    });

    // 스코어링 파라미터
    const W_SKILL = 0.35;
    const W_BELBIN = 0.4 + (plantCount >= 2 ? 0.05 : 0); // Plant 많으면 실행/완결을 살짝 더 반영
    const W_BIG5 = 0.25 - (plantCount >= 2 ? 0.05 : 0);

    const normalize = (value: number, max: number) =>
      max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

    const recommendations = candidateList
      .map((user) => {
        const skillsArray: string[] = user.skills
          ? String(user.skills)
              .split(",")
              .map((s: string) => s.trim().toLowerCase())
          : [];
        const requiredSkillsLower = (requiredSkills as string[]).map((s) =>
          String(s).toLowerCase()
        );

        // 하드 필터: 필수 스킬 중 최소 1개 이상 매칭(요청에 필수스킬이 있는 경우)
        if (requiredSkillsLower.length > 0) {
          const hasAnyRequired = requiredSkillsLower.some((rs) =>
            skillsArray.includes(rs)
          );
          if (!hasAnyRequired) return null;
        }

        const traitsByCat = userIdToTraits[user.id] || {};
        const belbinTraits = (traitsByCat["belbin"] || []) as string[];
        const big5Traits = (traitsByCat["big5"] || []) as string[]; // 예: Conscientiousness:High, Agreeableness:High

        // 스킬 점수: 일치 개수 비율 (요구 스킬 미지정 시 기본치 부여)
        const matchedSkillCount = requiredSkillsLower.filter((rs) =>
          skillsArray.includes(rs)
        ).length;
        let skillScore = normalize(
          matchedSkillCount,
          Math.max(1, requiredSkillsLower.length)
        );
        if (requiredSkillsLower.length === 0) {
          // 요구 스킬이 비어있으면 스킬 기입 유무로 기본 점수
          skillScore = skillsArray.length > 0 ? 0.3 : 0.1;
        }

        // Belbin 점수: 목표 역할 보유 + 팀에 없는 역할 보유
        const hasTargetRoles = targetRoles.filter((r) =>
          belbinTraits.includes(r)
        ).length;
        const missingRoleHits = belbinRoles.filter(
          (r) => (teamRoleCounts[r] || 0) === 0 && belbinTraits.includes(r)
        ).length;
        const belbinRaw = hasTargetRoles + missingRoleHits; // 0~(targetRoles.length + 결핍롤수)
        let belbinScore = normalize(
          belbinRaw,
          Math.max(
            1,
            targetRoles.length +
              belbinRoles.filter((r) => (teamRoleCounts[r] || 0) === 0).length
          )
        );
        if (belbinTraits.length === 0) {
          // Belbin 정보가 없을 때는 결핍 역할 유무에 따라 소폭 기본치
          belbinScore = missingRoleHits > 0 ? 0.15 : 0.1;
        }

        // Big5 점수: 성실성/우호성 강조
        let big5Raw = 0;
        const big5Max =
          (emphasizeConscientiousness ? 1 : 0) +
            (emphasizeAgreeableness ? 1 : 0) || 1;
        if (emphasizeConscientiousness) {
          if (
            big5Traits.some(
              (t) =>
                /Conscientiousness\s*:\s*High/i.test(t) ||
                /성실성\s*:\s*높음/.test(t)
            )
          )
            big5Raw += 1;
        }
        if (emphasizeAgreeableness) {
          if (
            big5Traits.some(
              (t) =>
                /Agreeableness\s*:\s*High/i.test(t) ||
                /우호성\s*:\s*높음/.test(t)
            )
          )
            big5Raw += 1;
        }
        let big5Score = normalize(big5Raw, big5Max);
        if (big5Max > 0 && big5Traits.length === 0) {
          // Big5 정보가 없으면 작은 기본치
          big5Score = 0.1;
        }

        // 지역/직무 보너스 (소폭)
        let bonus = 0;
        if (user.region && team.region && user.region === team.region)
          bonus += 0.05;
        if (requiredJobField && user.job_field === requiredJobField)
          bonus += 0.05;

        // 종합 스코어 0~100 (보너스 적용)
        const totalRatio = Math.max(
          0,
          Math.min(
            1,
            W_SKILL * skillScore +
              W_BELBIN * belbinScore +
              W_BIG5 * big5Score +
              bonus
          )
        );
        const totalScore = Math.round(totalRatio * 10000) / 100; // 2자리

        // 이유 요약
        const reasons: string[] = [];
        if (matchedSkillCount > 0)
          reasons.push(`요구 스킬과 ${matchedSkillCount}개 일치`);
        if (missingRoleHits > 0)
          reasons.push(`팀에 부족한 역할(${missingRoleHits}개) 보유`);
        if (hasTargetRoles > 0)
          reasons.push(`우선 역할(${targetRoles.join(", ")}) 적합`);
        if (big5Raw > 0) reasons.push(`성향(Big5) 우수: ${big5Raw}/${big5Max}`);
        if (bonus > 0) {
          const bonusTags: string[] = [];
          if (user.region && team.region && user.region === team.region)
            bonusTags.push("동일 지역");
          if (requiredJobField && user.job_field === requiredJobField)
            bonusTags.push("직무 일치");
          if (bonusTags.length)
            reasons.push(`추가 가점: ${bonusTags.join(", ")}`);
        }
        if (belbinTraits.length === 0 || big5Traits.length === 0) {
          reasons.push("프로필 일부 항목 미기입 시 기본 가중치 적용");
        }

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            region: user.region,
            job_field: user.job_field,
            skills: skillsArray,
          },
          score: totalScore,
          breakdown: {
            skillScore: Math.round(skillScore * 10000) / 100,
            belbinScore: Math.round(belbinScore * 10000) / 100,
            big5Score: Math.round(big5Score * 10000) / 100,
            weights: { W_SKILL, W_BELBIN, W_BIG5 },
          },
          reasons,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, Math.max(1, Math.min(20, Number(limit) || 5)));

    res.json({
      success: true,
      data: {
        team: { id: team.id, name: team.name },
        parameters: {
          requiredJobField: requiredJobField || null,
          requiredSkills,
          targetRoles,
          emphasizeConscientiousness,
          emphasizeAgreeableness,
        },
        recommendations,
      },
    });
  })
);

// 팀 프로젝트 목록 조회
router.get(
  "/:id/projects",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const [projects] = await pool.execute(
      `SELECT id, team_id, project_name, start_date, end_date, is_ongoing, summary, tech_stack, result_link, performance_indicators, images, created_at, updated_at 
       FROM team_projects 
       WHERE team_id = ? 
       ORDER BY created_at DESC`,
      [id]
    );

    // tech_stack, images를 JSON 파싱
    const parsedProjects = Array.isArray(projects)
      ? (projects as any[]).map((project) => {
          try {
            return {
              ...project,
              tech_stack: project.tech_stack ? JSON.parse(project.tech_stack) : [],
              images: project.images ? JSON.parse(project.images) : [],
            };
          } catch {
            return {
              ...project,
              tech_stack: project.tech_stack ? project.tech_stack.split(",") : [],
              images: project.images ? project.images.split(",") : [],
            };
          }
        })
      : [];

    res.json({
      success: true,
      data: { projects: parsedProjects },
    });
  })
);

// 팀 프로젝트 생성
router.post(
  "/:id/projects",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 팀 권한 확인
    const [existingTeams] = await pool.execute(
      "SELECT id, created_by FROM teams WHERE id = ?",
      [id]
    );

    const existingTeam = Array.isArray(existingTeams)
      ? (existingTeams[0] as any)
      : null;

    if (!existingTeam) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    if (existingTeam.created_by !== userId) {
      throw createError("프로젝트 등록 권한이 없습니다", 403);
    }

    const {
      project_name,
      start_date,
      end_date,
      is_ongoing,
      summary,
      tech_stack,
      result_link,
      performance_indicators,
      images,
    } = req.body;

    if (!project_name) {
      throw createError("프로젝트명은 필수입니다", 400);
    }

    const techStackStr = Array.isArray(tech_stack)
      ? JSON.stringify(tech_stack)
      : tech_stack || null;
    const imagesStr = Array.isArray(images)
      ? JSON.stringify(images)
      : images || null;

    // UUID 생성
    const projectId = randomUUID();

    await pool.execute(
      `INSERT INTO team_projects (id, team_id, project_name, start_date, end_date, is_ongoing, summary, tech_stack, result_link, performance_indicators, images) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        id,
        project_name,
        start_date,
        end_date,
        is_ongoing || false,
        summary,
        techStackStr,
        result_link,
        performance_indicators,
        imagesStr,
      ]
    );

    // 생성된 프로젝트 조회
    const [projects] = await pool.execute(
      "SELECT id, team_id, project_name, start_date, end_date, is_ongoing, summary, tech_stack, result_link, performance_indicators, images, created_at, updated_at FROM team_projects WHERE id = ?",
      [projectId]
    );

    const project = Array.isArray(projects) ? (projects[0] as any) : null;

    if (project) {
      try {
        project.tech_stack = project.tech_stack ? JSON.parse(project.tech_stack) : [];
        project.images = project.images ? JSON.parse(project.images) : [];
      } catch {
        project.tech_stack = project.tech_stack ? project.tech_stack.split(",") : [];
        project.images = project.images ? project.images.split(",") : [];
      }
    }

    res.status(201).json({
      success: true,
      data: { project },
      message: "프로젝트가 생성되었습니다",
    });
  })
);

// 팀 프로젝트 수정
router.put(
  "/:id/projects/:projectId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, projectId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 팀 권한 확인
    const [existingTeams] = await pool.execute(
      "SELECT id, created_by FROM teams WHERE id = ?",
      [id]
    );

    const existingTeam = Array.isArray(existingTeams)
      ? (existingTeams[0] as any)
      : null;

    if (!existingTeam) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    if (existingTeam.created_by !== userId) {
      throw createError("프로젝트 수정 권한이 없습니다", 403);
    }

    const {
      project_name,
      start_date,
      end_date,
      is_ongoing,
      summary,
      tech_stack,
      result_link,
      performance_indicators,
      images,
    } = req.body;

    const techStackStr = Array.isArray(tech_stack)
      ? JSON.stringify(tech_stack)
      : tech_stack || null;
    const imagesStr = Array.isArray(images)
      ? JSON.stringify(images)
      : images || null;

    await pool.execute(
      `UPDATE team_projects 
       SET project_name = ?, start_date = ?, end_date = ?, is_ongoing = ?, summary = ?, tech_stack = ?, result_link = ?, performance_indicators = ?, images = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND team_id = ?`,
      [
        project_name,
        start_date,
        end_date,
        is_ongoing,
        summary,
        techStackStr,
        result_link,
        performance_indicators,
        imagesStr,
        projectId,
        id,
      ]
    );

    // 수정된 프로젝트 조회
    const [projects] = await pool.execute(
      "SELECT id, team_id, project_name, start_date, end_date, is_ongoing, summary, tech_stack, result_link, performance_indicators, images, created_at, updated_at FROM team_projects WHERE id = ?",
      [projectId]
    );

    const project = Array.isArray(projects) ? (projects[0] as any) : null;

    if (project) {
      try {
        project.tech_stack = project.tech_stack ? JSON.parse(project.tech_stack) : [];
        project.images = project.images ? JSON.parse(project.images) : [];
      } catch {
        project.tech_stack = project.tech_stack ? project.tech_stack.split(",") : [];
        project.images = project.images ? project.images.split(",") : [];
      }
    }

    res.json({
      success: true,
      data: { project },
      message: "프로젝트가 수정되었습니다",
    });
  })
);

// 팀 프로젝트 삭제
router.delete(
  "/:id/projects/:projectId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, projectId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 팀 권한 확인
    const [existingTeams] = await pool.execute(
      "SELECT id, created_by FROM teams WHERE id = ?",
      [id]
    );

    const existingTeam = Array.isArray(existingTeams)
      ? (existingTeams[0] as any)
      : null;

    if (!existingTeam) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }

    if (existingTeam.created_by !== userId) {
      throw createError("프로젝트 삭제 권한이 없습니다", 403);
    }

    await pool.execute("DELETE FROM team_projects WHERE id = ? AND team_id = ?", [
      projectId,
      id,
    ]);

    res.json({
      success: true,
      message: "프로젝트가 삭제되었습니다",
    });
  })
);

// 프로젝트 완료 및 팀원 리뷰 저장 (팀장만)
router.post(
  "/:id/reviews",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const {
      reviews,
    }: {
      reviews: Array<{ memberId: string; rating: number; comment?: string }>;
    } = req.body || {};

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      throw createError("리뷰 데이터가 올바르지 않습니다", 400);
    }

    // 팀 존재 및 권한 확인
    const [teams] = await pool.execute(
      "SELECT id, created_by FROM teams WHERE id = ?",
      [id]
    );
    const team = Array.isArray(teams) ? (teams[0] as any) : null;
    if (!team) {
      throw createError("팀을 찾을 수 없습니다", 404);
    }
    if (team.created_by !== userId) {
      throw createError("프로젝트 완료/리뷰 권한이 없습니다", 403);
    }

    // 팀 멤버 확인 (accepted만 대상)
    const [members] = await pool.execute(
      "SELECT id FROM team_members WHERE team_id = ? AND status = 'accepted'",
      [id]
    );
    const validMemberIds = new Set((members as any[]).map((m) => m.id));

    // 리뷰 테이블 생성(idempotent)
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS team_reviews (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        team_id VARCHAR(36) NOT NULL,
        member_id VARCHAR(36) NOT NULL,
        reviewer_user_id VARCHAR(36) NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_team_reviews_team_id (team_id)
      )`
    );

    // 배치 인서트
    const now = new Date();
    const rows: any[] = [];
    for (const r of reviews) {
      if (!r || typeof r.memberId !== "string" || typeof r.rating !== "number")
        continue;
      if (!validMemberIds.has(r.memberId)) continue;
      const rating = Math.max(1, Math.min(5, Math.round(r.rating)));
      rows.push([id, r.memberId, userId, rating, r.comment || null, now]);
    }

    if (rows.length === 0) {
      throw createError("저장할 리뷰가 없습니다", 400);
    }

    const placeholders = rows.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
    await pool.execute(
      `INSERT INTO team_reviews (team_id, member_id, reviewer_user_id, rating, comment, created_at) VALUES ${placeholders}`,
      rows.flat()
    );

    res.json({ success: true, message: "리뷰가 저장되었습니다" });
  })
);
