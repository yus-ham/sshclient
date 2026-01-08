import { Frame, Application, ObservableArray, LayoutBase, ContentView, KeyframeAnimation, Page, ListView, TabView, TabViewItem, ActionBar, NavigationButton, ActionItem, Label, DatePicker, AbsoluteLayout, ActivityIndicator, Button, DockLayout, GridLayout, HtmlView, Image, ListPicker, FlexboxLayout, FormattedString, Span, Placeholder, Progress, ProxyViewContainer, RootLayout, ScrollView, SearchBar, SegmentedBar, SegmentedBarItem, Slider, StackLayout, Switch, TextField, TextView, TimePicker, WebView, WrapLayout, View, Trace } from '@nativescript/core';
import { CssAnimationParser } from '@nativescript/core/ui/styling/css-animation-parser';
import { time } from '@nativescript/core/profiling';
import { _rootModalViews } from '@nativescript/core/ui/core/view';
import { mount, unmount } from 'svelte';

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Error"] = 3] = "Error";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor() {
        this.onLog = null;
    }
    setHandler(logger) {
        this.onLog = logger;
    }
    log(message, level) {
        if (this.onLog)
            this.onLog(message, level);
    }
    debug(message) {
        this.log(message, LogLevel.Debug);
    }
    info(message) {
        this.log(message, LogLevel.Info);
    }
    warn(message) {
        this.log(message, LogLevel.Warn);
    }
    error(message) {
        this.log(message, LogLevel.Error);
    }
}
const logger = new Logger();

function normalizeElementName(elementName) {
    return `${elementName.toLowerCase()}`;
}
function* elementIterator(el) {
    yield el;
    for (let child of el.childNodes) {
        yield* elementIterator(child);
    }
}
class ViewNode {
    constructor() {
        this.__isSvelteNativeElement__ = true; // Marker for bridge
        this.nodeType = null;
        this._tagName = null;
        this._parentNode = null;
        this.childNodes = [];
        this.prevSibling = null;
        this.nextSibling = null;
        this._ownerDocument = null;
        this._attributes = {};
    }
    get parentNode() { return this._parentNode; }
    set parentNode(node) { this._parentNode = node; }
    hasAttribute(name) {
        return this._attributes.hasOwnProperty(name);
    }
    removeAttribute(name) {
        delete this._attributes[name];
    }
    /* istanbul ignore next */
    toString() {
        return `${this.constructor.name}(${this.tagName})`;
    }
    set tagName(name) {
        this._tagName = normalizeElementName(name);
    }
    get tagName() {
        return this._tagName;
    }
    get firstChild() {
        return this.childNodes.length ? this.childNodes[0] : null;
    }
    get lastChild() {
        return this.childNodes.length
            ? this.childNodes[this.childNodes.length - 1]
            : null;
    }
    /* istanbul ignore next */
    get ownerDocument() {
        if (this._ownerDocument) {
            return this._ownerDocument;
        }
        let el = this;
        while (el != null && el.nodeType !== 9) {
            el = el.parentNode;
        }
        return (this._ownerDocument = el);
    }
    getAttribute(key) {
        return this._attributes[key];
    }
    /* istanbul ignore next */
    setAttribute(key, value) {
        this._attributes[key] = value;
    }
    /* istanbul ignore next */
    setText(text) {
        logger.debug(() => `setText ${this} ${text}`);
        this.setAttribute('text', text);
    }
    updateText() {
        this.setText(this.childNodes.filter(x => x.nodeType === 3).map(x => x.text).join(''));
    }
    onInsertedChild(childNode, index) { }
    onRemovedChild(childNode) { }
    contains(child) {
        if (child === this) return true;
        return this.childNodes.some(n => n.contains ? n.contains(child) : n === child);
    }
    insertBefore(childNode, referenceNode) {
        if (!childNode) return null;
        
        // Handle DocumentFragment (nodeType 11)
        if (childNode.nodeType === 11) {
            console.log("Inserting Fragment children...");
            let firstChild = null;
            // Move children from fragment to this node
            const children = [...childNode.childNodes]; 
            for (const child of children) {
                const inserted = this.insertBefore(child, referenceNode);
                if (!firstChild) firstChild = inserted;
            }
            // Fragment is now empty. Only clear if it's our virtual node.
            if (childNode instanceof ViewNode) {
                childNode.childNodes = [];
            }
            return firstChild; 
        }

        if (!referenceNode) {
            return this.appendChild(childNode);
        }
        if (referenceNode.parentNode !== this) {
            throw new Error(`Can't insert child, because the reference node has a different parent.`);
        }
        
        // Handle parentNode safely
        try {
            if (childNode.parentNode && childNode.parentNode !== this) {
                childNode.parentNode.removeChild(childNode);
            }
            childNode.parentNode = this;
        } catch(e) {}

        let index = this.childNodes.indexOf(referenceNode);
        
        // Link siblings
        try { childNode.nextSibling = referenceNode; } catch(e) {}
        
        const prev = this.childNodes[index - 1] || null;
        try { childNode.prevSibling = prev; } catch(e) {}
        try { referenceNode.prevSibling = childNode; } catch(e) {}
        
        if (prev) {
             try { prev.nextSibling = childNode; } catch(e) {}
        }

        this.childNodes.splice(index, 0, childNode);
        this.onInsertedChild(childNode, index);
        return childNode;
    }
    appendChild(childNode) {
        if (!childNode) return null;

        // Handle DocumentFragment (nodeType 11)
        if (childNode.nodeType === 11) {
            console.log("Appending Fragment children...");
            let firstChild = null;
            const children = [...childNode.childNodes];
            for (const child of children) {
                const appended = this.appendChild(child);
                if (!firstChild) firstChild = appended;
            }
            childNode.childNodes = [];
            return firstChild;
        }
        
        try {
            if (childNode.parentNode && childNode.parentNode !== this) {
                childNode.parentNode.removeChild(childNode);
            }
            childNode.parentNode = this;
        } catch(e) { }

        // Update Siblings
        if (this.lastChild) {
            try { childNode.prevSibling = this.lastChild; } catch(e) {}
            try { this.lastChild.nextSibling = childNode; } catch(e) {}
        } else {
            try { childNode.prevSibling = null; } catch(e) {}
        }
        try { childNode.nextSibling = null; } catch(e) {}

        this.childNodes.push(childNode);
        this.onInsertedChild(childNode, -1);
        return childNode;
    }
    removeChild(childNode) {
        if (!childNode) {
            throw new Error(`Can't remove child.`);
        }
        
        if (childNode instanceof ViewNode || !isBrowser) {
            if (childNode.parentNode && childNode.parentNode !== this) {
                throw new Error(`Can't remove child, because it has a different parent.`);
            }
            childNode.parentNode = null;
            if (childNode.prevSibling) {
                childNode.prevSibling.nextSibling = childNode.nextSibling;
            }
            if (childNode.nextSibling) {
                childNode.nextSibling.prevSibling = childNode.prevSibling;
            }
            childNode.prevSibling = null;
            childNode.nextSibling = null;
        }

        this.childNodes = this.childNodes.filter(node => node !== childNode);
        this.onRemovedChild(childNode);
        return childNode;
    }
    firstElement() {
        for (var child of this.childNodes) {
            if (child.nodeType == 1) {
                return child;
            }
        }
        return null;
    }
    // Svelte 5 DOM API Compatibility
    before(...nodes) {
        if (this.parentNode) {
            nodes.forEach(node => {
                this.parentNode.insertBefore(node, this);
            });
        }
    }
    after(...nodes) {
        if (this.parentNode) {
            const next = this.nextSibling;
            nodes.forEach(node => {
                if (next) {
                    this.parentNode.insertBefore(node, next);
                } else {
                    this.parentNode.appendChild(node);
                }
            });
        }
    }
    remove() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }
    replaceWith(...nodes) {
        this.before(...nodes);
        this.remove();
    }
    // Svelte 5 Template Cloning Support
    cloneNode(deep) {
        const clone = this.ownerDocument.createElement(this.tagName);
        
        // Copy attributes
        for (let key in this._attributes) {
            clone.setAttribute(key, this._attributes[key]);
        }
        
        // Copy text if applicable
        if (this.nodeType === 3) {
            clone.text = this.text;
        }

        if (deep) {
            this.childNodes.forEach(child => {
                clone.appendChild(child.cloneNode(true));
            });
        }
        
        return clone;
    }
}

