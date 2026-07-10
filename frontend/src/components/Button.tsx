interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className }) => {
  const baseClassNames = `duration-150 items-center flex font-medium transition-all truncate`;

  return (
    <button
      onClick={onClick}
      className={`group/button ${baseClassNames} ${className || ''}`}
    >
      {children}
    </button>
  );
};

export default Button;
