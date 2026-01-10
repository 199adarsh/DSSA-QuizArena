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
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="mx-auto px-4">
      <div className="flex h-14 max-w-5xl items-center justify-between gap-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-10">

          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold shadow-inner ring-1 ring-white/10">
              Q
            </div>
            <span className="font-display font-semibold text-sm tracking-tight text-white/90">
              DSSA QUIZ ARENA              
            </span>
          </Link>

          {/* Nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2",
                    location === item.href
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt={user.firstName || "User"} 
                      className="w-6 h-6 rounded-full ring-1 ring-white/20"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white ring-1 ring-white/20">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-white/90 hidden sm:block">
                    {user.firstName}
                  </p>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => login()}
                className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black hover:bg-white transition shadow"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
