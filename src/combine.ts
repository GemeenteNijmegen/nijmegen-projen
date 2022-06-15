/**
 * Combination function to concatanate
 * items to a list that may be undefined
 * @param a T[] | undefined
 * @param b T[]
 * @returns T[]
 */
export default function combine<T>(a: T[] | undefined, ...b: T[]) {
  var old = a;
  if (!old) {
    old = [];
  }
  return old.concat(b);
}