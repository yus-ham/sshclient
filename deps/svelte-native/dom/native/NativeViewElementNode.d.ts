import ViewNode from '../basicdom/ViewNode';
import { RegisterElementOptions } from '../basicdom';
import { EventData, ViewBase } from '@nativescript/core';
import NativeElementNode, { NativeElementPropConfig } from './NativeElementNode';
interface IStyleProxy {
    setProperty(propertyName: string, value: string, priority?: string): void;
    removeProperty(property: string): void;
    animation: string;
    cssText: string;
}
export declare function registerNativeViewElement<T extends ViewBase>(elementName: string, resolver: () => new () => T, parentProp?: string, propConfig?: NativeElementPropConfig, options?: RegisterElementOptions): void;
export type EventListener = (args: EventData) => void;
export default class NativeViewElementNode<T extends ViewBase> extends NativeElementNode<T> {
    style: IStyleProxy;
    constructor(tagName: string, viewClass: new () => T, setsParentProp?: string, propConfig?: NativeElementPropConfig);
    setStyle(property: string, value: string | number): void;
    get nativeView(): T;
    set nativeView(view: T);
    addEventListener(event: string, handler: EventListener): void;
    removeEventListener(event: string, handler?: EventListener): void;
    onInsertedChild(childNode: ViewNode, index: number): any;
    onRemovedChild(childNode: ViewNode): void;
    dispatchEvent(event: EventData): void;
}
export {};
