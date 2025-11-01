import Container from "../../shared/ui/Container";
import LinkButton from "../../shared/ui/LinkButton";
import { useAuth } from "../../contexts/AuthContext";

const Hero = () => {
  const { user } = useAuth();

  return (
    <Container>
      <section className="flex flex-col items-center pt-24 pb-20 md:pt-32 md:pb-28 accent-hero">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
            <span className="gradient-text">공모전 팀빌딩</span>
            <br />
            <span className="text-slate-900">이제 심플하게</span>
          </h1>
          <p className="mt-8 max-w-3xl text-center text-lg text-slate-600 md:text-xl leading-relaxed">
            TeamUp은 공모전·해커톤 팀빌딩을 단숨에 끝내는 올인원
            플랫폼입니다.맞춤 팀 추천, 투명한 프로필, 간편한 모집/지원으로
            함께할 팀을 빠르게 찾아 성공 확률을 높이세요.
          </p>
        </div>

        <div className="mt-12 grid w-full grid-cols-1 gap-4 sm:max-w-lg sm:grid-cols-2">
          <LinkButton to={user ? "/mypage/profile" : "/login"}>
            ✨ 프로필 등록
          </LinkButton>
          <LinkButton
            to={user ? "/mypage/posts" : "/login"}
            variant="secondary"
          >
            👥 팀 등록
          </LinkButton>
        </div>
      </section>
    </Container>
  );
};

export default Hero;
