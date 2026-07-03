import type { PageLoad } from './$types';
import { getTypes, getLabels } from '$lib/api.js';
import type { ItemType, Label } from '$lib/types.js';

export const load: PageLoad = async () => {
  let types: ItemType[] = [];
  let labels: Label[] = [];
  try {
    [types, labels] = await Promise.all([getTypes(), getLabels()]);
  } catch {
    // non-fatal
  }
  return { types, labels };
};
