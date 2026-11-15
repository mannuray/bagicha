/** How to show a plant: its name in the app's language when the API gave one, else the saved name. */
export function plantName(plant: { name: string; display_name?: string | null }): string {
  return plant.display_name || plant.name;
}
