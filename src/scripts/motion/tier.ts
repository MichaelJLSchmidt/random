// Motion tiers: data-motion="full|calm|still" on <html>, persisted.
export type Tier = 'full' | 'calm' | 'still';
const KEY = 'inkwake:motion';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function storedTier(): Tier | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'full' || t === 'calm' || t === 'still' ? t : null;
  } catch {
    return null;
  }
}

/** Current tier: stored choice, else reduced-motion → calm, else full. */
export function getTier(): Tier {
  const t = storedTier() ?? (reduce() ? 'calm' : 'full');
  if (document.documentElement.dataset.motion !== t) document.documentElement.dataset.motion = t;
  return t;
}

export function setTier(t: Tier) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode: tier lasts for this page only */
  }
  document.documentElement.dataset.motion = t;
  syncToggles();
  document.dispatchEvent(new CustomEvent('inkwake:tier', { detail: t }));
}

export function syncToggles() {
  const t = getTier();
  document.querySelectorAll<HTMLInputElement>('[data-motion-toggle] input').forEach((i) => {
    i.checked = i.value === t;
  });
}
