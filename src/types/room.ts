export type Room = {
  imageUrls: string[];
  id: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  imageUrl?: string;
  createdAt?: Date;
};