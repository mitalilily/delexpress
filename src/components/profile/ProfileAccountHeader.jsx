import ProfileTabNavigation from "./ProfileTabNavigation";

function ProfileAccountHeader({ tabs, activeTab, onTabChange }) {
  return (
    <section className="rounded-[1.75rem] border border-pink-200/15 bg-[linear-gradient(155deg,rgba(61,20,52,0.62),rgba(27,9,31,0.78))] px-6 py-8 shadow-[0_14px_34px_rgba(15,2,20,0.34)] backdrop-blur-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff8a2b]">Account Center</p>
      <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50">Profile &amp; Verification</h2>
      <p className="mt-3 max-w-3xl text-lg text-pink-100/70">
        Manage personal details, business identity, bank accounts, and KYC status.
      </p>
      <ProfileTabNavigation tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
    </section>
  );
}

export default ProfileAccountHeader;
