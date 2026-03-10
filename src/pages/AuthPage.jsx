import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  otp: "",
};

function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const sendOtp = async () => {
    setStatus({ type: "", message: "" });

    if (!form.email) {
      setStatus({ type: "error", message: "Please enter your email first." });
      return;
    }

    try {
      setSendingOtp(true);
      const { data } = await api.post(
        "/auth/send-otp",
        {
          email: form.email,
          purpose: mode,
        },
        {
          timeout: 20000,
        }
      );

      setOtpSent(true);
      setStatus({
        type: "success",
        message: data.message || "OTP sent to your email address.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.response?.data?.message || "Failed to send OTP",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      setSubmitting(true);

      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/signin";
      const payload =
        mode === "signup"
          ? {
              name: form.name,
              phone: form.phone,
              email: form.email,
              password: form.password,
              otp: form.otp,
            }
          : {
              email: form.email,
              password: form.password,
              otp: form.otp,
            };

      const { data } = await api.post(endpoint, payload);
      setUser(data.user);
      navigate("/");
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.response?.data?.message || "Authentication failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setOtpSent(false);
    setStatus({ type: "", message: "" });
    setForm((current) => ({ ...current, otp: "" }));
  };

  return (
    <main className="relative mx-auto grid min-h-[calc(100vh-90px)] w-full max-w-7xl place-items-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-pink-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <section className="card-modern animate-fade-in-up w-full max-w-xl rounded-3xl p-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-100">Welcome back</h1>
        <p className="mb-7 text-muted">Secure OTP authentication for sign in and sign up.</p>

        <div className="mb-8 grid grid-cols-2 rounded-full border border-white/10 bg-slate-900/70 p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "signin" ? "bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white" : "text-slate-300"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "signup" ? "bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white" : "text-slate-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {mode === "signup" ? (
            <>
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950/65 px-4 py-3 outline-none transition focus:border-pink-300"
              />
              <input
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950/65 px-4 py-3 outline-none transition focus:border-pink-300"
              />
            </>
          ) : null}

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950/65 px-4 py-3 outline-none transition focus:border-pink-300"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950/65 px-4 py-3 outline-none transition focus:border-pink-300"
          />

          <div className="flex gap-3">
            <input
              name="otp"
              placeholder="Enter OTP"
              value={form.otp}
              onChange={onChange}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/65 px-4 py-3 outline-none transition focus:border-pink-300"
            />
            <button
              type="button"
              onClick={sendOtp}
              disabled={sendingOtp}
              className="whitespace-nowrap rounded-xl border border-pink-200/30 bg-pink-500/10 px-4 py-3 text-sm font-medium text-pink-100 transition hover:border-pink-200/60 disabled:opacity-60"
            >
              {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
            </button>
          </div>

          {status.message ? (
            <p className={`rounded-xl px-4 py-3 text-sm ${status.type === "error" ? "bg-red-500/10 text-red-300" : "bg-pink-500/10 text-pink-200"}`}>
              {status.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-3 font-semibold text-white transition hover:from-fuchsia-400 hover:to-rose-400 disabled:opacity-60"
          >
            {submitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AuthPage;
