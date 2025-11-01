import { useEffect, useState, useRef } from "react";
import Container from "../../shared/ui/Container";
import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import { apiGet, apiPost } from "../../shared/api";
import { useAuth } from "../../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  receiver_name: string;
  message_type?: string;
  is_read?: boolean;
  read_at?: string;
}

interface DirectConversation {
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  last_message: string;
  last_message_at: string;
  last_message_read?: boolean;
  unread_count?: number;
}

interface Team {
  id: string;
  name: string;
  description: string;
  current_members: number;
  max_members: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

interface TeamMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

type CategoryType = "all" | "team" | "direct";

const MessengerPage = () => {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<CategoryType>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1대1 채팅 관련 상태
  const [directConversations, setDirectConversations] = useState<
    DirectConversation[]
  >([]);
  const [activeDirectUserId, setActiveDirectUserId] = useState<string | null>(
    null
  );
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  // 팀 채팅 관련 상태
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);

  // 공통 상태
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 메시지 스크롤 최하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [directMessages, teamMessages]);

  // 1대1 채팅 목록 로드
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const data = await apiGet<{ data: { messages: DirectConversation[] } }>(
          `/api/messages/direct`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDirectConversations(data.data.messages);

        // URL 파라미터에서 특정 사용자 ID가 있으면 해당 사용자와의 채팅을 열기
        const targetUserId = searchParams.get("user");
        if (targetUserId) {
          setActiveDirectUserId(targetUserId);
        } else if (data.data.messages.length > 0 && category !== "team") {
          setActiveDirectUserId(data.data.messages[0].other_user_id);
        }
      } catch (error) {
        console.error("1대1 채팅 목록 로드 실패:", error);
      }
    })();
  }, [user, token, searchParams]);

  // 팀 목록 로드
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const data = await apiGet<{ data: { teams: Team[] } }>(
          `/api/teams/my-teams`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTeams(data.data.teams);
        if (data.data.teams.length > 0 && category !== "direct") {
          setActiveTeamId(data.data.teams[0].id);
        }
      } catch (error) {
        console.error("팀 목록 로드 실패:", error);
      }
    })();
  }, [user, token]);

  // 1대1 채팅 메시지 로드
  useEffect(() => {
    if (!activeDirectUserId || !token) return;
    (async () => {
      try {
        const data = await apiGet<{ data: { messages: DirectMessage[] } }>(
          `/api/messages/direct/${activeDirectUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDirectMessages(data.data.messages);
      } catch (error) {
        console.error("1대1 메시지 로드 실패:", error);
      }
    })();
  }, [activeDirectUserId, token]);

  // 팀 채팅 메시지 로드
  useEffect(() => {
    if (!activeTeamId || !token) return;
    (async () => {
      try {
        const data = await apiGet<{ data: { messages: TeamMessage[] } }>(
          `/api/messages/team/${activeTeamId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTeamMessages(data.data.messages);
      } catch (error) {
        console.error("팀 메시지 로드 실패:", error);
      }
    })();
  }, [activeTeamId, token]);

  const sendDirectMessage = async () => {
    if (!user || !token || !activeDirectUserId || !input.trim()) return;
    setLoading(true);
    try {
      const data = await apiPost<{ data: { message: DirectMessage } }>(
        `/api/messages/direct`,
        {
          receiver_id: activeDirectUserId,
          content: input,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDirectMessages((prev) => [...prev, data.data.message]);
      setInput("");
    } finally {
      setLoading(false);
    }
  };

  const sendTeamMessage = async () => {
    if (!user || !token || !activeTeamId || !input.trim()) return;
    setLoading(true);
    try {
      const data = await apiPost<{ data: { message: TeamMessage } }>(
        `/api/messages/team/${activeTeamId}`,
        {
          content: input,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTeamMessages((prev) => [...prev, data.data.message]);
      setInput("");
    } finally {
      setLoading(false);
    }
  };

  // 시간 포맷팅 (상대적 시간)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  // 채팅 목록 필터링
  const getFilteredConversations = () => {
    if (category === "direct") {
      return directConversations;
    } else if (category === "team") {
      return [];
    } else {
      // 전체: 1대1과 팀 모두 표시
      return directConversations;
    }
  };

  const getFilteredTeams = () => {
    if (category === "team" || category === "all") {
      return teams;
    }
    return [];
  };

  // 총 안읽음 카운트 계산
  const totalUnreadCount =
    directConversations.reduce(
      (sum, conv) => sum + (conv.unread_count || 0),
      0
    ) + 0; // 팀 메시지 안읽음 카운트는 추후 추가

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* 좌측 패널 - 채팅 목록 */}
          <aside className="lg:col-span-1 space-y-4">
            {/* 카테고리 탭 */}
            <div className="flex space-x-1 rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setCategory("all")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors relative ${
                  category === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                전체
                {category === "all" && totalUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCategory("team")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  category === "team"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                팀
              </button>
              <button
                onClick={() => setCategory("direct")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors relative ${
                  category === "direct"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1:1
                {category === "direct" && totalUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* 채팅 목록 */}
            <div className="divide-y rounded-lg border border-slate-200 max-h-[70vh] overflow-y-auto">
              {/* 1대1 채팅 목록 */}
              {(category === "all" || category === "direct") &&
                getFilteredConversations().map((conversation) => {
                  const selected =
                    conversation.other_user_id === activeDirectUserId;
                  return (
                    <button
                      key={conversation.other_user_id}
                      onClick={() => {
                        setActiveDirectUserId(conversation.other_user_id);
                        setCategory("direct");
                      }}
                      className={`w-full text-left px-4 py-3 relative flex items-start gap-3 ${
                        selected ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* 프로필 이미지 */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                          {conversation.other_user_name.charAt(0)}
                        </div>
                      </div>

                      {/* 메시지 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {conversation.other_user_name}
                          </div>
                          {conversation.unread_count &&
                            conversation.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
                                {conversation.unread_count}
                              </span>
                            )}
                        </div>
                        <div
                          className={`text-xs truncate mb-1 ${
                            conversation.unread_count &&
                            conversation.unread_count > 0
                              ? "text-slate-900 font-medium"
                              : "text-slate-500"
                          }`}
                        >
                          {conversation.last_message}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatTime(conversation.last_message_at)}
                        </div>
                      </div>
                    </button>
                  );
                })}

              {/* 팀 채팅 목록 */}
              {(category === "all" || category === "team") &&
                getFilteredTeams().map((team) => {
                  const selected = team.id === activeTeamId;
                  return (
                    <button
                      key={team.id}
                      onClick={() => {
                        setActiveTeamId(team.id);
                        setCategory("team");
                      }}
                      className={`w-full text-left px-4 py-3 relative flex items-start gap-3 ${
                        selected ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* 팀 이미지 */}
                      <div className="flex-shrink-0">
                        {team.image_url ? (
                          <img
                            src={team.image_url}
                            alt={team.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                            {team.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* 팀 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate mb-1">
                          {team.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {team.current_members}/{team.max_members}명
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatTime(team.updated_at)}
                        </div>
                      </div>
                    </button>
                  );
                })}

              {/* 빈 상태 메시지 */}
              {((category === "all" &&
                directConversations.length === 0 &&
                teams.length === 0) ||
                (category === "direct" && directConversations.length === 0) ||
                (category === "team" && teams.length === 0)) && (
                <div className="px-4 py-6 text-sm text-slate-500 text-center">
                  {category === "direct"
                    ? "1대1 대화가 없습니다."
                    : category === "team"
                    ? "참여한 팀이 없습니다."
                    : "채팅이 없습니다."}
                </div>
              )}
            </div>
          </aside>

          {/* 우측 메인 패널 - 대화 내역 */}
          <main className="lg:col-span-4">
            <div className="flex flex-col h-[70vh] rounded-lg border border-slate-200">
              {/* 채팅 영역 */}
              <div className="flex-1 p-4 overflow-y-auto">
                {(category === "all" || category === "direct") &&
                activeDirectUserId &&
                directMessages.length > 0 ? (
                  // 1대1 채팅 메시지
                  directMessages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;

                    return (
                      <div
                        key={message.id}
                        className={`mb-4 flex ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[70%] ${
                            isOwnMessage ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {/* 프로필 이미지 (받은 메시지만) */}
                          {!isOwnMessage && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs flex-shrink-0">
                              {message.sender_name.charAt(0)}
                            </div>
                          )}

                          {/* 메시지 버블 */}
                          <div className="flex flex-col">
                            {!isOwnMessage && (
                              <div className="text-xs text-slate-500 mb-1 px-1">
                                {message.sender_name}
                              </div>
                            )}
                            <div
                              className={`rounded-lg px-4 py-2 text-sm ${
                                isOwnMessage
                                  ? "bg-slate-900 text-white"
                                  : "bg-slate-100 text-slate-900"
                              }`}
                            >
                              {message.content}
                            </div>
                            <div
                              className={`text-xs text-slate-400 mt-1 px-1 flex items-center gap-1 ${
                                isOwnMessage ? "justify-end" : "justify-start"
                              }`}
                            >
                              {formatTime(message.created_at)}
                              {isOwnMessage && message.is_read && (
                                <span className="text-green-500">✓ 읽음</span>
                              )}
                              {isOwnMessage && !message.is_read && (
                                <span className="text-slate-400">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (category === "all" || category === "team") &&
                  activeTeamId &&
                  teamMessages.length > 0 ? (
                  // 팀 채팅 메시지
                  teamMessages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;

                    return (
                      <div key={message.id} className="mb-4 flex justify-start">
                        <div className="flex items-end gap-2 max-w-[70%] flex-row">
                          {/* 프로필 이미지 */}
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs flex-shrink-0">
                            {message.sender_name.charAt(0)}
                          </div>

                          {/* 메시지 버블 */}
                          <div className="flex flex-col">
                            <div className="text-xs text-slate-500 mb-1 px-1">
                              {message.sender_name}
                            </div>
                            <div className="rounded-lg px-4 py-2 text-sm bg-slate-100 text-slate-900">
                              {message.content}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 px-1">
                              {formatTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full grid place-items-center text-slate-500 text-sm">
                    메시지가 없습니다.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 하단 입력 영역 */}
              <div className="border-t border-slate-200 p-4">
                <div className="flex gap-2 items-end">
                  {/* 파일 첨부 버튼 */}
                  <button
                    className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                    title="파일 첨부"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </button>

                  {/* 텍스트 입력창 */}
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="메시지를 입력하세요"
                    className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (category === "direct" || activeDirectUserId) {
                          sendDirectMessage();
                        } else if (category === "team" || activeTeamId) {
                          sendTeamMessage();
                        }
                      }
                    }}
                  />

                  {/* 전송 버튼 */}
                  <button
                    onClick={
                      category === "direct" || activeDirectUserId
                        ? sendDirectMessage
                        : sendTeamMessage
                    }
                    disabled={
                      loading ||
                      !input.trim() ||
                      (category === "direct" || activeDirectUserId
                        ? !activeDirectUserId
                        : !activeTeamId)
                    }
                    className="rounded-md bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    전송
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default MessengerPage;
