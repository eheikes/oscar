export const readableDate = (val?: string) => {
  if (!val) { return ''; }
  let date = new Date(val);
  return date.toLocaleDateString();
};

export const toFixed = (val?: string) => {
  if (!val) { return ''; }
  let num = Number(val);
  return num.toFixed(1);
};
