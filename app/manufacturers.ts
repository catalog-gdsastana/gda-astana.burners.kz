export interface Manufacturer {
  id: string;
  name: string;
  is_active: boolean;
}

export function sortManufacturers(items: Manufacturer[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}
