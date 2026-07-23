import Link from "next/link";
import { PhoneOtpForm } from "@/components/phone-otp-form";

export const metadata = { title: "Customer login" };

export default function LoginPage() {
  return <div className="auth-page"><PhoneOtpForm mode="customer" /><p className="auth-help">New customers choose <strong>Personal</strong> or <strong>Business</strong> only after OTP verification. <Link href="/wholesale">Learn about wholesale access</Link>.</p></div>;
}
