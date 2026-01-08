import { ViewNode } from "../basicdom";
import { Frame } from '@nativescript/core';
import NativeViewElementNode from "./NativeViewElementNode";
export default class FrameElement extends NativeViewElementNode<Frame> {
    constructor();
    setAttribute(key: string, value: any): void;
    onInsertedChild(childNode: ViewNode, index: number): void;
    static register(): void;
}
