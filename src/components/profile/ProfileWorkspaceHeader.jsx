import { LogOut, Search, Wallet, Zap } from "lucide-react";

function ProfileWorkspaceHeader({ summary, userInitials, onLogout }) {
  return (
    <header className="rounded-[1.75rem] border border-pink-200/15 bg-[linear-gradient(155deg,rgba(61,20,52,0.72),rgba(27,9,31,0.82))] px-4 py-4 shadow-[0_18px_40px_rgba(15,2,20,0.42)] backdrop-blur-xl sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-200/20 bg-pink-500/10 text-pink-50">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-50">{summary.title}</h1>
            <p className="text-sm font-medium tracking-wide text-pink-100/65">{summary.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <span className="inline-flex items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-bold tracking-wide text-amber-100">
            {summary.liveLabel}
          </span>

          <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-pink-100/40 sm:min-w-[420px]">
            <span className="flex-1 truncate">Search by Order ID, Order Number, AWB, Invoice...</span>
            <Search size={20} className="text-pink-100/80" />
          </div>

          <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-200/25 bg-rose-500/10 text-rose-200">
            <Zap size={18} />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
            <Wallet size={20} className="text-pink-100" />
            <span className="text-xl font-semibold text-slate-50">{summary.walletAmount}</span>
            <button type="button" className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:from-fuchsia-400 hover:to-rose-400">
              Recharge
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm font-semibold text-pink-50 transition hover:border-pink-200/25 hover:bg-pink-500/10"
          >
            <LogOut size={16} />
            Logout
          </button>

          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-pink-200/20 bg-[#18315b] text-lg font-semibold text-white">
            {userInitials}
          </div>
        </div>
      </div>
    </header>
  );
}

export default ProfileWorkspaceHeader;
