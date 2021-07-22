import Fraction from 'fraction.js'

export const sumBy = <T>(
  arr: T[],
  iterator: (t: T, index: number) => number | Fraction
): Fraction => {
  let buffer = new Fraction(0)
  for (let i = 0; i < arr.length; i++) {
    const val = iterator(arr[i], i)
    if (val instanceof Fraction) {
      buffer = buffer.add(val)
    } else {
      buffer = buffer.add(new Fraction(val))
    }
  }
  return buffer
}
