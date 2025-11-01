import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { asyncHandler, createError } from "../middleware/error";
import { validatePagination } from "../utils/validation";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// 메시지 목록 조회 (직접 메시지)
router.get(
  "/direct",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { page = "1", limit = "20" } = req.query;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    const {
      page: pageNum,
      limit: limitNum,
      offset,
    } = validatePagination(page as string, limit as string);

    // 직접 메시지 대화 목록 조회 (최신 메시지 및 안읽음 카운트 포함)
    // 먼저 대화 상대 목록을 가져옴
    const [conversationsRaw] = await pool.execute(
      `SELECT DISTINCT
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id
      FROM messages m
      WHERE (m.sender_id = ? OR m.receiver_id = ?) 
        AND m.message_type = 'direct'`,
      [userId, userId, userId]
    );

    const conversationList = [];
    if (Array.isArray(conversationsRaw)) {
      const seenUserIds = new Set();

      for (const row of conversationsRaw) {
        const otherUserId = (row as any).other_user_id;

        // 중복 제거
        if (seenUserIds.has(otherUserId)) continue;
        seenUserIds.add(otherUserId);

        // 사용자 정보 조회
        const [userRows] = await pool.execute(
          `SELECT id, name, email FROM users WHERE id = ?`,
          [otherUserId]
        );

        const otherUser =
          Array.isArray(userRows) && userRows.length > 0
            ? (userRows[0] as any)
            : null;

        if (!otherUser) continue;

        // 최신 메시지 조회
        const [latestMessages] = await pool.execute(
          `SELECT m.content, m.created_at, m.is_read
           FROM messages m
           WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
             AND m.message_type = 'direct'
           ORDER BY m.created_at DESC
           LIMIT 1`,
          [userId, otherUserId, otherUserId, userId]
        );

        const latest =
          Array.isArray(latestMessages) && latestMessages.length > 0
            ? (latestMessages[0] as any)
            : null;

        // 안읽음 카운트 조회
        const [unreadCount] = await pool.execute(
          `SELECT COUNT(*) as count
           FROM messages m
           WHERE m.receiver_id = ?
             AND m.sender_id = ?
             AND m.message_type = 'direct'
             AND (m.is_read IS NULL OR m.is_read = FALSE)`,
          [userId, otherUserId]
        );

        const unread =
          Array.isArray(unreadCount) && unreadCount.length > 0
            ? (unreadCount[0] as any).count
            : 0;

        conversationList.push({
          other_user_id: otherUserId,
          other_user_name: otherUser.name,
          other_user_email: otherUser.email,
          last_message: latest?.content || "",
          last_message_at: latest?.created_at || new Date().toISOString(),
          last_message_read: latest?.is_read || false,
          unread_count: unread,
        });
      }

      // 최신 메시지 시간순 정렬
      conversationList.sort((a, b) => {
        const timeA = new Date(a.last_message_at).getTime();
        const timeB = new Date(b.last_message_at).getTime();
        return timeB - timeA;
      });
    }

    const uniqueConversations = conversationList;

    res.json({
      success: true,
      data: { messages: uniqueConversations },
      pagination: {
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

// 특정 사용자와의 메시지 조회
router.get(
  "/direct/:userId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user?.userId;
    const { userId: otherUserId } = req.params;
    const { page = "1", limit = "50" } = req.query;

    if (!currentUserId) {
      throw createError("로그인이 필요합니다", 401);
    }

    const {
      page: pageNum,
      limit: limitNum,
      offset,
    } = validatePagination(page as string, limit as string);

    // 메시지 조회 (읽음 상태 포함)
    const [messages] = await pool.execute(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at, m.is_read, m.read_at,
            s.name as sender_name, r.name as receiver_name
     FROM messages m
     JOIN users s ON m.sender_id = s.id
     JOIN users r ON m.receiver_id = r.id
     WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
       AND m.message_type = 'direct'
     ORDER BY m.created_at DESC
     LIMIT 50`,
      [currentUserId, otherUserId, otherUserId, currentUserId]
    );

    // 받은 메시지들을 읽음 처리
    if (Array.isArray(messages)) {
      const unreadMessages = messages.filter(
        (msg: any) => msg.receiver_id === currentUserId && !msg.is_read
      );

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((msg: any) => msg.id);
        await pool.execute(
          `UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE id IN (${messageIds
            .map(() => "?")
            .join(",")})`,
          messageIds
        );
      }
    }

    res.json({
      success: true,
      data: { messages: (Array.isArray(messages) ? messages : []).reverse() }, // 오래된 순으로 정렬
      pagination: {
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

// 직접 메시지 전송
router.post(
  "/direct",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const senderId = req.user?.userId;
    const { receiver_id, content } = req.body;

    if (!senderId) {
      throw createError("로그인이 필요합니다", 401);
    }

    if (!receiver_id || !content) {
      throw createError("받는 사람과 메시지 내용이 필요합니다", 400);
    }

    if (senderId === receiver_id) {
      throw createError("자기 자신에게 메시지를 보낼 수 없습니다", 400);
    }

    // 받는 사람 존재 확인
    const [users] = await pool.execute("SELECT id FROM users WHERE id = ?", [
      receiver_id,
    ]);

    if (!Array.isArray(users) || users.length === 0) {
      throw createError("받는 사람을 찾을 수 없습니다", 404);
    }

    // 메시지 저장
    const [result] = await pool.execute(
      "INSERT INTO messages (sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?)",
      [senderId, receiver_id, content, "direct"]
    );

    const insertResult = result as any;
    const messageId = insertResult.insertId;

    // 저장된 메시지 조회
    const [messages] = await pool.execute(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at,
            s.name as sender_name, r.name as receiver_name
     FROM messages m
     JOIN users s ON m.sender_id = s.id
     JOIN users r ON m.receiver_id = r.id
     WHERE m.id = ?`,
      [messageId]
    );

    const message = Array.isArray(messages) ? (messages[0] as any) : null;

    res.status(201).json({
      success: true,
      data: { message },
      message: "메시지가 전송되었습니다",
    });
  })
);

// 팀 메시지 목록 조회
router.get(
  "/team/:teamId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { teamId } = req.params;
    const { page = "1", limit = "50" } = req.query;

    if (!userId) {
      throw createError("로그인이 필요합니다", 401);
    }

    // 팀 멤버 권한 확인
    const [members] = await pool.execute(
      "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?",
      [teamId, userId, "accepted"]
    );

    if (!Array.isArray(members) || members.length === 0) {
      throw createError("팀 멤버가 아닙니다", 403);
    }

    const {
      page: pageNum,
      limit: limitNum,
      offset,
    } = validatePagination(page as string, limit as string);

    // 팀 메시지 조회 (간단한 버전)
    const [messages] = await pool.execute(
      `SELECT m.id, m.sender_id, m.content, m.created_at,
            u.name as sender_name
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.team_id = ? AND m.message_type = 'team'
     ORDER BY m.created_at DESC
     LIMIT 50`,
      [teamId]
    );

    res.json({
      success: true,
      data: { messages: (Array.isArray(messages) ? messages : []).reverse() }, // 오래된 순으로 정렬
      pagination: {
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

// 팀 메시지 전송
router.post(
  "/team/:teamId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const senderId = req.user?.userId;
    const { teamId } = req.params;
    const { content } = req.body;

    if (!senderId) {
      throw createError("로그인이 필요합니다", 401);
    }

    if (!content) {
      throw createError("메시지 내용이 필요합니다", 400);
    }

    // 팀 멤버 권한 확인
    const [members] = await pool.execute(
      "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?",
      [teamId, senderId, "accepted"]
    );

    if (!Array.isArray(members) || members.length === 0) {
      throw createError("팀 멤버가 아닙니다", 403);
    }

    // 메시지 저장
    const [result] = await pool.execute(
      "INSERT INTO messages (sender_id, team_id, content, message_type) VALUES (?, ?, ?, ?)",
      [senderId, teamId, content, "team"]
    );

    const insertResult = result as any;
    const messageId = insertResult.insertId;

    // 저장된 메시지 조회
    const [messages] = await pool.execute(
      `SELECT m.id, m.sender_id, m.content, m.created_at,
            u.name as sender_name
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.id = ?`,
      [messageId]
    );

    const message = Array.isArray(messages) ? (messages[0] as any) : null;

    res.status(201).json({
      success: true,
      data: { message },
      message: "메시지가 전송되었습니다",
    });
  })
);

// 찔러보기 (nudge) - 공모전 참가 제안
router.post(
  "/nudge",
  asyncHandler(async (req: Request, res: Response) => {
    const senderId = req.user?.userId;
    const { toUserId, contestId, message } = req.body;

    if (!senderId) {
      throw createError("로그인이 필요합니다", 401);
    }

    if (!toUserId) {
      throw createError("받는 사용자 ID가 필요합니다", 400);
    }

    if (!contestId) {
      throw createError("공모전 ID가 필요합니다", 400);
    }

    // 수신자가 존재하는지 확인
    const [users] = await pool.execute(
      "SELECT id, name FROM users WHERE id = ?",
      [toUserId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      throw createError("받는 사용자를 찾을 수 없습니다", 404);
    }

    // 공모전이 존재하는지 확인
    const [contests] = await pool.execute(
      "SELECT id, title FROM contests WHERE id = ?",
      [contestId]
    );

    if (!Array.isArray(contests) || contests.length === 0) {
      throw createError("공모전을 찾을 수 없습니다", 404);
    }

    // 자신에게는 보낼 수 없음
    if (senderId === toUserId) {
      throw createError("자신에게는 메시지를 보낼 수 없습니다", 400);
    }

    // 기본 메시지 설정
    const defaultMessage =
      message ||
      `안녕하세요! ${contests[0].title} 공모전에 함께 참가해보시겠어요?`;

    // 찔러보기 메시지 저장 (message_type을 'direct'로 설정)
    const [result] = await pool.execute(
      "INSERT INTO messages (sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?)",
      [senderId, toUserId, defaultMessage, "direct"]
    );

    const insertResult = result as any;
    const messageId = insertResult.insertId;

    res.status(201).json({
      success: true,
      data: { messageId },
      message: "찔러보기를 보냈습니다",
    });
  })
);

export default router;
