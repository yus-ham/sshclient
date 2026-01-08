import { DocumentNode, ElementNode, TextNode } from '../basicdom';
export default class SvelteNativeDocument extends DocumentNode {
    head: ElementNode;
    constructor();
    createTextNode(text: string): TextNode;
    createElementNS(namespace: string, tagName: string): ElementNode;
    createEvent(type: string): any;
}
