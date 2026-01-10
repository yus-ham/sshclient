console.log("[SVELTE NATIVE DOM] shim imported");
console.log("[SVELTE NATIVE DOM] shim imported");

import * as core from '@nativescript/core';
const { View: NSCoreView } = core;

const globalRef = typeof global !== 'undefined' ? global : window;


// Mock/Singleton for elements
const elementMap = globalRef.__SVELTE_NATIVE_ELEMENT_MAP__ || (globalRef.__SVELTE_NATIVE_ELEMENT_MAP__ = {});

let gm = 0;

function normalizeElementName(elementName) {
    return `${elementName.toLowerCase()}`;
}

class SvelteView {
    constructor(e = 1) {
        this._domId = gm++;
        this.nodeType = e;
        this.childNodes = [];
        this.parentNode = null;
        this.tagName = null;
        this.text = null;
        this.isTemplate = false;
    }
    get nodeName() {
        switch (this.nodeType) {
            case 3: return "#text"
            case 8: return "#comment"
            case 11: return "#document-fragment"
            default: return (this.tagName || "").toUpperCase();
        }
    }
    get namespaceURI() { return "http://www.w3.org/1999/xhtml"; }

    // DOM compatibility for Svelte 5
    get textContent() { return this.text; }
    set textContent(v) { this.text = v; }
    get data() { return this.text; }
    set data(v) { this.text = v; }
    get nodeValue() { return this.text; }
    set nodeValue(v) { this.text = v; }
    get parentElement() { return this.parentNode; }
    get ownerDocument() { return globalRef.document; }

    get content() { return this._content; }

    setAttribute(name, value) {
        this[name] = value;
        if (name === "class") this.className = value;
        if (name.startsWith("on")) {
            const eventName = name.slice(2).toLowerCase();
            if (this.addEventListener) {
                this.addEventListener(eventName, value);
            } else if (this.on) {
                this.on(eventName, value);
            }
        }
    }
    getAttribute(name) {
        return this[name];
    }
    removeAttribute(name) {
        delete this[name];
    }
    addEventListener(event, callback) {
        this._listeners = this._listeners || {};
        (this._listeners[event] = this._listeners[event] || []).push(callback);
    }
    removeEventListener(event, callback) {
        if (this._listeners && this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(l => l !== callback);
        }
    }
    cloneNode(deep) {
        const copy = this.tagName ? createElement(this.tagName) : new SvelteView(this.nodeType);
        copy.nodeType = this.nodeType;
        copy.tagName = this.tagName;
        copy.text = this.text;
        
        // Copy tracked attributes
        if (this._svelteAttributes) {
            this._svelteAttributes.forEach(attr => {
                copy.setAttribute(attr, this[attr]);
            });
        }

        if (this.isTemplate) {
            // Templates store their content in a fragment (_content)
            this._content.childNodes.forEach(c => {
                const childClone = c.cloneNode(true);
                if (childClone) copy._content.appendChild(childClone);
            });
        } else if (deep && this.childNodes) {
            // Standard child cloning
            this.childNodes.forEach(c => {
                const childClone = c.cloneNode(true);
                if (childClone) copy.appendChild(childClone);
            });
        }
        return copy;
    }
}

