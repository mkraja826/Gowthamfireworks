export type Availability = "available" | "limited" | "out_of_stock" | "coming_soon";

export type CatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  packSize: string;
  retailPrice: number;
  mrp: number;
  availability: Availability;
  imageLabel: string;
  featured?: boolean;
  lowSound?: boolean;
};
