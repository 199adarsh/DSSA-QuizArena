import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { LogOut, LayoutDashboard, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, login, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold font-mona shadow-lg shadow-primary/25 group-hover:shadow-primary/50 transition-all">
            Q
          </div>
          <span className="font-mona font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            DSSA-Quizzyy
          </span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  location === item.href
                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.firstName}</p>
                  <p className="text-xs text-muted-foreground">Level 1</p>
                </div>
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.firstName || "User"} 
                    className="w-9 h-9 rounded-full ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary ring-2 ring-white/10">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
              <button
                onClick={() => logout()}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => login()}
              className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg shadow-white/5"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
