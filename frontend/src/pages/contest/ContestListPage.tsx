import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import Container from "../../shared/ui/Container";
import ContestFilter, {
  type FilterOptions,
} from "../../widgets/contest/ContestFilter";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { apiGet, apiPost, apiDelete } from "@/shared/api";
import { useAuth } from "@/contexts/AuthContext";

type Contest = {
  id: string;
  title: string;
  topic?: string | null;
  region?: string | null;
  deadline?: string | null;
  image_url?: string | null;
  is_favorited?: boolean;
  favorite_id?: string | null;
};

type ContestResponse = {
  success: boolean;
  data: { contests: Contest[] };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const ContestCard = ({
  c,
  onFavoriteToggle,
}: {
  c: Contest;
  onFavoriteToggle: (
    contestId: string,
    isFavorited: boolean,
    favoriteId?: string | null
  ) => Promise<void>;
}) => {
  const { user } = useAuth();
  // 서버에서 받은 초기값을 직접 사용 (상태로 관리하지 않음)
  const isFavorited = c.is_favorited ?? false;
  const favoriteId = c.favorite_id ?? null;
  const [isLoading, setIsLoading] = useState(false);

  // 마감일 계산 함수
  const getDeadlineDisplay = (
    deadline: string | null
  ): { text: string; className: string } => {
    if (!deadline) {
      return { text: "마감 미정", className: "text-slate-500" };
    }

    try {
      // YYYY-MM-DD 형식의 날짜 문자열을 직접 파싱
      const dateParts = deadline.split("-");
      if (dateParts.length !== 3) {
        console.error("날짜 형식 오류:", deadline);
        return { text: "마감 미정", className: "text-slate-500" };
      }

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.error("날짜 파싱 오류:", deadline, { year, month, day });
        return { text: "마감 미정", className: "text-slate-500" };
      }

      const today = new Date();
      // 오늘 날짜를 자정으로 설정
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      // 마감일을 자정으로 설정
      const deadlineStart = new Date(year, month - 1, day);

      // 유효한 날짜인지 확인
      if (isNaN(deadlineStart.getTime())) {
        console.error("유효하지 않은 날짜:", deadline);
        return { text: "마감 미정", className: "text-slate-500" };
      }

      // 날짜 차이 계산 (밀리초)
      const diffTime = deadlineStart.getTime() - todayStart.getTime();
      // 일수로 변환
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // 디버깅 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === "development") {
        console.log("날짜 계산:", {
          deadline,
          deadlineDate: deadlineStart.toISOString().split("T")[0],
          todayDate: todayStart.toISOString().split("T")[0],
          diffDays,
        });
      }

      if (diffDays < 0) {
        // 마감됨
        return { text: "마감됨", className: "text-red-600 font-medium" };
      } else if (diffDays === 0) {
        // 오늘이 마감일
        return { text: "D-Day", className: "text-orange-600 font-medium" };
      } else {
        // 남은 일수
        return { text: `D-${diffDays}`, className: "text-slate-700" };
      }
    } catch (error) {
      console.error("날짜 계산 오류:", error, deadline);
      return { text: "마감 미정", className: "text-slate-500" };
    }
  };

  const deadlineDisplay = getDeadlineDisplay(c.deadline);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      await onFavoriteToggle(c.id, isFavorited, favoriteId);
      // 상태는 부모 컴포넌트에서 업데이트되고, useEffect를 통해 동기화됨
    } catch (error) {
      console.error("관심 등록/해제 실패:", error);
      alert("관심 등록/해제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      to={`/contests/${c.id}`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300"
    >
      <div className="aspect-[3/4] w-full bg-white flex items-center justify-center">
        {c.image_url ? (
          <img
            src={c.image_url}
            alt={c.title}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-slate-200" />
        )}
      </div>
      <div className="p-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold">{c.title}</div>
          <div className="text-xs text-slate-600">
            {c.topic ?? "-"} · {c.region ?? "-"}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className={deadlineDisplay.className}>
            {deadlineDisplay.text}
          </div>
          <button
            type="button"
            disabled={isLoading}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              isFavorited
                ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-slate-300 text-slate-800 hover:border-slate-400"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handleFavoriteClick}
          >
            {isFavorited ? "저장됨" : "저장"}
          </button>
        </div>
      </div>
    </Link>
  );
};

