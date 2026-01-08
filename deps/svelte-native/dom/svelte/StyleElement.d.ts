import { ElementNode } from '../basicdom';
declare class StyleSheet {
    _rules: string[];
    deleteRule(index: number): void;
    insertRule(rule: string, index?: number): void;
    get cssRules(): any;
}
export default class StyleElement extends ElementNode {
    _sheet: StyleSheet;
    constructor();
    get sheet(): StyleSheet;
}
export {};
