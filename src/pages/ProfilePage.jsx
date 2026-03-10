import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ProfileSidebar from "../components/profile/ProfileSidebar";
import ProfileWorkspaceHeader from "../components/profile/ProfileWorkspaceHeader";
import ProfileAccountHeader from "../components/profile/ProfileAccountHeader";
import ProfileTabContent from "../components/profile/ProfileTabContent";
import {
  createInitialProfileState,
  kycDocumentIds,
  profileStorageKey,
  profileTabs,
  sidebarItems,
  workspaceSummary,
} from "../components/profile/profileData";

function buildInitialProfileState(user) {
  const storedProfile = window.localStorage.getItem(profileStorageKey);

  if (!storedProfile) {
    return createInitialProfileState(user);
  }

  try {
    return JSON.parse(storedProfile);
  } catch {
    window.localStorage.removeItem(profileStorageKey);
    return createInitialProfileState(user);
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type,
        url: reader.result,
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("user");
  const [profileState, setProfileState] = useState(() => buildInitialProfileState(user));

  const avatarInputRef = useRef(null);
  const companyLogoInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const documentInputRefs = useRef({});

  useEffect(() => {
    setProfileState((current) => {
      if (current?.userForm?.email) {
        return current;
      }

      return createInitialProfileState(user);
    });
  }, [user]);

  useEffect(() => {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(profileState));
  }, [profileState]);

  const userInitials = useMemo(() => {
    return (
      profileState.userForm.fullName
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "IM"
    );
  }, [profileState.userForm.fullName]);

  const updateProfileSection = (sectionKey, fieldId, value) => {
    setProfileState((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [fieldId]: value,
      },
    }));
  };

  const handleFileSelect = async (event, updater) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const asset = await readFile(file);
    setProfileState((current) => updater(current, asset));
    event.target.value = "";
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear session locally even if the logout request fails.
    } finally {
      setUser(null);
      navigate("/");
    }
  };

  const openStoredFile = (file) => {
    if (file?.url) {
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  };

  const handlers = {
    onUserFieldChange: (fieldId, value) => updateProfileSection("userForm", fieldId, value),
    onCompanyFieldChange: (fieldId, value) => updateProfileSection("companyForm", fieldId, value),
    onBankFieldChange: (fieldId, value) => updateProfileSection("bankForm", fieldId, value),
    onAvatarSelect: () => avatarInputRef.current?.click(),
    onAvatarRemove: () => setProfileState((current) => ({ ...current, avatar: null })),
    onCompanyLogoSelect: () => companyLogoInputRef.current?.click(),
    onSelfieSelect: () => selfieInputRef.current?.click(),
    onDocumentSelect: (documentId) => documentInputRefs.current[documentId]?.click(),
    onOpenFile: openStoredFile,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#35142e_0%,#170719_48%,#0b030d_100%)] text-slate-100">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileSelect(event, (current, asset) => ({ ...current, avatar: asset }))}
      />
      <input
        ref={companyLogoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileSelect(event, (current, asset) => ({ ...current, companyLogo: asset }))}
      />
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) =>
          handleFileSelect(event, (current, asset) => ({
            ...current,
            kyc: {
              ...current.kyc,
              selfie: asset,
            },
          }))
        }
      />
      {kycDocumentIds.map((documentId) => (
        <input
          key={documentId}
          ref={(element) => {
            documentInputRefs.current[documentId] = element;
          }}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) =>
            handleFileSelect(event, (current, asset) => ({
              ...current,
              kyc: {
                ...current.kyc,
                documents: {
                  ...current.kyc.documents,
                  [documentId]: asset,
                },
              },
            }))
          }
        />
      ))}

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(236,72,153,0.12),transparent_18%),radial-gradient(circle_at_85%_12%,rgba(217,70,239,0.12),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(244,114,182,0.08),transparent_24%)]" />
      <div className="relative flex min-h-screen">
        <ProfileSidebar
          items={sidebarItems}
          brandInitials="IMC"
          onItemSelect={(itemId) => {
            if (itemId === "home") {
              navigate("/");
            }
          }}
        />

        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-9">
          <ProfileWorkspaceHeader summary={workspaceSummary} userInitials={userInitials} onLogout={handleLogout} />

          <div className="mx-auto mt-6 max-w-[1680px] space-y-6 pb-10">
            <ProfileAccountHeader tabs={profileTabs} activeTab={activeTab} onTabChange={setActiveTab} />
            <ProfileTabContent activeTab={activeTab} profileState={profileState} handlers={handlers} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