class ElementNode extends ViewNode {
    constructor(tagName) {
        super();
        this.nodeType = 1;
        this.tagName = tagName;
    }
    get id() {
        return this.getAttribute('id');
    }
    set id(value) {
        this.setAttribute('id', value);
    }
    get classList() {
        if (!this._classList) {
            const getClasses = () => (this.getAttribute('class') || "").split(/\s+/).filter((k) => k != "");
            this._classList = {
                add: (...classNames) => {
                    this.setAttribute('class', [...new Set(getClasses().concat(classNames))].join(" "));
                },
                remove: (...classNames) => {
                    this.setAttribute('class', getClasses().filter((i) => classNames.indexOf(i) == -1).join(" "));
                },
                toggle: (className, toggle) => {
                    if (toggle === undefined) {
                        toggle = getClasses().indexOf(className) === -1;
                    }
                    if (toggle) {
                        this.classList.add(className);
                    }
                    else {
                        this.classList.remove(className);
                    }
                },
                get length() {
                    return getClasses().length;
                }
            };
        }
        return this._classList;
    }
    appendChild(childNode) {
        const res = super.appendChild(childNode);
        if (childNode.nodeType === 3) {
            this.updateText();
        }
        if (childNode.nodeType === 7) {
            childNode.setOnNode(this);
        }
        return res;
    }
    insertBefore(childNode, referenceNode) {
        const res = super.insertBefore(childNode, referenceNode);
        if (childNode.nodeType === 3) {
            this.updateText();
        }
        if (childNode.nodeType === 7) {
            childNode.setOnNode(this);
        }
        return res;
    }
    removeChild(childNode) {
        const res = super.removeChild(childNode);
        if (childNode.nodeType === 3) {
            this.updateText();
        }
        if (childNode.nodeType === 7) {
            childNode.clearOnNode(this);
        }
        return res;
    }
}

class CommentNode extends ElementNode {
    constructor(text) {
        super('comment');
        this.nodeType = 8;
        this.text = text;
    }
}

class TextNode extends ViewNode {
    constructor(text) {
        super();
        this.nodeType = 3;
        this.text = text;
    }
    setText(text) {
        this.text = text;
        this.parentNode.updateText();
    }
    set data(text) {
        this.setText(text);
    }
    get data() {
        return this.text;
    }
}

class PropertyNode extends ElementNode {
    constructor(tagName, propertyName) {
        super(`${tagName}.${propertyName}`);
        this.propertyName = propertyName;
        this.propertyTagName = normalizeElementName(tagName);
        this.nodeType = 7; //processing instruction
    }
    onInsertedChild() {
        this.setOnNode(this.parentNode);
    }
    onRemovedChild() {
        this.setOnNode(this.parentNode);
    }
    /* istanbul ignore next */
    toString() {
        return `${this.constructor.name}(${this.tagName}, ${this.propertyName})`;
    }
    setOnNode(parent) {
        if (parent && (parent.tagName === this.propertyTagName)) {
            const el = this.firstElement();
            parent.setAttribute(this.propertyName, el);
        }
    }
    clearOnNode(parent) {
        if (parent && (parent.tagName === this.propertyTagName)) {
            parent.setAttribute(this.propertyName, null);
        }
    }
}

const elementMap = {};
function registerElementResolver(elementName, entry, options) {
    const normalizedName = normalizeElementName(elementName);
    if (elementMap[normalizedName] && (!options || options.override !== true)) {
        console.error(`Element for ${normalizedName} already registered.`);
        return;
    }
    elementMap[normalizedName] = entry;
}
function registerElement(elementName, resolver, options) {
    registerElementResolver(elementName, { resolver: resolver }, options);
}
function createElement(elementName, owner) {
    if (!owner) {
        owner = window.document;
    }
    const normalizedName = normalizeElementName(elementName);
    const elementDefinition = elementMap[normalizedName];
    if (!elementDefinition) {
        throw new TypeError(`No known component for element ${elementName}.`);
    }
    const el = elementDefinition.resolver();
    el._ownerDocument = owner;
    return el;
}

class DocumentNode extends ViewNode {
    constructor() {
        super();
        this.tagName = "docNode";
        this.nodeType = 9;
    }
    createComment(text) {
        return new CommentNode(text);
    }
    createPropertyNode(tagName, propertyName) {
        return new PropertyNode(tagName, propertyName);
    }
    createElement(tagName) {
        if (tagName.indexOf(".") >= 0) {
            let bits = tagName.split(".", 2);
            return this.createPropertyNode(bits[0], bits[1]);
        }
        return createElement(tagName, this);
    }
    createElementNS(namespace, tagName) {
        return this.createElement(tagName);
    }
    createTextNode(text) {
        return new TextNode(text);
    }
    getElementById(id) {
        for (let el of elementIterator(this)) {
            if (el.nodeType === 1 && el.id === id)
                return el;
        }
    }
    dispatchEvent(event) {
        //Svelte dev fires these for tool support
    }
}

class StyleSheet {
    constructor() {
        this._rules = [];
    }
    // The css rules generated by svelte have a keyframe every 16 milliseconds and are quite slow to create and run
    // this is here to support the simple and short ones, but ideally we would promote our own transitions in svelte-native/transitions
    // which would delegate to the more direct nativescript way of working.
    deleteRule(index) {
        let removed = this._rules.splice(index, 1);
        for (let r in removed) {
            logger.debug(() => `removing transition rule ${r}`);
            // Turns out nativescript doesn't support "removing" css.
            // this is pretty horrible but better than a memory leak. 
            // since this code is called mainly for keyframes, and keyframes don't add new selectors (they just end up in _keyframes)
            // we can almost remove the rules ourselves.
            if (r.startsWith('@keyframes')) {
                const name = r.split(" ")[1];
                let frame = Frame.topmost();
                if (frame && frame._styleScope) {
                    let scope = frame._styleScope;
                    delete scope._keyframes[name];
                    scope._css = scope._css.replace(r, "");
                }
            }
        }
    }
    insertRule(rule, index = 0) {
        logger.debug(() => `Adding transition rule ${rule}`);
        let frame = Frame.topmost();
        frame.addCss(rule);
        this._rules.splice(index, 0, rule);
    }
    get cssRules() {
        return this._rules;
    }
}
class StyleElement extends ElementNode {
    constructor() {
        super('style');
        this._sheet = new StyleSheet();
    }
    get sheet() {
        return this._sheet;
    }
}

