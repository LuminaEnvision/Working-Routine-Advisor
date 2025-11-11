import { Brain } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Logo = ({ size = "md", className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-[#35D07F] via-[#FBCC5C] to-[#35D07F] flex items-center justify-center shadow-lg relative overflow-hidden group ${className}`}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Brain icon with glow */}
      <div className="relative z-10">
        <Brain className={`${iconSizes[size]} text-white drop-shadow-lg`} strokeWidth={2.5} />
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-white/20 rounded-bl-full" />
    </div>
  );
};

