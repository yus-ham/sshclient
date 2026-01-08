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
        this.nextSibling = null;
        this.prevSibling = null;
    }
    appendChild(child) { this.childNodes.push(child); child.parentNode = this; return child; }
    insertBefore(child, ref) { this.childNodes.push(child); return child; }
    removeChild(child) { return child; }
    setAttribute() {}
    getAttribute() {}
    cloneNode() { return this; }
}

function registerElement(elementName, resolver) {
    elementMap[normalizeElementName(elementName)] = { resolver };
}

function createElement(elementName) {
    const normalized = normalizeElementName(elementName);
    if (elementMap[normalized]) return elementMap[normalized].resolver();
    return new ViewNode();
}

function installGlobalShims() {
    let snDoc = {
        createElement,
        createTextNode: (t) => ({ nodeType: 3, text: t }),
        createComment: (t) => ({ nodeType: 8, text: t }),
        createDocumentFragment: () => ({ nodeType: 11, childNodes: [] }),
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