class HeadElement extends ElementNode {
    constructor() {
        super('head');
    }
    onInsertedChild(childNode, atIndex) {
        if (childNode instanceof StyleElement) {
            let css = childNode.textContent;
            let id = childNode.id;
            let style_hash = id.replace('-style', '');
            //style rules are one per line as long as each selector in the rule has the style hash we are all scoped styles and can pass true to addCss
            let all_scoped = css.split("\n").every(r => r.split(",").every(i => i.indexOf(style_hash) >= 0));
            if (css) {
                Application.addCss(css, all_scoped);
            }
        }
    }
}

class TemplateElement extends ElementNode {
    constructor() {
        super('template');
    }
    set component(value) {
        this.setAttribute('component', value);
    }
    get component() {
        return this.getAttribute('component');
    }
}

// Dom elements that svelte expects to be able to create or use.
// or custom additions to make life easier
function registerSvelteElements() {
    registerElement('head', () => new HeadElement());
    registerElement('style', () => new StyleElement());
    registerElement('fragment', () => {
        const el = new ElementNode('fragment');
        el.nodeType = 11; // DocumentFragment
        return el;
    });
    // registerElement('template', () => new TemplateElement()); // Disabled to allow Svelte 5 native template usage
}

var NativeElementPropType;
(function (NativeElementPropType) {
    NativeElementPropType[NativeElementPropType["Value"] = 0] = "Value";
    NativeElementPropType[NativeElementPropType["Array"] = 1] = "Array";
    NativeElementPropType[NativeElementPropType["ObservableArray"] = 2] = "ObservableArray";
})(NativeElementPropType || (NativeElementPropType = {}));
function setOnArrayProp(parent, value, propName, index, build = null) {
    logger.debug(() => `setOnArrayProp ${propName} index: ${index}`);
    let current = parent[propName];
    if (!current || !current.push) {
        parent[propName] = build ? build(value) : [value];
    }
    else {
        if (current instanceof ObservableArray) {
            if (index > -1) {
                current.splice(index, 0, value);
            }
            else {
                current.push(value);
            }
        }
        else {
            if (index > -1) {
                const newArr = current.slice();
                newArr.splice(index, 0, value);
                parent[propName] = newArr;
            }
            else {
                parent[propName] = [...current, value];
            }
        }
    }
}
function removeFromArrayProp(parent, value, propName) {
    let current = parent[propName];
    if (!current || !current.splice) {
        return;
    }
    let idx = current.indexOf(value);
    if (idx < 0)
        return;
    if (current instanceof ObservableArray) {
        current.splice(idx, 1);
    }
    else {
        const newArr = current.slice();
        newArr.splice(idx, 1);
        parent[propName] = newArr;
    }
}
// Implements an ElementNode that wraps a NativeScript object. It uses the object as the source of truth for its attributes
class NativeElementNode extends ElementNode {
    constructor(tagName, elementClass, setsParentProp = null, propConfig = {}) {
        super(tagName, elementClass, setsParentProp, propConfig);
        this.propAttribute = null;
        this.propConfig = propConfig;
        this.propAttribute = setsParentProp;
        this._nativeElement = new elementClass();
        this._nativeElement.__SvelteNativeElement__ = this;
        logger.debug(() => `created ${this} ${this._nativeElement}`);
    }
    get nativeElement() {
        return this._nativeElement;
    }
    set nativeElement(el) {
        if (this._nativeElement) {
            throw new Error(`Can't overwrite native element.`);
        }
        this._nativeElement = el;
    }
    getAttribute(fullkey) {
        let getTarget = this.nativeElement;
        let keypath = fullkey.split(".");
        while (keypath.length > 0) {
            if (!getTarget)
                return null;
            let key = keypath.shift();
            if (keypath.length > 0) {
                getTarget = getTarget[key];
            }
            else {
                return getTarget[key];
            }
        }
        return null;
    }
    onInsertedChild(childNode, index) {
        super.onInsertedChild(childNode, index);
        // support for the prop: shorthand for setting parent property to native element
        if (!(childNode instanceof NativeElementNode))
            return;
        let propName = childNode.propAttribute;
        if (!propName)
            return;
        //Special case Array and Observable Array keys
        if (this.propConfig[propName] === undefined || this.propConfig[propName] === NativeElementPropType.Value) {
            this.setAttribute(propName, childNode);
            return;
        }
        //our array index is based on how many items with the same prop attribute come before us
        const allPropSetters = this.childNodes.filter(n => n instanceof NativeElementNode && n.propAttribute && n.propAttribute.toLowerCase() == propName.toLowerCase());
        const myIndex = allPropSetters.indexOf(childNode);
        switch (this.propConfig[propName]) {
            case NativeElementPropType.Array:
                setOnArrayProp(this.nativeElement, childNode.nativeElement, propName, myIndex);
                return;
            case NativeElementPropType.ObservableArray:
                setOnArrayProp(this.nativeElement, childNode.nativeElement, propName, myIndex, (v) => new ObservableArray(v));
                return;
        }
    }
    onRemovedChild(childNode) {
        if (!(childNode instanceof NativeElementNode))
            return;
        let propName = childNode.propAttribute;
        if (!propName)
            return;
        //Special case Array and Observable Array keys
        switch (this.propConfig[propName]) {
            case NativeElementPropType.Array:
            case NativeElementPropType.ObservableArray:
                removeFromArrayProp(this.nativeElement, childNode.nativeElement, propName);
                return;
            default:
                this.setAttribute(propName, null);
        }
        super.onRemovedChild(childNode);
    }
    removeAttribute(fullkey) {
        // if an attribute is set to null svelte will call removeAttribute
        // but we still need to call setAttribute to apply the change on N view
        this.setAttribute(fullkey, null);
    }
    setAttribute(fullkey, value) {
        const nv = this.nativeElement;
        let setTarget = nv;
        // normalize key
        if (__ANDROID__) {
            if (fullkey.startsWith('android:')) {
                fullkey = fullkey.substring(8);
            }
            if (fullkey.startsWith('ios:')) {
                return;
            }
        }
        if (__IOS__) {
            if (fullkey.startsWith('ios:')) {
                fullkey = fullkey.substring(4);
            }
            if (fullkey.startsWith('android:')) {
                return;
            }
        }
        if (fullkey.startsWith("prop:")) {
            this.propAttribute = fullkey.substring(5);
            return;
        }
        //we might be getting an element from a propertyNode eg page.actionBar, unwrap
        if (value instanceof NativeElementNode) {
            value = value.nativeElement;
        }
        let keypath = fullkey.split(".");
        let resolvedKeys = [];
        while (keypath.length > 0) {
            if (!setTarget)
                return;
            let key = keypath.shift();
            resolvedKeys.push(key);
            if (keypath.length > 0) {
                setTarget = setTarget[key];
            }
            else {
                logger.debug(() => `setAttr value ${this} ${resolvedKeys.join(".")} ${value}`);
                setTarget[key] = value;
            }
        }
    }
}
function registerNativeConfigElement(elementName, resolver, parentProp = null, propConfig = {}) {
    registerElement(elementName, () => new NativeElementNode(elementName, resolver(), parentProp, propConfig));
}

