import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import Container from "../../shared/ui/Container";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet, apiPost, apiPut } from "../../shared/api";
import { TRAITS_OPTIONS } from "../../shared/traits";

interface Award {
  id?: string;
  title: string;
  awardedAt: string;
  description: string;
  rank?: string;
  participation_type?: string;
  roles?: string[];
  result_link?: string;
  result_images?: string[];
}

interface Portfolio {
  id?: string;
  project_name: string;
  start_date?: string;
  end_date?: string;
  is_ongoing?: boolean;
  participation_type?: string;
  roles?: string[];
  contribution_detail?: string;
  goal?: string;
  problem_definition?: string;
  result_summary?: string;
  tech_stack?: string[];
  images?: string[];
  github_link?: string;
  figma_link?: string;
  other_links?: string[];
  certifications?: string[];
}

export const ProfileForm = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState<"awards" | "portfolio" | "traits">("awards");
  const [awards, setAwards] = useState<Award[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedTraits, setSelectedTraits] = useState<
    Record<string, string[]>
  >({});
  const [availableTime, setAvailableTime] = useState("");

  const [newAward, setNewAward] = useState<Award>({
    title: "",
    awardedAt: "",
    description: "",
    rank: "",
    participation_type: "",
    roles: [],
    result_link: "",
    result_images: [],
  });

  const [editingAwardIndex, setEditingAwardIndex] = useState<number | null>(
    null
  );
  const [rankCustomInput, setRankCustomInput] = useState("");
  const [participationCustomInput, setParticipationCustomInput] = useState("");
  const [roleCustomInput, setRoleCustomInput] = useState("");
  const [rankIsOther, setRankIsOther] = useState(false);
  const [participationIsOther, setParticipationIsOther] = useState(false);

  const rankOptions = ["대상", "최우수상", "우수상", "장려상", "입선"];
  const participationOptions = ["개인", "팀", "공모전", "연구", "과제"];
  const roleOptions = ["개발", "기획", "디자인", "발표", "데이터"];

  const portfolioParticipationOptions = [
    "팀 프로젝트",
    "개인",
    "대회",
    "수업",
    "사이드 프로젝트",
  ];
  const portfolioRoleOptions = ["개발", "기획", "디자인", "데이터", "PM"];

  const [newPortfolio, setNewPortfolio] = useState<Portfolio>({
    project_name: "",
    start_date: "",
    end_date: "",
    is_ongoing: false,
    participation_type: "",
    roles: [],
    contribution_detail: "",
    goal: "",
    problem_definition: "",
    result_summary: "",
    tech_stack: [],
    images: [],
    github_link: "",
    figma_link: "",
    other_links: [],
    certifications: [],
  });

  const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<
    number | null
  >(null);
  const [techStackInput, setTechStackInput] = useState("");
  const [otherLinkInput, setOtherLinkInput] = useState("");
  const [certificationInput, setCertificationInput] = useState("");

  const toggleTrait = (category: string, value: string) => {
    setSelectedTraits((prev) => {
      const current = new Set(prev[category] ?? []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [category]: Array.from(current) };
    });
  };

  const addAward = () => {
    if (!newAward.title || !newAward.awardedAt) {
      alert("대회명과 수상 날짜는 필수 입력 항목입니다.");
      return;
    }

    if (editingAwardIndex !== null) {
      // 수정 모드
      setAwards((prev) =>
        prev.map((award, index) =>
          index === editingAwardIndex ? { ...newAward } : award
        )
      );
      setEditingAwardIndex(null);
    } else {
      // 추가 모드
      setAwards((prev) => [...prev, { ...newAward }]);
    }

    // 폼 초기화
    setNewAward({
      title: "",
      awardedAt: "",
      description: "",
      rank: "",
      participation_type: "",
      roles: [],
      result_link: "",
      result_images: [],
    });
    setRankCustomInput("");
    setParticipationCustomInput("");
    setRoleCustomInput("");
  };

  const removeAward = (index: number) => {
    if (confirm("정말 이 수상경력을 삭제하시겠습니까?")) {
      setAwards((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const editAward = (index: number) => {
    const award = awards[index];
    setNewAward({ ...award });
    setEditingAwardIndex(index);

    // 커스텀 입력 필드 설정
    if (award.rank && !rankOptions.includes(award.rank)) {
      setRankCustomInput(award.rank);
      setRankIsOther(true);
    }
    if (
      award.participation_type &&
      !participationOptions.includes(award.participation_type)
    ) {
      setParticipationCustomInput(award.participation_type);
      setParticipationIsOther(true);
    }
  };

  const cancelEdit = () => {
    setEditingAwardIndex(null);
    setNewAward({
      title: "",
      awardedAt: "",
      description: "",
      rank: "",
      participation_type: "",
      roles: [],
      result_link: "",
      result_images: [],
    });
    setRankCustomInput("");
    setParticipationCustomInput("");
    setRoleCustomInput("");
    setRankIsOther(false);
    setParticipationIsOther(false);
  };

  const toggleRole = (role: string) => {
    setNewAward((prev) => {
      const currentRoles = prev.roles || [];
      if (currentRoles.includes(role)) {
        return { ...prev, roles: currentRoles.filter((r) => r !== role) };
      } else {
        return { ...prev, roles: [...currentRoles, role] };
      }
    });
  };

  const addCustomRole = () => {
    const trimmed = roleCustomInput.trim();
    if (trimmed && !newAward.roles?.includes(trimmed)) {
      setNewAward((prev) => ({
        ...prev,
        roles: [...(prev.roles || []), trimmed],
      }));
      setRoleCustomInput("");
    }
  };

  const removeRole = (role: string) => {
    setNewAward((prev) => ({
      ...prev,
      roles: prev.roles?.filter((r) => r !== role) || [],
    }));
  };

  const handleRankChange = (value: string) => {
    if (value === "기타") {
      setRankIsOther(true);
      setNewAward((prev) => ({ ...prev, rank: rankCustomInput || "" }));
    } else {
      setRankIsOther(false);
      setNewAward((prev) => ({ ...prev, rank: value }));
      setRankCustomInput("");
    }
  };

  const handleParticipationChange = (value: string) => {
    if (value === "기타") {
      setParticipationIsOther(true);
      setNewAward((prev) => ({
        ...prev,
        participation_type: participationCustomInput || "",
      }));
    } else {
      setParticipationIsOther(false);
      setNewAward((prev) => ({ ...prev, participation_type: value }));
      setParticipationCustomInput("");
    }
  };

  const fetchAwards = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await apiGet<{
        success: boolean;
        data: { awards: Award[] };
      }>("/api/profile/awards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success && response.data.awards) {
        setAwards(response.data.awards);
      }
    } catch (error) {
      console.error("수상경력 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "awards") {
      fetchAwards();
    }
  }, [tab, fetchAwards]);

  // 컴포넌트 마운트 시 수상경력 로드
  useEffect(() => {
    if (token) {
      fetchAwards();
      fetchPortfolios();
      fetchTraits();
      fetchAvailableTime();
    }
  }, [token]);

  const fetchTraits = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiGet<{
        success: boolean;
        data: { traits: Record<string, string[]> };
      }>("/api/profile/traits", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success && response.data.traits) {
        setSelectedTraits(response.data.traits);
      }
    } catch (error) {
      console.error("성향 불러오기 실패:", error);
    }
  }, [token]);

  const fetchAvailableTime = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiGet<{
        success: boolean;
        data: { user: { available_time?: string } };
      }>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success && response.data.user?.available_time) {
        setAvailableTime(response.data.user.available_time);
      }
    } catch (error) {
      console.error("가용시간 불러오기 실패:", error);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "traits") {
      fetchTraits();
      fetchAvailableTime();
    }
  }, [tab, fetchTraits, fetchAvailableTime]);

  const fetchPortfolios = useCallback(async () => {
    if (!token) return;

    try {
      setPortfolioLoading(true);
      const response = await apiGet<{
        success: boolean;
        data: { portfolios: Portfolio[] };
      }>("/api/profile/portfolios", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success && response.data.portfolios) {
        setPortfolios(response.data.portfolios);
      }
    } catch (error) {
      console.error("포트폴리오 불러오기 실패:", error);
    } finally {
      setPortfolioLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "portfolio") {
      fetchPortfolios();
    }
  }, [tab, fetchPortfolios]);

  const saveProfile = async () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSaving(true);
    try {
      // 수상경력 저장 (항상 실행 - 빈 배열이어도 기존 데이터 삭제를 위해)
      await apiPost(
        "/api/profile/awards",
        { awards },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 포트폴리오 저장 (항상 실행)
      await apiPost(
        "/api/profile/portfolios",
        { portfolios },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 성향 저장
      if (Object.keys(selectedTraits).length > 0) {
        await apiPost(
          "/api/profile/traits",
          { traits: selectedTraits },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // 가용시간 저장 (traits 탭일 때만, 빈 값도 저장)
      if (tab === "traits") {
        // 기존 사용자 정보 조회
        const userResponse = await apiGet<{
          success: boolean;
          data: { user: any };
        }>("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const existingUser = userResponse.data.user;

        // birth_date를 YYYY-MM-DD 형식으로 변환
        let formattedBirthDate = existingUser.birth_date || null;
        if (formattedBirthDate) {
          try {
            const date = new Date(formattedBirthDate);
            if (!isNaN(date.getTime())) {
              formattedBirthDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
            }
          } catch (e) {
            // 이미 YYYY-MM-DD 형식이거나 변환 실패 시 그대로 사용
            if (
              typeof formattedBirthDate === "string" &&
              formattedBirthDate.match(/^\d{4}-\d{2}-\d{2}$/)
            ) {
              // 이미 올바른 형식
            } else {
              formattedBirthDate = null;
            }
          }
        }

        // 기존 값들을 포함하여 업데이트 (가용시간만 변경, birth_date는 형식 변환)
        await apiPut(
          "/api/auth/me",
          {
            ...existingUser,
            birth_date: formattedBirthDate,
            available_time: availableTime || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      alert("프로필이 성공적으로 저장되었습니다!");

      // 저장 후 데이터 다시 불러오기
      if (tab === "awards") {
        await fetchAwards();
      } else if (tab === "portfolio") {
        await fetchPortfolios();
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-100 p-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-6 text-sm">
        {[
          { key: "awards", label: "수상경력" },
          { key: "portfolio", label: "포트폴리오" },
          { key: "traits", label: "성향" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as "awards" | "portfolio" | "traits")}
            className={`border-b-2 pb-1 font-semibold ${
              tab === t.key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contents */}
      {tab === "portfolio" && (
        <div className="space-y-6 text-sm">
          {portfolioLoading && (
            <div className="text-center py-4 text-slate-600">
              포트폴리오를 불러오는 중...
            </div>
          )}

          {/* 포트폴리오 추가/수정 폼 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingPortfolioIndex !== null
                ? "포트폴리오 수정"
                : "신규 프로젝트 등록"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 프로젝트명 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  프로젝트 명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={newPortfolio.project_name}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      project_name: e.target.value,
                    }))
                  }
                  placeholder="간단 명료한 제목"
                />
              </div>

              {/* 참여 형태 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  참여 형태
                </label>
                <select
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={newPortfolio.participation_type || ""}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      participation_type: e.target.value,
                    }))
                  }
                >
                  <option value="">선택하세요</option>
                  {portfolioParticipationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* 진행 기간 - 시작일 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  시작일
                </label>
                <input
                  type="date"
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={newPortfolio.start_date || ""}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  disabled={newPortfolio.is_ongoing}
                />
              </div>

              {/* 진행 기간 - 종료일 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  종료일
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="flex-1 rounded border border-slate-300 p-2 text-sm"
                    value={newPortfolio.end_date || ""}
                    onChange={(e) =>
                      setNewPortfolio((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    disabled={newPortfolio.is_ongoing}
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={newPortfolio.is_ongoing || false}
                      onChange={(e) =>
                        setNewPortfolio((prev) => ({
                          ...prev,
                          is_ongoing: e.target.checked,
                          end_date: "",
                        }))
                      }
                      className="rounded"
                    />
                    진행중
                  </label>
                </div>
              </div>
            </div>

            {/* 역할/기여도 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                역할/기여도
              </label>
              <div className="mb-2">
                <div className="text-xs text-slate-600 mb-2">직무 선택</div>
                <div className="flex flex-wrap gap-2">
                  {portfolioRoleOptions.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        const currentRoles = newPortfolio.roles || [];
                        if (currentRoles.includes(role)) {
                          setNewPortfolio((prev) => ({
                            ...prev,
                            roles: currentRoles.filter((r) => r !== role),
                          }));
                        } else {
                          setNewPortfolio((prev) => ({
                            ...prev,
                            roles: [...currentRoles, role],
                          }));
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        newPortfolio.roles?.includes(role)
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <textarea
                  className="w-full rounded border border-slate-300 p-2 text-sm h-24"
                  value={newPortfolio.contribution_detail || ""}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      contribution_detail: e.target.value,
                    }))
                  }
                  placeholder={`이 프로젝트에서 당신의 역할을 자유롭게 적어보세요.
구체적인 성과나 산출물이 있다면 꼭 기록해주세요.
다른 사람이 봤을 때 '이 사람은 이런 역량이 있구나' 하고 알 수 있는 정도면 충분합니다.

예) 백엔드 API 설계 및 구현 (로그인, 회원가입), DB 스키마 모델링`}
                />
              </div>
            </div>

            {/* 내용 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                내용
              </label>

              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">
                  핵심 목표
                </div>
                <div className="text-xs text-slate-600 mb-1">
                  이 프로젝트의 목적은 무엇이었나요?
                </div>
                <textarea
                  className="w-full rounded border border-slate-300 p-2 text-sm h-20"
                  value={newPortfolio.goal || ""}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      goal: e.target.value,
                    }))
                  }
                  placeholder="프로젝트의 핵심 목표를 입력하세요"
                />
              </div>

              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">
                  문제 정의
                </div>
                <div className="text-xs text-slate-600 mb-1">
                  어떤 문제를 해결하려 했나요?
                </div>
                <textarea
                  className="w-full rounded border border-slate-300 p-2 text-sm h-20"
                  value={newPortfolio.problem_definition || ""}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      problem_definition: e.target.value,
                    }))
                  }
                  placeholder="해결하려는 문제를 입력하세요"
                />
              </div>

              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">
                  결과 요약
                </div>
                <div className="text-xs text-slate-600 mb-1">
                  최종적으로 어떤 결과를 만들었나요?
                </div>
                <textarea
                  className="w-full rounded border border-slate-300 p-2 text-sm h-20"
                  value={newPortfolio.result_summary || ""}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      result_summary: e.target.value,
                    }))
                  }
                  placeholder="프로젝트 결과를 요약하세요"
                />
              </div>
            </div>

            {/* 사용 기술 스택 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                사용 기술 스택
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 rounded border border-slate-300 p-2 text-sm"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = techStackInput.trim();
                      if (
                        trimmed &&
                        !newPortfolio.tech_stack?.includes(trimmed)
                      ) {
                        setNewPortfolio((prev) => ({
                          ...prev,
                          tech_stack: [...(prev.tech_stack || []), trimmed],
                        }));
                        setTechStackInput("");
                      }
                    }
                  }}
                  placeholder="기술 스택 입력 후 Enter로 추가"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = techStackInput.trim();
                    if (
                      trimmed &&
                      !newPortfolio.tech_stack?.includes(trimmed)
                    ) {
                      setNewPortfolio((prev) => ({
                        ...prev,
                        tech_stack: [...(prev.tech_stack || []), trimmed],
                      }));
                      setTechStackInput("");
                    }
                  }}
                  className="px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50"
                >
                  추가
                </button>
              </div>
              {newPortfolio.tech_stack &&
                newPortfolio.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPortfolio.tech_stack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-xs text-blue-700"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => {
                            setNewPortfolio((prev) => ({
                              ...prev,
                              tech_stack:
                                prev.tech_stack?.filter((_, i) => i !== idx) ||
                                [],
                            }));
                          }}
                          className="text-blue-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* 이미지 첨부 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                이미지 첨부
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full text-xs mb-2"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const imageUrls = files.map((file) =>
                    URL.createObjectURL(file)
                  );
                  setNewPortfolio((prev) => ({
                    ...prev,
                    images: [...(prev.images || []), ...imageUrls],
                  }));
                }}
              />
              {newPortfolio.images && newPortfolio.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPortfolio.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`프로젝트 이미지 ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewPortfolio((prev) => ({
                            ...prev,
                            images:
                              prev.images?.filter((_, i) => i !== idx) || [],
                          }));
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 결과물 링크 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  GitHub 링크
                </label>
                <input
                  type="url"
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={newPortfolio.github_link || ""}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      github_link: e.target.value,
                    }))
                  }
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Figma 링크
                </label>
                <input
                  type="url"
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={newPortfolio.figma_link || ""}
                  onChange={(e) =>
                    setNewPortfolio((prev) => ({
                      ...prev,
                      figma_link: e.target.value,
                    }))
                  }
                  placeholder="https://www.figma.com/file/..."
                />
              </div>
            </div>

            {/* 기타 링크 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                기타 링크 (노션, 배포 URL 등)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  className="flex-1 rounded border border-slate-300 p-2 text-sm"
                  value={otherLinkInput}
                  onChange={(e) => setOtherLinkInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = otherLinkInput.trim();
                      if (
                        trimmed &&
                        !newPortfolio.other_links?.includes(trimmed)
                      ) {
                        setNewPortfolio((prev) => ({
                          ...prev,
                          other_links: [...(prev.other_links || []), trimmed],
                        }));
                        setOtherLinkInput("");
                      }
                    }
                  }}
                  placeholder="링크 입력 후 Enter로 추가"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = otherLinkInput.trim();
                    if (
                      trimmed &&
                      !newPortfolio.other_links?.includes(trimmed)
                    ) {
                      setNewPortfolio((prev) => ({
                        ...prev,
                        other_links: [...(prev.other_links || []), trimmed],
                      }));
                      setOtherLinkInput("");
                    }
                  }}
                  className="px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50"
                >
                  추가
                </button>
              </div>
              {newPortfolio.other_links &&
                newPortfolio.other_links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPortfolio.other_links.map((link, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs text-slate-700"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {link.length > 30
                            ? `${link.substring(0, 30)}...`
                            : link}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setNewPortfolio((prev) => ({
                              ...prev,
                              other_links:
                                prev.other_links?.filter((_, i) => i !== idx) ||
                                [],
                            }));
                          }}
                          className="text-slate-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* 자격증 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                자격증
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 rounded border border-slate-300 p-2 text-sm"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = certificationInput.trim();
                      if (
                        trimmed &&
                        !newPortfolio.certifications?.includes(trimmed)
                      ) {
                        setNewPortfolio((prev) => ({
                          ...prev,
                          certifications: [
                            ...(prev.certifications || []),
                            trimmed,
                          ],
                        }));
                        setCertificationInput("");
                      }
                    }
                  }}
                  placeholder="예: 정보처리기사 (2025.06 취득)"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = certificationInput.trim();
                    if (
                      trimmed &&
                      !newPortfolio.certifications?.includes(trimmed)
                    ) {
                      setNewPortfolio((prev) => ({
                        ...prev,
                        certifications: [
                          ...(prev.certifications || []),
                          trimmed,
                        ],
                      }));
                      setCertificationInput("");
                    }
                  }}
                  className="px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50"
                >
                  추가
                </button>
              </div>
              {newPortfolio.certifications &&
                newPortfolio.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPortfolio.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-xs text-green-700"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => {
                            setNewPortfolio((prev) => ({
                              ...prev,
                              certifications:
                                prev.certifications?.filter(
                                  (_, i) => i !== idx
                                ) || [],
                            }));
                          }}
                          className="text-green-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPortfolioIndex(null);
                  setNewPortfolio({
                    project_name: "",
                    start_date: "",
                    end_date: "",
                    is_ongoing: false,
                    participation_type: "",
                    roles: [],
                    contribution_detail: "",
                    goal: "",
                    problem_definition: "",
                    result_summary: "",
                    tech_stack: [],
                    images: [],
                    github_link: "",
                    figma_link: "",
                    other_links: [],
                    certifications: [],
                  });
                  setTechStackInput("");
                  setOtherLinkInput("");
                  setCertificationInput("");
                }}
                className={`px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50 ${
                  editingPortfolioIndex === null ? "hidden" : ""
                }`}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newPortfolio.project_name.trim()) {
                    alert("프로젝트명은 필수 입력 항목입니다.");
                    return;
                  }

                  if (editingPortfolioIndex !== null) {
                    setPortfolios((prev) =>
                      prev.map((portfolio, index) =>
                        index === editingPortfolioIndex
                          ? { ...newPortfolio }
                          : portfolio
                      )
                    );
                    setEditingPortfolioIndex(null);
                  } else {
                    setPortfolios((prev) => [...prev, { ...newPortfolio }]);
                  }

                  // 폼 초기화
                  setNewPortfolio({
                    project_name: "",
                    start_date: "",
                    end_date: "",
                    is_ongoing: false,
                    participation_type: "",
                    roles: [],
                    contribution_detail: "",
                    goal: "",
                    problem_definition: "",
                    result_summary: "",
                    tech_stack: [],
                    images: [],
                    github_link: "",
                    figma_link: "",
                    other_links: [],
                    certifications: [],
                  });
                  setTechStackInput("");
                  setOtherLinkInput("");
                  setCertificationInput("");
                }}
                className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {editingPortfolioIndex !== null ? "수정 완료" : "추가"}
              </button>
            </div>
          </div>

          {/* 저장된 포트폴리오 목록 */}
          {portfolios.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">
                프로젝트 목록 ({portfolios.length}개)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolios.map((portfolio, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {portfolio.project_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {portfolio.start_date &&
                            new Date(portfolio.start_date).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "short",
                              }
                            )}
                          {portfolio.end_date && !portfolio.is_ongoing && (
                            <>
                              {" ~ "}
                              {new Date(portfolio.end_date).toLocaleDateString(
                                "ko-KR",
                                {
                                  year: "numeric",
                                  month: "short",
                                }
                              )}
                            </>
                          )}
                          {portfolio.is_ongoing && " ~ 진행중"}
                        </div>
                        {portfolio.participation_type && (
                          <div className="mt-1 text-xs text-slate-500">
                            {portfolio.participation_type}
                          </div>
                        )}
                        {portfolio.roles && portfolio.roles.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {portfolio.roles.map((role, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-700"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                        {portfolio.tech_stack &&
                          portfolio.tech_stack.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {portfolio.tech_stack.map((tech, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-blue-100 text-xs text-blue-700"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewPortfolio({ ...portfolio });
                            setEditingPortfolioIndex(index);
                            setTechStackInput("");
                            setOtherLinkInput("");
                            setCertificationInput("");
                          }}
                          className="px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm("정말 이 프로젝트를 삭제하시겠습니까?")
                            ) {
                              setPortfolios((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }
                          }}
                          className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    {(portfolio.github_link ||
                      portfolio.figma_link ||
                      (portfolio.other_links &&
                        portfolio.other_links.length > 0)) && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {portfolio.github_link && (
                          <a
                            href={portfolio.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            GitHub →
                          </a>
                        )}
                        {portfolio.figma_link && (
                          <a
                            href={portfolio.figma_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Figma →
                          </a>
                        )}
                        {portfolio.other_links &&
                          portfolio.other_links.length > 0 && (
                            <span className="text-slate-500">
                              기타 링크 {portfolio.other_links.length}개
                            </span>
                          )}
                      </div>
                    )}
                    {portfolio.images && portfolio.images.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {portfolio.images.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`프로젝트 이미지 ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded border border-slate-300 cursor-pointer hover:opacity-80"
                            onClick={() => window.open(img, "_blank")}
                          />
                        ))}
                        {portfolio.images.length > 3 && (
                          <div className="w-16 h-16 rounded border border-slate-300 flex items-center justify-center text-xs text-slate-500">
                            +{portfolio.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "awards" && (
        <div className="space-y-6 text-sm">
          {loading && (
            <div className="text-center py-4 text-slate-600">
              수상경력을 불러오는 중...
            </div>
          )}

          {/* 수상경력 추가/수정 폼 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingAwardIndex !== null ? "수상경력 수정" : "수상경력 추가"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 대회명 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  대회/공모전 명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={newAward.title}
                  onChange={(e) =>
                    setNewAward((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="대회명을 입력하세요"
                />
              </div>

              {/* 수상/등급 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  수상/등급
                </label>
                <select
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={rankIsOther ? "기타" : newAward.rank || ""}
                  onChange={(e) => handleRankChange(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {rankOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value="기타">기타</option>
                </select>
                {rankIsOther && (
                  <input
                    type="text"
                    className="mt-2 w-full rounded border border-slate-300 p-2 text-sm"
                    value={rankCustomInput}
                    onChange={(e) => {
                      setRankCustomInput(e.target.value);
                      setNewAward((prev) => ({
                        ...prev,
                        rank: e.target.value,
                      }));
                    }}
                    placeholder="직접 입력"
                  />
                )}
              </div>

              {/* 수상 날짜 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  수상 날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={newAward.awardedAt}
                  onChange={(e) =>
                    setNewAward((prev) => ({
                      ...prev,
                      awardedAt: e.target.value,
                    }))
                  }
                />
              </div>

              {/* 참여 형태 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  참여 형태
                </label>
                <select
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  value={
                    participationIsOther
                      ? "기타"
                      : newAward.participation_type || ""
                  }
                  onChange={(e) => handleParticipationChange(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {participationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value="기타">기타</option>
                </select>
                {participationIsOther && (
                  <input
                    type="text"
                    className="mt-2 w-full rounded border border-slate-300 p-2 text-sm"
                    value={participationCustomInput}
                    onChange={(e) => {
                      setParticipationCustomInput(e.target.value);
                      setNewAward((prev) => ({
                        ...prev,
                        participation_type: e.target.value,
                      }));
                    }}
                    placeholder="직접 입력"
                  />
                )}
              </div>
            </div>

            {/* 내 역할 - 체크리스트 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                내 역할
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      newAward.roles?.includes(role)
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  className="flex-1 rounded border border-slate-300 p-2 text-sm"
                  value={roleCustomInput}
                  onChange={(e) => setRoleCustomInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomRole();
                    }
                  }}
                  placeholder="직접 입력 (Enter로 추가)"
                />
                <button
                  type="button"
                  onClick={addCustomRole}
                  className="px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50"
                >
                  추가
                </button>
              </div>
              {newAward.roles && newAward.roles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newAward.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs text-slate-700"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => removeRole(role)}
                        className="text-slate-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 성과/결과물 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                성과/결과물
              </label>
              <input
                type="url"
                className="w-full rounded border border-slate-300 p-2 text-sm mb-2"
                value={newAward.result_link || ""}
                onChange={(e) =>
                  setNewAward((prev) => ({
                    ...prev,
                    result_link: e.target.value,
                  }))
                }
                placeholder="결과물 링크 (GitHub, 배포 URL 등)"
              />
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full text-xs"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const imageUrls = files.map((file) =>
                    URL.createObjectURL(file)
                  );
                  setNewAward((prev) => ({
                    ...prev,
                    result_images: [
                      ...(prev.result_images || []),
                      ...imageUrls,
                    ],
                  }));
                }}
              />
              {newAward.result_images && newAward.result_images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newAward.result_images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`결과물 ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewAward((prev) => ({
                            ...prev,
                            result_images:
                              prev.result_images?.filter((_, i) => i !== idx) ||
                              [],
                          }));
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 간단 소개/설명 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                간단 소개/설명
              </label>
              <textarea
                className="w-full rounded border border-slate-300 p-2 text-sm h-24"
                value={newAward.description || ""}
                onChange={(e) =>
                  setNewAward((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="대회 주제와 결과 요약"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={editingAwardIndex !== null ? cancelEdit : () => {}}
                className={`px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50 ${
                  editingAwardIndex === null ? "hidden" : ""
                }`}
              >
                취소
              </button>
              <button
                type="button"
                onClick={addAward}
                className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {editingAwardIndex !== null ? "수정 완료" : "추가"}
              </button>
            </div>
          </div>

          {/* 저장된 수상경력 목록 */}
          {awards.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">
                수상 경력 ({awards.length}개)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {awards.map((award, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {award.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {award.rank && (
                            <span className="font-medium text-slate-700">
                              {award.rank}
                            </span>
                          )}
                          {award.rank && award.awardedAt && " · "}
                          {award.awardedAt &&
                            new Date(award.awardedAt).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                        </div>
                        {award.description && (
                          <div className="mt-2 text-sm text-slate-700 line-clamp-2">
                            {award.description}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => editAward(index)}
                          className="px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAward(index)}
                          className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    {award.result_link && (
                      <div className="mt-2">
                        <a
                          href={award.result_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          결과물 보기 →
                        </a>
                      </div>
                    )}
                    {award.result_images && award.result_images.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {award.result_images.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`결과물 ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded border border-slate-300 cursor-pointer hover:opacity-80"
                            onClick={() => window.open(img, "_blank")}
                          />
                        ))}
                        {award.result_images.length > 3 && (
                          <div className="w-16 h-16 rounded border border-slate-300 flex items-center justify-center text-xs text-slate-500">
                            +{award.result_images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "traits" && (
        <div className="space-y-6 text-sm">
          {/* 선택된 키워드 태그 표시 */}
          {Object.values(selectedTraits).flat().length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 text-xs font-medium text-slate-600">
                선택한 성향 ({Object.values(selectedTraits).flat().length}개)
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedTraits).map(([category, traits]) =>
                  traits.map((trait) => (
                    <button
                      key={`${category}-${trait}`}
                      type="button"
                      onClick={() => toggleTrait(category, trait)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      {trait}
                      <span className="ml-1 text-slate-400 hover:text-white">
                        ×
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 카테고리별 키워드 선택 */}
          {Object.entries(TRAITS_OPTIONS).map(([category, options]) => (
            <div
              key={category}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-3 text-base font-semibold text-slate-900">
                {category.replaceAll("_", " ")}
              </div>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                  const active = (selectedTraits[category] ?? []).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleTrait(category, opt)}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-md"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 일주일 내 가용 시간 */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 text-base font-semibold text-slate-900">
              일주일 내 가용 시간
            </div>
            <input
              type="text"
              className="w-full rounded border border-slate-300 p-2 text-sm"
              value={availableTime}
              onChange={(e) => setAvailableTime(e.target.value)}
              placeholder="예: 평일 저녁 2시간, 주말 4시간"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
};

const ProfileEditor = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-8">
        <ProfileForm />
      </Container>
      <AppFooter />
    </div>
  );
};

export default ProfileEditor;
