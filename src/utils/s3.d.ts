export declare function fetchProductFromS3(productId: string): Promise<Product>;

export type Product = {
  name: string;
  description: string;
  imageUrl: string;
};
