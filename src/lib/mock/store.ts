import { writable } from 'svelte/store';
import { seed } from './seed';
import type { DemoData } from '$lib/types';

// Intentionally memory-only. No credentials, localStorage, API or database.
export const demo = writable<DemoData>(structuredClone(seed));
export const demoSession = writable(false);
export function resetDemo() { demo.set(structuredClone(seed)); }