// Svelte 5 retrieves getters from the prototype during init_operations.
// We must define them explicitly so Object.getOwnPropertyDescriptor works.
console.log("[SVELTE NATIVE DOM] Defining SvelteView prototype properties (firstChild, etc)... Node is:", typeof Node !== "undefined" ? Node : "UNDEFINED");
Object.defineProperties(SvelteView.prototype, {
    firstChild: {
        get() {
            const res = (this.childNodes && this.childNodes.length > 0) ? this.childNodes[0] : null;
            let debug = "NULL";
            if (res) {
                const isText = res.nodeType === 3;
                const isComment = res.nodeType === 8;
                const info = (isText || isComment) ? `${isText ? 'TEXT' : 'COMMENT'}: "${res.text?.split('\n')[0].trim()}"` : `${res.childNodes?.length || 0} children`;
                debug = `${res.tagName || res.nodeName || res.constructor.name} (${info})`;
            }
            console.log(`[SVELTE NATIVE DOM] get firstChild of ${this.tagName || (this.constructor && this.constructor.name) || "UNDEFINED"}(${this._domId}) -> ${debug}`);
            if (!this.tagName && this.constructor && this.constructor.name === "Object") {
                console.trace("[SVELTE NATIVE DOM] Global object walk detected!");
            }
            return res;
        },
        configurable: true
    },
    lastChild: {
        get() {
            return (this.childNodes && this.childNodes.length > 0) ? this.childNodes[this.childNodes.length - 1] : null;
        },
        configurable: true
    },
    nextSibling: {
        get() {
            const parent = this.parentNode || this.parent;
            if (!parent || !parent.childNodes) return null;
            const nodes = parent.childNodes;
            const index = nodes.indexOf(this);
            const res = (index !== -1 && index < nodes.length - 1) ? nodes[index + 1] : null;
            
            let debug = "NULL";
            if (res) {
                const isText = res.nodeType === 3;
                const isComment = res.nodeType === 8;
                const info = (isText || isComment) ? `${isText ? 'TEXT' : 'COMMENT'}: "${res.text?.split('\n')[0].trim()}"` : `${res.childNodes?.length || 0} children`;
                debug = `${res.tagName || res.nodeName || res.constructor.name} (${info})`;
            }
            console.log(`[SVELTE NATIVE DOM] get nextSibling of ${this.tagName || this.nodeName || (this.constructor && this.constructor.name)}(${this._domId}) -> ${debug}`);
            return res;
        },
        configurable: true
    },
    parent: {
        get() { return this.parentNode; },
        configurable: true
    }
});

// Implementation of methods
Object.defineProperties(SvelteView.prototype, {
    innerHTML: {
        set(html) {
            console.log(`[SVELTE NATIVE DOM] set innerHTML: ${html.substring(0, 100).replace(/\n/g, '\\n')}...`);
            const target = this.tagName === 'template' ? this.content : this;
            target.childNodes = [];
            if (!html) return;

            // Match comments, tags, or text (preserving whitespace)
            const tagRegex = /(<!--.*?-->)|(<([a-zA-Z0-9-]+)([^>]*?)>)|(<\/([a-zA-Z0-9-]+)>)|([^<]+)/gs;
            let match;
            let currentParent = target;

            while ((match = tagRegex.exec(html)) !== null) {
                if (match[1]) { // Comment
                    const commentText = match[1].slice(4, -3);
                    console.log(`[SVELTE NATIVE DOM] innerHTML Comment: ${commentText}`);
                    currentParent.appendChild(installGlobalShims().createComment(commentText));
                } else if (match[3]) { // Open tag
                    const tagName = match[3].toLowerCase();
                    console.log(`[SVELTE NATIVE DOM] innerHTML Open tag: ${tagName}. currentParent: ${currentParent.tagName || currentParent.constructor.name}`);
                    const node = createElement(tagName);

                    const attrStr = match[4];
                    if (attrStr) {
                        const attrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
                        let attrMatch;
                        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
                            node.setAttribute(attrMatch[1], attrMatch[2]);
                        }
                    }

                    console.log(`[SVELTE NATIVE DOM] innerHTML Appending ${tagName} to ${currentParent.tagName || currentParent.constructor.name}`);
                    currentParent.appendChild(node);
                    const isSelfClosing = attrStr && attrStr.trim().endsWith('/');
                    const voidTags = ["image", "activityindicator", "progress", "slider", "switch"];
                    const isVoid = voidTags.includes(tagName) || isSelfClosing;
                    if (!isVoid) {
                        currentParent = node;
                    }
                } else if (match[6]) { // Close tag
                    const tagName = match[6].toLowerCase();
                    console.log(`[SVELTE NATIVE DOM] innerHTML Close tag: ${tagName}. currentParent before pop: ${currentParent.tagName || currentParent.constructor.name}`);
                    const voidTags = ["image", "activityindicator", "progress", "slider", "switch"];
                    if (!voidTags.includes(tagName)) {
                        currentParent = currentParent.parentNode || target;
                        console.log(`[SVELTE NATIVE DOM] innerHTML currentParent after pop: ${currentParent.tagName || currentParent.constructor.name}`);
                    }
                } else if (match[7]) { // Text (KEEP WHITESPACE for Svelte 5 walking)
                    console.log(`[SVELTE NATIVE DOM] innerHTML Text: "${match[7].replace(/\n/g, '\\n')}"`);
                    currentParent.appendChild(installGlobalShims().createTextNode(match[7]));
                }
            }
        },
        configurable: true
    }
});

