export interface Room {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

import room1 from "../../assets/images/room1.jpeg";
import room2 from "../../assets/images/room2.jpeg";
import room3 from "../../assets/images/room3.jpeg";

export const rooms: Room[] = [
  {
    id: "deluxe",
    name: "Deluxe Room",
    price: 32,
    description:
      "Spacious private room with modern design and city views.",
    image: room1,
  },
  {
    id: "suite",
    name: "Private Suite",
    price: 48,
    description:
      "Premium suite with queen bed and private bathroom.",
    image: room2,
  },
  {
    id: "shared",
    name: "Shared Dorm",
    price: 18,
    description:
      "Comfortable shared dorm with lockers and social vibe.",
    image: room3,
  },
];