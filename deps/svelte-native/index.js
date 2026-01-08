import { Application } from '@nativescript/core';
import { initializeDom, createElement, navigate } from './dom';
import { mount, unmount } from 'svelte';
export { DomTraceCategory, closeModal, goBack, initializeDom, isModalOpened, navigate, showModal } from './dom';

// Override this function as the default is currently resetting entire content on NativeScript
global.__onLiveSyncCore = () => {
    Application.getRootView()?._onCssStateChange();
};
function svelteNativeNoFrame(rootElement, data) {
    return new Promise((resolve, reject) => {
        let elementInstance;
        const buildElement = () => {
            let frag = createElement('fragment', window.document);
            console.log("[SvelteNative] Mounting component to fragment...");
            elementInstance = mount(rootElement, {
                target: frag,
                props: data || {}
            });
            console.log("[SvelteNative] Mount complete. Fragment children:", frag.childNodes.length);
            if (frag.firstChild) {
                 console.log("[SvelteNative] First child:", frag.firstChild);
                 return frag.firstChild.nativeElement || frag.firstChild;
            } else {
                 console.error("[SvelteNative] Fragment is empty after mount!");
                 return frag; // Return fragment itself as fallback
            }
        };
        //wait for launch before returning
        Application.on(Application.launchEvent, () => {
            resolve(elementInstance);
        });
        Application.on(Application.exitEvent, () => {
            unmount(elementInstance);
            elementInstance = null;
        });
        try {
            Application.run({ create: buildElement });
        }
        catch (e) {
            reject(e);
        }
    });
}
function svelteNative(startPage, data) {
    let rootFrame;
    let pageInstance;
    return new Promise((resolve, reject) => {
        //wait for launch
        Application.on(Application.launchEvent, () => {
            resolve(pageInstance);
        });
        Application.on(Application.exitEvent, () => {
            if (pageInstance) {
                // Warning: pageInstance from navigate might need adjustment for Svelte 5 too
                // unmount(pageInstance); 
                // We'll leave this for now as user uses NoFrame
                pageInstance = null;
            }
        });
        try {
            Application.run({ create: () => {
                    rootFrame = createElement('frame', window.document);
                    rootFrame.setAttribute("id", "app-root-frame");
                    pageInstance = navigate({
                        page: startPage,
                        props: data || {},
                        frame: rootFrame
                    });
                    return rootFrame.nativeView;
                } });
        }
        catch (e) {
            reject(e);
        }
    });
}
// Svelte looks to see if window is undefined in order to determine if it is running on the client or in SSR.
// any imports of svelte/internals global also bind to the current value of window (during module import) so we need to 
// configure our dom now.
initializeDom();

export { svelteNative, svelteNativeNoFrame };
