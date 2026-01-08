import { ActionBar } from "@nativescript/core";
import NativeViewElementNode from "./NativeViewElementNode";
import { ViewNode } from "../basicdom";
export default class ActionBarElement extends NativeViewElementNode<ActionBar> {
    constructor();
    onInsertedChild(childNode: ViewNode, index: number): void;
    onRemovedChild(childNode: ViewNode): void;
    static register(): void;
}
