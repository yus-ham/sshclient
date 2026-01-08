import { Frame, Application, ObservableArray, LayoutBase, ContentView, KeyframeAnimation, Page, ListView, TabView, TabViewItem, ActionBar, NavigationButton, ActionItem, Label, DatePicker, AbsoluteLayout, ActivityIndicator, Button, DockLayout, GridLayout, HtmlView, Image, ListPicker, FlexboxLayout, FormattedString, Span, Placeholder, Progress, ProxyViewContainer, RootLayout, ScrollView, SearchBar, SegmentedBar, SegmentedBarItem, Slider, StackLayout, Switch, TextField, TextView, TimePicker, WebView, WrapLayout, View, Trace } from '@nativescript/core';
import { CssAnimationParser } from '@nativescript/core/ui/styling/css-animation-parser';
import { time } from '@nativescript/core/profiling';
import { _rootModalViews } from '@nativescript/core/ui/core/view';
import { mount, unmount } from 'svelte';

const globalRef = typeof global !== 'undefined' ? global : window;
const isBrowser = typeof window !== 'undefined';

// Mock/Singleton for elements
const elementMap = globalRef.__SVELTE_NATIVE_ELEMENT_MAP__ || (globalRef.__SVELTE_NATIVE_ELEMENT_MAP__ = {});

function normalizeElementName(elementName) {
    return `${elementName.toLowerCase()}`;
}

class ViewNode {
    constructor() {
        this.nodeType = null;
        this.childNodes = [];
        this.parentNode = null;
        this.tagName = null;
    }
}

// Svelte 5 retrieves getters from the prototype during init_operations.
// We must define them explicitly so Object.getOwnPropertyDescriptor works.
Object.defineProperties(ViewNode.prototype, {
    firstChild: {
        get() { 
            if (this.childNodes) return this.childNodes[0] || null;
            if (this.content) return this.content;
            if (this.getChildrenCount && this.getChildrenCount() > 0) return this.getChildAt(0);
            return null;
        },
        configurable: true
    },
    lastChild: {
        get() { 
            if (this.childNodes) return this.childNodes[this.childNodes.length - 1] || null;
            if (this.content) return this.content;
            const count = this.getChildrenCount ? this.getChildrenCount() : 0;
            if (count > 0) return this.getChildAt(count - 1);
            return null;
        },
        configurable: true
    },
    nextSibling: {
        get() {
            const parent = this.parentNode || this.parent;
            if (!parent) return null;
            if (parent.childNodes) {
                const index = parent.childNodes.indexOf(this);
                return parent.childNodes[index + 1] || null;
            }
            if (parent.getChildIndex && parent.getChildAt) {
                const index = parent.getChildIndex(this);
                if (index !== -1 && index < parent.getChildrenCount() - 1) {
                    return parent.getChildAt(index + 1);
                }
            }
            return null;
        },
        configurable: true
    },
    previousSibling: {
        get() {
            const parent = this.parentNode || this.parent;
            if (!parent) return null;
            if (parent.childNodes) {
                const index = parent.childNodes.indexOf(this);
                return parent.childNodes[index - 1] || null;
            }
            if (parent.getChildIndex && parent.getChildAt) {
                const index = parent.getChildIndex(this);
                if (index > 0) return parent.getChildAt(index - 1);
            }
            return null;
        },
        configurable: true
    },
    parent: {
        get() { return this.parentNode; },
        configurable: true
    },
    content: {
        get() {
            if (this.tagName === 'template') {
                if (!this._content) {
                    this._content = installGlobalShims().createDocumentFragment();
                }
                return this._content;
            }
            return undefined;
        },
        configurable: true
    }
});

// Implementation of methods
Object.assign(ViewNode.prototype, {
    set innerHTML(html) {
        this.childNodes = [];
    },
    appendChild(child) { 
        this.childNodes.push(child); 
        child.parentNode = this; 
        return child; 
    },
    insertBefore(child, ref) { 
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
    },
    cloneNode(deep) {
        const copy = new ViewNode();
        copy.nodeType = this.nodeType;
        copy.tagName = this.tagName;
        copy.text = this.text;
        if (deep) {
            this.childNodes.forEach(c => copy.appendChild(c.cloneNode(true)));
        }
        return copy;
    },
    setAttribute() {},
    getAttribute() {}
});

function registerElement(elementName, resolver) {
    elementMap[normalizeElementName(elementName)] = { resolver };
}

function createElement(elementName) {
    const normalized = normalizeElementName(elementName);
    const node = elementMap[normalized] ? elementMap[normalized].resolver() : new ViewNode();
    node.nodeType = 1;
    node.tagName = normalized;
    return node;
}

function installGlobalShims() {
    let snDoc = {
        createElement,
        createTextNode: (t) => {
            const node = new ViewNode();
            node.nodeType = 3;
            node.text = t;
            return node;
        },
        createComment: (t) => {
            const node = new ViewNode();
            node.nodeType = 8;
            node.text = t;
            return node;
        },
        createDocumentFragment: () => {
            const node = new ViewNode();
            node.nodeType = 11;
            return node;
        },
        body: new ViewNode(),
        head: new ViewNode()
    };

    // ONLY provide global document for libraries that expect it, 
    // but DO NOT hijack the real window.document factories if in browser
    if (!globalRef.document) globalRef.document = snDoc;
    
    // Safety check for window property
    if (typeof window !== 'undefined') {
        if (globalRef === window) {
            // Already window, no need to set
        } else {
            try { globalRef.window = globalRef; } catch(e) {}
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
    if (!globalRef.Element) globalRef.Element = ViewNode;
    if (!globalRef.Text) globalRef.Text = ViewNode;
    if (!globalRef.Comment) globalRef.Comment = ViewNode;
    if (!globalRef.DocumentFragment) globalRef.DocumentFragment = ViewNode;
    if (!globalRef.Document) globalRef.Document = ViewNode;

    return snDoc;
}

// Minimal registration for core elements so svelte-native doesn't crash on init
function registerNativeElements() {
    const tags = ['page', 'actionbar', 'stacklayout', 'gridlayout', 'label', 'button', 'frame', 'tabview', 'listview'];
    tags.forEach(tag => registerElement(tag, () => new ViewNode()));
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
        parentNode: {
            get() { return this.parent; },
            configurable: true
        },
        firstChild: {
            get() {
                if (this.content) return this.content;
                if (this.getChildrenCount && this.getChildrenCount() > 0) {
                    return this.getChildAt(0);
                }
                return null;
            },
            configurable: true
        },
        nextSibling: {
            get() {
                if (!this.parent || !this.parent.getChildIndex) return null;
                const index = this.parent.getChildIndex(this);
                if (index === -1 || index >= this.parent.getChildrenCount() - 1) return null;
                return this.parent.getChildAt(index + 1);
            },
            configurable: true
        }
    });
    ViewPrototype.before = function(...nodes) {
        if (!this.parent || !this.parent.insertChild) return;
        const index = this.parent.getChildIndex(this);
        nodes.forEach((node, i) => {
            this.parent.insertChild(node, index + i);
        });
    };
    ViewPrototype.remove = function() {
        if (this.parent && this.parent.removeChild) {
            this.parent.removeChild(this);
        }
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
export const SvelteKeyedTemplate = class {};
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
export const closeModal = () => {};
export const goBack = () => {};
export const isModalOpened = () => false;
export const logger = { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} };
export const navigate = () => {};
export const showModal = () => new Promise(()=>{});
