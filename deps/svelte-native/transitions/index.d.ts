import { CubicBezierAnimationCurve, Pair } from "@nativescript/core/ui/animation/animation-interfaces";
import { Color, View } from "@nativescript/core";
import * as easings from './easing';
import { NativeViewElementNode } from "../dom";
export interface NativeAnimationDefinition {
    opacity?: number;
    backgroundColor?: Color;
    translate?: Pair;
    scale?: Pair;
    rotate?: number;
}
export declare function asSvelteTransition(node: NativeViewElementNode<View>, delay: number, duration: number, curve: string | CubicBezierAnimationCurve, nativeAnimationProps: (t: number) => NativeAnimationDefinition, applyNativeAnimationProps?: (view: View, def: NativeAnimationDefinition) => void): any;
export declare function fade(node: NativeViewElementNode<View>, { delay, duration }: {
    delay?: number;
    duration?: number;
}): any;
export declare function fly(node: NativeViewElementNode<View>, { delay, duration, easing, x, y }: {
    delay?: number;
    duration?: number;
    easing?: string;
    x?: number;
    y?: number;
}): any;
export declare function slide(node: NativeViewElementNode<View>, { delay, duration, easing }: {
    delay?: number;
    duration?: number;
    easing?: string;
}): any;
export { easings };
