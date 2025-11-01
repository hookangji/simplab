import { useAuth } from "../../contexts/AuthContext";
import { TRAITS_OPTIONS } from "../../shared/traits";

export interface TeamFilterOptions {
  // 기존 단일 선택 필드 (서버 쿼리 연동 유지)
  region: string;
  area: string;
  teamSize: string;
  recruitmentStatus: string;
  deadlineStatus: string;
  traits: string[];

  // 신규 클라이언트 필터
  keyword?: string;
  regions?: string[]; // 다중 시/도
  subregions?: string[]; // 다중 시/군/구
}

interface TeamFilterProps {
  onFilterChange: (filters: TeamFilterOptions) => void;
  currentFilters: TeamFilterOptions;
}

const TeamFilter = ({ onFilterChange, currentFilters }: TeamFilterProps) => {
  const { user } = useAuth();

  // 지역 옵션
  const regionOptions = [
    "서울",
    "경기",
    "인천",
    "부산",
    "대구",
    "광주",
    "대전",
    "울산",
    "세종",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
  ];

  const subregionMap: Record<string, string[]> = {
    서울: [
      "강남구",
      "강서구",
      "송파구",
      "관악구",
      "광진구",
      "마포구",
      "서초구",
      "용산구",
      "중구",
      "종로구",
    ],
    경기: [
      "성남시",
      "수원시",
      "용인시",
      "고양시",
      "화성시",
      "부천시",
      "안양시",
    ],
    인천: ["남동구", "연수구", "부평구", "서구", "미추홀구"],
    부산: ["해운대구", "수영구", "남구", "연제구", "부산진구"],
    대구: ["수성구", "달서구", "동구", "중구"],
    광주: ["서구", "남구", "동구", "북구", "광산구"],
    대전: ["서구", "유성구", "중구", "동구"],
    울산: ["남구", "중구", "동구", "북구"],
    세종: ["세종시"],
    강원: ["춘천시", "원주시", "강릉시"],
    충북: ["청주시", "충주시"],
    충남: ["천안시", "아산시"],
    전북: ["전주시", "익산시"],
    전남: ["순천시", "여수시", "목포시"],
    경북: ["포항시", "구미시"],
    경남: ["창원시", "김해시"],
    제주: ["제주시", "서귀포시"],
  };

  // 모집 분야 옵션
  const areaOptions = [
    "AI/인공지능",
    "웹개발",
    "모바일앱",
    "게임",
    "보안",
    "블록체인",
    "IoT",
    "빅데이터",
    "클라우드",
    "AR/VR",
    "로봇공학",
    "바이오테크",
    "금융",
    "교육",
    "의료",
    "환경",
    "사회공헌",
    "스타트업",
  ];

  // 팀 규모 옵션
  const teamSizeOptions = [
    { value: "2-3", label: "2-3명 (소규모)" },
    { value: "4-5", label: "4-5명 (중규모)" },
    { value: "6-8", label: "6-8명 (대규모)" },
    { value: "9+", label: "9명 이상" },
  ];

  // 모집 상태 옵션
  const recruitmentStatusOptions = [
    { value: "recruiting", label: "모집 중" },
    { value: "almost-full", label: "거의 마감" },
    { value: "urgent", label: "급하게 구함" },
  ];

  // 마감일 상태 옵션
  const deadlineStatusOptions = [
    { value: "week", label: "1주일 이내" },
    { value: "month", label: "1개월 이내" },
    { value: "over-month", label: "1개월 이후" },
    { value: "no-deadline", label: "마감일 없음" },
  ];

  const handleFilterChange = (key: keyof TeamFilterOptions, value: string) => {
    const newFilters = { ...currentFilters, [key]: value };
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({
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
  };

  const hasActiveFilters =
    currentFilters.region ||
    currentFilters.area ||
    currentFilters.teamSize ||
    currentFilters.recruitmentStatus ||
    currentFilters.deadlineStatus ||
    (currentFilters.traits && currentFilters.traits.length > 0);

  return (
    <div className="w-full surface p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">팀 필터링</h3>
        <p className="text-sm text-slate-600 mt-1">원하는 팀을 찾아보세요</p>
      </div>

      <div className="space-y-6">
        {/* 키워드 검색 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            🔎 키워드 검색
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={currentFilters.keyword || ""}
              onChange={(e) =>
                onFilterChange({ ...currentFilters, keyword: e.target.value })
              }
              placeholder="팀 이름, 공고 제목, 포지션, 소개글"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {currentFilters.keyword && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                {currentFilters.keyword}
                <button
                  type="button"
                  className="ml-2 text-slate-500 hover:text-slate-700"
                  onClick={() =>
                    onFilterChange({ ...currentFilters, keyword: "" })
                  }
                >
                  ✕
                </button>
              </span>
            </div>
          )}
        </div>

        {/* 사용자 정보 기반 추천 */}
        {user && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2">
              내 정보 기반 추천
            </h4>
            <div className="text-sm text-blue-700 space-y-2">
              <div className="flex flex-wrap gap-1">
                {user.region && (
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange("region", user.region || "")
                    }
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                  >
                    📍 {user.region}
                  </button>
                )}
                {user.job_field && (
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange("area", user.job_field || "")
                    }
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                  >
                    🎯 {user.job_field}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange("recruitmentStatus", "recruiting")
                  }
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                >
                  🔥 모집 중인 팀만
                </button>
              </div>
              <div className="text-xs text-blue-600">
                내 정보로 빠르게 필터링하기
              </div>
            </div>
          </div>
        )}

        {/* 지역 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            📍 활동 지역
          </label>
          <div className="flex flex-wrap gap-2">
            {regionOptions.map((region) => {
              const selected =
                currentFilters.regions?.includes(region) || false;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    const current = new Set(currentFilters.regions || []);
                    if (current.has(region)) current.delete(region);
                    else current.add(region);
                    onFilterChange({
                      ...currentFilters,
                      regions: Array.from(current),
                    });
                  }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selected
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-slate-700 border-slate-300 hover:border-blue-300"
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* 세부 지역 (시/군/구) */}
        {currentFilters.regions && currentFilters.regions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🗺️ 세부 지역
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
              {Array.from(
                new Set(
                  (currentFilters.regions || []).flatMap(
                    (r) => subregionMap[r] || []
                  )
                )
              ).map((sgg) => {
                const selected =
                  currentFilters.subregions?.includes(sgg) || false;
                return (
                  <button
                    key={sgg}
                    type="button"
                    onClick={() => {
                      const current = new Set(currentFilters.subregions || []);
                      if (current.has(sgg)) current.delete(sgg);
                      else current.add(sgg);
                      onFilterChange({
                        ...currentFilters,
                        subregions: Array.from(current),
                      });
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      selected
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-slate-700 border-slate-300 hover:border-blue-300"
                    }`}
                  >
                    {sgg}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 모집 분야 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            🎯 모집 분야
          </label>
          <select
            value={currentFilters.area}
            onChange={(e) => handleFilterChange("area", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 분야</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* 팀 규모 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            👥 팀 규모
          </label>
          <select
            value={currentFilters.teamSize}
            onChange={(e) => handleFilterChange("teamSize", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 규모</option>
            {teamSizeOptions.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* 모집 상태 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            🔥 모집 상태
          </label>
          <select
            value={currentFilters.recruitmentStatus}
            onChange={(e) =>
              handleFilterChange("recruitmentStatus", e.target.value)
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 상태</option>
            {recruitmentStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* 마감일 상태 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            ⏰ 마감일
          </label>
          <select
            value={currentFilters.deadlineStatus}
            onChange={(e) =>
              handleFilterChange("deadlineStatus", e.target.value)
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체</option>
            {deadlineStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* 성향 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            🎭 팀원 성향
          </label>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {Object.entries(TRAITS_OPTIONS).map(([category, options]) => (
              <div key={category}>
                <div className="text-xs font-medium text-slate-600 mb-2">
                  {category.replaceAll("_", " ")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map((trait) => {
                    const isSelected = currentFilters.traits.includes(trait);
                    return (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => {
                          const newTraits = isSelected
                            ? currentFilters.traits.filter((t) => t !== trait)
                            : [...currentFilters.traits, trait];
                          onFilterChange({
                            ...currentFilters,
                            traits: newTraits,
                          });
                        }}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          isSelected
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-slate-700 border-slate-300 hover:border-blue-300"
                        }`}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 필터 초기화 */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full btn btn-animate btn-primary text-sm"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamFilter;
