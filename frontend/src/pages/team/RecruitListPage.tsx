import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "@/shared/api";
import { useAuth } from "../../contexts/AuthContext";
import Container from "../../shared/ui/Container";
import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import TeamFilter, {
  type TeamFilterOptions,
} from "../../widgets/team/TeamFilter";

type Team = {
  id: string;
  name: string;
  region?: string | null;
  area?: string | null;
  description?: string | null;
  purpose?: string | null;
  seeking_members?: string | null;
  current_team_composition?: string | null;
  ideal_candidate?: string | null;
  collaboration_style?: string | null;
  max_members?: number;
  current_members?: number;
  deadline?: string | null;
  project_title?: string | null;
  image_url?: string | null;
  isFavorited?: boolean;
  favoriteId?: string;
};

const getDDay = (deadline?: string | null): string => {
  if (!deadline) return "D-?";
  const now = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-Day";
  return `D+${Math.abs(diff)}`;
};

const RecruitCard = ({
  t,
  onToggleFavorite,
}: {
  t: Team;
  onToggleFavorite: (
    teamId: string,
    isFavorited: boolean,
    favoriteId?: string
  ) => void;
}) => {
  const { user } = useAuth();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    onToggleFavorite(t.id, t.isFavorited || false, t.favoriteId);
  };

  const current = t.current_members || 0;
  const max = t.max_members || 6;
  const isTight = max - current <= 2; // 마감 임박 정원 강조
  return (
    <div className="relative rounded-2xl surface p-5 hover:border-blue-300">
      <Link to={`/team/${t.id}`} className="block">
        <div className="flex items-start gap-4">
          {t.image_url ? (
            <img
              src={t.image_url}
              alt={t.name}
              className="h-14 w-14 rounded-md object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-14 w-14 rounded-md bg-slate-200" />
          )}
          <div className="flex-1 space-y-1">
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="text-xs text-slate-600">
              {t.area ?? "-"} · {t.region ?? "-"}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-slate-600 line-clamp-2">
            {t.description || t.purpose || "팀 모집 중입니다."}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                isTight
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              정원 {current}/{max}
            </span>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            {getDDay(t.deadline)}
          </span>
        </div>

        {/* 저장 버튼 - 카드 하단에 배치 */}
        {user && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleFavoriteClick}
              className={`btn btn-animate text-sm ${
                t.isFavorited ? "btn-primary" : "btn-outline"
              }`}
              aria-label={t.isFavorited ? "저장 취소" : "저장"}
            >
              {t.isFavorited ? "저장됨" : "저장"}
            </button>
          </div>
        )}
      </Link>
    </div>
  );
};

const RecruitListPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filters, setFilters] = useState<TeamFilterOptions>({
    region: "",
    area: "",
    teamSize: "",
    recruitmentStatus: "",
    deadlineStatus: "",
    traits: [],
    keyword: "",
    regions: [],
    subregions: [],
  });
  const { user, token } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  const buildQueryString = useCallback((currentFilters: TeamFilterOptions) => {
    const params = new URLSearchParams();

    if (currentFilters.region) {
      params.append("region", currentFilters.region);
    }
    if (currentFilters.area) {
      params.append("area", currentFilters.area);
    }
    if (currentFilters.teamSize) {
      params.append("teamSize", currentFilters.teamSize);
    }
    if (currentFilters.recruitmentStatus) {
      params.append("recruitmentStatus", currentFilters.recruitmentStatus);
    }
    if (currentFilters.deadlineStatus) {
      params.append("deadlineStatus", currentFilters.deadlineStatus);
    }
    if (currentFilters.traits && currentFilters.traits.length > 0) {
      currentFilters.traits.forEach((trait) => {
        params.append("traits", trait);
      });
    }

    return params.toString();
  }, []);

  // 팀 목록과 즐겨찾기 정보를 함께 로드
  const loadTeams = useCallback(async () => {
    try {
      // 팀 목록 로드
      const queryString = buildQueryString(filters);
      const teamsResponse = await apiGet<{
        success: boolean;
        data: { teams: Team[] };
      }>(`/api/teams${queryString ? `?${queryString}` : ""}`);
      let teamsWithFavorites = teamsResponse.data.teams;

      // 로그인된 사용자의 경우 즐겨찾기 정보도 함께 로드
      if (user && token) {
        try {
          const favoritesResponse = await apiGet<{
            success: boolean;
            data: { teams: Array<{ id: string; team_id: string }> };
          }>("/api/favorites", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const favoriteTeamIds = new Set(
            favoritesResponse.data.teams.map((fav) => fav.team_id)
          );

          teamsWithFavorites = teamsResponse.data.teams.map((team) => ({
            ...team,
            isFavorited: favoriteTeamIds.has(team.id),
          }));
        } catch (favoritesError) {
          console.warn(
            "즐겨찾기 정보를 불러오는데 실패했습니다:",
            favoritesError
          );
          // 즐겨찾기 로드 실패해도 팀 목록은 표시
        }
      }

      // 클라이언트 추가 필터링: 키워드, 다중 지역, 시/군/구
      const keyword = (filters.keyword || "").trim().toLowerCase();
      const regions = new Set(filters.regions || []);
      const subregions = new Set(filters.subregions || []);

      const filtered = teamsWithFavorites.filter((t) => {
        // 키워드 매칭: 이름/프로젝트/설명/모집포지션/이상적인 후보 등
        if (keyword) {
          const hay = [
            t.name,
            t.project_title,
            t.description,
            t.purpose,
            t.seeking_members,
            t.ideal_candidate,
            t.collaboration_style,
          ]
            .filter(Boolean)
            .join("\n")
            .toLowerCase();
          if (!hay.includes(keyword)) return false;
        }

        // 다중 지역
        if (regions.size > 0) {
          const regionMatch = t.region && regions.has(t.region);
          if (!regionMatch) return false;
        }

        // 시/군/구 텍스트 매칭(백엔드 필드 규격화 전 가벼운 포함 체크)
        if (subregions.size > 0) {
          const text = `${t.region ?? ""} ${t.description ?? ""}`;
          const matched = Array.from(subregions).some((sgg) =>
            text.includes(sgg)
          );
          if (!matched) return false;
        }

        return true;
      });

      setTeams(filtered);
    } catch (error) {
      console.error("팀 목록을 불러오는데 실패했습니다:", error);
      setTeams([]);
    }
  }, [filters, buildQueryString, user, token]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleFilterChange = useCallback((newFilters: TeamFilterOptions) => {
    setFilters(newFilters);
  }, []);

  const handleToggleFavorite = async (
    teamId: string,
    isFavorited: boolean,
    favoriteId?: string
  ) => {
    if (!user || !token) return;

    try {
      if (isFavorited && favoriteId) {
        // 즐겨찾기 제거
        await apiDelete(`/api/favorites/${favoriteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId
              ? { ...team, isFavorited: false, favoriteId: undefined }
              : team
          )
        );

        alert("즐겨찾기에서 제거되었습니다.");
      } else {
        // 즐겨찾기 추가
        await apiPost<{ success: boolean; message: string }>(
          "/api/favorites",
          { team_id: teamId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId ? { ...team, isFavorited: true } : team
          )
        );

        alert("즐겨찾기에 추가되었습니다.");
      }
    } catch (error) {
      console.error("즐겨찾기 처리 중 오류가 발생했습니다:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <Container className="py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">팀 모집 공고</h1>
          <button
            className="btn btn-animate btn-ghost text-sm border border-slate-300"
            onClick={() => setShowSearch((v) => !v)}
            aria-expanded={showSearch}
            aria-controls="page-search"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z"
              />
            </svg>
            검색
          </button>
        </div>

        {showSearch && (
          <div id="page-search" className="mb-8">
            <div className="glass p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={filters.keyword || ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, keyword: e.target.value }))
                  }
                  placeholder="팀 이름, 공고 제목, 포지션, 소개글"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                {filters.keyword && (
                  <button
                    className="btn btn-animate btn-outline text-sm"
                    onClick={() => setFilters((f) => ({ ...f, keyword: "" }))}
                  >
                    키워드 지우기
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8">
          {/* 왼쪽 사이드바 - 필터링 */}
          <div className="w-full xl:w-96 flex-shrink-0">
            <TeamFilter
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </div>

          {/* 오른쪽 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              {/* 필터링 결과 정보 */}
              {(filters.region ||
                filters.area ||
                filters.teamSize ||
                filters.recruitmentStatus ||
                filters.deadlineStatus ||
                (filters.keyword && filters.keyword.trim() !== "") ||
                (filters.regions && filters.regions.length > 0) ||
                (filters.subregions && filters.subregions.length > 0)) && (
                <div className="surface p-4 mb-4">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">적용된 필터:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.keyword && filters.keyword.trim() !== "" && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                          🔎 {filters.keyword}
                          <button
                            type="button"
                            className="ml-2 text-slate-500 hover:text-slate-700"
                            onClick={() =>
                              setFilters((f) => ({ ...f, keyword: "" }))
                            }
                          >
                            ✕
                          </button>
                        </span>
                      )}
                      {filters.region && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          📍 {filters.region}
                        </span>
                      )}
                      {filters.area && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          🎯 {filters.area}
                        </span>
                      )}
                      {filters.teamSize && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          👥 {filters.teamSize}
                        </span>
                      )}
                      {filters.recruitmentStatus && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          🔥 {filters.recruitmentStatus}
                        </span>
                      )}
                      {filters.deadlineStatus && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          ⏰ {filters.deadlineStatus}
                        </span>
                      )}
                      {filters.regions &&
                        filters.regions.map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200"
                          >
                            {r}
                            <button
                              type="button"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              onClick={() =>
                                setFilters((f) => ({
                                  ...f,
                                  regions: (f.regions || []).filter(
                                    (x) => x !== r
                                  ),
                                }))
                              }
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      {filters.subregions &&
                        filters.subregions.map((sgg) => (
                          <span
                            key={sgg}
                            className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-200"
                          >
                            {sgg}
                            <button
                              type="button"
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                              onClick={() =>
                                setFilters((f) => ({
                                  ...f,
                                  subregions: (f.subregions || []).filter(
                                    (x) => x !== sgg
                                  ),
                                }))
                              }
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {teams && teams.length > 0 ? (
                teams.map((t) => (
                  <RecruitCard
                    key={t.id}
                    t={t}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-slate-500">
                  조건에 부합하는 팀을 찾지 못했습니다
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default RecruitListPage;
