"use strict";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: api.products,
    staleTime: 3e4
  });
}
export function useProduct(id) {
  const { data: products, isLoading, isError } = useProducts();
  const product = products?.find((p) => p.id === id);
  return { product, isLoading, isError };
}
