import { createElement } from "react";

function ProfileSidebar({ items, brandInitials, onItemSelect }) {
  return (
    <aside className="hidden w-24 flex-col items-center border-r border-white/10 bg-[#120815] px-3 py-4 lg:flex">
      <button
        type="button"
        onClick={() => onItemSelect("home")}
        className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-pink-200/20 bg-[linear-gradient(180deg,rgba(244,114,182,0.16),rgba(30,10,34,0.9))] text-xs font-bold text-pink-50 shadow-[0_10px_30px_rgba(32,8,36,0.45)]"
      >
        {brandInitials}
      </button>

      <nav className="flex w-full flex-col items-center gap-3">
        {items.map(({ id, icon, label, active }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => onItemSelect(id)}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition ${
              active
                ? "border-pink-300/35 bg-pink-500/15 text-pink-50 shadow-[0_8px_24px_rgba(236,72,153,0.18)]"
                : "border-white/8 bg-white/5 text-pink-100/80 hover:border-pink-200/20 hover:bg-pink-500/10 hover:text-pink-50"
            }`}
          >
            {createElement(icon, { size: 20 })}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default ProfileSidebar;
