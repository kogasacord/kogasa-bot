export interface Option<T> {
  content: T | undefined;
  hasNull?: boolean;
}

export function run<K, T>(
  input: Option<T>,
  transform: (_: T) => Option<K>,
  none?: () => void
): Option<K> {
  if (input.hasNull) {
    if (none) {
      none();
    }
    return { content: undefined, hasNull: true };
  }
  if (input.content === undefined) {
    return { content: undefined, hasNull: true };
  }
  return transform(input.content);
}
export async function asyncRun<K, T>(
  input: Option<T>,
  transform: (_: T, ...args: any[]) => Promise<Option<K>>,
  none?: () => void,
  ...args: any[]
): Promise<Option<K>> {
  if (input.hasNull) {
    if (none) {
      none();
    }
    return { content: undefined, hasNull: true };
  }
  if (input.content === undefined) {
    return { content: undefined, hasNull: true };
  }
  return await transform(input.content, ...args);
}
export function wrapInOption<T>(object: T | undefined): Option<T> {
  return {
    content: object,
    hasNull: object === undefined,
  };
}
