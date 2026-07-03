import type { PageLoad } from './$types';
import { getTypes, getLabels, getNextItems } from '$lib/api.js';
import type { NextItemResult, ItemType, Label } from '$lib/types.js';

export const load: PageLoad = async ({ url }) => {
  const selectedType = url.searchParams.get('type') ?? '';
  const selectedCount = parseInt(url.searchParams.get('count') ?? '1', 10) || 1;
  const selectedLabels = url.searchParams.getAll('label');

  let types: ItemType[] = [];
  let labels: Label[] = [];
  try {
    [types, labels] = await Promise.all([getTypes(), getLabels()]);
  } catch {
    // non-fatal
  }

  let results: NextItemResult[] | null = null;
  let resultsError = '';
  if (selectedType) {
    try {
      // For getNextItems, the API expects a single label, so we pass the first one if multiple selected
      results = await getNextItems({
        type: selectedType,
        count: selectedCount,
        label: selectedLabels.length > 0 ? selectedLabels[0] : undefined,
      });
    } catch (err) {
      resultsError = err instanceof Error ? err.message : 'Failed to fetch items';
    }
  }

  return { types, labels, results, resultsError, selectedType, selectedCount, selectedLabels };
};
