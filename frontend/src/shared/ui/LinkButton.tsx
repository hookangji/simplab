import { Link } from "react-router-dom"; // ES import 사용 [[memory:5999249]]

type LinkButtonVariant = "primary" | "secondary";

interface LinkButtonProps {
  to: string;
  children: React.ReactNode;
  variant?: LinkButtonVariant;
  className?: string;
}

const base = "btn btn-animate text-center text-sm focus-ring";

const styles: Record<LinkButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-outline",
};

const LinkButton = ({
  to,
  children,
  variant = "primary",
  className = "",
}: LinkButtonProps) => {
  return (
    <Link to={to} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
};

export default LinkButton;
