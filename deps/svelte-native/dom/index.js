import * as core from '@nativescript/core';
const { View } = core;

const globalRef = typeof global !== 'undefined' ? global : window;
const isBrowser = typeof window !== 'undefined';

// Mock/Singleton for elements
const elementMap = globalRef.__SVELTE_NATIVE_ELEMENT_MAP__ || (globalRef.__SVELTE_NATIVE_ELEMENT_MAP__ = {});

function normalizeElementName(elementName) {
    return `${elementName.toLowerCase()}`;
}

class ViewNode {
    constructor(nodeType = 1) {
        this.nodeType = nodeType;
        this.childNodes = [];
        this.parentNode = null;
        this.tagName = null;
        this.text = null;
        this.isTemplate = false;
    }
    get nodeName() {
        const name = (this.nodeType === 3) ? "#text" :
            (this.nodeType === 8) ? "#comment" :
                (this.nodeType === 11) ? "#document-fragment" :
                    (this.tagName || "").toUpperCase();
        console.log(`[ViewNode] nodeName: ${name} (type: ${this.nodeType})`);
        return name;
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
        const copy = this.tagName ? createElement(this.tagName) : new ViewNode(this.nodeType);
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
Object.defineProperties(ViewNode.prototype, {
    firstChild: {
        get() {
            return (this.childNodes && this.childNodes.length > 0) ? this.childNodes[0] : null;
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
            return (index !== -1 && index < nodes.length - 1) ? nodes[index + 1] : null;
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
    },
    parent: {
        get() { return this.parentNode; },
        configurable: true
    }
});

// Implementation of methods
Object.defineProperties(ViewNode.prototype, {
    innerHTML: {
        set(html) {
            console.log(`[ViewNode] set innerHTML on ${this.tagName}: ${html}`);
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
                    currentParent.appendChild(installGlobalShims().createComment(commentText));
                } else if (match[3]) { // Open tag
                    const tagName = match[3].toLowerCase();
                    const node = createElement(tagName);

                    const attrStr = match[4];
                    if (attrStr) {
                        const attrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
                        let attrMatch;
                        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
                            node.setAttribute(attrMatch[1], attrMatch[2]);
                        }
                    }

                    currentParent.appendChild(node);
                    const isSelfClosing = attrStr && attrStr.trim().endsWith('/');
                    const voidTags = ["image", "activityindicator", "progress", "slider", "switch"];
                    const isVoid = voidTags.includes(tagName) || isSelfClosing;
                    if (!isVoid) {
                        currentParent = node;
                    }
                } else if (match[6]) { // Close tag
                    const tagName = match[6].toLowerCase();
                    const voidTags = ["image", "activityindicator", "progress", "slider", "switch"];
                    if (!voidTags.includes(tagName)) {
                        currentParent = currentParent.parentNode || target;
                    }
                } else if (match[7]) { // Text (KEEP WHITESPACE for Svelte 5 walking)
                    currentParent.appendChild(installGlobalShims().createTextNode(match[7]));
                }
            }
        },
        configurable: true
    }
});

Object.assign(ViewNode.prototype, {
    appendChild(child) {
        console.log(`(${this.nodeType}|${this.tagName}).appendChild: (${child.nodeType}|${child.tagName || child.nodeName})`);
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
        console.log(`(${this.nodeType}|${this.tagName}).insertBefore: (${child.nodeType}|${child.tagName || child.nodeName})`);
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
    const node = elementMap[normalized] ? elementMap[normalized].resolver() : new ViewNode(type);
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
            const node = new ViewNode(3);
            node.text = t;
            return node;
        },
        createComment: (t) => {
            const node = new ViewNode(8);
            node.text = t;
            return node;
        },
        createDocumentFragment: () => {
            return new ViewNode(11);
        },
        body: new ViewNode(1),
        head: new ViewNode(1)
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
    if (!globalRef.Node) globalRef.Node = ViewNode;
    if (!globalRef.Element) globalRef.Element = class extends ViewNode { constructor() { super(1); } };
    if (!globalRef.Text) globalRef.Text = class extends ViewNode { constructor() { super(3); } };
    if (!globalRef.Comment) globalRef.Comment = class extends ViewNode { constructor() { super(8); } };
    if (!globalRef.DocumentFragment) globalRef.DocumentFragment = class extends ViewNode { constructor() { super(11); } };
    if (!globalRef.Document) globalRef.Document = ViewNode;
    if (!globalRef.HTMLMediaElement) globalRef.HTMLMediaElement = class extends ViewNode { constructor() { super(1); } };

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
            registerElement(tag, () => new ViewNode());
        }
    });
}

let initializedDom = false;
function initializeDom() {
    if (initializedDom) return;
    initializedDom = true;
    registerNativeElements();
    return installGlobalShims();
}

initializeDom();

