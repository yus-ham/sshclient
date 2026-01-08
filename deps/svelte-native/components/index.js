// Mock Svelte 4 components to prevent crash in Svelte 5 environment.
// The original implementation relies on 'svelte/internal' which is not available in Svelte 5.
// Since these are wrapper components and not strictly required for core functionality if using native tags,
// we stub them out to allow the bundle to load.

export const AsComponent = null;
export const Template = null;
export const android = null;
export const ios = null;