Object.assign(SvelteView.prototype, {
    appendChild(child) {
        if (this.tagName === 'template') return this.content.appendChild(child);
        if (child.nodeType === 11) {
            const children = [...child.childNodes];
            children.forEach(c => this.appendChild(c));
            child.childNodes = [];
            return child;
        }
        this.childNodes.push(child);
        child.parentNode = this;
        return child;
    },
    insertBefore(child, ref) {
        if (this.tagName === 'template') return this.content.insertBefore(child, ref);
        if (child.nodeType === 11) {
            const children = [...child.childNodes];
            children.forEach(c => this.insertBefore(c, ref));
            child.childNodes = [];
            return child;
        }
        const index = ref ? this.childNodes.indexOf(ref) : -1;
        if (index !== -1) {
            this.childNodes.splice(index, 0, child);
        } else {
            this.childNodes.push(child);
        }
        child.parentNode = this;
        return child;
    },
    removeChild(child) {
        const index = this.childNodes.indexOf(child);
        if (index !== -1) {
            this.childNodes.splice(index, 1);
            child.parentNode = null;
        }
        return child;
    },
    remove() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    },
    before(...nodes) {
        if (!this.parentNode) return;
        for (const node of nodes) {
            this.parentNode.insertBefore(node, this);
        }
    },
    after(...nodes) {
        if (!this.parentNode) return;
        const next = this.nextSibling;
        for (const node of nodes) {
            this.parentNode.insertBefore(node, next);
        }
    }
});

function registerElement(elementName, resolver) {
    elementMap[normalizeElementName(elementName)] = { resolver };
}

function createElement(elementName) {
    const normalized = normalizeElementName(elementName);
    const type = (normalized === 'fragment') ? 11 : 1;
    const node = elementMap[normalized] ? elementMap[normalized].resolver() : new SvelteView(type);
    node.tagName = normalized;
    if (normalized === 'template') {
        node.isTemplate = true;
        node._content = installGlobalShims().createDocumentFragment();
        node._content.childNodes = node.childNodes;
    }
    return node;
}

function installGlobalShims() {
    let snDoc = {
        createElement,
        createElementNS: (ns, name) => createElement(name),
        importNode: (node, deep) => node.cloneNode(deep),
        createTextNode: (t) => {
            const node = new SvelteView(3);
            node.text = t;
            return node;
        },
        createComment: (t) => {
            const node = new SvelteView(8);
            node.text = t;
            return node;
        },
        createDocumentFragment: () => {
            return new SvelteView(11);
        },
        body: new SvelteView(1),
        head: new SvelteView(1)
    };

    // ONLY provide global document for libraries that expect it, 
    // but DO NOT hijack the real window.document factories if in browser
    if (!globalRef.document) globalRef.document = snDoc;

    // Safety check for window property
    if (typeof window !== 'undefined') {
        if (globalRef === window) {
            // Already window, no need to set
        } else {
            try { globalRef.window = globalRef; } catch (e) { }
        }
    } else {
        globalRef.window = globalRef;
    }

    // Platform Flags
    if (globalRef.__ANDROID__ === undefined) globalRef.__ANDROID__ = false;
    if (globalRef.__IOS__ === undefined) globalRef.__IOS__ = false;

    // Svelte 5 expects navigator to exist in 'browser' target
    if (!globalRef.navigator) {
        globalRef.navigator = { userAgent: "NativeScript" };
    }

    // Svelte 5 expects Node, Element, and Text to exist globally
    if (!globalRef.Node) globalRef.Node = SvelteView;
    if (!globalRef.Element) globalRef.Element = class extends SvelteView { constructor() { super(1); } };
    if (!globalRef.Text) globalRef.Text = class extends SvelteView { constructor() { super(3); } };
    if (!globalRef.Comment) globalRef.Comment = class extends SvelteView { constructor() { super(8); } };
    if (!globalRef.DocumentFragment) globalRef.DocumentFragment = class extends SvelteView { constructor() { super(11); } };
    if (!globalRef.Document) globalRef.Document = SvelteView;
    if (!globalRef.HTMLMediaElement) globalRef.HTMLMediaElement = class extends SvelteView { constructor() { super(1); } };

    return snDoc;
}

