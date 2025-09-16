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

export type PaginationInput = {
  page?: number | string | null
  perPage?: number | string | null
  maxPerPage?: number
}

export type PaginationResult = {
  skip: number
  take: number
  page: number
  perPage: number
}

export const getPagination = ({ page, perPage, maxPerPage = 50 }: PaginationInput): PaginationResult => {
  const parsedPage = Math.max(Number(page ?? 1) || 1, 1)
  const parsedPerPageRaw = Number(perPage ?? 10) || 10
  const parsedPerPage = Math.min(Math.max(parsedPerPageRaw, 1), maxPerPage)
  const skip = (parsedPage - 1) * parsedPerPage
  const take = parsedPerPage
  return { skip, take, page: parsedPage, perPage: parsedPerPage }
}