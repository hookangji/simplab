import { useState } from "react";
import { apiPost } from "../api";

interface NudgeButtonProps {
  toUserId: string;
  contestId: string;
  contestTitle?: string;
  onSuccess?: () => void;
  className?: string;
}

const NudgeButton = ({
  toUserId,
  contestId,
  contestTitle = "공모전",
  onSuccess,
  className = "",
}: NudgeButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const handleNudge = async () => {
    setIsLoading(true);
    try {
      await apiPost("/api/messages/nudge", {
        toUserId,
        contestId,
        message: customMessage || undefined, // 빈 문자열이면 undefined로 보내서 기본 메시지 사용
      });

      setShowModal(false);
      setCustomMessage("");
      onSuccess?.();

      // 성공 알림 (간단한 alert 대신 나중에 토스트로 교체 가능)
      alert("찔러보기를 보냈습니다! 💌");
    } catch (error) {
      console.error("찔러보기 전송 실패:", error);
      alert("찔러보기 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const defaultMessage = `안녕하세요! ${contestTitle} 공모전에 함께 참가해보시겠어요?`;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`btn btn-animate btn-primary text-sm disabled:opacity-50 ${className}`}
      >
        {isLoading ? "전송 중..." : "💌 찔러보기"}
      </button>

      {/* 찔러보기 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="glass p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">💌 찔러보기 보내기</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                메시지 (선택사항)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={defaultMessage}
                className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">
                비워두면 기본 메시지가 전송됩니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setCustomMessage("");
                }}
                className="flex-1 btn btn-ghost border border-slate-300"
              >
                취소
              </button>
              <button
                onClick={handleNudge}
                disabled={isLoading}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {isLoading ? "전송 중..." : "보내기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NudgeButton;
