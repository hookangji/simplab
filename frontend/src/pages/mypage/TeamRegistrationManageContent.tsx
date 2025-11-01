import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "../../shared/api";

type Team = {
  id: string;
  name: string;
  region?: string;
  area?: string;
  description?: string;
  image_url?: string;
  area_keywords?: string;
  progress_stage?: string;
  meeting_schedule?: string;
  available_time_slots?: string;
  collaboration_style?: string;
  collaboration_tools?: string;
  created_by?: string;
};

type TeamProject = {
  id: string;
  team_id: string;
  project_name: string;
  start_date?: string;
  end_date?: string;
  is_ongoing: boolean;
  summary?: string;
  tech_stack: string[];
  result_link?: string;
  performance_indicators?: string;
  images: string[];
  created_at: string;
  updated_at: string;
};

const TeamRegistrationManageContent = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    area: "",
    description: "",
    image_url: "",
    area_keywords: "",
    progress_stage: "",
    meeting_schedule: "",
    available_time_slots: "",
    collaboration_style: "",
    collaboration_tools: "",
  });

  // 프로젝트 폼 상태
  const [projectForm, setProjectForm] = useState({
    project_name: "",
    start_date: "",
    end_date: "",
    is_ongoing: false,
    summary: "",
    tech_stack: [] as string[],
    result_link: "",
    performance_indicators: "",
    images: [] as string[],
  });

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const techStackInputRef = useRef<HTMLInputElement>(null);
  const [techStackInput, setTechStackInput] = useState("");

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

  // 선택한 팀의 상세 정보 조회
  const fetchTeamDetail = useCallback(async () => {
    if (!token || !selectedTeamId) return;

    try {
      const response = await apiGet<{
        success: boolean;
        data: { team: Team };
      }>(`/api/teams/${selectedTeamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const team = response.data.team;
      setSelectedTeam(team);

      // 폼 데이터 설정
      setFormData({
        name: team.name || "",
        region: team.region || "",
        area: team.area || "",
        description: team.description || "",
        image_url: team.image_url || "",
        area_keywords: team.area_keywords || "",
        progress_stage: team.progress_stage || "",
        meeting_schedule: team.meeting_schedule || "",
        available_time_slots: team.available_time_slots || "",
        collaboration_style: team.collaboration_style || "",
        collaboration_tools: team.collaboration_tools || "",
      });
    } catch (error) {
      console.error("팀 상세 정보 조회 실패:", error);
      alert("팀 정보를 불러오는데 실패했습니다.");
    }
  }, [token, selectedTeamId]);

  // 프로젝트 목록 조회
  const fetchProjects = useCallback(async () => {
    if (!token || !selectedTeamId) return;

    try {
      const response = await apiGet<{
        success: boolean;
        data: { projects: TeamProject[] };
      }>(`/api/teams/${selectedTeamId}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProjects(response.data.projects || []);
    } catch (error) {
      console.error("프로젝트 목록 조회 실패:", error);
      // 프로젝트가 없을 수도 있으므로 에러는 무시
    }
  }, [token, selectedTeamId]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamDetail();
      fetchProjects();
    }
  }, [selectedTeamId, fetchTeamDetail, fetchProjects]);

  // 팀 프로필 저장
  const handleSaveTeamProfile = async () => {
    if (!token || !selectedTeamId) return;

    setSaving(true);
    try {
      // area_keywords를 배열에서 문자열로 변환 (이미 문자열이면 그대로 사용)
      const areaKeywordsStr = Array.isArray(formData.area_keywords)
        ? JSON.stringify(formData.area_keywords)
        : formData.area_keywords || null;

      // available_time_slots를 배열에서 문자열로 변환
      const availableTimeSlotsStr = Array.isArray(formData.available_time_slots)
        ? JSON.stringify(formData.available_time_slots)
        : formData.available_time_slots || null;

      // undefined 값을 null로 변환
      const payload: Record<string, any> = {
        name: formData.name || null,
        region: formData.region || null,
        area: formData.area || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        area_keywords: areaKeywordsStr,
        progress_stage: formData.progress_stage || null,
        meeting_schedule: formData.meeting_schedule || null,
        available_time_slots: availableTimeSlotsStr,
        collaboration_style: formData.collaboration_style || null,
        collaboration_tools: formData.collaboration_tools || null,
      };

      await apiPut(`/api/teams/${selectedTeamId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("팀 프로필이 성공적으로 저장되었습니다!");
      fetchTeamDetail();
    } catch (error) {
      console.error("팀 프로필 저장 실패:", error);
      alert("팀 프로필 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 프로젝트 저장
  const handleSaveProject = async () => {
    if (!token || !selectedTeamId) return;

    if (!projectForm.project_name.trim()) {
      alert("프로젝트명을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      if (editingProjectId) {
        // 수정
        await apiPut(
          `/api/teams/${selectedTeamId}/projects/${editingProjectId}`,
          projectForm,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // 생성
        await apiPost(`/api/teams/${selectedTeamId}/projects`, projectForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      alert("프로젝트가 성공적으로 저장되었습니다!");
      setProjectForm({
        project_name: "",
        start_date: "",
        end_date: "",
        is_ongoing: false,
        summary: "",
        tech_stack: [],
        result_link: "",
        performance_indicators: "",
        images: [],
      });
      setEditingProjectId(null);
      setTechStackInput("");
      fetchProjects();
    } catch (error) {
      console.error("프로젝트 저장 실패:", error);
      alert("프로젝트 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId: string) => {
    if (!token || !selectedTeamId) return;

    if (!window.confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await apiDelete(`/api/teams/${selectedTeamId}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("프로젝트가 삭제되었습니다.");
      fetchProjects();
    } catch (error) {
      console.error("프로젝트 삭제 실패:", error);
      alert("프로젝트 삭제에 실패했습니다.");
    }
  };

  // 프로젝트 수정 모드
  const handleEditProject = (project: TeamProject) => {
    setProjectForm({
      project_name: project.project_name,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      is_ongoing: project.is_ongoing,
      summary: project.summary || "",
      tech_stack: project.tech_stack || [],
      result_link: project.result_link || "",
      performance_indicators: project.performance_indicators || "",
      images: project.images || [],
    });
    setEditingProjectId(project.id);
  };

  // 기술 스택 태그 추가
  const handleAddTechStack = () => {
    const trimmed = techStackInput.trim();
    if (trimmed && !projectForm.tech_stack.includes(trimmed)) {
      setProjectForm({
        ...projectForm,
        tech_stack: [...projectForm.tech_stack, trimmed],
      });
      setTechStackInput("");
    }
  };

  // 기술 스택 태그 제거
  const handleRemoveTechStack = (tech: string) => {
    setProjectForm({
      ...projectForm,
      tech_stack: projectForm.tech_stack.filter((t) => t !== tech),
    });
  };

  // 분야 키워드 관리
  const [areaKeywordInput, setAreaKeywordInput] = useState("");
  const areaKeywordsList = formData.area_keywords
    ? (formData.area_keywords.includes("[")
        ? JSON.parse(formData.area_keywords)
        : formData.area_keywords.split(",").filter(Boolean)
      ).filter(Boolean)
    : [];

  const handleAddAreaKeyword = () => {
    const trimmed = areaKeywordInput.trim();
    if (trimmed && !areaKeywordsList.includes(trimmed)) {
      const updated = [...areaKeywordsList, trimmed];
      setFormData({
        ...formData,
        area_keywords: JSON.stringify(updated),
      });
      setAreaKeywordInput("");
    }
  };

  const handleRemoveAreaKeyword = (keyword: string) => {
    const updated = areaKeywordsList.filter((k) => k !== keyword);
    setFormData({
      ...formData,
      area_keywords: JSON.stringify(updated),
    });
  };

  // 시간대 선택 관리
  const timeSlotOptions = [
    "평일 오전",
    "평일 오후",
    "평일 저녁",
    "평일 심야",
    "주말 오전",
    "주말 오후",
    "주말 저녁",
    "주말 심야",
  ];

  const availableTimeSlotsList = formData.available_time_slots
    ? (formData.available_time_slots.includes("[")
        ? JSON.parse(formData.available_time_slots)
        : formData.available_time_slots.split(",").filter(Boolean)
      ).filter(Boolean)
    : [];

  const handleToggleTimeSlot = (slot: string) => {
    const updated = availableTimeSlotsList.includes(slot)
      ? availableTimeSlotsList.filter((s) => s !== slot)
      : [...availableTimeSlotsList, slot];
    setFormData({
      ...formData,
      available_time_slots: JSON.stringify(updated),
    });
  };

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

  if (!token) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
              <div className="text-slate-500">
                <p className="text-lg">로그인이 필요합니다.</p>
                <p className="mt-2 text-sm">
                  팀 프로필 관리를 위해 로그인해주세요.
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
                팀 프로필 관리
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                팀 프로필을 관리하고 수정할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/mypage/posts/create")}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              새 팀 등록
            </button>
          </div>

          <div className="text-center">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
              <div className="text-slate-500">
                <p className="text-lg">아직 속한 팀이 없습니다.</p>
                <p className="mt-2 text-sm">새 팀을 만들어보세요.</p>
                <button
                  type="button"
                  onClick={() => navigate("/mypage/posts/create")}
                  className="mt-4 inline-block rounded bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
                >
                  팀 등록하기
                </button>
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
            <h2 className="text-xl font-bold text-slate-900">팀 프로필 관리</h2>
            <p className="mt-1 text-sm text-slate-600">
              팀 프로필을 관리하고 수정할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/mypage/posts/create")}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              새 팀 등록
            </button>
          </div>
        </div>

        {/* 팀 선택 드롭다운 */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            팀 선택
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {myTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTeam && (
          <div className="space-y-6">
            {/* 팀 기본 정보 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                팀 기본 정보
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    팀 대표 이미지
                  </label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="이미지 URL 입력"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    팀 이름
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    분야 (키워드)
                  </label>
                  <div className="mb-2 flex gap-2">
                    <input
                      type="text"
                      value={areaKeywordInput}
                      onChange={(e) => setAreaKeywordInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAreaKeyword();
                        }
                      }}
                      placeholder="키워드 입력 후 Enter"
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddAreaKeyword}
                      className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {areaKeywordsList.map((keyword: string) => (
                      <span
                        key={keyword}
                        className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveAreaKeyword(keyword)}
                          className="hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    지역/활동 권역
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                    placeholder="예: 서울, 경기"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    진행 단계
                  </label>
                  <select
                    value={formData.progress_stage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        progress_stage: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">선택하세요</option>
                    <option value="아이디어 구상">아이디어 구상</option>
                    <option value="초기 개발">초기 개발</option>
                    <option value="프로토타입 완성">프로토타입 완성</option>
                    <option value="운영 중">운영 중</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 팀 소개 섹션 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900">팀 소개</h3>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="팀 소개글을 작성해주세요 (3~5문장 권장)"
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* 프로젝트 관리 섹션 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                진행중인/진행한 프로젝트 관리
              </h3>

              {/* 프로젝트 입력 폼 */}
              <div className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    프로젝트명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectForm.project_name}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        project_name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      시작일
                    </label>
                    <input
                      type="date"
                      value={projectForm.start_date}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          start_date: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      종료일
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={projectForm.end_date}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            end_date: e.target.value,
                          })
                        }
                        disabled={projectForm.is_ongoing}
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100"
                      />
                      <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={projectForm.is_ongoing}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
                              is_ongoing: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        진행중
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    활용 요약
                  </label>
                  <textarea
                    value={projectForm.summary}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        summary: e.target.value,
                      })
                    }
                    placeholder="프로젝트의 활용 방법과 요약"
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    사용 기술 스택
                  </label>
                  <div className="mb-2 flex gap-2">
                    <input
                      ref={techStackInputRef}
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTechStack();
                        }
                      }}
                      placeholder="기술 스택 입력 후 Enter"
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddTechStack}
                      className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projectForm.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => handleRemoveTechStack(tech)}
                          className="hover:text-green-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    결과물 링크
                  </label>
                  <input
                    type="url"
                    value={projectForm.result_link}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        result_link: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    성과 지표
                  </label>
                  <textarea
                    value={projectForm.performance_indicators}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        performance_indicators: e.target.value,
                      })
                    }
                    placeholder="성과 지표를 입력해주세요"
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    이미지 첨부
                  </label>
                  <input
                    type="text"
                    value={projectForm.images.join(", ")}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        images: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="이미지 URL (쉼표로 구분)"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveProject}
                    disabled={saving}
                    className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {editingProjectId ? "수정" : "저장"}
                  </button>
                  {editingProjectId && (
                    <button
                      type="button"
                      onClick={() => {
                        setProjectForm({
                          project_name: "",
                          start_date: "",
                          end_date: "",
                          is_ongoing: false,
                          summary: "",
                          tech_stack: [],
                          result_link: "",
                          performance_indicators: "",
                          images: [],
                        });
                        setEditingProjectId(null);
                        setTechStackInput("");
                      }}
                      className="rounded bg-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-400"
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>

              {/* 프로젝트 리스트 */}
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">
                          {project.project_name}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {project.start_date && project.end_date
                            ? `${project.start_date} ~ ${
                                project.is_ongoing ? "진행중" : project.end_date
                              }`
                            : project.is_ongoing
                            ? "진행중"
                            : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditProject(project)}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project.id)}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {project.summary && (
                      <p className="mb-2 text-sm text-slate-700">
                        {project.summary}
                      </p>
                    )}

                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {project.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {project.result_link && (
                      <a
                        href={project.result_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        결과물 보기 →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 운영 정보 섹션 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                운영 정보
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    협업 방식
                  </label>
                  <textarea
                    value={formData.collaboration_style}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collaboration_style: e.target.value,
                      })
                    }
                    placeholder="팀의 협업 방식을 입력해주세요"
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    회의 주기 및 방식
                  </label>
                  <input
                    type="text"
                    value={formData.meeting_schedule}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        meeting_schedule: e.target.value,
                      })
                    }
                    placeholder="예: 주 1회 온라인, 월 2회 오프라인"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    사용 도구
                  </label>
                  <input
                    type="text"
                    value={formData.collaboration_tools}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collaboration_tools: e.target.value,
                      })
                    }
                    placeholder="예: Slack, Notion, GitHub, Figma"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    팀 활동 가능 시간대
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlotOptions.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleToggleTimeSlot(slot)}
                        className={`rounded px-3 py-2 text-sm ${
                          availableTimeSlotsList.includes(slot)
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveTeamProfile}
                disabled={saving}
                className="rounded bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "저장 중..." : "팀 프로필 저장"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamRegistrationManageContent;