// Minimal registration for core elements so svelte-native doesn't crash on init
function registerNativeElements() {
    const tags = {
        'page': 'Page',
        'actionbar': 'ActionBar',
        'stacklayout': 'StackLayout',
        'gridlayout': 'GridLayout',
        'wraplayout': 'WrapLayout',
        'absolutelayout': 'AbsoluteLayout',
        'docklayout': 'DockLayout',
        'flexboxlayout': 'FlexboxLayout',
        'label': 'Label',
        'button': 'Button',
        'frame': 'Frame',
        'tabview': 'TabView',
        'tabviewitem': 'TabViewItem',
        'listview': 'ListView',
        'textfield': 'TextField',
        'textview': 'TextView',
        'image': 'Image',
        'scrollview': 'ScrollView',
        'activityindicator': 'ActivityIndicator',
        'placeholder': 'Placeholder',
        'switch': 'Switch',
        'slider': 'Slider',
        'progress': 'Progress',
        'datepicker': 'DatePicker',
        'timepicker': 'TimePicker',
        'listpicker': 'ListPicker',
        'segmentedbar': 'SegmentedBar',
        'segmentedbaritem': 'SegmentedBarItem',
        'webview': 'WebView',
        'htmlview': 'HtmlView',
        'formattedstring': 'FormattedString',
        'span': 'Span'
    };

    Object.keys(tags).forEach(tag => {
        const className = tags[tag];
        const cls = core[className];
        if (cls) {
            registerElement(tag, () => {
                const node = new cls();
                node.nodeType = 1;
                node.tagName = tag;
                return node;
            });
        } else {
            console.warn(`[registerNativeElements] Could not find class ${className} for tag ${tag}`);
            registerElement(tag, () => new SvelteView());
        }
    });
}

let initializedDom = false;
function initializeDom() {
    if (initializedDom) return;
    initializedDom = true;
    registerNativeElements();
        const desc = Object.getOwnPropertyDescriptor(SvelteView.prototype, "firstChild");
    console.log("[SVELTE NATIVE DOM] initializeDom check. firstChild getter:", desc?.get ? "DEFINED" : "UNDEFINED");
    
    if (!desc?.get) {
        console.warn("[SVELTE NATIVE DOM] firstChild getter missing! Redefining...");
        Object.defineProperty(SvelteView.prototype, "firstChild", {
            get() { return (this.childNodes && this.childNodes.length > 0) ? this.childNodes[0] : null; },
            configurable: true
        });
    }
console.log("[SVELTE NATIVE DOM] shim initialized");
    return installGlobalShims();
}

initializeDom();

