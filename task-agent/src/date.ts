export const toDateString = (x: any): string => {
  if (x instanceof Date) {
    return x.toLocaleDateString()
  }
  return x
}
