export type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  rating: number;
  length: string;
  cover: string;
  description: string;
  genre: string;
};

export const books: Book[] = [
  {
    id: "dunesaga",
    title: "Dune: The Saga Begins",
    author: "Frank Herbert",
    price: 14.99,
    rating: 4.8,
    length: "21h 2m",
    cover: "/dune.jpg",
    description:
      "A sweeping epic of politics, religion, and ecology on the desert planet Arrakis.",
    genre: "Sci-Fi",
  },
  {
    id: "atomic",
    title: "Atomic Habits",
    author: "James Clear",
    price: 11.99,
    rating: 4.7,
    length: "5h 35m",
    cover: "/atomic_habits.jpg",
    description:
      "Build better habits and systems for continuous improvement with practical strategies.",
    genre: "Nonfiction",
  },
  {
    id: "hobbit",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    price: 12.49,
    rating: 4.9,
    length: "10h 24m",
    cover: "/the_hobbit.jpg",
    description:
      "Bilbo Baggins embarks on an unexpected journey filled with dragons and dwarves.",
    genre: "Fantasy",
  },
  {
    id: "martian",
    title: "The Martian",
    author: "Andy Weir",
    price: 13.99,
    rating: 4.6,
    length: "10h 53m",
    cover: "/martian.jpg",
    description:
      "A stranded astronaut fights to survive on Mars using ingenuity and humor.",
    genre: "Sci-Fi",
  },
  {
    id: "becoming",
    title: "Becoming",
    author: "Michelle Obama",
    price: 10.99,
    rating: 4.8,
    length: "19h 3m",
    cover: "/becoming.jpg",
    description:
      "An intimate, powerful memoir by the former First Lady of the United States.",
    genre: "Memoir",
  },
  {
    id: "sapiens",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    price: 15.49,
    rating: 4.7,
    length: "15h 17m",
    cover: "/sapiens.jpg",
    description:
      "A profound exploration of humanity’s past and our impact on the world.",
    genre: "History",
  },
];
