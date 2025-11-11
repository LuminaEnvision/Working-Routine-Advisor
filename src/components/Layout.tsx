import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Home, Lightbulb, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletMenu } from "@/components/WalletMenu";
import { Logo } from "@/components/Logo";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/daily-checkin", icon: CheckCircle2, label: "Check-in" },
    { path: "/recommendations", icon: Lightbulb, label: "Insights" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <Logo size="md" className="group-hover:scale-110 transition-transform" />
            <span className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              WRA
            </span>
          </Link>
          {/* Wallet Menu - Top Right */}
          <div className="flex items-center">
            <WalletMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="container max-w-2xl mx-auto px-2">
          <div className="flex items-center justify-around h-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[64px] h-16 rounded-xl transition-all relative",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <Icon 
                    className={cn(
                      "w-6 h-6 transition-transform",
                      isActive && "scale-110"
                    )} 
                  />
                  <span className={cn("text-xs font-medium", isActive && "font-bold")}>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-2 w-8 h-1 rounded-full bg-gradient-celo" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
