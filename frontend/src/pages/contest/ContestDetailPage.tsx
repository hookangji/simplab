import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import Container from "../../shared/ui/Container";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../../shared/api";
import { useAuth } from "../../contexts/AuthContext";
import { useParams, useNavigate, Link } from "react-router-dom";

type Contest = {
  id: string;
  title: string;
  topic?: string | null;
  region?: string | null;
  deadline?: string | null;
  description?: string | null;
  host?: string | null;
  format?: string | null;
  features?: string | null;
  required_skills?: string | null;
  team_composition?: string | null;
  image_url?: string | null;
  is_favorited?: boolean;
  favorite_id?: string | null;
};

type RecommendedUser = {
  id: string;
  name: string;
  email: string;
  region: string;
  school?: string;
  major?: string;
  job_field?: string;
  skills: string[];
  match_score: number;
};

const ContestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>(
    []
  );
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    apiGet<{
      success: boolean;
      data: { contest: Contest };
    }>(`/api/contests/${id}`)
      .then((d) => {
        setContest(d.data.contest);
      })
      .catch(() => {
        setContest(null);
      });
  }, [id]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      setToast("로그인이 필요합니다.");
      setTimeout(() => setToast(null), 2000);
      return;
    }

    if (!contest) return;

    if (isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    try {
      if (contest.is_favorited && contest.favorite_id) {
        // 관심 해제
        await apiDelete(`/api/favorites/${contest.favorite_id}`);
        setContest({
          ...contest,
          is_favorited: false,
          favorite_id: null,
        });
        setToast("저장이 해제되었습니다.");
      } else {
        // 관심 추가
        const response = await apiPost<{
          success: boolean;
          data: { favorite: { id: string } };
        }>("/api/favorites", { contest_id: contest.id });

        const newFavoriteId = response.data.favorite?.id;
        setContest({
          ...contest,
          is_favorited: true,
          favorite_id: newFavoriteId || null,
        });
        setToast("저장되었습니다.");
      }
    } catch (error) {
      console.error("관심 등록/해제 실패:", error);
      setToast("저장에 실패했습니다.");
    } finally {
      setIsFavoriteLoading(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoadingUsers(true);
    apiGet<{ success: boolean; data: { recommendedUsers: RecommendedUser[] } }>(
      `/api/contests/${id}/recommended-users`
    )
      .then((d) => setRecommendedUsers(d.data.recommendedUsers))
      .catch(() => setRecommendedUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [id]);

  const handleTeamRegister = () => {
    console.log("팀 등록하기 버튼 클릭됨", { user, id });
    if (!user) {
      setToast("로그인이 필요합니다.");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (!id) {
      setToast("공모전 정보를 불러올 수 없습니다.");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    // 공모전 정보를 함께 전달하며 팀 모집 공고 작성 페이지로 이동
    const targetPath = `/mypage/posts/create?contestId=${id}`;
    console.log("이동 경로:", targetPath);
    navigate(targetPath);
  };

  const RecommendedUserCard = ({ user }: { user: RecommendedUser }) => {
    const getMatchScoreColor = (score: number) => {
      switch (score) {
        case 3:
          return "bg-green-100 text-green-800";
        case 2:
          return "bg-yellow-100 text-yellow-800";
        default:
          return "bg-blue-100 text-blue-800";
      }
    };

    const getMatchScoreText = (score: number) => {
      switch (score) {
        case 3:
          return "높은 매칭";
        case 2:
          return "보통 매칭";
        default:
          return "기본 매칭";
      }
    };

    return (
      <div className="flex flex-col">
        <Link
          to={`/profile/${user.id}`}
          className={`flex flex-col items-center rounded-xl border-2 px-4 py-4 cursor-pointer transition-all hover:border-blue-400 ${
            selectedTargetId === user.id
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200"
          }`}
        >
          <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-600">
            {user.name.charAt(0)}
          </div>
          <div className="mt-2 text-center">
            <div className="text-sm font-medium text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500">
              {user.job_field || "직군 미설정"}
            </div>
            <div className="text-xs text-slate-500">{user.region}</div>
            {user.school && (
              <div className="text-xs text-slate-400">{user.school}</div>
            )}
            <div
              className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getMatchScoreColor(
                user.match_score
              )}`}
            >
              {getMatchScoreText(user.match_score)}
            </div>
          </div>
          {user.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 justify-center">
              {user.skills.slice(0, 2).map((skill, index) => (
                <span
                  key={index}
                  className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-600"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 2 && (
                <span className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-600">
                  +{user.skills.length - 2}
                </span>
              )}
            </div>
          )}
        </Link>
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) {
              setToast("로그인이 필요해요.");
              setTimeout(() => setToast(null), 2000);
              return;
            }
            try {
              setSending(true);
              await apiPost<{ nudge: unknown }>("/api/messages/nudge", {
                toUserId: user.id,
                contestId: id,
                message: "같이 이 대회 나가보실래요?",
              });
              setToast("가볍게 제안(찔러보기)을 보냈어요.");
              setTimeout(() => {
                navigate(`/messenger?user=${user.id}`);
              }, 1500);
            } catch (error: any) {
              const errorMessage =
                error.message || "전송에 실패했어요. 잠시 후 다시 시도해주세요.";
              setToast(errorMessage);
            } finally {
              setSending(false);
              setTimeout(() => setToast(null), 3000);
            }
          }}
          disabled={sending}
          className="mt-2 w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "보내는 중..." : "찔러보기"}
        </button>
      </div>
    );
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const parseFeatures = (features: string | null | undefined): string[] => {
    if (!features) return [];
    return features.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
  };

  const parseRequiredSkills = (skills: string | null | undefined): string[] => {
    if (!skills) return [];
    return skills.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-10">
        {/* 헤더 영역 */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900">
              {contest?.title ?? "대회 상세"}
            </h1>
            <button
              onClick={handleFavoriteToggle}
              disabled={isFavoriteLoading}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                contest?.is_favorited
                  ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-slate-300 text-slate-800 hover:border-slate-400"
              }`}
            >
              {contest?.is_favorited ? "저장됨" : "저장"}
            </button>
          </div>

          {/* 포스터 */}
          {contest?.image_url && (
            <div className="mb-8 rounded-xl overflow-hidden max-w-2xl mx-auto">
              <img
                src={contest.image_url}
                alt={contest.title}
                className="w-full h-auto object-contain max-h-96"
              />
            </div>
          )}
        </div>

        {/* 행사 개요 */}
        <section className="mb-12 rounded-lg border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">행사 개요</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                대회명
              </h3>
              <p className="text-base text-slate-900">{contest?.title ?? "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                주제
              </h3>
              <p className="text-base text-slate-900">{contest?.topic ?? "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                지역
              </h3>
              <p className="text-base text-slate-900">{contest?.region ?? "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                일정
              </h3>
              <p className="text-base text-slate-900">
                {formatDate(contest?.deadline)}
              </p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                세부 설명
              </h3>
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {contest?.description ?? "-"}
              </p>
            </div>
          </div>
        </section>

        {/* 공모전/대회 특성 */}
        <section className="mb-12 rounded-lg border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            공모전/대회 특성
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                대회 유형
              </h3>
              <p className="text-base text-slate-900">{contest?.format ?? "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                주최
              </h3>
              <p className="text-base text-slate-900">{contest?.host ?? "-"}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                주최측이 강조하는 핵심 가치
              </h3>
              {contest?.features ? (
                <div className="flex flex-wrap gap-2">
                  {parseFeatures(contest.features).map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base text-slate-900">-</p>
              )}
            </div>
          </div>
        </section>

        {/* 필요한 역량 */}
        <section className="mb-12 rounded-lg border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">필요한 역량</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                요구 기술 스택
              </h3>
              {contest?.required_skills ? (
                <div className="flex flex-wrap gap-2">
                  {parseRequiredSkills(contest.required_skills).map(
                    (skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="text-base text-slate-600">-</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                권장 역할별 역량
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-medium text-slate-900 mb-2">기획자</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• 문제 정의 능력</li>
                    <li>• 논리적 스토리텔링</li>
                    <li>• 시장조사</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-medium text-slate-900 mb-2">개발자</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• 프로토타입 제작</li>
                    <li>• API 활용</li>
                    <li>• 성능 개선</li>
                    <li>• 버그 디버깅</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-medium text-slate-900 mb-2">디자이너</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• UI/UX 기획</li>
                    <li>• 프로토타입 툴</li>
                    <li>• 발표 자료 시각화</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                소프트 스킬
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "팀워크",
                  "발표 능력",
                  "문제 해결력",
                  "리더십",
                  "팔로워십",
                ].map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                난이도 지표
              </h3>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="beginner"
                    className="mr-2"
                    defaultChecked
                  />
                  <span className="text-sm text-slate-700">초급</span>
                  <span className="ml-2 text-xs text-slate-500">
                    (단순 아이디어 기획 중심)
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="difficulty" value="intermediate" className="mr-2" />
                  <span className="text-sm text-slate-700">중급</span>
                  <span className="ml-2 text-xs text-slate-500">
                    (기획 + 간단 구현 필요)
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="difficulty" value="advanced" className="mr-2" />
                  <span className="text-sm text-slate-700">고급</span>
                  <span className="ml-2 text-xs text-slate-500">
                    (실제 서비스 수준의 프로토타입 요구)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 팀 구성 추천 */}
        <section className="mb-12 rounded-lg border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">팀 구성 추천</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                권장 팀 규모
              </h3>
              <p className="text-base text-slate-900">
                {contest?.team_composition
                  ? contest.team_composition.match(/총 (\d+[-\d]*명)/)?.[0] ||
                    "4-5명"
                  : "4-5명"}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                추천 포지션 조합
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="text-sm font-medium text-green-900">
                    기획자 1명
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-sm font-medium text-blue-900">
                    개발자 2명
                  </div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="text-sm font-medium text-purple-900">
                    디자이너 1명
                  </div>
                </div>
              </div>
              {contest?.team_composition && (
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  {contest.team_composition}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 적합한 사용자 추천 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            적합한 사용자 추천
          </h2>
          {loadingUsers ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col items-center rounded-xl border border-slate-200 px-4 py-4"
                >
                  <div className="h-20 w-20 rounded-full bg-slate-200 animate-pulse" />
                  <div className="mt-2 h-4 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="mt-1 h-3 w-16 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recommendedUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedUsers.map((user) => (
                <RecommendedUserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 rounded-lg border border-slate-200">
              <div className="text-slate-500">
                <p className="text-lg">추천할 수 있는 사용자가 없습니다.</p>
                <p className="mt-2 text-sm">
                  아직 가입한 사용자가 적거나 조건에 맞는 사용자가 없습니다.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 액션 버튼 영역 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {user ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTeamRegister();
              }}
              className="flex-1 rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              팀 등록하기
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setToast("로그인이 필요합니다.");
                setTimeout(() => setToast(null), 2000);
              }}
              className="flex-1 rounded-md bg-slate-400 px-6 py-3 text-base font-semibold text-white cursor-not-allowed"
            >
              팀 등록하기 (로그인 필요)
            </button>
          )}
          <button
            onClick={() => {
              // 외부 링크 (실제 URL이 있다면 contest 객체에 추가 필요)
              setToast("공식 홈페이지 정보가 없습니다.");
              setTimeout(() => setToast(null), 2000);
            }}
            className="flex-1 rounded-md border-2 border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:border-slate-400 transition-colors"
          >
            외부 링크
          </button>
        </div>

        {toast && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {toast}
          </div>
        )}
      </Container>
      <AppFooter />
    </div>
  );
};

export default ContestDetailPage;
