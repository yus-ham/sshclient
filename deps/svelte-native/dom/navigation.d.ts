import { ViewBase, View, NavigationTransition, Frame, BackstackEntry } from "@nativescript/core";
import FrameElement from "./native/FrameElement";
import PageElement from "./native/PageElement";
import NativeViewElementNode from "./native/NativeViewElementNode";
export type ViewSpec<T extends ViewBase = View> = T | NativeViewElementNode<T>;
export type FrameSpec = Frame | FrameElement | string;
export type PageSpec<T> = typeof SvelteComponent<T>;
export interface NavigationOptions<T> {
    page: PageSpec<T>;
    props?: T;
    frame?: FrameSpec;
    animated?: boolean;
    backstackVisible?: boolean;
    clearHistory?: boolean;
    transition?: NavigationTransition;
    transitionAndroid?: NavigationTransition;
    transitioniOS?: NavigationTransition;
}
export declare function resolveFrame(frameSpec: FrameSpec): Frame;
export declare function resolveTarget<T extends ViewBase = View>(viewSpec: ViewSpec<T>): T;
export interface ComponentInstanceInfo<T extends ViewBase = View, U = SvelteComponent> {
    element: NativeViewElementNode<T>;
    viewInstance: U;
}
export declare function resolveComponentElement<T, U extends ViewBase = View>(viewSpec: typeof SvelteComponent<T>, props?: T): ComponentInstanceInfo<U, SvelteComponent<T>>;
export declare function navigate<T>(options: NavigationOptions<T>): SvelteComponent<T>;
export interface BackNavigationOptions {
    frame?: FrameSpec;
    to?: PageElement;
    backStackEntry?: BackstackEntry;
    transition?: NavigationTransition;
    transitionAndroid?: NavigationTransition;
    transitioniOS?: NavigationTransition;
}
export declare function goBack(options?: BackNavigationOptions): any;
export interface ShowModalOptions<T> {
    page: PageSpec<T>;
    target?: ViewSpec;
    props?: T;
    android?: {
        cancelable: boolean;
    };
    ios?: {
        presentationStyle: any;
    };
    animated?: boolean;
    fullscreen?: boolean;
    stretched?: boolean;
}
export declare function showModal<T, U>(modalOptions: ShowModalOptions<U>): Promise<T>;
export declare function closeModal(result: any, parent?: View): void;
export declare function isModalOpened(): boolean;
