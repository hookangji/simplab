import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Container from "../../shared/ui/Container";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet } from "../../shared/api";

type DirectConversation = {
  unread_count?: number;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 읽지 않은 메시지 개수 로드
  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const data = await apiGet<{ data: { messages: DirectConversation[] } }>(
          "/api/messages/direct"
        );
        const totalUnread = data.data.messages.reduce(
          (sum: number, conv: DirectConversation) => {
            const unread =
              typeof conv.unread_count === "number" ? conv.unread_count : 0;
            return sum + unread;
          },
          0
        );
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("읽지 않은 메시지 개수 로드 실패:", error);
      }
    };

    loadUnreadCount();

    // 30초마다 업데이트
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-50 glass">
      <Container className="flex items-center justify-between py-4">
        <Link
          to="/"
          className="font-bold text-xl tracking-tight gradient-text hover:opacity-80 transition-opacity"
        >
          TeamUp
        </Link>

        <ul className="hidden items-center gap-8 text-sm md:flex">
          <li>
            <Link
              to="/team"
              className="font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200 relative group"
            >
              팀
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </li>
          <li>
            <Link
              to="/contests"
              className="font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200 relative group"
            >
              공모전/대회
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </li>
        </ul>

        {/* 데스크톱 버튼들 */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/messenger"
                className="btn btn-animate btn-primary text-sm relative"
              >
                💬 메신저
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/mypage"
                className="btn btn-animate btn-outline text-sm"
              >
                👤 {user.name}
              </Link>
              <button
                onClick={logout}
                className="btn btn-animate btn-ghost text-sm border border-slate-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-animate btn-primary text-sm">
              로그인
            </Link>
          )}
        </div>

        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </Container>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass">
          <div className="px-6 py-4 space-y-4">
            <Link
              to="/team"
              className="block py-2 text-slate-700 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              팀
            </Link>
            <Link
              to="/contests"
              className="block py-2 text-slate-700 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              공모전/대회
            </Link>

            {user ? (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <Link
                  to="/messenger"
                  className="block w-full text-center py-3 btn btn-primary relative"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  💬 메신저
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/mypage"
                  className="block w-full text-center py-3 btn btn-outline"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  👤 {user.name}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-center py-3 btn btn-ghost border border-slate-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200">
                <Link
                  to="/login"
                  className="block w-full text-center py-3 btn btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
