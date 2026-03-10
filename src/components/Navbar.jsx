import { Link, useNavigate } from "react-router-dom";
import { CircleUserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { href: "#workspace-flow", label: "Features" },
  { href: "#workflow-story", label: "Workflow" },
  { href: "#faq", label: "FAQ" },
  { href: "#start", label: "Start" },
];

function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-pink-200/12 bg-[#140914]/72 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-left text-slate-100 transition hover:opacity-90"
        >
          <p className="bg-gradient-to-r from-pink-100 via-fuchsia-200 to-rose-300 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
            IronManCourier
          </p>
          <p className="text-sm text-pink-200/70">Shipping workspace for modern brands</p>
        </button>

        <div className="hidden items-center gap-7 text-sm text-pink-100/80 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-pink-200">
              {link.label}
            </a>
          ))}
        </div>

        {isAuthenticated ? (
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-full border border-pink-200/30 bg-pink-950/30 px-5 py-2.5 text-sm font-medium text-pink-50 transition hover:border-pink-200/55"
          >
            <CircleUserRound size={18} />
            Profile
          </Link>
        ) : (
          <Link
            to="/auth"
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-fuchsia-400 hover:to-rose-400"
          >
            Get Started
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