const ContestListPage = () => {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    region: "",
    topic: "",
    skills: [],
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastContestElementRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  const handleFavoriteToggle = useCallback(
    async (
      contestId: string,
      isFavorited: boolean,
      favoriteId?: string | null
    ) => {
      if (!user) {
        throw new Error("로그인이 필요합니다");
      }

      if (isFavorited && favoriteId) {
        // 관심 해제
        await apiDelete(`/api/favorites/${favoriteId}`);
        // 로컬 상태 업데이트
        setContests((prev) =>
          prev.map((contest) =>
            contest.id === contestId
              ? { ...contest, is_favorited: false, favorite_id: null }
              : contest
          )
        );
      } else {
        // 관심 추가
        const response = await apiPost<{
          success: boolean;
          data: { favorite: { id: string } };
        }>("/api/favorites", { contest_id: contestId });

        const newFavoriteId = response.data.favorite?.id;
        // 로컬 상태 업데이트
        setContests((prev) =>
          prev.map((contest) =>
            contest.id === contestId
              ? {
                  ...contest,
                  is_favorited: true,
                  favorite_id: newFavoriteId || null,
                }
              : contest
          )
        );
      }
    },
    [user]
  );

  const buildQueryString = useCallback(
    (pageNum: number, currentFilters: FilterOptions) => {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "8",
      });

      if (currentFilters.region) {
        params.append("region", currentFilters.region);
      }
      if (currentFilters.topic) {
        params.append("topic", currentFilters.topic);
      }
      if (currentFilters.skills.length > 0) {
        currentFilters.skills.forEach((skill) => {
          params.append("skills", skill);
        });
      }

      return params.toString();
    },
    []
  );

  const loadContests = useCallback(
    async (pageNum: number, append = false) => {
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      setLoading(true);
      try {
        const queryString = buildQueryString(pageNum, filters);
        const response = await apiGet<ContestResponse>(
          `/api/contests?${queryString}`
        );
        const newContests = response.data.contests.map((contest: Contest) => ({
          ...contest,
          // deadline이 Date 객체인 경우 문자열로 변환
          deadline: contest.deadline
            ? typeof contest.deadline === "string"
              ? contest.deadline
              : new Date(contest.deadline as any).toISOString().split("T")[0]
            : null,
        }));

        if (append) {
          setContests((prev) => [...prev, ...newContests]);
        } else {
          setContests(newContests);
        }

        setHasMore(pageNum < response.pagination.totalPages);
        setCurrentPage(pageNum);
      } catch (error) {
        console.error("공모전 목록을 불러오는데 실패했습니다:", error);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [filters, buildQueryString, user]
  );

  useEffect(() => {
    loadContests(1, false);
  }, [loadContests]);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    // 필터 변경 시 첫 페이지부터 다시 로드
    setCurrentPage(1);
    setContests([]);
    setHasMore(true);
  }, []);

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    if (currentPage === 1) {
      loadContests(1, false);
    }
  }, [filters, loadContests, currentPage]);

  const lastContestElementCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingRef.current || !hasMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
          const nextPage = currentPage + 1;
          loadContests(nextPage, true);
        }
      });

      if (node) observerRef.current.observe(node);
      lastContestElementRef.current = node;
    },
    [hasMore, currentPage, loadContests]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <Container className="py-10">
        <div className="flex flex-col gap-8">
          {/* 상단 필터 바 */}
          <div className="w-full">
            <ContestFilter
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4">공모전/대회</h1>

              {(filters.region ||
                filters.topic ||
                filters.skills.length > 0) && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">적용된 필터:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.region && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          📍 {filters.region}
                        </span>
                      )}
                      {filters.topic && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          🎯 {filters.topic}
                        </span>
                      )}
                      {filters.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                        >
                          💪 {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {contests.map((c, index) => {
                if (contests.length === index + 1) {
                  return (
                    <div key={c.id} ref={lastContestElementCallback}>
                      <ContestCard
                        c={c}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    </div>
                  );
                }
                return (
                  <ContestCard
                    key={c.id}
                    c={c}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                );
              })}
            </div>

            {loading && (
              <div className="mt-8 text-center text-slate-500">
                공모전을 더 불러오는 중...
              </div>
            )}

            {!hasMore && contests.length > 0 && (
              <div className="mt-8 text-center text-slate-500">
                모든 공모전을 불러왔습니다.
              </div>
            )}

            {contests.length === 0 && !loading && (
              <div className="mt-8 text-center text-slate-500">
                공모전이 없습니다.
              </div>
            )}
          </div>
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default ContestListPage;
