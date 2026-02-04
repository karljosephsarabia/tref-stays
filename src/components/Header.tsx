import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut, X, Home, Info, PlusCircle, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import trefLogo from "@/assets/tref-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function NavLink({
  to,
  children,
  className = "",
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={cn("relative", className)}>
      <span className="relative z-10">{children}</span>
      {isActive && (
        <motion.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const linkBase = "font-medium transition-colors duration-300";
  const isHome = location.pathname === "/";
  const linkStyle =
    isHome && !scrolled
      ? "text-white hover:text-primary"
      : "text-foreground hover:text-primary";

  return (
    <motion.header
      className={cn(
        "top-0 left-0 right-0 z-50 transition-all duration-300",
        isHome && !scrolled ? "absolute bg-transparent" : "sticky bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
      )}
      initial={false}
      animate={{
        backgroundColor: isHome && !scrolled ? "transparent" : "hsl(var(--background) / 0.85)",
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src={trefLogo} 
              alt="Tref Stays" 
              className="h-8 w-auto md:h-10 lg:h-12 object-contain transition-all duration-300"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <NavLink
              to="/"
              className={cn(linkBase, linkStyle, "py-2")}
            >
              Properties
            </NavLink>
            {user ? (
              <>
                <NavLink to="/list-property" className={cn(linkBase, linkStyle, "py-2")}>
                  List Property
                </NavLink>
                <NavLink to="/dashboard" className={cn(linkBase, linkStyle, "py-2")}>
                  Dashboard
                </NavLink>
              </>
            ) : (
              <NavLink to="/auth" className={cn(linkBase, linkStyle, "py-2")}>
                List Your Property
              </NavLink>
            )}
            <NavLink to="/about" className={cn(linkBase, linkStyle, "py-2")}>
              About
            </NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2 transition-colors",
                        isHome && !scrolled ? "text-white hover:text-primary hover:bg-white/10" : "text-foreground hover:text-primary hover:bg-muted"
                      )}
                    >
                      <User className="h-4 w-4" />
                      {user.email?.split("@")[0]}
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    isHome && !scrolled ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
                  )}
                  onClick={() => navigate("/auth")}
                >
                  Login
                </Button>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-95 shadow-md"
                    onClick={() => navigate("/auth")}
                  >
                    Sign Up
                  </Button>
                </motion.div>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3"
                onClick={() => navigate("/auth")}
              >
                Sign Up
              </Button>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={isHome && !scrolled ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <img src={trefLogo} alt="Tref" className="h-8 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  <button
                    onClick={() => handleNavClick("/")}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Home className="h-5 w-5 text-primary" />
                    <span className="font-medium">Properties</span>
                  </button>
                  {user ? (
                    <>
                      <button
                        onClick={() => handleNavClick("/list-property")}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <PlusCircle className="h-5 w-5 text-primary" />
                        <span className="font-medium">List Property</span>
                      </button>
                      <button
                        onClick={() => handleNavClick("/dashboard")}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        <span className="font-medium">Dashboard</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleNavClick("/auth")}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <PlusCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">List Your Property</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleNavClick("/about")}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Info className="h-5 w-5 text-primary" />
                    <span className="font-medium">About</span>
                  </button>

                  <div className="border-t border-border my-4" />

                  {user ? (
                    <>
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Signed in as {user.email}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left text-destructive"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleNavClick("/auth")}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-medium">Login / Sign Up</span>
                    </button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
