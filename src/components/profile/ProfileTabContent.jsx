import {
  BadgeCheck,
  Eye,
  FileText,
  Pencil,
  UploadCloud,
  X,
} from "lucide-react";
import {
  bankFields,
  companyFields,
  kycDocumentDefinitions,
  userProfileCards,
} from "./profileData";

function SectionCard({ children, className = "" }) {
  return (
    <section
      className={`rounded-[1.75rem] border border-pink-200/15 bg-[linear-gradient(155deg,rgba(61,20,52,0.64),rgba(27,9,31,0.8))] p-5 shadow-[0_14px_34px_rgba(15,2,20,0.32)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}

function VerifiedBadge({ label = "Verified", tone = "green" }) {
  const styles =
    tone === "blue"
      ? "border-sky-300/25 bg-sky-400/10 text-sky-100"
      : "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${styles}`}>
      <BadgeCheck size={14} />
      {label}
    </span>
  );
}

function FormField({ field, value, onChange, verified }) {
  const baseClassName =
    "mt-2 w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-lg text-slate-50 outline-none transition placeholder:text-pink-100/35 focus:border-pink-300/40";

  if (field.type === "textarea") {
    return (
      <label className={field.fullWidth ? "md:col-span-2" : ""}>
        <div className="text-sm font-medium text-pink-100/80">
          {field.label}
          {field.required ? <span className="ml-1 text-rose-300">*</span> : null}
        </div>
        <textarea
          className={`${baseClassName} min-h-[96px] resize-none`}
          value={value}
          onChange={(event) => onChange(field.id, event.target.value)}
        />
      </label>
    );
  }

  return (
    <label className={field.fullWidth ? "md:col-span-2" : ""}>
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-pink-100/80">
        <span>
          {field.label}
          {field.required ? <span className="ml-1 text-rose-300">*</span> : null}
        </span>
        {verified ? <VerifiedBadge label="Verified" tone="blue" /> : null}
      </div>
      <input
        type={field.type}
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
        className={baseClassName}
      />
    </label>
  );
}

