import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = ({ date }: { date: Date | string }) => {
  return new Date(date).toLocaleDateString()
}

export const formatPrice = ({ price }: { price: number }) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}