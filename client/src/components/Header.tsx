import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { LogOut, LayoutDashboard, Trophy, User, Menu, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useEffect } from "react";

export function Header() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between rounded-full border border-white/20 bg-white/5 backdrop-blur-2xl shadow-lg px-6">
          
          {/* Logo - Icon Only */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center"
          >
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
              Q
            </div>
          </button>

          {/* Profile/Sign-in Icon Only */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <button
                onClick={() => setIsMobileMenuOpen((p) => !p)}
                className="p-1.5 rounded-full hover:bg-white/10"
              >
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                  {user?.firstName?.[0] || 'U'}
                </div>
              </button>
            ) : (
              <button
                onClick={login}
                className="p-1.5 rounded-full hover:bg-white/10"
              >
                <User className="w-4 h-4 text-white/80" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Top Bar - UNCHANGED */}
      <header className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-2xl shadow-lg px-2 py-2">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className={cn(
                "p-3 rounded-full transition-all duration-200",
                location === item.href
                  ? "bg-white/15 text-white shadow-lg shadow-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
          
          <div className="w-px h-6 bg-white/10 mx-1" />
          
          {isAuthenticated ? (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-3 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                {user?.firstName?.[0] || 'U'}
              </div>
            </button>
          ) : (
            <button
              onClick={login}
              className="p-3 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Floating Sheet */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-4">
              
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-medium text-white">{user?.firstName}</p>
                  <p className="text-xs text-white/60">Profile</p>
                </div>
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-300"
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
