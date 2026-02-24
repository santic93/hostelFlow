export type Room = {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  imageUrl?: string;
  createdAt?: Date;
};