export type Product = {
  title: string;
  price: number;
  image: string;
  url: string;
  store: string;
};

export interface StoreSearchService {
  search(query: string): Promise<Product[]>;
}
