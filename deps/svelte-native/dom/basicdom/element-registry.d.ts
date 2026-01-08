import ElementNode from './ElementNode';
import { DocumentNode } from '.';
export interface RegisterElementOptions {
    override?: boolean;
}
export declare function registerElement(elementName: string, resolver: () => ElementNode, options?: RegisterElementOptions): void;
export declare function createElement(elementName: string, owner?: DocumentNode): ElementNode;
