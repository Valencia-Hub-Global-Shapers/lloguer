/**
 * Picks the singular variant (`${key}One`) when count is 1 and the dictionary
 * has it, otherwise the base key. `has` tells whether a key exists.
 */
export function pluralKey(key: string, count: number, has: (key: string) => boolean): string {
  const one = `${key}One`;
  return count === 1 && has(one) ? one : key;
}
