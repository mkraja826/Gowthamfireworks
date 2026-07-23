"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function BusinessApplicationPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Configure Supabase and log in before submitting a business application.");
    setLoading(true);
    const { error } = await supabase.rpc("complete_business_onboarding", {
      p_business_name: form.get("business_name"),
      p_contact_person: form.get("contact_person"),
      p_email: form.get("email") || null,
      p_business_type: form.get("business_type"),
      p_gstin: form.get("gstin") || null,
      p_address: form.get("address"),
      p_city: form.get("city"),
      p_state: form.get("state"),
      p_postal_code: form.get("postal_code"),
      p_licence_number: form.get("licence_number") || null,
      p_expected_volume: form.get("expected_volume") || null,
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    router.replace("/wholesale");
  }

  return (
    <div className="page-shell narrow container"><div className="page-heading"><span className="eyebrow dark">Wholesale application</span><h1>Create your business profile.</h1><p>You must verify your phone through customer login before this application can be submitted.</p></div><form className="form-card" onSubmit={submit}><div className="form-grid"><label>Business name<input name="business_name" required /></label><label>Contact person<input name="contact_person" required /></label></div><div className="form-grid"><label>Business type<select name="business_type"><option>Retail shop</option><option>Wholesaler</option><option>Distributor</option><option>Event business</option><option>Other</option></select></label><label>Email (optional)<input name="email" type="email" /></label></div><label>GSTIN (where applicable)<input name="gstin" /></label><label>Shop or office address<textarea name="address" required rows={3} /></label><div className="form-grid"><label>City<input name="city" required /></label><label>State<input name="state" required /></label></div><div className="form-grid"><label>Postal code<input name="postal_code" required /></label><label>Licence number (where applicable)<input name="licence_number" /></label></div><label>Expected purchase volume<textarea name="expected_volume" rows={2} placeholder="Example: seasonal requirement or approximate carton volume" /></label><label className="checkbox"><input type="checkbox" required /> I confirm the information is accurate and understand wholesale pricing requires owner approval.</label><button className="primary-button" disabled={loading}>{loading ? "Submitting…" : "Submit for owner review"}</button>{message && <p className="form-message">{message}</p>}</form></div>
  );
}
