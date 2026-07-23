import Link from "next/link";

export default function AccountTypePage() {
  return (
    <div className="page-shell narrow container">
      <div className="page-heading centered"><span className="eyebrow dark">First-time setup</span><h1>How are you buying?</h1><p>Your choice creates the correct profile. Admin access is assigned privately and is never available here.</p></div>
      <div className="channel-grid">
        <Link className="channel-card personal selectable" href="/onboarding/personal"><span>Personal</span><h3>I am buying for myself or my family</h3><p>Create an active retail customer profile.</p></Link>
        <Link className="channel-card business selectable" href="/business/apply"><span>Business</span><h3>I represent a shop, wholesaler or organisation</h3><p>Create a business profile and submit it for owner approval.</p></Link>
      </div>
    </div>
  );
}
