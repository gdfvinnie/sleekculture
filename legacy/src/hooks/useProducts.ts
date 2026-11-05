import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";

/**
 * Loads the catalog from the project's own backend API. The admin dashboard
 * writes through the same API, so dashboard changes appear on the
 * storefront instantly.
 */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: api.products,
    staleTime: 30_000,
  });
}

export function useProduct(id: string | undefined) {
  const { data: products, isLoading, isError } = useProducts();
  const product = products?.find((p) => p.id === id);
  return { product, isLoading, isError };
}
