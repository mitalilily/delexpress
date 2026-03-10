import { createElement } from "react";

function ProfileTabNavigation({ tabs, activeTab, onChange }) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {tabs.map(({ id, label, icon }) => {
        const isActive = id === activeTab;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
              isActive
                ? "border-pink-300/35 bg-pink-500/14 text-pink-50"
                : "border-white/10 bg-slate-950/25 text-pink-100/75 hover:border-pink-200/20 hover:bg-pink-500/10 hover:text-pink-50"
            }`}
          >
            {createElement(icon, { size: 16 })}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default ProfileTabNavigation;
