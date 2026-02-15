import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, History } from "lucide-react";

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">PP</span>
          <span className="text-lg font-semibold text-foreground">
            Planning Poker
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/history"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <History className="h-4 w-4" />
              History
            </Link>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <span className="text-sm font-medium">{user?.displayName}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
