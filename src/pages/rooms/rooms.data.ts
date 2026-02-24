export interface Room {
  id: string;
  name: string;
  price: number;
  description: string;
  capacity: number;
  imageUrl: string; // ✅ URL de Firebase Storage
}

import room1 from "../../assets/images/room1.jpeg";
import room2 from "../../assets/images/room2.jpeg";
import room3 from "../../assets/images/room3.jpeg";

export const rooms: Room[] = [
  {
    id: "deluxe",
    name: "Deluxe Room",
    price: 32,
    description: "Spacious private room with modern design and city views.",
    imageUrl: room1,
    capacity: 0
  },
  {
    id: "suite",
    name: "Private Suite",
    price: 48,
    description:
      "Premium suite with queen bed and private bathroom.",
    imageUrl: room2,
    capacity: 2
  },
  {
    id: "shared",
    name: "Shared Dorm",
    price: 18,
    description:
      "Comfortable shared dorm with lockers and social vibe.",
    imageUrl: room3,
    capacity: 6
  },
];