// Patch NativeScript NSCoreView prototype to be Svelte 5 compatible
const ViewPrototype = NSCoreView.prototype;
if (ViewPrototype) {
    Object.defineProperties(ViewPrototype, {
        nodeType: {
            get() { return 1; },
            configurable: true
        },
        childNodes: {
            get() {
                if (!this._childNodes) this._childNodes = [];
                return this._childNodes;
            },
            set(v) { this._childNodes = v; },
            configurable: true
        },
        nodeName: {
            get() {
                return (this.tagName || this.constructor.name || "").toUpperCase();
            },
            configurable: true
        },
        textContent: {
            get() { return this.text; },
            set(v) { this.text = v; },
            configurable: true
        },
        nodeValue: {
            get() { return this.text; },
            set(v) { this.text = v; },
            configurable: true
        },
        namespaceURI: {
            get() { return "http://www.w3.org/1999/xhtml"; },
            configurable: true
        },
        parentNode: {
            get() { return this._parentNode || this.parent; },
            set(v) { this._parentNode = v; },
            configurable: true
        },
        firstChild: {
            get() {
                const res = (this.childNodes && this.childNodes.length > 0) ? this.childNodes[0] : null;
                let debug = "NULL";
                if (res) {
                    const isText = res.nodeType === 3;
                    const isComment = res.nodeType === 8;
                    const info = (isText || isComment) ? `${isText ? 'TEXT' : 'COMMENT'}: "${res.text?.split('\n')[0].trim()}"` : `${res.childNodes?.length || 0} children`;
                    debug = `${res.tagName || res.nodeName || res.constructor.name} (${info})`;
                }
                console.log(`[SVELTE NATIVE DOM] get firstChild of ${this.tagName || (this.constructor && this.constructor.name) || 'UNDEFINED'} -> ${debug}`);
                return res;
            },
            configurable: true
        },
        lastChild: {
            get() {
                return (this.childNodes && this.childNodes.length > 0) ? this.childNodes[this.childNodes.length - 1] : null;
            },
            configurable: true
        },
        nextSibling: {
            get() {
                const parent = this.parentNode || this.parent;
                if (!parent || !parent.childNodes) return null;
                const nodes = parent.childNodes;
                const index = nodes.indexOf(this);
                const res = (index !== -1 && index < nodes.length - 1) ? nodes[index + 1] : null;
                
                let debug = "NULL";
                if (res) {
                    const isText = res.nodeType === 3;
                    const isComment = res.nodeType === 8;
                    const info = (isText || isComment) ? `${isText ? 'TEXT' : 'COMMENT'}: "${res.text?.split('\n')[0].trim()}"` : `${res.childNodes?.length || 0} children`;
                    debug = `${res.tagName || res.nodeName || res.constructor.name} (${info})`;
                }
                console.log(`[SVELTE NATIVE DOM] get nextSibling of ${this.tagName || this.nodeName || (this.constructor && this.constructor.name)} -> ${debug}`);
                return res;
            },
            configurable: true
        },
        previousSibling: {
            get() {
                const parent = this.parentNode || this.parent;
                if (!parent || !parent.childNodes) return null;
                const nodes = parent.childNodes;
                const index = nodes.indexOf(this);
                return (index > 0) ? nodes[index - 1] : null;
            },
            configurable: true
        }
    });
    ViewPrototype.before = function (...nodes) {
        if (!this.parent || !this.parent.insertChild) return;
        const index = this.parent.getChildIndex(this);
        nodes.forEach((node, i) => {
            this.parent.insertChild(node, index + i);
        });
    };
    ViewPrototype.after = function (...nodes) {
        if (!this.parent || !this.parent.insertChild) return;
        const index = this.parent.getChildIndex(this);
        nodes.forEach((node, i) => {
            this.parent.insertChild(node, index + i);
        });
    };

    ViewPrototype.appendChild = function (child) {
        if (child.nodeType === 11) {
            const children = [...child.childNodes];
            children.forEach(c => this.appendChild(c));
            child.childNodes = [];
            return child;
        }
        this.childNodes.push(child);
        child.parentNode = this;
        console.log(`[SVELTE NATIVE DOM] appendChild: ${child.tagName || child.nodeName}(${child._domId}) attached to ${this.tagName || (this.constructor && this.constructor.name)}(${this._domId}). isNative: ${child instanceof NSCoreView}`);
        
        if (child instanceof NSCoreView) {
            // Only use addChild if the instance truly supports it (e.g. LayoutBase)
            // and it's not our own patched version from the prototype.
            if (this.addChild && this.addChild !== ViewPrototype.addChild) {
                console.log(`[SVELTE NATIVE DOM] Native addChild called on ${this.tagName || this.constructor.name}(${this._domId}) for ${child.tagName || child.constructor.name}(${child._domId})`);
                this.addChild(child);
            } else {
                const isActionBar = child.constructor.name === 'ActionBar' || child.tagName === 'actionbar';
                if (isActionBar && ("actionBar" in this)) {
                    console.log(`[SVELTE NATIVE DOM] Setting actionBar of ${this.tagName || this.constructor.name} to ${child.tagName}(${child._domId})`);
                    this.actionBar = child;
                } else if ("content" in this) {
                    console.log(`[SVELTE NATIVE DOM] Setting content of ${this.tagName || this.constructor.name} to ${child.tagName || child.nodeName}(${child._domId})`);
                    this.content = child;
                }
            }
        }
        return child;
    };
    ViewPrototype.insertBefore = function (child, ref) {
        if (child.nodeType === 11) {
            const children = [...child.childNodes];
            children.forEach(c => this.insertBefore(c, ref));
            child.childNodes = [];
            return child;
        }
        
        const idx = ref ? this.childNodes.indexOf(ref) : -1;
        if (idx !== -1) {
            this.childNodes.splice(idx, 0, child);
        } else {
            this.childNodes.push(child);
        }
        child.parentNode = this;

        if (child instanceof NSCoreView) {
            // Calculate actual native index by counting only NSCoreView instances
            let nativeIndex = 0;
            for (const node of this.childNodes) {
                if (node === child) break;
                if (node instanceof NSCoreView) nativeIndex++;
            }

            if (this.insertChild && ref) {
                this.insertChild(child, nativeIndex);
            } else if (this.addChild) {
                this.addChild(child);
            } else {
                const isActionBar = child.constructor.name === 'ActionBar' || child.tagName === 'actionbar';
                if (isActionBar && ("actionBar" in this)) {
                    this.actionBar = child;
                } else if ("content" in this) {
                    this.content = child;
                }
            }
        }
        return child;
    };
    ViewPrototype.setAttribute = function (name, value) {
        this[name] = value;
        // Track attributes for cloning
        this._svelteAttributes = this._svelteAttributes || new Set();
        this._svelteAttributes.add(name);

        if (name.startsWith("on")) {
            const eventName = name.slice(2).toLowerCase();
            this.on(eventName, value);
        }
    };
    ViewPrototype.getAttribute = function (name) {
        return this[name];
    };
    ViewPrototype.remove = function () {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        } else if (this.parent) {
            this.parent.removeChild(this);
        }
    };

    const originalInsertChild = ViewPrototype.insertChild;
    ViewPrototype.insertChild = function (child, index) {
        if (originalInsertChild) return originalInsertChild.call(this, child, index);
    };

    ViewPrototype.cloneNode = function (deep) {
        const copy = this.tagName ? createElement(this.tagName) : createElement(this.constructor.name.toLowerCase());
        copy.nodeType = this.nodeType;
        
        // Copy tracked attributes
        if (this._svelteAttributes) {
            this._svelteAttributes.forEach(attr => {
                try {
                    copy.setAttribute(attr, this[attr]);
                } catch (e) {
                    // Ignore native property errors
                }
            });
        }

        if (deep && this.childNodes) {
            this.childNodes.forEach(c => {
                const childClone = c.cloneNode(true);
                if (childClone) {
                    copy.appendChild(childClone);
                }
            });
        }
        return copy;
    };
}