const isBrowser = typeof window !== 'undefined';

function camelize(kebab) {
    return kebab.replace(/-+(\w)/g, (m, l) => l.toUpperCase());
}
function registerNativeViewElement(elementName, resolver, parentProp = null, propConfig = {}, options) {
    registerElement(elementName, () => new NativeViewElementNode(elementName, resolver(), parentProp, propConfig), options);
}
// A NativeViewElementNode, wraps a native View and handles style, event dispatch, and native view hierarchy management.
class NativeViewElementNode extends NativeElementNode {
    constructor(tagName, viewClass, setsParentProp = null, propConfig = {}) {
        super(tagName, viewClass, setsParentProp, propConfig);
        
        // Svelte 5 Event Handling Support - Removed defineProperty to avoid redefinition errors
        // Standard property access will be handled by our sync logic or future proxy.

        let setStyleAttribute = (value) => {
            this.setAttribute('style', value);
        };
        let getStyleAttribute = () => {
            return this.getAttribute('style');
        };
        let getParentPage = () => {
            if (this.nativeView && this.nativeView.page) {
                return this.nativeView.page.__SvelteNativeElement__;
            }
            return null;
        };
        let animations = new Map();
        let oldAnimations = [];
        const addAnimation = (animation) => {
            logger.debug(() => `Adding animation ${animation}`);
            if (!this.nativeView) {
                throw Error("Attempt to apply animation to tag without a native view" + this.tagName);
            }
            let page = getParentPage();
            if (page == null) {
                animations.set(animation, null);
                return;
            }
            //quickly cancel any old ones
            while (oldAnimations.length) {
                let oldAnimation = oldAnimations.shift();
                if (oldAnimation.isPlaying) {
                    oldAnimation.cancel();
                }
            }
            //Parse our "animation" style property into an animation info instance (this won't include the keyframes from the css)
            let animationInfos = CssAnimationParser.keyframeAnimationsFromCSSDeclarations([{ property: "animation", value: animation }]);
            if (!animationInfos) {
                animations.set(animation, null);
                return;
            }
            let animationInfo = animationInfos[0];
            //Fetch an animationInfo instance that includes the keyframes from the css (this won't include the animation properties parsed above)
            let animationWithKeyframes = page.nativeView.getKeyframeAnimationWithName(animationInfo.name);
            if (!animationWithKeyframes) {
                animations.set(animation, null);
                return;
            }
            animationInfo.keyframes = animationWithKeyframes.keyframes;
            //combine the keyframes from the css with the animation from the parsed attribute to get a complete animationInfo object
            let animationInstance = KeyframeAnimation.keyframeAnimationFromInfo(animationInfo);
            // save and launch the animation
            animations.set(animation, animationInstance);
            animationInstance.play(this.nativeView);
        };
        const removeAnimation = (animation) => {
            logger.debug(() => `Removing animation ${animation}`);
            if (animations.has(animation)) {
                let animationInstance = animations.get(animation);
                animations.delete(animation);
                if (animationInstance) {
                    if (animationInstance.isPlaying) {
                        //we don't want to stop right away since svelte removes the animation before it is finished due to our lag time starting the animation.
                        oldAnimations.push(animationInstance);
                    }
                }
            }
        };
        this.style = {
            setProperty: (propertyName, value, priority) => {
                this.setStyle(camelize(propertyName), value);
            },
            removeProperty: (propertyName) => {
                this.setStyle(camelize(propertyName), null);
            },
            get animation() {
                return [...animations.keys()].join(", ");
            },
            set animation(value) {
                logger.debug(() => `setting animation ${value}`);
                let new_animations = value.trim() == "" ? [] : value.split(',').map(a => a.trim());
                //add new ones
                for (let anim of new_animations) {
                    if (!animations.has(anim)) {
                        addAnimation(anim);
                    }
                }
                //remove old ones
                for (let anim of animations.keys()) {
                    if (new_animations.indexOf(anim) < 0) {
                        removeAnimation(anim);
                    }
                }
            },
            get cssText() {
                logger.debug(() => "got css text");
                return getStyleAttribute();
            },
            set cssText(value) {
                logger.debug(() => "set css text");
                setStyleAttribute(value);
            }
        };
    }
    /* istanbul ignore next */
    setStyle(property, value) {
        logger.debug(() => `setStyle ${this} ${property} ${value}`);
        if (!(value = value.toString().trim()).length) {
            return;
        }
        if (property.endsWith('Align')) {
            // NativeScript uses Alignment instead of Align, this ensures that text-align works
            property += 'ment';
        }
        this.nativeView.style[property] = value;
    }
    get nativeView() {
        return this.nativeElement;
    }
    set nativeView(view) {
        this.nativeElement = view;
    }
    /* istanbul ignore next */
    addEventListener(event, handler) {
        logger.debug(() => `add event listener ${this} ${event}`);
        //svelte compatibility wrapper
        handler.__wrapper = handler.__wrapper || ((args) => {
            args.type = args.eventName;
            handler(args);
        });
        this.nativeView.on(event, handler.__wrapper);
    }
    /* istanbul ignore next */
    removeEventListener(event, handler) {
        logger.debug(() => `remove event listener ${this} ${event}`);
        this.nativeView.off(event, handler.__wrapper || handler);
    }
    onInsertedChild(childNode, index) {
        super.onInsertedChild(childNode, index);
        if (!(childNode instanceof NativeViewElementNode)) {
            return;
        }
        //if we are a property value, then skip adding to parent
        let propName = childNode.propAttribute;
        if (propName && this.propConfig[propName] !== undefined && this.propConfig[propName] !== NativeElementPropType.Value)
            return;
        const parentView = this.nativeView;
        const childView = childNode.nativeView;
        if (!parentView) {
            return;
        }
        if (parentView instanceof LayoutBase) {
            if (index >= 0) {
                //our dom includes "textNode" and "commentNode" which does not appear in the nativeview's children. 
                //we recalculate the index required for the insert operation by only including native view element nodes in the count
                //that aren't property setter nodes
                let nativeIndex = this.childNodes.filter(e => e instanceof NativeViewElementNode && !e.propAttribute).indexOf(childNode);
                parentView.insertChild(childView, nativeIndex);
            }
            else {
                parentView.addChild(childView);
            }
            return;
        }
        // we aren't a layout view, _addChildFromBuilder should give the correct behaviour if it exists 
        if (parentView._addChildFromBuilder) {
            return parentView._addChildFromBuilder(childView.constructor.name, childView);
        }
        // No _addChildFromBuilder, we sort of know what to do with ContentView
        if (parentView instanceof ContentView) {
            parentView.content = childView;
            return;
        }
        // Give up.
        throw new Error("Parent can't contain children: " + this + ", " + childNode);
    }
    onRemovedChild(childNode) {
        super.onRemovedChild(childNode);
        if (!(childNode instanceof NativeViewElementNode)) {
            return;
        }
        //childnodes with propAttributes aren't added to native views
        if (childNode.propAttribute)
            return;
        if (!this.nativeView || !childNode.nativeView) {
            return;
        }
        const parentView = this.nativeView;
        const childView = childNode.nativeView;
        if (parentView instanceof LayoutBase) {
            parentView.removeChild(childView);
        }
        else if (parentView instanceof ContentView) {
            if (parentView.content === childView) {
                parentView.content = null;
            }
            if (childNode.nodeType === 8) {
                parentView._removeView(childView);
            }
        }
        else if (typeof parentView._removeView === 'function') {
            parentView._removeView(childView);
        }
        else {
            logger.warn(() => "Unknown parent view type: " + parentView);
        }
    }
    dispatchEvent(event) {
        if (this.nativeView) {
            //nativescript uses the EventName while dom uses Type
            event.eventName = event.type;
            this.nativeView.notify(event);
        }
    }
}