function UploadButton({ label, onClick, secondary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
        secondary
          ? "border border-white/10 bg-slate-950/25 text-pink-100 hover:border-pink-200/25"
          : "bg-[#163f8d] text-white hover:bg-[#1a4ba7]"
      }`}
    >
      <UploadCloud size={14} />
      {label}
    </button>
  );
}

function UserPanel({ profileState, onUserFieldChange, onAvatarSelect, onAvatarRemove }) {
  const avatar = profileState.avatar;

  return (
    <div className="space-y-6">
      <SectionCard className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {userProfileCards.map((card) => (
            <article
              key={card.id}
              className={`rounded-2xl border px-4 py-5 ${
                card.active ? "border-pink-300/30 bg-pink-500/10" : "border-white/10 bg-slate-950/20"
              }`}
            >
              <h3 className="text-2xl font-semibold text-slate-50">{card.title}</h3>
              <p className="mt-2 text-lg text-pink-100/65">{card.description}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-lg font-semibold text-[#ff8a2b]">
          Keep your profile and credentials updated for uninterrupted account operations.
        </p>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff8a2b]">Profile Settings</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50">Personal Contact Information</h3>
          </div>
          <VerifiedBadge label="Account Approved" />
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-[520px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/25 p-8 text-center">
            <div className="relative">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-[12px] border-white/10 bg-white/5 text-pink-100/45 shadow-[0_16px_40px_rgba(13,3,16,0.35)]">
                {avatar ? (
                  <img src={avatar.url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <svg viewBox="0 0 120 120" className="h-28 w-28 fill-current">
                    <path d="M60 58c11 0 20-12 20-27S71 4 60 4 40 16 40 31s9 27 20 27Zm0 10c-22 0-40 14-40 32v16h80v-16c0-18-18-32-40-32Z" />
                  </svg>
                )}
              </div>
              <button
                type="button"
                onClick={onAvatarRemove}
                className="absolute right-0 top-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ef5b45] text-white shadow-lg"
              >
                <X size={20} />
              </button>
              <button
                type="button"
                onClick={onAvatarSelect}
                className="absolute bottom-0 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2e3779] text-white shadow-lg"
              >
                <Pencil size={18} />
              </button>
            </div>
            <button type="button" onClick={onAvatarSelect} className="mt-8 text-xl font-medium text-pink-100/75">
              {avatar ? "Change profile photo" : "Upload profile photo"}
            </button>
          </div>

          <div className="space-y-4">
            <SectionCard className="p-4 sm:p-5">
              <div className="grid gap-4">
                <FormField
                  field={{ id: "fullName", label: "Full Name", type: "text" }}
                  value={profileState.userForm.fullName}
                  onChange={onUserFieldChange}
                />
                <FormField
                  field={{ id: "email", label: "Email", type: "email" }}
                  value={profileState.userForm.email}
                  onChange={onUserFieldChange}
                  verified
                />
                <FormField
                  field={{ id: "phone", label: "Phone Number", type: "tel" }}
                  value={profileState.userForm.phone}
                  onChange={onUserFieldChange}
                  verified
                />
              </div>
            </SectionCard>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function CompanyPanel({ profileState, onCompanyFieldChange, onCompanyLogoSelect }) {
  const logo = profileState.companyLogo;

  return (
    <SectionCard className="border-t-4 border-t-fuchsia-500 p-6 sm:p-8">
      <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-pink-100/75">
            <BadgeCheck size={14} />
            <span>Company Logo (optional)</span>
          </div>
          <button
            type="button"
            onClick={onCompanyLogoSelect}
            className="flex min-h-[190px] w-full flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-pink-200/20 bg-slate-950/25 px-6 text-center text-pink-50 shadow-inner"
          >
            {logo ? (
              <img src={logo.url} alt="Company logo" className="max-h-[180px] w-full rounded-2xl object-contain" />
            ) : (
              <>
                <UploadCloud size={52} className="mb-5 text-pink-200/80" />
                <span className="text-2xl font-medium">Drag files here or click to upload</span>
              </>
            )}
          </button>
          <div className="mt-4">
            <UploadButton label={logo ? "Replace logo" : "Upload logo"} onClick={onCompanyLogoSelect} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {companyFields.map((field) => (
            <FormField
              key={field.id}
              field={field}
              value={profileState.companyForm[field.id]}
              onChange={onCompanyFieldChange}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function BankPanel({ profileState, onBankFieldChange }) {
  return (
    <SectionCard className="p-6 sm:p-8">
      <h3 className="text-4xl font-semibold tracking-tight text-slate-50">Bank Account Details</h3>
      <p className="mt-3 text-lg text-pink-100/65">Add payout details to receive remittance without delays.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {bankFields.map((field) => (
          <FormField
            key={field.id}
            field={field}
            value={profileState.bankForm[field.id]}
            onChange={onBankFieldChange}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function KycPanel({ profileState, onSelfieSelect, onDocumentSelect, onOpenFile }) {
  const { kyc } = profileState;

  return (
    <SectionCard className="mx-auto max-w-4xl border-t-4 border-t-fuchsia-500 p-6 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-semibold text-slate-50">KYC Details</h3>
          <button type="button" onClick={onSelfieSelect} className="inline-flex items-center gap-2 rounded-lg bg-[#163f8d] px-3 py-2 text-sm font-semibold text-white">
            <Pencil size={14} />
            Edit
          </button>
        </div>
        <VerifiedBadge />
      </div>

      <div className="grid gap-8 border-b border-white/10 py-6 md:grid-cols-[1fr_240px]">
        <div>
          <div className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-50">
            <span className="h-6 w-1 rounded-full bg-[#1fc16b]" />
            Basic Information
          </div>
          <p className="text-sm font-medium text-pink-100/70">Business Structure</p>
          <p className="mt-2 text-lg font-medium text-white">{kyc.businessStructure}</p>
        </div>

        <article className="rounded-xl border border-white/10 bg-slate-950/25 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-50">Selfie</p>
            <VerifiedBadge />
          </div>
          {kyc.selfie ? (
            <img src={kyc.selfie.url} alt="KYC selfie" className="h-40 w-full rounded-lg object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 text-pink-100/50">
              Upload selfie
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <UploadButton label={kyc.selfie ? "Replace" : "Upload"} onClick={onSelfieSelect} />
            {kyc.selfie ? <UploadButton label="Preview" onClick={() => onOpenFile(kyc.selfie)} secondary /> : null}
          </div>
        </article>
      </div>

      <div className="border-b border-white/10 py-6">
        <div className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-50">
          <span className="h-6 w-1 rounded-full bg-[#1fc16b]" />
          Uploaded Documents
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {kycDocumentDefinitions.map((document) => {
            const file = kyc.documents[document.id];

            return (
              <article key={document.id} className="rounded-xl border border-white/10 bg-slate-950/25 p-3 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-50">{document.label}</p>
                  <VerifiedBadge />
                </div>
                <div className="flex h-40 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  {file ? (
                    <div className="text-center">
                      <FileText size={72} className="mx-auto text-[#ea6052]" />
                      <p className="mt-2 text-sm text-pink-100/70">{file.name}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-pink-100/50">Upload PDF</div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <UploadButton label={file ? "Replace" : "Upload"} onClick={() => onDocumentSelect(document.id)} />
                  {file ? (
                    <button
                      type="button"
                      onClick={() => onOpenFile(file)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#163f8d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4ba7]"
                    >
                      <Eye size={14} />
                      Open PDF
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 pt-6 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-pink-100/70">Submitted On</p>
          <p className="mt-2 text-lg font-medium text-white">{kyc.timestamps.submittedOn}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-pink-100/70">Last Updated</p>
          <p className="mt-2 text-lg font-medium text-white">{kyc.timestamps.lastUpdated}</p>
        </div>
      </div>
    </SectionCard>
  );
}

function ProfileTabContent({ activeTab, profileState, handlers }) {
  if (activeTab === "company") {
    return (
      <CompanyPanel
        profileState={profileState}
        onCompanyFieldChange={handlers.onCompanyFieldChange}
        onCompanyLogoSelect={handlers.onCompanyLogoSelect}
      />
    );
  }

  if (activeTab === "bank") {
    return <BankPanel profileState={profileState} onBankFieldChange={handlers.onBankFieldChange} />;
  }

  if (activeTab === "kyc") {
    return (
      <KycPanel
        profileState={profileState}
        onSelfieSelect={handlers.onSelfieSelect}
        onDocumentSelect={handlers.onDocumentSelect}
        onOpenFile={handlers.onOpenFile}
      />
    );
  }

  return (
    <UserPanel
      profileState={profileState}
      onUserFieldChange={handlers.onUserFieldChange}
      onAvatarSelect={handlers.onAvatarSelect}
      onAvatarRemove={handlers.onAvatarRemove}
    />
  );
}

export default ProfileTabContent;
