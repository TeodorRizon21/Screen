export const COLLECTIONS = {
  Home: "Acasă",
  About_Foil: "Despre Folie",
  All_Products: "Toate produsele",
  Bmw: "BMW",
  Mercedes_Benz: "Mercedes-Benz",
  Audi: "Audi",
  Volkswagen: "Volkswagen",
  Porsche: "Porsche",
  Tesla: "Tesla",
  Volvo: "Volvo",
  Land_Rover: "Land Rover",
  Jaguar: "Jaguar",
  Sales: "Reduceri"
} as const

export type Collection = keyof typeof COLLECTIONS

export const SORT_OPTIONS = {
  DEFAULT: "default",
  NAME_DESC: "name-desc",
  PRICE_ASC: "price-asc",
  PRICE_DESC: "price-desc"
} as const

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS]

export function isSortOption(value: string): value is SortOption {
  return Object.values(SORT_OPTIONS).includes(value as SortOption)
}

