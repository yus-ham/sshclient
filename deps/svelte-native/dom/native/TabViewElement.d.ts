import { ViewNode } from "../basicdom";
import { TabView } from '@nativescript/core';
import NativeViewElementNode from "./NativeViewElementNode";
export default class TabViewElement extends NativeViewElementNode<TabView> {
    private needs_update;
    constructor();
    doUpdate(): void;
    onInsertedChild(childNode: ViewNode, index: number): any;
    onRemovedChild(childNode: ViewNode): void;
    static register(): void;
}