class PageElement extends NativeViewElementNode {
    constructor() {
        super("Page", Page);
    }
    static register() {
        registerElement("Page", () => new PageElement());
    }
}

class FrameElement extends NativeViewElementNode {
    constructor() {
        super('Frame', Frame);
    }
    setAttribute(key, value) {
        if (key.toLowerCase() == "defaultpage") {
            logger.debug(() => `loading page ${value}`);
            let dummy = createElement('fragment', this.ownerDocument);
            mount(value, { target: dummy, props: {} }); // Fixed for Svelte 5
            this.nativeView.navigate({ create: () => dummy.firstElement().nativeView });
            return;
        }
        super.setAttribute(key, value);
    }
    //In regular native script, Frame elements aren't meant to have children, we instead allow it to have one.. a page.. as a convenience
    // and set the instance as the default page by navigating to it.
    onInsertedChild(childNode, index) {
        //only handle page nodes
        if (!(childNode instanceof PageElement))
            return;
        this.nativeView.navigate({ create: () => childNode.nativeView, clearHistory: true });
    }
    static register() {
        registerElement("Frame", () => new FrameElement());
    }
}

class SvelteKeyedTemplate {
    constructor(key, templateEl) {
        this._key = key;
        this._templateEl = templateEl;
    }
    get component() {
        return this._templateEl.component;
    }
    get key() {
        return this._key;
    }
    createView() {
        //create a proxy element to eventually contain our item (once we have one to render)
        //TODO is StackLayout the best choice here? 
        logger.debug(() => `creating view for key ${this.key}`);
        let wrapper = createElement('StackLayout', this._templateEl.ownerDocument);
        wrapper.setStyle("padding", 0);
        wrapper.setStyle("margin", 0);
        let nativeEl = wrapper.nativeView;
        nativeEl.__SvelteComponentBuilder__ = (props) => {
            let instance = mount(this.component, {
                target: wrapper,
                props: props
            });
            nativeEl.__SvelteComponent__ = instance;
        };
        return nativeEl;
    }
}
class ListViewElement extends NativeViewElementNode {
    constructor() {
        super("ListView", ListView);
        this.nativeView.on(ListView.itemLoadingEvent, (args) => { this.updateListItem(args); });
    }
    updateListItem(args) {
        let item;
        let listView = this.nativeView;
        let items = listView.items;
        if (args.index >= items.length) {
            logger.error(() => `Got request for item at index that didn't exist ${args.index}`);
            return;
        }
        if (items.getItem) {
            item = items.getItem(args.index);
        }
        else {
            item = items[args.index];
        }
        if (!args.view || !args.view.__SvelteComponent__) {
            let component;
            if (args.view && args.view.__SvelteComponentBuilder__) {
                logger.debug(() => `instantiating component in keyed view item at ${args.index}`);
                //now we have an item, we can create and mount this component
                args.view.__SvelteComponentBuilder__({ item });
                args.view.__SvelteComponentBuilder__ = null; //free the memory
                return;
            }
            logger.debug(() => `creating default view for item at ${args.index}`);
            if (typeof listView.itemTemplates == "object") {
                component = listView.itemTemplates.filter(x => x.key == "default").map(x => x.component)[0];
            }
            if (!component) {
                logger.error(() => `Couldn't determine component to use for item at ${args.index}`);
                return;
            }
            let wrapper = createElement('ProxyViewContainer', this.ownerDocument);
            let componentInstance = mount(component, {
                target: wrapper,
                props: {
                    item
                }
            });
            let nativeEl = wrapper.nativeView;
            nativeEl.__SvelteComponent__ = componentInstance;
            args.view = nativeEl;
        }
        else {
            let componentInstance = args.view.__SvelteComponent__;
            logger.debug(() => `updating view for ${args.index} which is a ${args.view}`);
            // Note: Svelte 5 component update might be different than $set.
            // If componentInstance is from mount(), we might not have $set.
            // For now, assuming compatibility or we need to rethink ListView recycling in Svelte 5.
            if (componentInstance.$set) {
                componentInstance.$set({ item });
            } else {
                // Svelte 5 doesn't expose $set easily. Re-mount might be needed or state management.
                // TODO: Fix for Svelte 5 list view updates
            }
        }
    }
    onInsertedChild(childNode, index) {
        super.onInsertedChild(childNode, index);
        if (childNode instanceof TemplateElement) {
            let key = childNode.getAttribute('key') || "default";
            logger.debug(() => `Adding template for key ${key}`);
            if (!this.nativeView.itemTemplates || typeof this.nativeView.itemTemplates == "string") {
                this.nativeView.itemTemplates = [];
            }
            this.nativeView.itemTemplates.push(new SvelteKeyedTemplate(key, childNode));
        }
    }
    onRemovedChild(childNode) {
        super.onRemovedChild(childNode);
        if (childNode instanceof TemplateElement) {
            let key = childNode.getAttribute('key') || "default";
            if (this.nativeView.itemTemplates && typeof this.nativeView.itemTemplates != "string") {
                this.nativeView.itemTemplates = this.nativeView.itemTemplates.filter(t => t.key != key);
            }
        }
    }
    static register() {
        registerElement("ListView", () => new ListViewElement());
    }
}

