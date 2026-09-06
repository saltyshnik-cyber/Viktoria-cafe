export type MenuCategory = {
  id: string;
  name: string;
  emoji: string;
};

export type ComboComponent = {
  name: string;
  quantity: number;
  menuItemId?: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  weight: string;
  price?: number;
  isPopular?: boolean;
  photoUrl?: string;
  isAvailable?: boolean;
  sauceOptions?: string[];
  composition?: ComboComponent[];
  galleryPhotos?: string[];
};
