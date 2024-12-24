import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export const isUserLoggedIn = () => {
  const user_id = localStorage.getItem('user_id');  
  return user_id; // Check if both exist
};