class TabViewElement extends NativeViewElementNode {
    constructor() {
        super('TabView', TabView);
        this.needs_update = false;
    }
    doUpdate() {
        let items = this.childNodes.filter(x => x instanceof NativeViewElementNode && x.nativeView instanceof TabViewItem).map(x => x.nativeView);
        logger.debug(() => `updating tab items. now has ${items.length} items`);
        this.nativeView.items = items;
    }
    onInsertedChild(childNode, index) {
        try {
            //We only want to handle TabViewItem and only if it is the last item!
            if (!(childNode instanceof NativeViewElementNode && childNode.nativeView instanceof TabViewItem))
                return super.onInsertedChild(childNode, index);
            this.needs_update = true;
            //resolve after this event loop to catch all added tabviewitems in one update, and to handle the fact that svelte adds the
            //tabviewitem to tabview while it is still empty which causes problems.
            Promise.resolve().then(() => {
                if (this.needs_update) {
                    this.doUpdate();
                    this.needs_update = false;
                }
            }).catch(e => console.error(e));
        }
        catch (e) {
            console.error(e);
        }
    }
    onRemovedChild(childNode) {
        if (!(childNode instanceof NativeViewElementNode && childNode.nativeView instanceof TabViewItem))
            return super.onRemovedChild(childNode);
        console.error("Removing a TabViewItem is not supported atm see:  https://github.com/NativeScript/nativescript-angular/issues/621");
    }
    static register() {
        registerNativeViewElement("TabViewItem", () => TabViewItem);
        registerElement("TabView", () => new TabViewElement());
    }
}

class ActionBarElement extends NativeViewElementNode {
    constructor() {
        super("ActionBar", ActionBar);
    }
    onInsertedChild(childNode, index) {
        //ActionItems isn't an array or ObservableArray, it is a special ActionItems type, so we handle it here
        if (childNode instanceof NativeElementNode) {
            let propName = childNode.propAttribute;
            if (propName) {
                if (propName.toLowerCase() == "actionitems") {
                    this.nativeView.actionItems.addItem(childNode.nativeElement);
                    return; //skip rest of the processing.
                }
            }
        }
        super.onInsertedChild(childNode, index);
    }
    onRemovedChild(childNode) {
        if (childNode instanceof NativeElementNode) {
            let propName = childNode.propAttribute;
            if (propName) {
                if (propName.toLowerCase() == "actionitems") {
                    this.nativeView.actionItems.removeItem(childNode.nativeElement);
                    return; //skip rest of the processing.
                }
            }
        }
        super.onRemovedChild(childNode);
    }
    static register() {
        registerElement("ActionBar", () => new ActionBarElement());
        registerNativeViewElement("NavigationButton", () => NavigationButton, "navigationButton");
        registerNativeViewElement("ActionItem", () => ActionItem, "actionItems");
    }
}

class LabelElement extends NativeViewElementNode {
    constructor() {
        super("Label", Label);
    }
    static register() {
        registerElement("Label", () => new LabelElement());
    }
}

class DatePickerElement extends NativeViewElementNode {
    constructor() {
        super("DatePicker", DatePicker);
    }
    static register() {
        registerElement("DatePicker", () => new DatePickerElement());
    }
}

class AbsoluteLayoutElement extends NativeViewElementNode {
    constructor() {
        super("AbsoluteLayout", AbsoluteLayout);
    }
    static register() {
        registerElement("AbsoluteLayout", () => new AbsoluteLayoutElement());
    }
}

class ActivityIndicatorElement extends NativeViewElementNode {
    constructor() {
        super("ActivityIndicator", ActivityIndicator);
    }
    static register() {
        registerElement("ActivityIndicator", () => new ActivityIndicatorElement());
    }
}

class ButtonElement extends NativeViewElementNode {
    constructor() {
        super("Button", Button);
    }
    static register() {
        registerElement("Button", () => new ButtonElement());
    }
}

class DockLayoutElement extends NativeViewElementNode {
    constructor() {
        super("DockLayout", DockLayout);
    }
    static register() {
        registerElement("DockLayout", () => new DockLayoutElement());
    }
}

class GridLayoutElement extends NativeViewElementNode {
    constructor() {
        super("GridLayout", GridLayout);
    }
    static register() {
        registerElement("GridLayout", () => new GridLayoutElement());
    }
}

class HtmlViewElement extends NativeViewElementNode {
    constructor() {
        super("HtmlView", HtmlView);
    }
    static register() {
        registerElement("HtmlView", () => new HtmlViewElement());
    }
}

class ImageElement extends NativeViewElementNode {
    constructor() {
        super("Image", Image);
    }
    static register() {
        registerElement("Image", () => new ImageElement());
    }
}

class ListPickerElement extends NativeViewElementNode {
    constructor() {
        super("ListPicker", ListPicker);
    }
    static register() {
        registerElement("ListPicker", () => new ListPickerElement());
    }
}

class ContentViewElement extends NativeViewElementNode {
    constructor() {
        super("ContentView", ContentView);
    }
    static register() {
        registerElement("ContentView", () => new ContentViewElement());
    }
}

class FlexboxLayoutElement extends NativeViewElementNode {
    constructor() {
        super("FlexboxLayout", FlexboxLayout);
    }
    static register() {
        registerElement("FlexboxLayout", () => new FlexboxLayoutElement());
    }
}

class FormattedStringElement extends NativeViewElementNode {
    constructor() {
        super("FormattedString", FormattedString, "formattedText", {
            spans: NativeElementPropType.ObservableArray,
        });
    }
    static register() {
        registerElement("FormattedString", () => new FormattedStringElement());
        registerNativeViewElement("Span", () => Span, "spans");
    }
}

class PlaceholderElement extends NativeViewElementNode {
    constructor() {
        super("Placeholder", Placeholder);
    }
    static register() {
        registerElement("Placeholder", () => new PlaceholderElement());
    }
}

class ProgressElement extends NativeViewElementNode {
    constructor() {
        super("Progress", Progress);
    }
    static register() {
        registerElement("Progress", () => new ProgressElement());
    }
}

class ProxyViewContainerElement extends NativeViewElementNode {
    constructor() {
        super("ProxyViewContainer", ProxyViewContainer);
    }
    static register() {
        registerElement("ProxyViewContainer", () => new ProxyViewContainerElement());
    }
}

class RootLayoutElement extends NativeViewElementNode {
    constructor() {
        super("RootLayout", RootLayout);
    }
    static register() {
        registerElement("RootLayout", () => new RootLayoutElement());
    }
}

class ScrollViewElement extends NativeViewElementNode {
    constructor() {
        super("ScrollView", ScrollView);
    }
    static register() {
        registerElement("ScrollView", () => new ScrollViewElement());
    }
}

class SearchBarElement extends NativeViewElementNode {
    constructor() {
        super("SearchBar", SearchBar);
    }
    static register() {
        registerElement("SearchBar", () => new SearchBarElement());
    }
}

class SegmentedBarElement extends NativeViewElementNode {
    constructor() {
        super("SegmentedBar", SegmentedBar, null, {
            items: NativeElementPropType.Array,
        });
    }
    static register() {
        registerElement("SegmentedBar", () => new SegmentedBarElement());
        registerNativeViewElement("SegmentedBarItem", () => SegmentedBarItem, "items");
    }
}

class SliderElement extends NativeViewElementNode {
    constructor() {
        super("Slider", Slider);
    }
    static register() {
        registerElement("Slider", () => new SliderElement());
    }
}

