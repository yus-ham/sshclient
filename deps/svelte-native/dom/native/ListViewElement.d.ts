import { ListView, ItemEventData, View } from '@nativescript/core';
import TemplateElement from '../svelte/TemplateElement';
import { ViewNode } from '../basicdom';
import NativeViewElementNode from './NativeViewElementNode';
export declare class SvelteKeyedTemplate {
    _key: string;
    _templateEl: TemplateElement;
    constructor(key: string, templateEl: TemplateElement);
    get component(): typeof import("../../ambient").SvelteComponent;
    get key(): string;
    createView(): View;
}
export default class ListViewElement extends NativeViewElementNode<ListView> {
    constructor();
    updateListItem(args: ItemEventData): void;
    onInsertedChild(childNode: ViewNode, index: number): void;
    onRemovedChild(childNode: ViewNode): void;
    static register(): void;
}
