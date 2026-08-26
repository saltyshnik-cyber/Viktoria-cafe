export type MenuCategory = {
  id: string;
  name: string;
  emoji: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  weight: string;
  price: number;
  isPopular?: boolean;
  photoUrl?: string;
  isAvailable?: boolean;
};