class StackLayoutElement extends NativeViewElementNode {
    constructor() {
        super("StackLayout", StackLayout);
    }
    static register() {
        registerElement("StackLayout", () => new StackLayoutElement());
    }
}

class SwitchElement extends NativeViewElementNode {
    constructor() {
        super("Switch", Switch);
    }
    static register() {
        registerElement("Switch", () => new SwitchElement());
    }
}

class TextFieldElement extends NativeViewElementNode {
    constructor() {
        super("TextField", TextField);
    }
    static register() {
        registerElement("TextField", () => new TextFieldElement());
    }
}

class TextViewElement extends NativeViewElementNode {
    constructor() {
        super("TextView", TextView);
    }
    static register() {
        registerElement("TextView", () => new TextViewElement());
    }
}

class TimePickerElement extends NativeViewElementNode {
    constructor() {
        super("TimePicker", TimePicker);
    }
    static register() {
        registerElement("TimePicker", () => new TimePickerElement());
    }
}

class WebViewElement extends NativeViewElementNode {
    constructor() {
        super("WebView", WebView);
    }
    static register() {
        registerElement("WebView", () => new WebViewElement());
    }
}

class WrapLayoutElement extends NativeViewElementNode {
    constructor() {
        super("WrapLayout", WrapLayout);
    }
    static register() {
        registerElement("WrapLayout", () => new WrapLayoutElement());
    }
}

function registerNativeElements() {
    AbsoluteLayoutElement.register();
    ActionBarElement.register();
    ActivityIndicatorElement.register();
    ButtonElement.register();
    ContentViewElement.register();
    DatePickerElement.register();
    DockLayoutElement.register();
    FlexboxLayoutElement.register();
    FormattedStringElement.register();
    FrameElement.register();
    GridLayoutElement.register();
    HtmlViewElement.register();
    ImageElement.register();
    LabelElement.register();
    ListPickerElement.register();
    ListViewElement.register();
    PageElement.register();
    PlaceholderElement.register();
    ProgressElement.register();
    ProxyViewContainerElement.register();
    RootLayoutElement.register();
    ScrollViewElement.register();
    SearchBarElement.register();
    SegmentedBarElement.register();
    SliderElement.register();
    StackLayoutElement.register();
    SwitchElement.register();
    TabViewElement.register();
    TextFieldElement.register();
    TextViewElement.register();
    TimePickerElement.register();
    WebViewElement.register();
    WrapLayoutElement.register();
}

class SvelteNativeDocument extends DocumentNode {
    constructor() {
        super();
        this.head = this.createElement('head');
        this.appendChild(this.head);
        logger.debug(() => `created ${this}`);
    }
    createTextNode(text) {
        const el = new TextNode(text);
        logger.debug(() => `created ${el}`);
        return el;
    }
    createElementNS(namespace, tagName) {
        return this.createElement(tagName);
    }
    createEvent(type) {
        let e = {};
        e.initCustomEvent = (type, ignored1, ignored2, detail) => {
            e.type = type;
            e.detail = detail;
            e.eventName = type;
        };
        return e;
    }
}

function resolveFrame(frameSpec) {
    let targetFrame;
    if (!frameSpec)
        targetFrame = Frame.topmost();
    if (frameSpec instanceof FrameElement)
        targetFrame = frameSpec.nativeView;
    if (frameSpec instanceof Frame)
        targetFrame = frameSpec;
    if (typeof frameSpec == "string") {
        targetFrame = Frame.getFrameById(frameSpec);
        if (!targetFrame)
            logger.error(() => `Navigate could not find frame with id ${frameSpec}`);
    }
    return targetFrame;
}
function resolveTarget(viewSpec) {
    if (viewSpec instanceof View) {
        return viewSpec;
    }
    return viewSpec?.nativeView;
}
function resolveComponentElement(viewSpec, props) {
    const dummy = createElement('fragment', window.document);
    const viewInstance = mount(viewSpec, { target: dummy, props });
    const element = dummy.firstElement();
    return { element, viewInstance };
}
// export function resolveComponentElement<T>(pageSpec: PageSpec<T>, props?: T): ComponentInstanceInfo<T> {
//     let dummy = createElement('fragment', window.document as unknown as DocumentNode);
//     let pageInstance = new pageSpec({ target: dummy, props });
//     let element = dummy.firstElement() as NativeViewElementNode<View>;
//     return { element, pageInstance }
// }
function navigate(options) {
    let { frame, page, props, ...navOptions } = options;
    let targetFrame = resolveFrame(frame);
    if (!targetFrame) {
        throw new Error("navigate requires frame option to be a native Frame, a FrameElement, a frame Id, or null");
    }
    if (!page) {
        throw new Error("navigate requires page to be set to the svelte component class that implements the page or reference to a page element");
    }
    let { element, viewInstance } = resolveComponentElement(page, props);
    if (!(element instanceof PageElement))
        throw new Error("navigate requires a svelte component with a page element at the root");
    let nativePage = element.nativeView;
    const handler = (args) => {
        if (args.isBackNavigation) {
            // we need to delay because it could create a crash in N as $destroy() 
            // will remove all set `navigatedFrom` while we are enumerating to actually send them
            setTimeout(() => {
                nativePage.off('navigatedFrom', handler);
                unmount(viewInstance);
            }, 0);
        }
    };
    // This is used by svelte-hmr to register navigate-from handler to new native view upon hot module reload
    nativePage.__navigateFromHandler = handler;
    nativePage.on('navigatedFrom', handler);
    targetFrame.navigate({
        ...navOptions,
        create: () => nativePage
    });
    return viewInstance;
}
function goBack(options = {}) {
    let targetFrame = resolveFrame(options.frame);
    if (!targetFrame) {
        throw new Error("goback requires frame option to be a native Frame, a FrameElement, a frame Id, or null");
    }
    let backStackEntry = options.backStackEntry;
    if (!backStackEntry) {
        if (options.to) {
            backStackEntry = targetFrame.backStack.find(e => e.resolvedPage === options.to.nativeView);
            if (!backStackEntry) {
                throw new Error("Couldn't find the destination page in the frames backstack");
            }
            delete options.to;
            Object.assign(backStackEntry, options);
        }
        else {
            backStackEntry = targetFrame.backStack[targetFrame.backStack.length - 1];
            if (backStackEntry) {
                Object.assign(backStackEntry, options);
            }
        }
    }
    return targetFrame.goBack(backStackEntry);
}
function showModal(modalOptions) {
    let { page, props = {}, target, ...options } = modalOptions;
    let modalLauncher = resolveTarget(target) || Frame.topmost().currentPage || Application.getRootView();
    let componentInstanceInfo = resolveComponentElement(page, props);
    let modalView = componentInstanceInfo.element.nativeView;
    return new Promise((resolve, reject) => {
        let resolved = false;
        const closeCallback = (result) => {
            if (resolved)
                return;
            resolved = true;
            try {
                unmount(componentInstanceInfo.viewInstance);
            }
            finally {
                resolve(result);
            }
        };
        modalLauncher.showModal(modalView, { ...options, context: {}, closeCallback });
    });
}
function closeModal(result, parent) {
    (parent || _rootModalViews[_rootModalViews.length - 1])?.closeModal(result);
}
function isModalOpened() {
    return _rootModalViews.length > 0;
}

