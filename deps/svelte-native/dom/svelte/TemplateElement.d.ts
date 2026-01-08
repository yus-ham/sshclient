import { ElementNode } from '../basicdom';
export default class TemplateElement extends ElementNode {
    constructor();
    set component(value: typeof SvelteComponent);
    get component(): typeof SvelteComponent;
}
