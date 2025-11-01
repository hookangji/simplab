import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet, apiPost, apiPut } from "../../shared/api";

type Team = {
  id: string;
  name: string;
  region?: string;
  area?: string;
};

type SeekingMember = {
  role: string;
  tasks: string;
  skills: string;
};

type CurrentMember = {
  user_id?: string;
  name: string;
  role: string;
};

const RecruitmentPostCreateForm = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [externalLinks, setExternalLinks] = useState<
    { url: string; icon?: string }[]
  >([]);
  const [linkInput, setLinkInput] = useState("");

  // 기본 개요
  const [formData, setFormData] = useState({
    team_id: "",
    post_title: "",
    project_title: "",
    category: "",
    progress_stage: "",
    deadline: "",
    recruitment_count: 1,
  });

  // 공모전/대회 정보
  const [contestData, setContestData] = useState({
    poster_url: "",
    contest_name: "",
    topic: "",
    description: "",
    prize_info: "",
  });

  // 팀 프로젝트 개요
  const [projectData, setProjectData] = useState({
    problem: "",
    future_direction: "",
    purpose: "",
  });

  // 구하는 팀원
  const [seekingMembers, setSeekingMembers] = useState<SeekingMember[]>([]);

  // 현재 팀원
  const [currentMembers, setCurrentMembers] = useState<CurrentMember[]>([]);

  // 협업 방식
  const [collaborationData, setCollaborationData] = useState({
    meeting_frequency: "",
    meeting_style: "",
    collaboration_tools: [] as string[],
  });

  // 사용자가 속한 팀 목록 조회
  const fetchMyTeams = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiGet<{
        success: boolean;
        data: { teams: Team[] };
      }>("/api/teams/my-teams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyTeams(response.data.teams);
      if (response.data.teams.length > 0 && !formData.team_id) {
        setFormData((prev) => ({
          ...prev,
          team_id: response.data.teams[0].id,
        }));
      }
    } catch (error) {
      console.error("팀 목록 조회 실패:", error);
      alert("팀 목록을 불러오는데 실패했습니다.");
    }
  }, [token, formData.team_id]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  // 태그 추가
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  // 태그 삭제
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // 외부 링크 추가
  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (trimmed && !externalLinks.some((link) => link.url === trimmed)) {
      // URL에서 도메인 추출하여 아이콘 결정
      let icon = "🔗";
      try {
        const url = new URL(trimmed);
        const hostname = url.hostname.toLowerCase();

        if (hostname.includes("github")) icon = "💻";
        else if (hostname.includes("notion")) icon = "📝";
        else if (hostname.includes("figma")) icon = "🎨";
        else if (hostname.includes("slack")) icon = "💬";
        else if (
          hostname.includes("drive.google") ||
          hostname.includes("docs.google")
        )
          icon = "📄";
        else if (hostname.includes("youtube")) icon = "📹";
        else icon = "🔗";
      } catch {
        // URL 파싱 실패 시 기본 아이콘
      }

      setExternalLinks([...externalLinks, { url: trimmed, icon }]);
      setLinkInput("");
    }
  };

  // 외부 링크 삭제
  const handleRemoveLink = (url: string) => {
    setExternalLinks(externalLinks.filter((link) => link.url !== url));
  };

  // 구하는 팀원 추가
  const handleAddSeekingMember = () => {
    setSeekingMembers([...seekingMembers, { role: "", tasks: "", skills: "" }]);
  };

  // 구하는 팀원 삭제
  const handleRemoveSeekingMember = (index: number) => {
    setSeekingMembers(seekingMembers.filter((_, i) => i !== index));
  };

  // 구하는 팀원 업데이트
  const handleUpdateSeekingMember = (
    index: number,
    field: keyof SeekingMember,
    value: string
  ) => {
    const updated = [...seekingMembers];
    updated[index] = { ...updated[index], [field]: value };
    setSeekingMembers(updated);
  };

  // 현재 팀원 추가
  const handleAddCurrentMember = () => {
    setCurrentMembers([...currentMembers, { name: "", role: "" }]);
  };

  // 현재 팀원 삭제
  const handleRemoveCurrentMember = (index: number) => {
    setCurrentMembers(currentMembers.filter((_, i) => i !== index));
  };

  // 현재 팀원 업데이트
  const handleUpdateCurrentMember = (
    index: number,
    field: keyof CurrentMember,
    value: string
  ) => {
    const updated = [...currentMembers];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentMembers(updated);
  };

  // 협업 툴 토글
  const handleToggleTool = (tool: string) => {
    const current = collaborationData.collaboration_tools;
    if (current.includes(tool)) {
      setCollaborationData({
        ...collaborationData,
        collaboration_tools: current.filter((t) => t !== tool),
      });
    } else {
      setCollaborationData({
        ...collaborationData,
        collaboration_tools: [...current, tool],
      });
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 필수 필드 검증
    if (!formData.team_id) {
      alert("팀을 선택해주세요.");
      return;
    }

    if (!formData.post_title.trim()) {
      alert("공고 제목을 입력해주세요.");
      return;
    }

    if (!formData.project_title.trim()) {
      alert("프로젝트 제목을 입력해주세요.");
      return;
    }

    if (!formData.category) {
      alert("대주제를 선택해주세요.");
      return;
    }

    if (!formData.progress_stage) {
      alert("현재 진행 상황을 선택해주세요.");
      return;
    }

    if (!formData.deadline) {
      alert("모집 마감일을 선택해주세요.");
      return;
    }

    if (!contestData.contest_name.trim()) {
      alert("대회명을 입력해주세요.");
      return;
    }

    if (!projectData.problem.trim()) {
      alert("서비스가 해결하는 문제를 입력해주세요.");
      return;
    }

    if (seekingMembers.length === 0) {
      alert("구하는 팀원 정보를 최소 1개 이상 추가해주세요.");
      return;
    }

    // 구하는 팀원 필수 필드 검증
    for (let i = 0; i < seekingMembers.length; i++) {
      const member = seekingMembers[i];
      if (
        !member.role.trim() ||
        !member.tasks.trim() ||
        !member.skills.trim()
      ) {
        alert(`구하는 팀원 ${i + 1}의 모든 필드를 입력해주세요.`);
        return;
      }
    }

    if (currentMembers.length === 0) {
      alert("현재 팀원 정보를 최소 1개 이상 추가해주세요.");
      return;
    }

    // 현재 팀원 필수 필드 검증
    for (let i = 0; i < currentMembers.length; i++) {
      const member = currentMembers[i];
      if (!member.name.trim() || !member.role.trim()) {
        alert(`현재 팀원 ${i + 1}의 모든 필드를 입력해주세요.`);
        return;
      }
    }

    if (!collaborationData.meeting_frequency) {
      alert("회의 주기를 선택해주세요.");
      return;
    }

    if (!collaborationData.meeting_style) {
      alert("회의 방식을 선택해주세요.");
      return;
    }

    if (collaborationData.collaboration_tools.length === 0) {
      alert("협업 툴을 최소 1개 이상 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const selectedTeam = myTeams.find((t) => t.id === formData.team_id);

      // 기존 팀 선택 시 업데이트, 아니면 새 팀 생성
      if (selectedTeam) {
        // 기존 팀 업데이트
        await apiPut(
          `/api/teams/${formData.team_id}`,
          {
            name: selectedTeam.name || null,
            region: selectedTeam.region || null,
            area: formData.category || null,
            description:
              `${formData.post_title}\n\n${contestData.description}\n\n${projectData.problem}` ||
              null,
            project_title: formData.project_title || null,
            max_members:
              currentMembers.length + formData.recruitment_count || null,
            deadline: formData.deadline || null,
            progress_stage: formData.progress_stage || null,
            collaboration_style:
              `${collaborationData.meeting_frequency}, ${collaborationData.meeting_style}` ||
              null,
            collaboration_tools:
              collaborationData.collaboration_tools.join(", ") || null,
            area_keywords: JSON.stringify(tags) || null,
            meeting_schedule:
              `${collaborationData.meeting_frequency}, ${collaborationData.meeting_style}` ||
              null,
            seeking_members: JSON.stringify(seekingMembers) || null,
            current_team_composition: JSON.stringify(currentMembers) || null,
            purpose: projectData.purpose || null,
            ideal_candidate: projectData.future_direction || null,
            image_url: contestData.poster_url || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // 새 팀 생성
        await apiPost(
          "/api/teams",
          {
            name: formData.post_title || "새 팀",
            region: selectedTeam?.region || null,
            area: formData.category || null,
            description:
              `${formData.post_title}\n\n${contestData.description}\n\n${projectData.problem}` ||
              null,
            project_title: formData.project_title || null,
            max_members:
              currentMembers.length + formData.recruitment_count || null,
            deadline: formData.deadline || null,
            progress_stage: formData.progress_stage || null,
            collaboration_style:
              `${collaborationData.meeting_frequency}, ${collaborationData.meeting_style}` ||
              null,
            collaboration_tools:
              collaborationData.collaboration_tools.join(", ") || null,
            area_keywords: JSON.stringify(tags) || null,
            meeting_schedule:
              `${collaborationData.meeting_frequency}, ${collaborationData.meeting_style}` ||
              null,
            seeking_members: JSON.stringify(seekingMembers) || null,
            current_team_composition: JSON.stringify(currentMembers) || null,
            purpose: projectData.purpose || null,
            ideal_candidate: projectData.future_direction || null,
            image_url: contestData.poster_url || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      alert("모집 공고가 성공적으로 등록되었습니다!");
      navigate("/mypage/posts");
    } catch (error) {
      console.error("모집 공고 등록 오류:", error);
      alert("모집 공고 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 오늘 날짜 (마감일 최소값)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">모집 공고 추가</h2>
          <p className="mt-2 text-sm text-slate-600">
            <span className="text-red-500">*</span> 표시된 항목은 필수
            입력입니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 개요 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-slate-900">기본 개요</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  공고 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.post_title}
                  onChange={(e) =>
                    setFormData({ ...formData, post_title: e.target.value })
                  }
                  placeholder="예: AI 기반 의료 서비스 개발 팀원 모집"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  팀 선택 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.team_id}
                  onChange={(e) =>
                    setFormData({ ...formData, team_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  <option value="">팀을 선택하세요</option>
                  {myTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  프로젝트 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.project_title}
                  onChange={(e) =>
                    setFormData({ ...formData, project_title: e.target.value })
                  }
                  placeholder="예: AI 기반 의료 진단 서비스"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  대주제 (분야, 카테고리){" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  <option value="">대주제를 선택하세요</option>
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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  현재 진행 상황 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.progress_stage}
                  onChange={(e) =>
                    setFormData({ ...formData, progress_stage: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  <option value="">진행 상황을 선택하세요</option>
                  <option value="아이디어만">아이디어만</option>
                  <option value="기획 완료">기획 완료</option>
                  <option value="MVP 진행">MVP 진행</option>
                  <option value="베타 테스트">베타 테스트</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    모집 마감일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    min={today}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    모집 인원 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.recruitment_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recruitment_count: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 공모전/대회 정보 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              공모전/대회 정보
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  대회 포스터 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={contestData.poster_url}
                  onChange={(e) =>
                    setContestData({
                      ...contestData,
                      poster_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  대회명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contestData.contest_name}
                  onChange={(e) =>
                    setContestData({
                      ...contestData,
                      contest_name: e.target.value,
                    })
                  }
                  placeholder="예: 제1회 AI 혁신 아이디어 공모전"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  주제 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contestData.topic}
                  onChange={(e) =>
                    setContestData({ ...contestData, topic: e.target.value })
                  }
                  placeholder="예: AI를 활용한 의료 서비스 혁신"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  세부 설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={contestData.description}
                  onChange={(e) =>
                    setContestData({
                      ...contestData,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="공모전/대회에 대한 상세 설명을 입력해주세요."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  시상 규모/혜택 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={contestData.prize_info}
                  onChange={(e) =>
                    setContestData({
                      ...contestData,
                      prize_info: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="예: 대상 500만원, 우수상 200만원, 입선상 50만원 등"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* 팀 프로젝트 개요 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              팀 프로젝트 개요
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  내용 (서비스가 해결하는 문제){" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={projectData.problem}
                  onChange={(e) =>
                    setProjectData({ ...projectData, problem: e.target.value })
                  }
                  rows={4}
                  placeholder="프로젝트가 해결하려는 문제나 서비스 내용을 설명해주세요."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  프로젝트 향후 방향성 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={projectData.future_direction}
                  onChange={(e) =>
                    setProjectData({
                      ...projectData,
                      future_direction: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="프로젝트의 향후 계획과 방향성을 설명해주세요."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  목적 <span className="text-red-500">*</span>
                </label>
                <select
                  value={projectData.purpose}
                  onChange={(e) =>
                    setProjectData({ ...projectData, purpose: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  <option value="">목적을 선택하세요</option>
                  <option value="수상">수상</option>
                  <option value="경험">경험</option>
                  <option value="네트워킹">네트워킹</option>
                  <option value="실제 서비스 런칭">실제 서비스 런칭</option>
                </select>
              </div>
            </div>
          </div>

          {/* 구하는 팀원 설명 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                구하는 팀원 설명
              </h3>
              <button
                type="button"
                onClick={handleAddSeekingMember}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + 역할 추가
              </button>
            </div>
            <div className="space-y-4">
              {seekingMembers.map((member, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">
                      역할 {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveSeekingMember(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        역할명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateSeekingMember(
                            index,
                            "role",
                            e.target.value
                          )
                        }
                        placeholder="예: 프론트엔드, 백엔드, 기획"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        주요 업무 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={member.tasks}
                        onChange={(e) =>
                          handleUpdateSeekingMember(
                            index,
                            "tasks",
                            e.target.value
                          )
                        }
                        rows={2}
                        placeholder="해당 역할의 주요 업무를 설명해주세요."
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        필요 역량 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={member.skills}
                        onChange={(e) =>
                          handleUpdateSeekingMember(
                            index,
                            "skills",
                            e.target.value
                          )
                        }
                        rows={2}
                        placeholder="필요한 기술 스택이나 역량을 입력해주세요."
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
              {seekingMembers.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                  <p className="text-slate-500">
                    구하는 팀원 정보를 추가해주세요.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddSeekingMember}
                    className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    역할 추가
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 현재 팀원 설명 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                현재 팀원 설명
              </h3>
              <button
                type="button"
                onClick={handleAddCurrentMember}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + 팀원 추가
              </button>
            </div>
            <div className="space-y-4">
              {currentMembers.map((member, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">
                      팀원 {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveCurrentMember(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) =>
                          handleUpdateCurrentMember(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="팀원 이름"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        역할 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateCurrentMember(
                            index,
                            "role",
                            e.target.value
                          )
                        }
                        placeholder="예: 팀장, 프론트엔드"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
              {currentMembers.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                  <p className="text-slate-500">
                    현재 팀원 정보를 추가해주세요.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddCurrentMember}
                    className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    팀원 추가
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 협업 방식 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-slate-900">협업 방식</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  회의 주기 <span className="text-red-500">*</span>
                </label>
                <select
                  value={collaborationData.meeting_frequency}
                  onChange={(e) =>
                    setCollaborationData({
                      ...collaborationData,
                      meeting_frequency: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  <option value="">회의 주기를 선택하세요</option>
                  <option value="매일">매일</option>
                  <option value="주 3회">주 3회</option>
                  <option value="주 2회">주 2회</option>
                  <option value="주 1회">주 1회</option>
                  <option value="격주 1회">격주 1회</option>
                  <option value="월 1회">월 1회</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  회의 방식 <span className="text-red-500">*</span>
                </label>
                <select
                  value={collaborationData.meeting_style}
                  onChange={(e) =>
                    setCollaborationData({
                      ...collaborationData,
                      meeting_style: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  <option value="">회의 방식을 선택하세요</option>
                  <option value="온라인">온라인</option>
                  <option value="오프라인">오프라인</option>
                  <option value="온오프라인 병행">온오프라인 병행</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  협업 툴 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {["노션", "깃허브", "피그마", "슬랙"].map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => handleToggleTool(tool)}
                      className={`rounded px-4 py-2 text-sm font-medium ${
                        collaborationData.collaboration_tools.includes(tool)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 외부 링크 입력 필드 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-slate-900">외부 링크</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  추가
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {externalLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {link.url.length > 30
                        ? link.url.substring(0, 30) + "..."
                        : link.url}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.url)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 태깅 입력 영역 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-slate-900">태그</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="태그 입력 후 Enter"
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  추가
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 저장/취소 버튼 */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/mypage/posts")}
              className="rounded bg-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-400"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruitmentPostCreateForm;