export { initializeDom, createElement, installGlobalShims };
// Dummy exports for compatibility
export const AbsoluteLayoutElement = SvelteView;
export const ActionBarElement = SvelteView;
export const ActivityIndicatorElement = SvelteView;
export const ButtonElement = SvelteView;
export const CommentNode = SvelteView;
export const ContentViewElement = SvelteView;
export const DatePickerElement = SvelteView;
export const DockLayoutElement = SvelteView;
export const DocumentNode = SvelteView;
export const DomTraceCategory = "SvelteNativeDom";
export const ElementNode = SvelteView;
export const FlexboxLayoutElement = SvelteView;
export const FormattedStringElement = SvelteView;
export const FrameElement = SvelteView;
export const GridLayoutElement = SvelteView;
export const HeadElement = SvelteView;
export const HtmlViewElement = SvelteView;
export const ImageElement = SvelteView;
export const LabelElement = SvelteView;
export const ListPickerElement = SvelteView;
export const ListViewElement = SvelteView;
export const LogLevel = {};
export const NativeElementNode = SvelteView;
export const NativeElementPropType = {};
export const NativeViewElementNode = SvelteView;
export const PageElement = SvelteView;
export const PlaceholderElement = SvelteView;
export const ProgressElement = SvelteView;
export const PropertyNode = SvelteView;
export const ProxyViewContainerElement = SvelteView;
export const RootLayoutElement = SvelteView;
export const ScrollViewElement = SvelteView;
export const SearchBarElement = SvelteView;
export const SegmentedBarElement = SvelteView;
export const SliderElement = SvelteView;
export const StackLayoutElement = SvelteView;
export const StyleElement = SvelteView;
export const SvelteKeyedTemplate = class { };
export const SvelteNativeDocument = SvelteView;
export const SwitchElement = SvelteView;
export const TabViewElement = SvelteView;
export const TemplateElement = SvelteView;
export const TextFieldElement = SvelteView;
export const TextNode = SvelteView;
export const TextViewElement = SvelteView;
export const TimePickerElement = SvelteView;
export const WebViewElement = SvelteView;
export const WrapLayoutElement = SvelteView;
export const closeModal = () => { };
export const goBack = () => { };
export const isModalOpened = () => false;
export const logger = { debug: () => { }, info: () => { }, warn: () => { }, error: () => { } };
export const navigate = () => { };
export const showModal = () => new Promise(() => { });