function installGlobalShims() {
    //expose our fake dom as global document for svelte components
    // In browser environment, we CANNOT overwrite window.document.
    // So we must HIJACK its methods to return our Virtual Nodes.
    
    let snDoc = new SvelteNativeDocument();
    
    if (typeof window !== 'undefined' && window.document) {
        console.log("Installing DOM Shims: Overriding document methods");
        
        // Save originals only once to prevent wrapping wrappers on reload
        if (!window.__originalCreateElement) {
            window.__originalCreateElement = window.document.createElement.bind(window.document);
            window.__originalCreateText = window.document.createTextNode.bind(window.document);
            window.__originalCreateComment = window.document.createComment.bind(window.document);
            window.__originalBodyAppend = window.document.body.appendChild.bind(window.document.body);
            window.__originalBodyInsert = window.document.body.insertBefore.bind(window.document.body);
            window.__originalHeadAppend = window.document.head.appendChild.bind(window.document.head);
            window.__originalHeadInsert = window.document.head.insertBefore.bind(window.document.head);
        }
        
        // Override factories
        try {
            // DEBUG: See what's in elementMap
            // console.log("[DOM] Registered elements:", Object.keys(elementMap).join(","));

            Object.defineProperty(window.document, 'createElement', {
                value: (tagName) => {
                    const normalized = normalizeElementName(tagName);
                    let res;
                    if (elementMap[normalized]) {
                        res = snDoc.createElement(tagName);
                    } else {
                        res = window.__originalCreateElement(tagName);
                    }
                    // console.log(`[DOM] createElement('${tagName}') ->`, res ? (res.constructor.name || res) : 'undefined');
                    return res;
                },
                writable: true, configurable: true
            });
            Object.defineProperty(window.document, 'createTextNode', {
                value: (text) => {
                    const res = snDoc.createTextNode(text);
                    return res;
                },
                writable: true, configurable: true
            });
            Object.defineProperty(window.document, 'createComment', {
                value: (text) => {
                    const res = snDoc.createComment(text);
                    return res;
                },
                writable: true, configurable: true
            });
            Object.defineProperty(window.document, 'createDocumentFragment', {
                value: () => {
                    const frag = snDoc.createElement('fragment');
                    frag.nodeType = 11;
                    return frag;
                },
                writable: true, configurable: true
            });

            // GLOBAL HIJACK: Node.prototype
            // This ensures any attempt to use native DOM methods on Virtual Nodes is handled safely.
            if (!window.__originalNodeAppend) {
                window.__originalNodeAppend = window.Node.prototype.appendChild;
                window.__originalNodeInsert = window.Node.prototype.insertBefore;

                window.Node.prototype.appendChild = function(child) {
                    if (child && child.__isSvelteNativeElement__) {
                        if (this.__isSvelteNativeElement__) return window.__originalNodeAppend.call(this, child);
                        return child; // Return child to satisfy Svelte, visual sync handled by bridge
                    }
                    return window.__originalNodeAppend.call(this, child);
                };

                window.Node.prototype.insertBefore = function(child, ref) {
                    if (child && child.__isSvelteNativeElement__) {
                        if (this.__isSvelteNativeElement__) return window.__originalNodeInsert.call(this, child, ref);
                        return child;
                    }
                    return window.__originalNodeInsert.call(this, child, ref);
                };
            }
            
        } catch(e) {
            console.error("Failed to install DOM shims", e);
        }
    }

    let globalRef = typeof global !== 'undefined' ? global : window;
    globalRef.document = snDoc; // For non-browser or if accessed via global
    globalRef.window = globalRef;

    if (globalRef.__SVELTE_USE_REQUESTANIMATIONFRAME_OVERRIDE__ !== false) {
        // we still need this as of N 9 as the android runtime does not return the same kind of values
        // for window.performance.now() and requestAnimationFrame value. So they are not comparable
        Object.defineProperty(global, 'requestAnimationFrame', {
            value: (action) => {
                setTimeout(() => action(window.performance.now()), 33); //about 30 fps
            },
            configurable: true,
            writable: true,
        });
    }
    window.getComputedStyle = (node) => {
        return node.nativeView.style;
    };
    if (!window.performance) {
        window.performance = {
            now: time,
        };
    }
    window.CustomEvent = class {
        constructor(name, detail = null) {
            this.eventName = name; //event name for nativescript
            this.type = name; // type for svelte
            this.detail = detail;
        }
    };
    window.dispatchEvent = function (event) {
        logger.info(() => `Event dispatched ${event}`);
    };
    return window.document;
}
const DomTraceCategory = "SvelteNativeDom";
function initializeLogger() {
    logger.setHandler((message, level) => {
        let traceLevel = Trace.messageType.log;
        switch (level) {
            case LogLevel.Debug:
                traceLevel = Trace.messageType.log;
                break;
            case LogLevel.Info:
                traceLevel = Trace.messageType.info;
                break;
            case LogLevel.Warn:
                traceLevel = Trace.messageType.warn;
                break;
            case LogLevel.Error:
                traceLevel = Trace.messageType.error;
                break;
        }
        if (Trace.isEnabled() || traceLevel == Trace.messageType.error) {
            Trace.write(message(), DomTraceCategory, traceLevel);
        }
    });
}
let initializedDom = false;
function initializeDom() {
    if (initializedDom) {
        return;
    }
    initializedDom = true;
    initializeLogger();
    if (typeof __UI_USE_EXTERNAL_RENDERER__ != "undefined" && __UI_USE_EXTERNAL_RENDERER__) ;
    else {
        registerNativeElements();
    }
    registerSvelteElements();
    return installGlobalShims();
}
initializeDom();

export { AbsoluteLayoutElement, ActionBarElement, ActivityIndicatorElement, ButtonElement, CommentNode, ContentViewElement, DatePickerElement, DockLayoutElement, DocumentNode, DomTraceCategory, ElementNode, FlexboxLayoutElement, FormattedStringElement, FrameElement, GridLayoutElement, HeadElement, HtmlViewElement, ImageElement, LabelElement, ListPickerElement, ListViewElement, LogLevel, NativeElementNode, NativeElementPropType, NativeViewElementNode, PageElement, PlaceholderElement, ProgressElement, PropertyNode, ProxyViewContainerElement, RootLayoutElement, ScrollViewElement, SearchBarElement, SegmentedBarElement, SliderElement, StackLayoutElement, StyleElement, SvelteKeyedTemplate, SvelteNativeDocument, SwitchElement, TabViewElement, TemplateElement, TextFieldElement, TextNode, TextViewElement, TimePickerElement, ViewNode, WebViewElement, WrapLayoutElement, closeModal, createElement, goBack, initializeDom, isModalOpened, logger, navigate, normalizeElementName, registerElement, registerNativeConfigElement, registerNativeElements, registerNativeViewElement, resolveComponentElement, resolveFrame, resolveTarget, showModal };