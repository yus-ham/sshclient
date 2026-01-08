import { ElementNode, ViewNode } from "../basicdom";
export default class HeadElement extends ElementNode {
    constructor();
    onInsertedChild(childNode: ViewNode, atIndex: number): void;
}
