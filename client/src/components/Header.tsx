import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { LogOut, LayoutDashboard, Trophy, User, Menu, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Header() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <>
      {/* Top Bar */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between rounded-full border border-white/20 bg-white/5 backdrop-blur-2xl shadow-lg px-6">
          
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">
              Q
            </div>
            <span className="text-sm font-semibold text-white/90">
              DSSA QUIZ
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/5 p-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2",
                  location === item.href
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-xs">{user?.firstName}</span>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen((p) => !p)}
                  className="md:hidden p-2 rounded-full hover:bg-white/10"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>

                {/* Desktop Logout */}
                <button
                  onClick={() => logout()}
                  className="hidden md:flex p-2 rounded-full hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Floating Sheet */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-4">
              
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      setLocation(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-left"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-300"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
