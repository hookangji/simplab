import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import Container from "../../shared/ui/Container";
import { Link, useLocation } from "react-router-dom";
import { ProfileForm } from "./ProfileEditor";
import { useEffect, useState, useCallback } from "react";
import { apiGet, apiDelete, apiPost, apiPut } from "../../shared/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TeamRegistrationManageContent from "./TeamRegistrationManageContent";
import RecruitmentPostManageContent from "./RecruitmentPostManageContent";
import RecruitmentPostCreateForm from "./RecruitmentPostCreateForm";

const SideLink = ({ to, label }: { to: string; label: string }) => {
  const { pathname } = useLocation();
  const isAccount = to === "/mypage/account";
  const active = isAccount
    ? pathname === "/mypage" || pathname === "/mypage/account"
    : pathname === to;
  return (
    <Link
      to={to}
      className={`block rounded px-2 py-1 text-sm ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
};

type FavoriteContest = {
  id: string;
  contest_id: string;
  title: string;
  topic: string;
  region: string;
  deadline: string;
  host: string;
  created_at: string;
};

type FavoriteTeam = {
  id: string;
  team_id: string;
  name: string;
  region: string;
  area: string;
  project_title: string;
  current_members: number;
  max_members: number;
  created_at: string;
};

type Team = {
  id: string;
  name: string;
  region: string;
  area: string;
  description: string;
  purpose: string;
  seeking_members: string;
  current_team_composition: string;
  ideal_candidate: string;
  collaboration_style: string;
  max_members: number;
  current_members: number;
  deadline: string;
  project_title: string;
  image_url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: "pending" | "accepted" | "rejected";
  joined_at: string;
  name: string;
  email: string;
  job_field: string;
  skills: string;
};

type TeamWithMembers = {
  team: Team;
  members: TeamMember[];
};

const FavoriteContestCard = ({
  contest,
  onRemove,
}: {
  contest: FavoriteContest;
  onRemove: (id: string) => void;
}) => {
  const getDaysUntilDeadline = (deadline: string | null): number | null => {
    if (!deadline) return null;

    try {
      // YYYY-MM-DD 형식의 날짜 문자열을 직접 파싱
      const [year, month, day] = deadline.split("-").map(Number);
      if (
        !year ||
        !month ||
        !day ||
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day)
      ) {
        return null;
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
        return null;
      }

      const diffTime = deadlineStart.getTime() - todayStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error("날짜 계산 오류:", error, deadline);
      return null;
    }
  };

  const daysUntilDeadline = getDaysUntilDeadline(contest.deadline);
  const isUrgent =
    daysUntilDeadline !== null &&
    daysUntilDeadline <= 7 &&
    daysUntilDeadline >= 0;
  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0;

  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between">
        <Link
          to={`/contests/${contest.contest_id}`}
          className="flex-1 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
            {contest.title}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {contest.topic} · {contest.region}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            주최: {contest.host}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {contest.deadline ? (
              <>
                <span
                  className={`text-xs font-medium ${
                    isOverdue
                      ? "text-red-600"
                      : isUrgent
                      ? "text-orange-600"
                      : "text-slate-500"
                  }`}
                >
                  마감: {new Date(contest.deadline).toLocaleDateString()}
                </span>
                {isUrgent && !isOverdue && (
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                    마감 임박 ({daysUntilDeadline}일 남음)
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    마감됨
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-500">마감: 미정</span>
            )}
          </div>
          <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            자세히 보기 →
          </div>
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(contest.id);
          }}
          className="ml-3 flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="관심 제거"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const FavoriteTeamCard = ({
  team,
  onRemove,
}: {
  team: FavoriteTeam;
  onRemove: (id: string) => void;
}) => (
  <div className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
    <div className="flex items-start justify-between">
      <Link
        to={`/team/${team.team_id}`}
        className="flex-1 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
          {team.name}
        </div>
        <div className="mt-1 text-xs text-slate-600">{team.project_title}</div>
        <div className="mt-1 text-xs text-slate-500">
          {team.area} · {team.region}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          정원: {team.current_members}/{team.max_members}명
        </div>
        <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          자세히 보기 →
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(team.id);
        }}
        className="ml-3 flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        title="관심 제거"
      >
        ×
      </button>
    </div>
  </div>
);

const TeamCard = ({
  team,
  onDelete,
}: {
  team: Team;
  onDelete: (teamId: string) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (
      window.confirm(
        "정말로 이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      onDelete(team.id);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadge = () => {
    const deadline = new Date(team.deadline);
    const now = new Date();

    if (deadline < now) {
      return (
        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
          마감됨
        </span>
      );
    }

    const daysLeft = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 3) {
      return (
        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          마감 임박 ({daysLeft}일)
        </span>
      );
    }

    return (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        모집중 ({daysLeft}일 남음)
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {team.image_url && (
            <img
              src={team.image_url}
              alt={team.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
            <div className="text-sm text-slate-600">
              {team.area} · {team.region}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <div className="flex gap-1">
            <Link
              to={`/team/${team.id}`}
              className="rounded bg-slate-600 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
            >
              보기
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">프로젝트</h4>
        <p className="text-sm text-slate-700">{team.project_title}</p>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">팀 소개</h4>
        <p className="text-sm text-slate-700 line-clamp-2">
          {team.description}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-500">정원:</span>
          <span className="ml-1 font-medium">
            {team.current_members}/{team.max_members}명
          </span>
        </div>
        <div>
          <span className="text-slate-500">마감일:</span>
          <span className="ml-1 font-medium">
            {new Date(team.deadline).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        등록일: {new Date(team.created_at).toLocaleDateString()}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              팀 삭제 확인
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              정말로 "{team.name}" 팀을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                삭제
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded bg-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberCard = ({
  member,
  onApprove,
  onReject,
  isLeader,
}: {
  member: TeamMember;
  onApprove: (memberId: string) => void;
  onReject: (memberId: string) => void;
  isLeader: boolean;
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            대기중
          </span>
        );
      case "accepted":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            승인됨
          </span>
        );
      case "rejected":
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            거절됨
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "팀장") {
      return (
        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
          팀장
        </span>
      );
    }
    return (
      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
        {role}
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{member.name}</h3>
            {getRoleBadge(member.role)}
            {getStatusBadge(member.status)}
          </div>
          <div className="mt-1 text-sm text-slate-600">{member.email}</div>
          <div className="mt-1 text-sm text-slate-500">
            <span className="font-medium">직군:</span> {member.job_field}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            <span className="font-medium">스킬:</span> {member.skills}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            가입일: {new Date(member.joined_at).toLocaleDateString()}
          </div>
        </div>
        {isLeader && member.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(member.id)}
              className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              승인
            </button>
            <button
              onClick={() => onReject(member.id)}
              className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              거절
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TeamManageCard = ({
  teamData,
  onMemberStatusChange,
  isLeader,
}: {
  teamData: TeamWithMembers;
  onMemberStatusChange: () => void;
  isLeader: boolean;
}) => {
  const { team, members } = teamData;
  const { token } = useAuth();
  const [showReview, setShowReview] = useState(false);
  const [reviewState, setReviewState] = useState<
    Record<string, { rating: number; comment: string }>
  >({});

  const handleApprove = async (memberId: string) => {
    if (!token) return;

    try {
      await apiPost(
        `/api/teams/${team.id}/members/${memberId}`,
        { status: "accepted" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("팀 가입을 승인했습니다.");
      onMemberStatusChange();
    } catch (error) {
      console.error("승인 처리 오류:", error);
      alert("승인 처리에 실패했습니다.");
    }
  };

  const handleReject = async (memberId: string) => {
    if (!token) return;

    try {
      await apiPost(
        `/api/teams/${team.id}/members/${memberId}`,
        { status: "rejected" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("팀 가입을 거절했습니다.");
      onMemberStatusChange();
    } catch (error) {
      console.error("거절 처리 오류:", error);
      alert("거절 처리에 실패했습니다.");
    }
  };

  const pendingMembers = members.filter((m) => m.status === "pending");
  const acceptedMembers = members.filter((m) => m.status === "accepted");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        {team.image_url && (
          <img
            src={team.image_url}
            alt={team.name}
            className="h-12 w-12 rounded-lg object-cover"
          />
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
          <div className="text-sm text-slate-600">
            {team.area} · {team.region}
          </div>
        </div>
      </div>

      {isLeader && acceptedMembers.length > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => setShowReview(true)}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            프로젝트 완료
          </button>
        </div>
      )}

      <div className="mb-4 text-sm text-slate-700">
        <p className="font-medium">프로젝트: {team.project_title}</p>
        <p className="mt-1">{team.description}</p>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          정원: {team.current_members}/{team.max_members}명
        </span>
        <span className="text-slate-600">
          마감: {new Date(team.deadline).toLocaleDateString()}
        </span>
      </div>

      {/* 승인된 멤버들 */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          팀원 ({acceptedMembers.length}명)
        </h3>
        {acceptedMembers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {acceptedMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onApprove={() => {}}
                onReject={() => {}}
                isLeader={false}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
            승인된 팀원이 없습니다.
          </div>
        )}
      </div>

      {/* 대기중인 신청자들 */}
      {isLeader && pendingMembers.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            가입 신청 ({pendingMembers.length}명)
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onApprove={handleApprove}
                onReject={handleReject}
                isLeader={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* 가입 신청이 없는 경우 */}
      {isLeader && pendingMembers.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
          새로운 가입 신청이 없습니다.
        </div>
      )}

      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                프로젝트 완료 · 팀원 리뷰
              </h3>
              <button
                onClick={() => setShowReview(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
              {acceptedMembers.map((m) => (
                <div key={m.id} className="rounded border border-slate-200 p-3">
                  <div className="mb-2 text-sm font-medium text-slate-900">
                    {m.name}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        평점(1~5)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={reviewState[m.id]?.rating ?? 5}
                        onChange={(e) =>
                          setReviewState((prev) => ({
                            ...prev,
                            [m.id]: {
                              rating: Number(e.target.value),
                              comment: prev[m.id]?.comment ?? "",
                            },
                          }))
                        }
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-600 mb-1">
                        코멘트(선택)
                      </label>
                      <input
                        type="text"
                        value={reviewState[m.id]?.comment ?? ""}
                        onChange={(e) =>
                          setReviewState((prev) => ({
                            ...prev,
                            [m.id]: {
                              rating: prev[m.id]?.rating ?? 5,
                              comment: e.target.value,
                            },
                          }))
                        }
                        placeholder="함께한 소감, 강점/보완점 등을 작성해 주세요"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowReview(false)}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!token) return;
                  const payload = {
                    reviews: acceptedMembers.map((m) => ({
                      memberId: m.id,
                      rating: reviewState[m.id]?.rating ?? 5,
                      comment: reviewState[m.id]?.comment ?? "",
                    })),
                  };
                  try {
                    await apiPost(`/api/teams/${team.id}/reviews`, payload, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    });
                    alert("리뷰가 저장되었습니다. 수고하셨습니다!");
                    setShowReview(false);
                  } catch (e) {
                    console.error(e);
                    alert("리뷰 저장 중 오류가 발생했습니다.");
                  }
                }}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FavoritesContent = () => {
  const { token } = useAuth();
  const [contests, setContests] = useState<FavoriteContest[]>([]);
  const [teams, setTeams] = useState<FavoriteTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiGet<{
        success: boolean;
        data: {
          contests: FavoriteContest[];
          teams: FavoriteTeam[];
        };
      }>("/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setContests(response.data.contests);
      setTeams(response.data.teams);
    } catch (error) {
      console.error("관심사 목록을 불러오는데 실패했습니다:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const removeFavorite = async (id: string) => {
    if (!token) return;

    try {
      await apiDelete(`/api/favorites/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 목록에서 제거
      setContests((prev) => prev.filter((c) => c.id !== id));
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("관심사 제거에 실패했습니다:", error);
      alert("관심사 제거에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [token, fetchFavorites]);

  if (loading) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center text-slate-500">
            관심사를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">관심 팀</h2>
          {teams.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <FavoriteTeamCard
                  key={team.id}
                  team={team}
                  onRemove={removeFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">
              관심 팀이 없습니다.
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            관심 공모전/대회
          </h2>
          {contests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contests.map((contest) => (
                <FavoriteContestCard
                  key={contest.id}
                  contest={contest}
                  onRemove={removeFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">
              관심 공모전이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AccountContent = () => {
  const { token, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState<string>("");
  const [jobFieldInput, setJobFieldInput] = useState<string>("");
  const [isJobFieldCustom, setIsJobFieldCustom] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 직군 선택지
  const jobFieldOptions = [
    "기획자",
    "디자이너",
    "프론트엔드",
    "백엔드",
    "풀스택",
    "데이터",
    "마케팅",
    "영상/콘텐츠",
  ];

  // 스킬 선택지 (일반적인 스킬들)
  const skillOptions = [
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "React",
    "Vue",
    "Node.js",
    "Figma",
    "발표 능력",
    "프로젝트 관리",
    "디자인",
    "마케팅",
    "데이터 분석",
  ];
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    region: "",
    district: "",
    school: "",
    status: "재학중",
    major: "",
    birth_date: "",
    job_field: "개발자",
    github_url: "",
    figma_url: "",
  });

  // 사용자 정보 로드
  const fetchUserInfo = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiGet<{
        success: boolean;
        data: {
          user: {
            id: string;
            email: string;
            name: string;
            region: string;
            school: string;
            major: string;
            birth_date: string;
            job_field: string;
            skills: string;
            github_url?: string | null;
            figma_url?: string | null;
          };
        };
      }>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = response.data.user;

      // birth_date를 YYYY-MM-DD 형식으로 변환 (input type="date"용)
      let formattedBirthDate = "";
      if (user.birth_date) {
        try {
          const date = new Date(user.birth_date);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            formattedBirthDate = `${year}-${month}-${day}`;
          }
        } catch (e) {
          console.error("Date parsing error:", e);
        }
      }

      const userJobField = user.job_field || "";
      const isCustomJobField =
        userJobField && !jobFieldOptions.includes(userJobField);

      setFormData({
        name: user.name || "",
        email: user.email || "",
        region: user.region || "",
        district: "", // 별도 필드가 없으므로 빈 문자열
        school: user.school || "",
        status: "재학중", // 별도 필드가 없으므로 기본값
        major: user.major || "",
        birth_date: formattedBirthDate,
        job_field: userJobField || "",
        github_url: user.github_url || "",
        figma_url: user.figma_url || "",
      });

      // 직군 커스텀 모드 설정
      setIsJobFieldCustom(isCustomJobField);
      if (isCustomJobField) {
        setJobFieldInput(userJobField);
      }

      // 스킬 설정
      if (user.skills) {
        const skillList = user.skills
          .split(",")
          .map((skill: string) => skill.trim())
          .filter((skill: string) => skill.length > 0);
        setSkills(skillList);
      }
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      alert("사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 직군이 선택지에 있으면 커스텀 모드 해제
    if (name === "job_field") {
      if (jobFieldOptions.includes(value)) {
        setIsJobFieldCustom(false);
      } else {
        setIsJobFieldCustom(true);
        setJobFieldInput(value);
      }
    }
  };

  const handleJobFieldSelect = (value: string) => {
    if (value === "직접 입력") {
      setIsJobFieldCustom(true);
      setJobFieldInput(formData.job_field);
    } else {
      setIsJobFieldCustom(false);
      setFormData((prev) => ({
        ...prev,
        job_field: value,
      }));
    }
  };

  const handleJobFieldInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setJobFieldInput(value);
    setFormData((prev) => ({
      ...prev,
      job_field: value,
    }));
  };

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setNewSkill("");
    }
  };

  const handleSkillSelect = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // 필수 항목 검증
  const validateRequiredFields = (): boolean => {
    const requiredFields = {
      name: formData.name.trim(),
      region: formData.region.trim(),
      school: formData.school.trim(),
      status: formData.status,
      birth_date: formData.birth_date,
      job_field: formData.job_field.trim(),
    };

    const missingFields: string[] = [];

    if (!requiredFields.name) missingFields.push("이름");
    if (!requiredFields.region) missingFields.push("지역 (시/도)");
    if (!requiredFields.school) missingFields.push("학교명");
    if (!requiredFields.status) missingFields.push("상태");
    if (!requiredFields.birth_date) missingFields.push("생년월일");
    if (!requiredFields.job_field) missingFields.push("직군");
    if (skills.length === 0) missingFields.push("스킬");

    if (missingFields.length > 0) {
      setToast({
        type: "error",
        message: `필수 항목을 입력해 주세요: ${missingFields.join(", ")}`,
      });
      setTimeout(() => setToast(null), 3000);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 필수 항목 검증
    if (!validateRequiredFields()) {
      return;
    }

    setSaving(true);
    try {
      await apiPut(
        "/api/auth/me",
        {
          name: formData.name,
          region: formData.region,
          school: formData.school,
          major: formData.major,
          birth_date: formData.birth_date || null,
          job_field: formData.job_field,
          skills: skills.join(", "),
          github_url: formData.github_url,
          figma_url: formData.figma_url,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 성공 토스트 표시
      setToast({
        type: "success",
        message: "사용자 정보가 성공적으로 저장되었습니다!",
      });

      // 토스트 자동 숨김
      setTimeout(() => setToast(null), 3000);

      // AuthContext의 사용자 정보도 즉시 업데이트
      updateUser({
        name: formData.name,
        region: formData.region,
      });

      // 저장 후 서버에서 최신 데이터 다시 가져오기
      await fetchUserInfo();

      // 수정 모드 종료
      setIsEditing(false);
    } catch (error) {
      console.error("사용자 정보 저장 실패:", error);
      setToast({ type: "error", message: "사용자 정보 저장에 실패했습니다." });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 원래 데이터로 복원
    fetchUserInfo();
  };

  // 입력 필드 공통 스타일
  const getInputClassName = () => {
    return `w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
      isEditing
        ? "border-slate-300 focus:border-slate-500 focus:ring-slate-500"
        : "border-slate-200 bg-slate-50 text-slate-900 cursor-not-allowed"
    }`;
  };

  // select 필드 공통 스타일
  const getSelectClassName = () => {
    return `w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
      isEditing
        ? "border-slate-300 focus:border-slate-500 focus:ring-slate-500"
        : "border-slate-200 bg-slate-50 text-slate-900 cursor-not-allowed"
    }`;
  };

  if (loading) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center text-slate-500">
            사용자 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center">
            <div className="text-slate-500">
              <p className="text-lg">로그인이 필요합니다.</p>
              <p className="mt-2 text-sm">계정 관리를 위해 로그인해주세요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">계정 관리</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-slate-900 px-6 py-2 text-white hover:bg-slate-800 transition-colors"
            >
              수정
            </button>
          )}
        </div>

        {/* 필수 입력 안내 */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">
            <span className="text-red-500 font-semibold">*</span> 표시된 항목은
            필수 입력 값입니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              기본 정보
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  지역 (시/도) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  placeholder="예: 서울특별시"
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  지역 (시/군/구)
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="예: 강남구"
                  className={getInputClassName()}
                />
              </div>
            </div>
          </div>

          {/* 학력 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              학력 정보
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  학교명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  상태 <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={getSelectClassName()}
                >
                  <option value="재학중">재학중</option>
                  <option value="졸업">졸업</option>
                  <option value="휴학중">휴학중</option>
                  <option value="취준생">취준생</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  전공명
                </label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={getInputClassName()}
                />
              </div>
            </div>
          </div>

          {/* 추가 개인 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              추가 개인 정보
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                생년월일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={getInputClassName()}
              />
            </div>
          </div>

          {/* 직군 및 스킬 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              직군 및 스킬
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  직군 <span className="text-red-500">*</span>
                </label>
                {isJobFieldCustom ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={jobFieldInput}
                      onChange={handleJobFieldInputChange}
                      disabled={!isEditing}
                      placeholder="직군을 직접 입력하세요"
                      className={getInputClassName()}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsJobFieldCustom(false);
                        setJobFieldInput("");
                      }}
                      disabled={!isEditing}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:text-slate-400"
                    >
                      선택지에서 선택하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      name="job_field"
                      value={formData.job_field}
                      onChange={(e) => handleJobFieldSelect(e.target.value)}
                      disabled={!isEditing}
                      className={getSelectClassName()}
                    >
                      <option value="">직군을 선택하세요</option>
                      {jobFieldOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="직접 입력">직접 입력</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  스킬 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {/* 스킬 선택지 */}
                  {isEditing && skillOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skillOptions
                        .filter((skill) => !skills.includes(skill))
                        .map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillSelect(skill)}
                            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-blue-500 hover:text-blue-700 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                    </div>
                  )}
                  {/* 스킬 입력 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!isEditing}
                      placeholder="스킬을 입력하고 Enter를 누르세요"
                      className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 disabled:bg-slate-100 disabled:border-slate-200"
                      list="skill-suggestions"
                    />
                    <datalist id="skill-suggestions">
                      {skillOptions.map((skill) => (
                        <option key={skill} value={skill} />
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      disabled={!isEditing || !newSkill.trim()}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      추가
                    </button>
                  </div>
                  {/* 스킬 태그 표시 */}
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                        >
                          {skill}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                              title="제거"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      최소 1개 이상의 스킬을 입력해주세요
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 연락처 및 SNS */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              연락처 및 SNS
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://github.com/username"
                  className={getInputClassName()}
                />
                <p className="mt-1 text-xs text-slate-500">
                  GitHub 프로필 URL을 입력하면 활동 통계가 표시됩니다.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Figma URL
                </label>
                <input
                  type="url"
                  name="figma_url"
                  value={formData.figma_url}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://www.figma.com/file/..."
                  className={getInputClassName()}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Figma 파일 URL을 입력하면 디자인을 미리볼 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-8 py-3 text-slate-900 hover:bg-slate-50 disabled:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-8 py-3 text-white hover:bg-slate-800 disabled:bg-slate-400"
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          )}
        </form>

        {/* 토스트 알림 - 하단 중앙 */}
        {toast && (
          <div
            className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="text-white hover:text-gray-200 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


type Nudge = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  team_id: string | null;
  contest_id: string | null;
  message: string;
  status: string;
  created_at: string;
  to_user_name: string;
  to_user_email: string;
  to_user_region: string;
  to_user_job_field: string;
  team_name: string | null;
};

const TeamManageContent = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [selectedTeamNudges, setSelectedTeamNudges] = useState<Nudge[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "accepted" | "pending" | "invited">("all");
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewState, setReviewState] = useState<
    Record<string, { rating: number; comment: string }>
  >({});

  // 내가 속한 팀 목록 조회
  const fetchMyTeams = useCallback(async () => {
    if (!token) return;

    try {
      const teamsResponse = await apiGet<{
        success: boolean;
        data: { teams: Team[] };
      }>("/api/teams/my-teams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyTeams(teamsResponse.data.teams);
      if (teamsResponse.data.teams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsResponse.data.teams[0].id);
      }
    } catch (error) {
      console.error("내 팀 목록 조회 실패:", error);
      alert("팀 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token, selectedTeamId]);

  // 선택한 팀의 상세 정보 및 멤버 조회
  const fetchTeamDetail = useCallback(async () => {
    if (!token || !selectedTeamId) return;

    try {
      const teamDetailResponse = await apiGet<{
        success: boolean;
        data: { team: Team; members: TeamMember[] };
      }>(`/api/teams/${selectedTeamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedTeam({
        team: teamDetailResponse.data.team,
        members: teamDetailResponse.data.members,
      });
    } catch (error) {
      console.error("팀 정보 조회 실패:", error);
      setSelectedTeam(null);
    }
  }, [token, selectedTeamId]);

  // 선택한 팀에 대한 초대(찔러보기) 목록 조회
  const fetchTeamNudges = useCallback(async () => {
    if (!token || !selectedTeamId) return;

    try {
      // 보낸 찔러보기 목록 조회
      const nudgesResponse = await apiGet<{
        success: boolean;
        data: { nudges: Nudge[] };
      }>("/api/nudges/sent?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 선택한 팀에 대한 찔러보기만 필터링
      const teamNudges = nudgesResponse.data.nudges.filter(
        (nudge) => nudge.team_id === selectedTeamId
      );

      setSelectedTeamNudges(teamNudges);
    } catch (error) {
      console.error("찔러보기 목록 조회 실패:", error);
      setSelectedTeamNudges([]);
    }
  }, [token, selectedTeamId]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamDetail();
      fetchTeamNudges();
    }
  }, [selectedTeamId, fetchTeamDetail, fetchTeamNudges]);

  if (loading) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center text-slate-500">
            팀 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  // 팀원 삭제
  const handleRemoveMember = async (memberId: string) => {
    if (!token || !selectedTeamId) return;

    if (!window.confirm("정말로 이 팀원을 제거하시겠습니까?")) {
      return;
    }

    try {
      await apiDelete(`/api/teams/${selectedTeamId}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("팀원이 제거되었습니다.");
      fetchTeamDetail();
    } catch (error) {
      console.error("팀원 제거 실패:", error);
      alert("팀원 제거에 실패했습니다.");
    }
  };

  // 지원자 승인/거절
  const handleApproveMember = async (memberId: string) => {
    if (!token || !selectedTeamId) return;

    try {
      await apiPost(
        `/api/teams/${selectedTeamId}/members/${memberId}`,
        { status: "accepted" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("팀 가입을 승인했습니다.");
      fetchTeamDetail();
    } catch (error) {
      console.error("승인 처리 오류:", error);
      alert("승인 처리에 실패했습니다.");
    }
  };

  const handleRejectMember = async (memberId: string) => {
    if (!token || !selectedTeamId) return;

    try {
      await apiPost(
        `/api/teams/${selectedTeamId}/members/${memberId}`,
        { status: "rejected" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("팀 가입을 거절했습니다.");
      fetchTeamDetail();
    } catch (error) {
      console.error("거절 처리 오류:", error);
      alert("거절 처리에 실패했습니다.");
    }
  };

  // 초대 삭제 (찔러보기 삭제)
  const handleDeleteNudge = async (nudgeId: string) => {
    if (!token) return;

    if (!window.confirm("정말로 이 초대를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await apiDelete(`/api/nudges/${nudgeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("초대가 삭제되었습니다.");
      fetchTeamNudges();
    } catch (error) {
      console.error("초대 삭제 실패:", error);
      alert("초대 삭제에 실패했습니다.");
    }
  };

  if (myTeams.length === 0) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">팀원 관리</h2>
            <p className="mt-1 text-sm text-slate-600">
              내가 속한 팀의 멤버들을 관리하고 가입 신청을 처리할 수 있습니다.
            </p>
          </div>

          <div className="text-center">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
              <div className="text-slate-500">
                <p className="text-lg">아직 참여한 팀이 없습니다.</p>
                <p className="mt-2 text-sm">
                  팀에 가입하거나 새 팀을 만들어보세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLeader = selectedTeam?.team.created_by === user?.id;
  const acceptedMembers = selectedTeam?.members.filter((m) => m.status === "accepted") || [];
  const pendingMembers = selectedTeam?.members.filter((m) => m.status === "pending") || [];

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">팀원 관리</h2>
          <p className="mt-1 text-sm text-slate-600">
            내가 속한 팀의 멤버들을 관리하고 가입 신청을 처리할 수 있습니다.
          </p>
        </div>

        {/* 팀 선택 드롭다운 */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            팀 선택
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {myTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* 사용자 상태 필터 드롭다운 */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            사용자 상태 필터
          </label>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "accepted" | "pending" | "invited"
                )
              }
              className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">전체</option>
              <option value="accepted">소속된 팀원</option>
              <option value="pending">지원한 사용자</option>
              <option value="invited">초대된 사용자</option>
            </select>
            {isLeader && acceptedMembers.length > 0 && (
              <button
                onClick={() => setShowReview(true)}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                프로젝트 완료
              </button>
            )}
          </div>
        </div>

        {/* 필터에 따른 리스트 표시 */}
        {statusFilter === "all" && (
          <div className="space-y-6">
            {/* 소속된 팀원 */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                소속된 팀원 ({acceptedMembers.length}명)
              </h3>
              {acceptedMembers.length > 0 ? (
                <div className="space-y-3">
                  {acceptedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">
                              {member.name}
                            </h4>
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              {member.role || "팀원"}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {member.email}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            직군: {member.job_field || "미지정"} · 스킬:{" "}
                            {member.skills || "없음"}
                          </div>
                        </div>
                      </div>
                      {isLeader && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
                  소속된 팀원이 없습니다.
                </div>
              )}
            </div>

            {/* 지원한 사용자 */}
            {isLeader && (
              <div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  지원한 사용자 ({pendingMembers.length}명)
                </h3>
                {pendingMembers.length > 0 ? (
                  <div className="space-y-3">
                    {pendingMembers.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-300 transition-colors"
                              onClick={() =>
                                navigate(`/profile/${member.user_id}`)
                              }
                            >
                              {member.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <Link
                                to={`/profile/${member.user_id}`}
                                className="font-semibold text-slate-900 hover:text-blue-600"
                              >
                                {member.name}
                              </Link>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                  신청 역할: {member.role || "미지정"}
                                </span>
                                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                  대기중
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-slate-600">
                                {member.email}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                직군: {member.job_field || "미지정"} · 스킬:{" "}
                                {member.skills || "없음"}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveMember(member.id)}
                              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                            >
                              수락
                            </button>
                            <button
                              onClick={() => handleRejectMember(member.id)}
                              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                              거절
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
                    새로운 가입 신청이 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 초대된 사용자 */}
            {isLeader && (
              <div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  초대된 사용자 ({selectedTeamNudges.length}명)
                </h3>
                {selectedTeamNudges.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTeamNudges.map((nudge) => (
                      <div
                        key={nudge.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                            {nudge.to_user_name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900">
                                {nudge.to_user_name}
                              </h4>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  nudge.status === "sent"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : nudge.status === "read"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {nudge.status === "sent"
                                  ? "대기"
                                  : nudge.status === "read"
                                  ? "읽음"
                                  : nudge.status}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {nudge.to_user_email}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {nudge.message}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNudge(nudge.id)}
                          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
                    초대한 사용자가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 필터 적용된 단일 리스트 */}
        {statusFilter !== "all" && (
          <div className="space-y-3">
            {statusFilter === "accepted" && (
              <>
                {acceptedMembers.length > 0 ? (
                  acceptedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">
                              {member.name}
                            </h4>
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              {member.role || "팀원"}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      {isLeader && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
                    소속된 팀원이 없습니다.
                  </div>
                )}
              </>
            )}

            {statusFilter === "pending" && isLeader && (
              <>
                {pendingMembers.length > 0 ? (
                  pendingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-300 transition-colors"
                            onClick={() =>
                              navigate(`/profile/${member.user_id}`)
                            }
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <Link
                              to={`/profile/${member.user_id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600"
                            >
                              {member.name}
                            </Link>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-sm text-slate-600">
                                신청 역할: {member.role || "미지정"}
                              </span>
                              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                대기중
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveMember(member.id)}
                            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            수락
                          </button>
                          <button
                            onClick={() => handleRejectMember(member.id)}
                            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
                    새로운 가입 신청이 없습니다.
                  </div>
                )}
              </>
            )}

            {statusFilter === "invited" && isLeader && (
              <>
                {selectedTeamNudges.length > 0 ? (
                  selectedTeamNudges.map((nudge) => (
                    <div
                      key={nudge.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                          {nudge.to_user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">
                              {nudge.to_user_name}
                            </h4>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                nudge.status === "sent"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : nudge.status === "read"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {nudge.status === "sent"
                                ? "대기"
                                : nudge.status === "read"
                                ? "읽음"
                                : nudge.status}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {nudge.to_user_email}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {nudge.message}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNudge(nudge.id)}
                        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
                    초대한 사용자가 없습니다.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 프로젝트 완료 리뷰 모달 */}
        {showReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  프로젝트 완료 · 팀원 리뷰
                </h3>
                <button
                  onClick={() => setShowReview(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                {acceptedMembers.map((m) => (
                  <div key={m.id} className="rounded border border-slate-200 p-3">
                    <div className="mb-2 text-sm font-medium text-slate-900">
                      {m.name}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          평점(1~5)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={reviewState[m.id]?.rating ?? 5}
                          onChange={(e) =>
                            setReviewState((prev) => ({
                              ...prev,
                              [m.id]: {
                                rating: Number(e.target.value),
                                comment: prev[m.id]?.comment ?? "",
                              },
                            }))
                          }
                          className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-600 mb-1">
                          코멘트(선택)
                        </label>
                        <input
                          type="text"
                          value={reviewState[m.id]?.comment ?? ""}
                          onChange={(e) =>
                            setReviewState((prev) => ({
                              ...prev,
                              [m.id]: {
                                rating: prev[m.id]?.rating ?? 5,
                                comment: e.target.value,
                              },
                            }))
                          }
                          placeholder="함께한 소감, 강점/보완점 등을 작성해 주세요"
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowReview(false)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (!token || !selectedTeamId) return;
                    const payload = {
                      reviews: acceptedMembers.map((m) => ({
                        memberId: m.id,
                        rating: reviewState[m.id]?.rating ?? 5,
                        comment: reviewState[m.id]?.comment ?? "",
                      })),
                    };
                    try {
                      await apiPost(`/api/teams/${selectedTeamId}/reviews`, payload, {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                      });
                      alert("리뷰가 저장되었습니다. 수고하셨습니다!");
                      setShowReview(false);
                      setReviewState({});
                    } catch (e) {
                      console.error(e);
                      alert("리뷰 저장 중 오류가 발생했습니다.");
                    }
                  }}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TeamCreateForm = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    area: "",
    description: "",
    maxMembers: 4,
    deadline: "",
    projectTitle: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost(
        "/api/teams",
        {
          name: formData.name,
          region: formData.region,
          area: formData.area,
          description: formData.description,
          max_members: parseInt(formData.maxMembers.toString()),
          deadline: formData.deadline,
          project_title: formData.projectTitle,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const responseData = response as { success: boolean };
      if (responseData.success) {
        alert("모집 공고가 성공적으로 등록되었습니다!");
        navigate("/mypage/posts");
      } else {
        alert("모집 공고 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("팀 등록 오류:", error);
      alert("팀 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">팀 등록</h2>
          <p className="mt-2 text-slate-600">
            새로운 팀을 만들어 함께할 멤버들을 모집해보세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              팀 이름 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="예: AI 혁신팀"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-slate-700"
              >
                지역 *
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">지역을 선택하세요</option>
                <option value="서울">서울</option>
                <option value="부산">부산</option>
                <option value="대구">대구</option>
                <option value="인천">인천</option>
                <option value="광주">광주</option>
                <option value="대전">대전</option>
                <option value="울산">울산</option>
                <option value="세종">세종</option>
                <option value="경기">경기</option>
                <option value="강원">강원</option>
                <option value="충북">충북</option>
                <option value="충남">충남</option>
                <option value="전북">전북</option>
                <option value="전남">전남</option>
                <option value="경북">경북</option>
                <option value="경남">경남</option>
                <option value="제주">제주</option>
                <option value="전국">전국</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="area"
                className="block text-sm font-medium text-slate-700"
              >
                분야 *
              </label>
              <select
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">분야를 선택하세요</option>
                <option value="해커톤">해커톤</option>
                <option value="AI/ML">AI/ML</option>
                <option value="웹 개발">웹 개발</option>
                <option value="모바일">모바일</option>
                <option value="게임 개발">게임 개발</option>
                <option value="블록체인">블록체인</option>
                <option value="IoT">IoT</option>
                <option value="AR/VR">AR/VR</option>
                <option value="핀테크">핀테크</option>
                <option value="헬스케어">헬스케어</option>
                <option value="에듀테크">에듀테크</option>
                <option value="그린테크">그린테크</option>
                <option value="푸드테크">푸드테크</option>
                <option value="소셜 임팩트">소셜 임팩트</option>
                <option value="창업">창업</option>
                <option value="디자인">디자인</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="projectTitle"
              className="block text-sm font-medium text-slate-700"
            >
              프로젝트 제목 *
            </label>
            <input
              type="text"
              id="projectTitle"
              name="projectTitle"
              value={formData.projectTitle}
              onChange={handleInputChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="예: AI 기반 의료 진단 서비스"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700"
            >
              팀 소개 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="팀의 목표, 진행할 프로젝트, 필요한 멤버 등에 대해 자세히 설명해주세요."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="maxMembers"
                className="block text-sm font-medium text-slate-700"
              >
                최대 멤버 수 *
              </label>
              <select
                id="maxMembers"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value={3}>3명</option>
                <option value={4}>4명</option>
                <option value={5}>5명</option>
                <option value={6}>6명</option>
                <option value={7}>7명</option>
                <option value={8}>8명</option>
                <option value={9}>9명</option>
                <option value={10}>10명</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-slate-700"
              >
                모집 마감일 *
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split("T")[0]}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/team")}
              className="flex-1 rounded-lg border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 disabled:bg-slate-400"
            >
              {loading ? "등록 중..." : "팀 등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MyPage = () => {
  const { pathname } = useLocation();

  const renderContent = (() => {
    if (pathname === "/mypage/favorites") return <FavoritesContent />;
    if (pathname === "/mypage/profile") return <ProfileForm />;
    if (pathname === "/mypage/posts") return <RecruitmentPostManageContent />;
    if (pathname === "/mypage/posts/create") return <RecruitmentPostCreateForm />;
    if (pathname === "/mypage/team-registration")
      return <TeamRegistrationManageContent />;
    if (pathname === "/mypage/manage") return <TeamManageContent />;
    return <AccountContent />;
  })();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-8">
        <div className="flex gap-8">
          <aside className="w-40 space-y-6 text-sm">
            <div>
              <div className="mb-2 text-slate-500">회원</div>
              <nav className="space-y-1">
                <SideLink to="/mypage/account" label="계정" />
                <SideLink to="/mypage/favorites" label="관심" />
                <SideLink to="/mypage/profile" label="프로필" />
              </nav>
            </div>
            <div>
              <div className="mb-2 text-slate-500">팀</div>
              <nav className="space-y-1">
                <SideLink to="/mypage/posts" label="모집 공고" />
                <SideLink to="/mypage/team-registration" label="팀 등록 관리" />
                <SideLink to="/mypage/manage" label="팀원 관리" />
              </nav>
            </div>
          </aside>
          {renderContent}
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default MyPage;