// Patch NativeScript View prototype to be Svelte 5 compatible
const ViewPrototype = View.prototype;
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
                const name = (this.tagName || this.constructor.name || "").toUpperCase();
                console.log(`[ViewPrototype] nodeName: ${name} (type: ${this.nodeType})`);
                return name;
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
            get() { return this.parent; },
            configurable: true
        },
        firstChild: {
            get() {
                const res = (this.childNodes && this.childNodes.length > 0) ? this.childNodes[0] : null;
                if (!res && (this.tagName === 'page' || this.tagName === 'stacklayout')) {
                    console.log(`[NAV-DEBUG] firstChild of ${this.tagName} is NULL! children: ${this.childNodes?.length}`);
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
                if (!res && (this.tagName === 'actionbar' || this.nodeType === 8)) {
                    console.log(`[NAV-DEBUG] nextSibling of ${this.tagName || this.nodeName} is NULL! parent: ${parent.tagName}, index: ${index}/${nodes.length}`);
                }
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
        if (child instanceof View) {
            if (this.addChild) {
                this.addChild(child);
            } else {
                const isActionBar = child.constructor.name === 'ActionBar' || child.tagName === 'actionbar';
                if (isActionBar && ("actionBar" in this)) {
                    this.actionBar = child;
                } else if ("content" in this) {
                    if (this.content && this.content !== child) {
                        console.warn(`[SvelteNative] content overwrite on ${this.tagName || this.constructor.name}: replacing ${this.content.tagName || this.content.constructor.name} with ${child.tagName || child.constructor.name}`);
                    }
                    this.content = child;
                } else {
                    console.warn(`[SvelteNative] orphan View: parent ${this.tagName || this.constructor.name} has no addChild or content property to hold ${child.tagName || child.constructor.name}`);
                }
            }
        } else {
            console.log(`[SvelteNative] bypass append: node type ${child.nodeType} (${child.tagName || child.nodeName}) is not a View, skipping native append.`);
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

        if (child instanceof View) {
            // Calculate actual native index by counting only View instances
            let nativeIndex = 0;
            for (const node of this.childNodes) {
                if (node === child) break;
                if (node instanceof View) nativeIndex++;
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

    const originalAddChild = ViewPrototype.addChild;
    ViewPrototype.addChild = function (child) {
        if (this.tagName === 'stacklayout' || this.constructor.name === 'StackLayout') {
            console.log(`[NATIVE-ADD] to ${this.tagName || this.constructor.name}: ${child.tagName || child.constructor.name}`);
        }
        if (originalAddChild) return originalAddChild.call(this, child);
    };

    const originalInsertChild = ViewPrototype.insertChild;
    ViewPrototype.insertChild = function (child, index) {
        if (this.tagName === 'stacklayout' || this.constructor.name === 'StackLayout') {
            console.log(`[NATIVE-INSERT] to ${this.tagName || this.constructor.name}: ${child.tagName || child.constructor.name} at ${index}`);
        }
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
export const AbsoluteLayoutElement = ViewNode;
export const ActionBarElement = ViewNode;
export const ActivityIndicatorElement = ViewNode;
export const ButtonElement = ViewNode;
export const CommentNode = ViewNode;
export const ContentViewElement = ViewNode;
export const DatePickerElement = ViewNode;
export const DockLayoutElement = ViewNode;
export const DocumentNode = ViewNode;
export const DomTraceCategory = "SvelteNativeDom";
export const ElementNode = ViewNode;
export const FlexboxLayoutElement = ViewNode;
export const FormattedStringElement = ViewNode;
export const FrameElement = ViewNode;
export const GridLayoutElement = ViewNode;
export const HeadElement = ViewNode;
export const HtmlViewElement = ViewNode;
export const ImageElement = ViewNode;
export const LabelElement = ViewNode;
export const ListPickerElement = ViewNode;
export const ListViewElement = ViewNode;
export const LogLevel = {};
export const NativeElementNode = ViewNode;
export const NativeElementPropType = {};
export const NativeViewElementNode = ViewNode;
export const PageElement = ViewNode;
export const PlaceholderElement = ViewNode;
export const ProgressElement = ViewNode;
export const PropertyNode = ViewNode;
export const ProxyViewContainerElement = ViewNode;
export const RootLayoutElement = ViewNode;
export const ScrollViewElement = ViewNode;
export const SearchBarElement = ViewNode;
export const SegmentedBarElement = ViewNode;
export const SliderElement = ViewNode;
export const StackLayoutElement = ViewNode;
export const StyleElement = ViewNode;
export const SvelteKeyedTemplate = class { };
export const SvelteNativeDocument = ViewNode;
export const SwitchElement = ViewNode;
export const TabViewElement = ViewNode;
export const TemplateElement = ViewNode;
export const TextFieldElement = ViewNode;
export const TextNode = ViewNode;
export const TextViewElement = ViewNode;
export const TimePickerElement = ViewNode;
export const WebViewElement = ViewNode;
export const WrapLayoutElement = ViewNode;
export const closeModal = () => { };
export const goBack = () => { };
export const isModalOpened = () => false;
export const logger = { debug: () => { }, info: () => { }, warn: () => { }, error: () => { } };
export const navigate = () => { };
export const showModal = () => new Promise(() => { });
