// Fallback catalog — seeds the database on first boot only.
// Self-contained copy of the storefront Product shape (src/types/product.ts).
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

const px = (id: number, w = 800, h = 1067) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

/**
 * SLEEKCULTURE — a 12-piece collection of plain, premium
 * building blocks. No graphics, no loud branding: heavyweight fabrics,
 * neutral colorways, considered silhouettes. Photography follows one
 * visual system — clean neutral backdrops, soft light, front/detail/
 * on-model angles — so every piece reads as part of the same line.
 */
export const fallbackProducts: Product[] = [
  {
    id: "e1",
    name: "sleekculture Heavyweight Hoodie — Washed Black",
    price: 98.0,
    originalPrice: undefined,
    category: "Hoodies",
    subcategory: "Heavyweight Fleece",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Washed Black"],
    images: [px(19461550), px(8499029), px(28701959), px(10971114)],
    description:
      "The anchor of the collection. 480gsm loopback cotton with a garment-washed finish, double-layer hood, and dropped shoulders. No draws, no prints — just weight, drape, and a boxy silhouette that holds its shape. Cut roomy; take your true size for an oversized fit.",
    rating: 4.9,
    reviews: 212,
    isNew: true,
    isTrending: true,
    inStock: true,
    quantity: 64,
  },
  {
    id: "e2",
    name: "sleekculture Heavyweight Hoodie — Stone Grey",
    price: 98.0,
    originalPrice: undefined,
    category: "Hoodies",
    subcategory: "Heavyweight Fleece",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Stone Grey"],
    images: [px(10961059), px(12126232), px(31711564)],
    description:
      "The same 480gsm loopback body in a quiet stone grey. Brushed interior, ribbed side panels, and a clean-front finish. Built to sit under a jacket or stand alone. Cut roomy; size down for a regular fit.",
    rating: 4.8,
    reviews: 164,
    isNew: false,
    isTrending: true,
    inStock: true,
    quantity: 58,
  },
  {
    id: "e3",
    name: "sleekculture Hoodie — Bone",
    price: 92.0,
    originalPrice: undefined,
    category: "Hoodies",
    subcategory: "Midweight Fleece",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Bone"],
    images: [px(9775550), px(20434270)],
    description:
      "A softer, lighter take in undyed bone cotton. 380gsm brushed fleece with a relaxed hood and clean waistband — the warm-weather layer of the line. Pairs with everything in the collection.",
    rating: 4.7,
    reviews: 98,
    isNew: true,
    isTrending: false,
    inStock: true,
    quantity: 47,
  },
  {
    id: "e4",
    name: "sleekculture Tee — Optic White",
    price: 38.0,
    originalPrice: undefined,
    category: "T-Shirts",
    subcategory: "Jersey",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Optic White"],
    images: [px(8217536), px(8217535), px(19719794)],
    description:
      "A perfect white tee, full stop. 240gsm compact cotton with a structured collar that keeps its line wash after wash. Boxy body, clean shoulder seam, zero branding. The foundation piece.",
    rating: 4.8,
    reviews: 341,
    isNew: false,
    isTrending: true,
    inStock: true,
    quantity: 140,
  },
  {
    id: "e5",
    name: "sleekculture Tee — Jet Black",
    price: 38.0,
    originalPrice: undefined,
    category: "T-Shirts",
    subcategory: "Jersey",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Jet Black"],
    images: [px(18398384), px(28079579)],
    description:
      "The Optic White body in a deep, wash-stable jet black. Same 240gsm compact cotton, same boxy cut — dyed in small batches so the color stays rich. Wear it under the heavyweight hoodie or alone.",
    rating: 4.7,
    reviews: 287,
    isNew: true,
    isTrending: true,
    inStock: true,
    quantity: 132,
  },
  {
    id: "e6",
    name: "sleekculture Tee — Sand",
    price: 38.0,
    originalPrice: undefined,
    category: "T-Shirts",
    subcategory: "Jersey",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Sand"],
    images: [px(20236324), px(33065360)],
    description:
      "A muted sand tone cut from the same compact jersey. Warm neutral that pairs with the Bone hoodie and Sand shorts as a full look. Garment-washed for a soft, lived-in hand.",
    rating: 4.6,
    reviews: 129,
    isNew: false,
    isTrending: false,
    inStock: true,
    quantity: 96,
  },
  {
    id: "e7",
    name: "sleekculture Shorts — Washed Black",
    price: 52.0,
    originalPrice: undefined,
    category: "Shorts",
    subcategory: "Cotton Twill",
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Washed Black"],
    images: [px(28079579), px(8437039), px(13077727)],
    description:
      "Clean-faced cotton twill shorts with a 7-inch inseam, elasticated drawcord waist, and two hidden side pockets. No cargo pockets, no patches — a straight, versatile silhouette in the collection's washed black.",
    rating: 4.7,
    reviews: 118,
    isNew: true,
    isTrending: true,
    inStock: true,
    quantity: 78,
  },
  {
    id: "e8",
    name: "sleekculture Shorts — Sand",
    price: 52.0,
    originalPrice: undefined,
    category: "Shorts",
    subcategory: "Cotton Twill",
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Sand"],
    images: [px(28079582), px(28079571)],
    description:
      "The same 7-inch twill short in warm sand. Mid-weight, breathable, and cut to pair with the Sand tee or Optic White tee as a set. Drawcord waist, clean hem, nothing else.",
    rating: 4.6,
    reviews: 84,
    isNew: false,
    isTrending: false,
    inStock: true,
    quantity: 71,
  },
  {
    id: "e9",
    name: "sleekculture Cap — Bone",
    price: 32.0,
    originalPrice: undefined,
    category: "Accessories",
    subcategory: "Cotton Twill",
    sizes: ["ONE SIZE"],
    colors: ["Bone"],
    images: [px(9775765), px(15451674)],
    description:
      "Six-panel cap in brushed cotton twill with an unstructured crown and adjustable strap. Unadorned front — the only marking is a small woven tag at the side seam. One size fits most.",
    rating: 4.8,
    reviews: 156,
    isNew: true,
    isTrending: true,
    inStock: true,
    quantity: 110,
  },
  {
    id: "e10",
    name: "sleekculture Cap — Black",
    price: 32.0,
    originalPrice: undefined,
    category: "Accessories",
    subcategory: "Cotton Twill",
    sizes: ["ONE SIZE"],
    colors: ["Black"],
    images: [px(20322658), px(1128846)],
    description:
      "The Bone cap's counterpart in washed black twill. Soft crown, curved brim, matte hardware. Finishes the look — from the gym to the studio to the street.",
    rating: 4.7,
    reviews: 121,
    isNew: false,
    isTrending: false,
    inStock: true,
    quantity: 104,
  },
  {
    id: "e11",
    name: "sleekculture Tank — Optic White",
    price: 34.0,
    originalPrice: undefined,
    category: "Tank Tops",
    subcategory: "Jersey",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Optic White"],
    images: [px(1325619), px(20620617), px(17181745)],
    description:
      "The summer layer of the line. 220gsm compact cotton with clean-bound armholes, a straight hem, and a scooped neckline that sits flat under a tee or stands alone. No graphics — just cut, weight, and fit.",
    rating: 4.7,
    reviews: 86,
    isNew: true,
    isTrending: true,
    inStock: true,
    quantity: 88,
  },
  {
    id: "e12",
    name: "sleekculture Tank — Jet Black",
    price: 34.0,
    originalPrice: undefined,
    category: "Tank Tops",
    subcategory: "Jersey",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Jet Black"],
    images: [px(37712386), px(35487506), px(23414743)],
    description:
      "The Optic White tank in wash-stable jet black. Same 220gsm compact cotton, same clean-bound finish — pairs with the Washed Black shorts as a full plain look, or layers under the heavyweight hoodie.",
    rating: 4.6,
    reviews: 64,
    isNew: false,
    isTrending: true,
    inStock: true,
    quantity: 82,
  },
];
