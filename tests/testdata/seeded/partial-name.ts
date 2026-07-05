export function partialNameOf(dto: Readonly<{ name: string }>, partial: string): string {
  if (!dto.name.includes(partial)) {
    throw new Error(`Partial search term '${partial}' is not part of '${dto.name}' — update it with the seeded name.`);
  }
  return partial;
}
