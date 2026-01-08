import type { SvelteComponent } from './ambient.js';
export declare function svelteNativeNoFrame<T>(rootElement: typeof SvelteComponent<T>, data: T): Promise<SvelteComponent<T>>;
export declare function svelteNative<T>(startPage: typeof SvelteComponent<T>, data: T): Promise<SvelteComponent<T>>;
export { navigate, goBack, showModal, closeModal, isModalOpened, initializeDom, DomTraceCategory } from "./dom";


import './jsx/svelte-native-jsx-nativescript-core'
import './jsx/shims.d.ts'
