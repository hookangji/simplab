import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import IndexPage from "./pages/index";
import RecruitDetailPage from "./pages/team/RecruitDetail";
import ProfileDetailPage from "./pages/profile/ProfileDetail";
import RecruitListPage from "./pages/team/RecruitListPage";
import ContestListPage from "./pages/contest/ContestListPage";
import ContestDetailPage from "./pages/contest/ContestDetailPage";
import MyPage from "./pages/mypage/MyPage";
import MessengerPage from "./pages/messenger/MessengerPage";
import LoginPage from "./pages/auth/LoginPage";

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/team" element={<RecruitListPage />} />
        <Route path="/team/:id" element={<RecruitDetailPage />} />
        <Route path="/profile/:id" element={<ProfileDetailPage />} />
        <Route path="/contests" element={<ContestListPage />} />
        <Route path="/contests/:id" element={<ContestDetailPage />} />
        <Route path="/messenger" element={<MessengerPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mypage/account" element={<MyPage />} />
        <Route path="/mypage/favorites" element={<MyPage />} />
        <Route path="/mypage/profile" element={<MyPage />} />
        <Route path="/mypage/posts" element={<MyPage />} />
        <Route path="/mypage/posts/create" element={<MyPage />} />
        <Route path="/mypage/team-registration" element={<MyPage />} />
        <Route path="/mypage/manage" element={<MyPage />} />
        <Route path="/mypage/team-profile" element={<MyPage />} />
        <Route
          path="/profile"
          element={<div className="p-8">프로필 등록</div>}
        />
        <Route
          path="*"
          element={<div className="p-8">페이지를 찾을 수 없습니다.</div>}
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
