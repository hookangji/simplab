import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet, apiDelete } from "../../shared/api";

type Team = {
  id: string;
  name: string;
  region?: string;
  area?: string;
  description?: string;
  project_title?: string;
  max_members: number;
  current_members: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
};

const RecruitmentPostManageContent = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeamPosts, setSelectedTeamPosts] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // 사용자가 속한 모든 팀 목록 조회
  const fetchMyTeams = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiGet<{
        success: boolean;
        data: { teams: Team[] };
      }>("/api/teams/my-teams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyTeams(response.data.teams);
      if (response.data.teams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(response.data.teams[0].id);
      }
    } catch (error) {
      console.error("내가 속한 팀 목록 조회 실패:", error);
      alert("팀 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token, selectedTeamId]);

  // 선택한 팀의 모집 공고 조회 (내가 만든 팀 중에서)
  const fetchTeamPosts = useCallback(async () => {
    if (!token || !selectedTeamId) return;

    try {
      // 내가 만든 팀 목록 조회
      const response = await apiGet<{
        success: boolean;
        data: { teams: Team[] };
      }>("/api/teams/my-created-teams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 선택한 팀의 공고만 필터링
      const posts = response.data.teams.filter(
        (team) => team.id === selectedTeamId
      );

      setSelectedTeamPosts(posts);
    } catch (error) {
      console.error("모집 공고 조회 실패:", error);
      // 내가 만든 팀이 아닐 수도 있으므로 에러는 무시
      setSelectedTeamPosts([]);
    }
  }, [token, selectedTeamId]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamPosts();
    }
  }, [selectedTeamId, fetchTeamPosts]);

  // 모집 공고 삭제
  const handleDeletePost = async (teamId: string, teamName: string) => {
    if (!token) return;

    if (
      !window.confirm(
        `"${teamName}" 팀의 모집 공고를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      await apiDelete(`/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("모집 공고가 삭제되었습니다.");
      fetchTeamPosts();
      fetchMyTeams();
    } catch (error) {
      console.error("모집 공고 삭제 실패:", error);
      alert("모집 공고 삭제에 실패했습니다.");
    }
  };

  // 모집 상태 확인
  const getRecruitmentStatus = (team: Team) => {
    if (!team.deadline) {
      return { label: "모집 중", color: "bg-green-100 text-green-800" };
    }

    const deadline = new Date(team.deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    if (deadline < now) {
      return { label: "마감", color: "bg-red-100 text-red-800" };
    }

    if (team.current_members >= team.max_members) {
      return { label: "마감", color: "bg-red-100 text-red-800" };
    }

    return { label: "모집 중", color: "bg-green-100 text-green-800" };
  };

  // 등록일 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center text-slate-500">
            모집 공고 정보를 불러오는 중...
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
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
              <div className="text-slate-500">
                <p className="text-lg">로그인이 필요합니다.</p>
                <p className="mt-2 text-sm">
                  모집 공고 관리를 위해 로그인해주세요.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-block rounded bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
                >
                  로그인하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                모집 공고 관리
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                모집 공고를 등록하고 관리할 수 있습니다.
              </p>
            </div>
            <Link
              to="/mypage/posts/create"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              새 공고 등록
            </Link>
          </div>

          <div className="text-center">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
              <div className="text-slate-500">
                <p className="text-lg">아직 속한 팀이 없습니다.</p>
                <p className="mt-2 text-sm">
                  먼저 팀을 만들고 모집 공고를 등록해보세요.
                </p>
                <Link
                  to="/mypage/posts/create"
                  className="mt-4 inline-block rounded bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
                >
                  새 공고 등록
                </Link>
              </div>
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
          <div>
            <h2 className="text-xl font-bold text-slate-900">모집 공고 관리</h2>
            <p className="mt-1 text-sm text-slate-600">
              팀별 모집 공고를 관리하고 수정할 수 있습니다.
            </p>
          </div>
          <Link
            to="/mypage/posts/create"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            새 공고 등록
          </Link>
        </div>

        {/* 팀 선택 드롭다운 */}
        <div className="mb-6">
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

        {/* 모집 공고 리스트 */}
        <div className="space-y-4">
          {selectedTeamPosts.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-500">
                선택한 팀의 모집 공고가 없습니다.
                <br />새 공고를 등록해보세요.
              </p>
            </div>
          ) : (
            selectedTeamPosts.map((post) => {
              const status = getRecruitmentStatus(post);
              return (
                <div
                  key={post.id}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {post.project_title || post.name}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="mb-2 text-sm text-slate-600">
                        등록일: {formatDate(post.created_at)}
                      </div>
                      <div className="text-sm text-slate-700">
                        <span className="font-medium">모집 분야:</span>{" "}
                        {post.area || "미지정"}
                        {post.region && ` · ${post.region}`}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-medium">모집 인원:</span>{" "}
                        {post.current_members}/{post.max_members}명
                      </div>
                      {post.deadline && (
                        <div className="mt-1 text-sm text-slate-700">
                          <span className="font-medium">마감일:</span>{" "}
                          {formatDate(post.deadline)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => {
                          // 수정 페이지로 이동 (팀 정보 수정)
                          navigate(`/mypage/team-registration`, {
                            state: { teamId: post.id, edit: true },
                          });
                        }}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id, post.name)}
                        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  {post.description && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {post.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruitmentPostManageContent;
