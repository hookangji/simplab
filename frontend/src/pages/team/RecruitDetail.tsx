import Container from "../../shared/ui/Container";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../../shared/api";
import { useAuth } from "../../contexts/AuthContext";

type TeamProject = {
  id: string;
  project_name: string;
  start_date: string;
  end_date: string | null;
  is_ongoing: boolean;
  summary: string;
  tech_stack: string[];
  result_link: string | null;
  performance_indicators: string | null;
  images: string[];
};

type ApiTeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  name: string;
  email: string;
  job_field: string;
  skills: string;
};

type TeamDetail = {
  id: string;
  name: string;
  area?: string | null;
  region?: string | null;
  description?: string | null;
  purpose?: string | null;
  project_title?: string | null;
  seeking_members?: string | null;
  current_team_composition?: string | null;
  ideal_candidate?: string | null;
  area_keywords?: string | null;
  progress_stage?: string | null;
  meeting_schedule?: string | null;
  collaboration_style?: string | null;
  collaboration_tools?: string | null;
  available_time_slots?: string | null;
  image_url?: string | null;
  current_members?: number;
  max_members?: number;
  deadline?: string | null;
};

type Contest = {
  id: string;
  title: string;
  topic?: string | null;
  region?: string | null;
  deadline?: string | null;
  image_url?: string | null;
};

const RecruitDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [members, setMembers] = useState<ApiTeamMember[]>([]);
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  // 팀 정보 로드
  useEffect(() => {
    if (!id) return;
    apiGet<{
      success: boolean;
      data: {
        team: TeamDetail;
        members: ApiTeamMember[];
        contests: Contest[];
        projects: TeamProject[];
      };
    }>(`/api/teams/${id}`)
      .then((d) => {
        setTeam(d.data.team);
        setMembers(d.data.members.filter((m) => m.status === "accepted"));
        setProjects(d.data.projects || []);
        setContests(d.data.contests || []);
      })
      .catch((error) => {
        console.error("팀 정보를 불러오는데 실패했습니다:", error);
        setTeam(null);
      });
  }, [id]);

  // 즐겨찾기 상태 확인
  useEffect(() => {
    if (!user || !token || !id) {
      setIsFavorited(false);
      setFavoriteId(null);
      return;
    }

    apiGet<{
      success: boolean;
      data: { teams: Array<{ id: string; team_id: string }> };
    }>("/api/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        const favorite = response.data?.teams?.find(
          (fav) => fav.team_id === id
        );
        if (favorite) {
          setIsFavorited(true);
          setFavoriteId(favorite.id);
        } else {
          setIsFavorited(false);
          setFavoriteId(null);
        }
      })
      .catch((error) => {
        console.warn("즐겨찾기 상태 확인 실패:", error);
        setIsFavorited(false);
        setFavoriteId(null);
      });
  }, [user, token, id]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !token) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!id) return;

    setLoading(true);
    try {
      if (isFavorited && favoriteId) {
        await apiDelete(`/api/favorites/${favoriteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const response = await apiPost<{
          success: boolean;
          data?: { favorite?: { id: string } };
        }>(
          "/api/favorites",
          { team_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newFavoriteId = response.data?.favorite?.id;
        setIsFavorited(true);
        if (newFavoriteId) {
          setFavoriteId(newFavoriteId);
        }
      }
    } catch (error) {
      console.error("즐겨찾기 처리 중 오류가 발생했습니다:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert("링크가 클립보드에 복사되었습니다.");
    });
  };

  // 분야 키워드 파싱
  const areaKeywords = team?.area_keywords
    ? (() => {
        try {
          const parsed = JSON.parse(team.area_keywords);
          return Array.isArray(parsed) ? parsed : [team.area];
        } catch {
          return team.area ? [team.area] : [];
        }
      })()
    : team?.area
    ? [team.area]
    : [];

  // 협업 방식 파싱
  const getCollaborationMethod = () => {
    if (!team?.meeting_schedule) return null;
    try {
      const parts = team.meeting_schedule.split(",").map((s) => s.trim());
      return {
        frequency: parts[0] || null,
        method: parts[1] || null,
      };
    } catch {
      return null;
    }
  };

  const collaborationMethod = getCollaborationMethod();

  // 결과물 링크 파싱
  const parseResultLink = (link: string | null) => {
    if (!link) return null;
    try {
      return JSON.parse(link);
    } catch {
      return link;
    }
  };

  // 프로젝트 기간 포맷팅
  const formatProjectDuration = (project: TeamProject) => {
    if (project.is_ongoing) {
      const start = new Date(project.start_date);
      return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(
        2,
        "0"
      )} - 진행 중`;
    } else if (project.end_date) {
      const start = new Date(project.start_date);
      const end = new Date(project.end_date);
      return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(
        2,
        "0"
      )} - ${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, "0")}`;
    } else {
      const start = new Date(project.start_date);
      return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    }
  };

  // 링크 아이콘 반환
  const getLinkIcon = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes("github")) return "🐱";
    if (lower.includes("figma")) return "🎨";
    if (lower.includes("notion")) return "📝";
    if (lower.includes("slack")) return "💬";
    if (lower.includes("drive")) return "📁";
    return "🔗";
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <Container className="py-8">
          <div className="text-center text-slate-500">
            팀 정보를 불러오는 중...
          </div>
        </Container>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      {/* 헤더 */}
      <div className="relative">
        {/* 커버 이미지 */}
        {team.image_url ? (
          <div className="h-64 w-full bg-gradient-to-r from-slate-900 to-slate-700">
            <img
              src={team.image_url}
              alt={team.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-64 w-full bg-gradient-to-r from-slate-900 to-slate-700" />
        )}

        <Container className="relative -mt-16 pb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* 팀 아이콘 */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-600 border-4 border-white shadow-md">
                  {team.name.charAt(0)}
                </div>
              </div>

              {/* 팀 정보 */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                  {team.name}
                </h1>

                {/* 분야 태그 */}
                {areaKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {areaKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {/* 지역 */}
                {team.region && (
                  <div className="text-sm text-slate-600 mb-3">
                    📍 {team.region}
                  </div>
                )}

                {/* 상태 뱃지 */}
                <div className="flex flex-wrap gap-2">
                  {team.progress_stage && (
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                      {team.progress_stage}
                    </span>
                  )}
                  {collaborationMethod?.method && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
                      {collaborationMethod.method === "Online"
                        ? "온라인"
                        : collaborationMethod.method === "Offline"
                        ? "오프라인"
                        : collaborationMethod.method === "Hybrid"
                        ? "하이브리드"
                        : collaborationMethod.method}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {team.current_members || 0}/{team.max_members || 0}명
                  </span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:border-slate-400 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  공유
                </button>
                {user ? (
                  <button
                    onClick={handleToggleFavorite}
                    disabled={loading}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                      isFavorited
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700"
                        : "border border-slate-300 text-slate-800 hover:border-blue-400 hover:text-blue-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      "처리중..."
                    ) : isFavorited ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        저장됨
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                        저장
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => alert("로그인이 필요합니다.")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:border-slate-400 flex items-center gap-2"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                    저장
                  </button>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {/* 소개글 */}
        {team.description && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">팀 소개</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {team.description}
            </p>
          </section>
        )}

        {/* 프로젝트 제목 및 목적 */}
        {(team.project_title || team.purpose) && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              프로젝트 개요
            </h2>
            {team.project_title && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  프로젝트 제목
                </h3>
                <p className="text-slate-700">{team.project_title}</p>
              </div>
            )}
            {team.purpose && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  프로젝트 목적
                </h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {team.purpose}
                </p>
              </div>
            )}
          </section>
        )}

        {/* 구하는 팀원 설명 */}
        {team.seeking_members && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              구하는 팀원
            </h2>
            {(() => {
              try {
                const parsed = JSON.parse(team.seeking_members);
                if (Array.isArray(parsed)) {
                  return (
                    <div className="space-y-4">
                      {parsed.map((role: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-200 p-4"
                        >
                          <h3 className="font-semibold text-slate-900 mb-2">
                            {role.role_name || role.name || `역할 ${idx + 1}`}
                          </h3>
                          {role.main_tasks && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-slate-700">
                                주요 업무:{" "}
                              </span>
                              <span className="text-sm text-slate-600">
                                {role.main_tasks}
                              </span>
                            </div>
                          )}
                          {role.required_skills && (
                            <div>
                              <span className="text-sm font-medium text-slate-700">
                                필요 역량:{" "}
                              </span>
                              <span className="text-sm text-slate-600">
                                {role.required_skills}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
              } catch {}
              return (
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {team.seeking_members}
                </p>
              );
            })()}
          </section>
        )}

        {/* 현재 팀원 구성 설명 */}
        {team.current_team_composition && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              현재 팀원 구성
            </h2>
            {(() => {
              try {
                const parsed = JSON.parse(team.current_team_composition);
                if (Array.isArray(parsed)) {
                  return (
                    <div className="space-y-2">
                      {parsed.map((member: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 text-slate-700"
                        >
                          <span className="font-medium">
                            {member.name || `멤버 ${idx + 1}`}:
                          </span>
                          <span>{member.role || "역할 미지정"}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
              } catch {}
              return (
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {team.current_team_composition}
                </p>
              );
            })()}
          </section>
        )}

        {/* 원하는 팀원 인재상 */}
        {team.ideal_candidate && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              원하는 팀원 인재상
            </h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {team.ideal_candidate}
            </p>
          </section>
        )}

        {/* 팀 구성원 */}
        {members.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">팀 구성원</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member) => (
                <Link
                  key={member.id}
                  to={`/profile/${member.user_id}`}
                  className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-xl font-semibold text-slate-600 mb-2">
                    {member.name.charAt(0)}
                  </div>
                  <div className="text-sm font-medium text-slate-900 text-center">
                    {member.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 text-center">
                    {member.role || "팀원"}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 프로젝트/성과 */}
        {projects.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              프로젝트/성과
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => {
                const resultLinks = parseResultLink(project.result_link);
                return (
                  <div
                    key={project.id}
                    className="rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {project.project_name}
                    </h3>
                    <div className="text-sm text-slate-600 mb-3">
                      {formatProjectDuration(project)}
                    </div>
                    {project.summary && (
                      <p className="text-sm text-slate-700 leading-relaxed mb-4 line-clamp-3">
                        {project.summary}
                      </p>
                    )}

                    {/* 사용 스택 태그 */}
                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tech_stack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 결과물 아이콘 */}
                    {resultLinks && (
                      <div className="flex gap-2 mb-4">
                        {Array.isArray(resultLinks) ? (
                          resultLinks.map((link: string, idx: number) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-2xl hover:scale-110 transition-transform"
                              title={link}
                            >
                              {getLinkIcon(link)}
                            </a>
                          ))
                        ) : (
                          <a
                            href={resultLinks}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-2xl hover:scale-110 transition-transform"
                            title={resultLinks}
                          >
                            {getLinkIcon(resultLinks)}
                          </a>
                        )}
                      </div>
                    )}

                    {/* 성과 지표 */}
                    {project.performance_indicators && (
                      <div className="text-xs text-slate-600 bg-slate-50 rounded px-3 py-2">
                        <span className="font-medium">성과: </span>
                        {project.performance_indicators}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 참여하려는 공모전 */}
        {contests.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              참여하려는 공모전
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contests.map((contest) => (
                <Link
                  key={contest.id}
                  to={`/contests/${contest.id}`}
                  className="rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer block"
                >
                  {contest.image_url && (
                    <img
                      src={contest.image_url}
                      alt={contest.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {contest.title}
                    </h3>
                    {contest.topic && (
                      <div className="text-sm text-slate-600 mb-2">
                        주제: {contest.topic}
                      </div>
                    )}
                    {contest.deadline && (
                      <div className="text-xs text-slate-500">
                        마감: {new Date(contest.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 운영 정보 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">운영 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 회의 주기/방식 */}
            {collaborationMethod && (
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  회의 주기 및 방식
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  {collaborationMethod.frequency && (
                    <div>
                      <span className="font-medium">주기: </span>
                      {collaborationMethod.frequency}
                    </div>
                  )}
                  {collaborationMethod.method && (
                    <div>
                      <span className="font-medium">방식: </span>
                      {collaborationMethod.method === "Online"
                        ? "온라인"
                        : collaborationMethod.method === "Offline"
                        ? "오프라인"
                        : collaborationMethod.method === "Hybrid"
                        ? "하이브리드"
                        : collaborationMethod.method}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 협업 도구 */}
            {team.collaboration_tools && (
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  협업 도구
                </h3>
                <div className="flex flex-wrap gap-2">
                  {team.collaboration_tools
                    .split(",")
                    .map((tool) => tool.trim())
                    .filter(Boolean)
                    .map((tool, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 border border-blue-200"
                      >
                        {tool}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* 팀 가용 시간대 */}
            {team.available_time_slots && (
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  팀 가용 시간대
                </h3>
                <div className="text-sm text-slate-600">
                  {(() => {
                    try {
                      const slots = JSON.parse(team.available_time_slots);
                      if (Array.isArray(slots)) {
                        return (
                          <div className="flex flex-wrap gap-2">
                            {slots.map((slot: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                              >
                                {slot}
                              </span>
                            ))}
                          </div>
                        );
                      }
                    } catch {}
                    return <div>{team.available_time_slots}</div>;
                  })()}
                </div>
              </div>
            )}
          </div>
        </section>
      </Container>

      <AppFooter />
    </div>
  );
};

export default RecruitDetailPage;
