import CommentNode from './CommentNode';
import ElementNode from './ElementNode';
import ViewNode from './ViewNode';
import TextNode from './TextNode';
import PropertyNode from './PropertyNode';
export default class DocumentNode extends ViewNode {
    constructor();
    createComment(text: string): CommentNode;
    createPropertyNode(tagName: string, propertyName: string): PropertyNode;
    createElement(tagName: string): ElementNode;
    createElementNS(namespace: string, tagName: string): ElementNode;
    createTextNode(text: string): TextNode;
    getElementById(id: string): ViewNode;
    dispatchEvent(event: any): void;
}
