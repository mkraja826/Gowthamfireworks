import { PhoneOtpForm } from "@/components/phone-otp-form";

export const metadata = { title: "Owner admin login" };

export default function AdminLoginPage() {
  return <div className="auth-page admin-auth"><PhoneOtpForm mode="admin" /></div>;
}
