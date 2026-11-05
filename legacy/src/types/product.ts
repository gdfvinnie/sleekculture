export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  rating: number;
  reviews: number;
  isNew: boolean;
  isTrending: boolean;
  inStock: boolean;
  quantity: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}
