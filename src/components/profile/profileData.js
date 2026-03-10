import {
  BriefcaseBusiness,
  Building2,
  CreditCard,
  HelpCircle,
  Home,
  Landmark,
  LayoutGrid,
  PackageSearch,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";

export const profileTabs = [
  { id: "user", label: "User", icon: UserRound },
  { id: "company", label: "Company", icon: Building2 },
  { id: "bank", label: "Bank", icon: CreditCard },
  { id: "kyc", label: "KYC", icon: ShieldCheck },
];

export const sidebarItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
  { id: "orders", icon: ShoppingCart, label: "Orders" },
  { id: "shipments", icon: Truck, label: "Shipments" },
  { id: "tracking", icon: PackageSearch, label: "Tracking" },
  { id: "reconciliation", icon: ReceiptText, label: "Reconciliation" },
  { id: "billing", icon: BriefcaseBusiness, label: "Billing" },
  { id: "wallet", icon: WalletCards, label: "Wallet" },
  { id: "banking", icon: Landmark, label: "Banking" },
  { id: "settings", icon: Settings, label: "Settings", active: true },
  { id: "help", icon: HelpCircle, label: "Help" },
];

export const workspaceSummary = {
  title: "Mera Courier Wala Workspace",
  subtitle: "ORDERS, BILLING, RECONCILIATION",
  liveLabel: "LIVE PANEL",
  walletAmount: "?0",
};

export const profileStorageKey = "imc-profile-state";
export const kycDocumentIds = ["pan", "aadhaar", "cheque"];

export function createInitialProfileState(user) {
  return {
    userForm: {
      fullName: user?.name || "IronMan User",
      email: user?.email || "demo@ironmancourier.com",
      phone: user?.phone || "+91 98765 43210",
    },
    avatar: null,
    companyLogo: null,
    companyForm: {
      brandName: "Google",
      businessName: "Google",
      website: "https://yourbrand.com",
      contactNumber: "",
      supportEmail: "",
      address: "",
      pincode: "246149",
      city: "Pauri Garhwal",
      state: "Uttarakhand",
    },
    bankForm: {
      accountHolderName: user?.name || "IronMan User",
      bankName: "HDFC Bank",
      accountNumber: "50200012345678",
      ifscCode: "HDFC0001234",
      branch: "New Delhi",
      accountType: "Current",
    },
    kyc: {
      businessStructure: "Individual",
      selfie: null,
      documents: {
        pan: null,
        aadhaar: null,
        cheque: null,
      },
      timestamps: {
        submittedOn: "09 Mar 2026, 06:47 PM",
        lastUpdated: "09 Mar 2026, 07:31 PM",
      },
    },
  };
}

export const userProfileCards = [
  {
    id: "details",
    title: "Profile Details",
    description: "Edit personal and contact information",
    active: true,
  },
  {
    id: "security",
    title: "Password & Security",
    description: "Update login password and access security",
  },
];

export const companyFields = [
  { id: "brandName", label: "Brand name", type: "text" },
  { id: "businessName", label: "Business name", type: "text" },
  { id: "website", label: "Website", type: "url" },
  { id: "contactNumber", label: "Contact number", type: "tel", required: true },
  { id: "supportEmail", label: "Support email", type: "email", required: true, fullWidth: true },
  { id: "address", label: "Address", type: "textarea", required: true, fullWidth: true },
  { id: "pincode", label: "Pincode", type: "text" },
  { id: "city", label: "City", type: "text" },
  { id: "state", label: "State", type: "text" },
];

export const bankFields = [
  { id: "accountHolderName", label: "Account Holder Name", type: "text" },
  { id: "bankName", label: "Bank Name", type: "text" },
  { id: "accountNumber", label: "Account Number", type: "text" },
  { id: "ifscCode", label: "IFSC Code", type: "text" },
  { id: "branch", label: "Branch", type: "text" },
  { id: "accountType", label: "Account Type", type: "text" },
];

export const kycDocumentDefinitions = [
  { id: "pan", label: "PAN Card" },
  { id: "aadhaar", label: "Aadhaar Card" },
  { id: "cheque", label: "Cancelled Cheque" },
];
