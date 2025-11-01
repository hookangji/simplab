import Container from "../../shared/ui/Container";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet } from "@/shared/api";

type Contest = {
  id: string;
  title: string;
  topic?: string | null;
  region?: string | null;
  deadline?: string | null;
  image_url?: string | null;
};

const getDDay = (deadline?: string | null): string => {
  if (!deadline) return "마감 미정";

  try {
    // YYYY-MM-DD 형식의 날짜 문자열을 직접 파싱
    const dateParts = deadline.split("-");
    if (dateParts.length !== 3) {
      console.error("날짜 형식 오류:", deadline);
      return "마감 미정";
    }

    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.error("날짜 파싱 오류:", deadline, { year, month, day });
      return "마감 미정";
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
      return "마감 미정";
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
      return "마감됨";
    } else if (diffDays === 0) {
      // 오늘이 마감일
      return "D-Day";
    } else {
      // 남은 일수
      return `D-${diffDays}`;
    }
  } catch (error) {
    console.error("날짜 계산 오류:", error, deadline);
    return "마감 미정";
  }
};

const ContestCard = ({ c }: { c: Contest }) => {
  return (
    <Link
      to={`/contests/${c.id}`}
      className="card-hover group overflow-hidden rounded-3xl surface hover:border-blue-300 hover:shadow-xl"
    >
      <div className="relative">
        <div className="aspect-[3/4] w-full bg-white flex items-center justify-center p-2">
          {c.image_url ? (
            <img
              src={c.image_url}
              alt={c.title}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-6xl">🏆</span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          <div className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {c.title}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              {c.topic ?? "주제 미정"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {c.region ?? "지역 미정"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(() => {
              const dDayText = getDDay(c.deadline);
              const isOverdue = dDayText === "마감됨";
              const isUrgent = dDayText === "D-Day";
              const className = isOverdue
                ? "bg-red-50 text-red-700 border-red-200"
                : isUrgent
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-blue-50 text-blue-700 border-blue-200";
              return (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${className}`}
                >
                  {dDayText}
                </span>
              );
            })()}
          </div>
          <div className="text-xs text-slate-500">자세히 보기 →</div>
        </div>
      </div>
    </Link>
  );
};

const ContestList = () => {
  const [contests, setContests] = useState<Contest[]>([]);

  useEffect(() => {
    apiGet<{ success: boolean; data: { contests: Contest[] } }>("/api/contests")
      .then((d) => {
        const contests = d.data.contests.map((contest: Contest) => ({
          ...contest,
          // deadline이 Date 객체인 경우 문자열로 변환
          deadline: contest.deadline
            ? typeof contest.deadline === "string"
              ? contest.deadline
              : new Date(contest.deadline as any).toISOString().split("T")[0]
            : null,
        }));
        setContests(contests);
      })
      .catch((error) => {
        console.error("공모전 목록을 불러오는데 실패했습니다:", error);
        setContests([]);
      });
  }, []);

  return (
    <section className="bg-gradient-to-br from-slate-50 to-white py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            인기 공모전
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            다양한 분야의 공모전에서 당신의 실력을 뽐내보세요
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {contests.slice(0, 8).map((c) => (
            <ContestCard key={c.id} c={c} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/contests"
            className="btn btn-animate btn-outline inline-flex items-center gap-2 text-lg"
          >
            모든 공모전 보기
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default ContestList;
