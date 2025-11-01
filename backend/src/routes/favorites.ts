import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { asyncHandler, createError } from "../middleware/error";

const router = Router();

// 관심사 목록 조회
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 관심 공모전 조회
    const [contestFavorites] = await pool.execute(
      `SELECT f.id, f.contest_id, f.created_at, 
            c.title, c.topic, c.region, c.deadline, c.host
     FROM favorites f 
     JOIN contests c ON f.contest_id = c.id 
     WHERE f.user_id = ? AND f.contest_id IS NOT NULL 
     ORDER BY f.created_at DESC`,
      [userId]
    );

    // 관심 팀 조회
    const [teamFavorites] = await pool.execute(
      `SELECT f.id, f.team_id, f.created_at, 
            t.name, t.region, t.area, t.project_title, t.current_members, t.max_members
     FROM favorites f 
     JOIN teams t ON f.team_id = t.id 
     WHERE f.user_id = ? AND f.team_id IS NOT NULL 
     ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        contests: contestFavorites || [],
        teams: teamFavorites || [],
      },
    });
  })
);

// 관심사 추가
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { contest_id, team_id } = req.body;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    if (!contest_id && !team_id) {
      throw createError("공모전 ID 또는 팀 ID가 필요합니다", 400);
    }

    if (contest_id && team_id) {
      throw createError("공모전과 팀 중 하나만 선택할 수 있습니다", 400);
    }

    // 이미 관심사로 등록되어 있는지 확인
    let existingFavorite;
    if (contest_id) {
      const [favorites] = await pool.execute(
        "SELECT id FROM favorites WHERE user_id = ? AND contest_id = ?",
        [userId, contest_id]
      );
      existingFavorite = Array.isArray(favorites) ? favorites[0] : null;
    } else {
      const [favorites] = await pool.execute(
        "SELECT id FROM favorites WHERE user_id = ? AND team_id = ?",
        [userId, team_id]
      );
      existingFavorite = Array.isArray(favorites) ? favorites[0] : null;
    }

    let favoriteId: string | null = null;

    if (existingFavorite) {
      // 이미 등록된 경우 기존 ID 반환
      favoriteId = (existingFavorite as any).id;
      res.json({
        success: true,
        message: "이미 관심사로 등록되어 있습니다",
        data: {
          favorite: {
            id: favoriteId,
          },
        },
      });
      return;
    }

    // 관심사 추가
    await pool.execute(
      "INSERT INTO favorites (user_id, contest_id, team_id) VALUES (?, ?, ?)",
      [userId, contest_id || null, team_id || null]
    );

    // 생성된 관심사 ID 조회
    const [createdFavorites] = await pool.execute(
      `SELECT id FROM favorites 
       WHERE user_id = ? AND ${contest_id ? "contest_id" : "team_id"} = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, contest_id || team_id]
    );

    favoriteId = Array.isArray(createdFavorites) && createdFavorites[0] 
      ? (createdFavorites[0] as any).id 
      : null;

    res.json({
      success: true,
      message: "관심사에 추가되었습니다",
      data: {
        favorite: favoriteId ? {
          id: favoriteId,
        } : undefined,
      },
    });
  })
);

// 관심사 제거
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 관심사 존재 확인
    const [favorites] = await pool.execute(
      "SELECT id FROM favorites WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (!Array.isArray(favorites) || favorites.length === 0) {
      throw createError("관심사를 찾을 수 없습니다", 404);
    }

    // 관심사 제거
    await pool.execute("DELETE FROM favorites WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    res.json({
      success: true,
      message: "관심사에서 제거되었습니다",
    });
  })
);

export default router;
