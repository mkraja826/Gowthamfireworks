"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function PersonalOnboardingPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Supabase is not configured.");
    setLoading(true);
    const { error } = await supabase.rpc("complete_personal_onboarding", {
      p_full_name: form.get("full_name"),
      p_email: form.get("email") || null,
      p_city: form.get("city"),
      p_state: form.get("state"),
      p_language: form.get("preferred_language"),
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    router.replace("/catalogue");
  }

  return (
    <div className="page-shell narrow container"><div className="page-heading"><span className="eyebrow dark">Personal profile</span><h1>Tell us where you are celebrating.</h1></div><form className="form-card" onSubmit={submit}><label>Full name<input name="full_name" required /></label><label>Email (optional)<input name="email" type="email" /></label><div className="form-grid"><label>City<input name="city" required /></label><label>State<input name="state" required /></label></div><label>Preferred language<select name="preferred_language" defaultValue="English"><option>English</option><option>Tamil</option><option>Telugu</option><option>Malayalam</option></select></label><label className="checkbox"><input type="checkbox" required /> I accept the privacy, safety and service conditions.</label><button className="primary-button" disabled={loading}>{loading ? "Saving…" : "Create personal profile"}</button>{message && <p className="form-message">{message}</p>}</form></div>
  );
}
