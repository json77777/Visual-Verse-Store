export type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

export type Product = {
  _id: string;
  title: string;
  description: string;
  price: number; // paise
  images: string[];
  isDigital: boolean;
  isFree?: boolean;
  stock: number;
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
};
