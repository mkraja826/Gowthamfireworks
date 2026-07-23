"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = { mode: "customer" | "admin" };

export function PhoneOtpForm({ mode }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const testMode = process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true";

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Supabase is not configured. Add the project URL and publishable key in .env.local.");
    setLoading(true); setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) return setMessage(error.message);
    setStep("otp");
    setMessage("OTP requested. Use the configured Supabase test OTP for this development number.");
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Supabase is not configured.");
    setLoading(true); setMessage("");
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (error || !data.user) { setLoading(false); return setMessage(error?.message ?? "OTP verification failed."); }

    if (mode === "admin") {
      const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const roles = (roleRows ?? []).map((row) => row.role);
      setLoading(false);
      if (roles.includes("owner_admin") || roles.includes("staff")) return router.replace("/admin");
      await supabase.auth.signOut();
      return setMessage("This verified number is not authorised for the admin dashboard.");
    }

    const { data: profile } = await supabase.from("profiles").select("account_type,onboarding_completed").eq("id", data.user.id).maybeSingle();
    setLoading(false);
    if (!profile?.onboarding_completed) return router.replace("/onboarding/account-type");
    if (profile.account_type === "business") return router.replace("/wholesale");
    return router.replace("/catalogue");
  }

  return (
    <div className="auth-card">
      {testMode && <div className="test-banner">Development mode · Supabase Test OTP</div>}
      <h1>{mode === "admin" ? "Owner admin login" : "Login with phone OTP"}</h1>
      <p>{mode === "admin" ? "Only pre-authorised owner and staff phone numbers can continue." : "Browse freely and verify your phone when you are ready to save or submit a requirement."}</p>
      {step === "phone" ? (
        <form onSubmit={sendOtp}>
          <label>Mobile number<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="+919876543210" required /></label>
          <button className="primary-button" disabled={loading}>{loading ? "Requesting…" : "Continue"}</button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <label>Six-digit OTP<input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" required /></label>
          <button className="primary-button" disabled={loading || otp.length !== 6}>{loading ? "Verifying…" : "Verify OTP"}</button>
          <button type="button" className="text-button" onClick={() => { setStep("phone"); setOtp(""); setMessage(""); }}>Change phone number</button>
        </form>
      )}
      {message && <p className="form-message" role="status">{message}</p>}
    </div>
  );
}
