type ProductPackVisualProps = {
  name: string;
  category: string;
  packSize: string;
  variant?: "card" | "hero" | "detail" | "cart";
};

function toneClass(category: string) {
  return `tone-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export function ProductPackVisual({ name, category, packSize, variant = "card" }: ProductPackVisualProps) {
  return (
    <div className={`pack-visual ${toneClass(category)} pack-${variant}`} aria-label={`${name}, ${packSize}`} role="img">
      <span className="pack-brand">GOWTHAM</span>
      <strong>{name}</strong>
      <small>{category}</small>
      <i>{packSize}</i>
      <span className="pack-seal">SIVAKASI</span>
    </div>
  );
}
