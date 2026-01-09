// The "Fat Mock" that ensures css-tree doesn't crash
const empty = { 
    syntax: "@empty { }", // Needs to match the regex in preprocessAtrules
    descriptors: {} 
};

const fatObj = {
    atrules: empty,
    properties: empty,
    types: empty,
    syntaxes: empty,
    units: empty
};

export const createRequire = () => (id) => {
    return fatObj;
};

export const ApplicationSettings = {
    hasKey: (key) => false,
    getString: (key, defaultValue) => defaultValue,
    setString: (key, value) => {},
    remove: (key) => {},
    getNumber: (k, d) => d,
    setNumber: (k, v) => {},
    getBoolean: (k, d) => d,
    setBoolean: (k, v) => {}
};

export const Trace = {
    messageType: { log: 0, info: 1, warn: 2, error: 3 },
    categories: { Debug: "Debug" },
    write: () => {},
    isEnabled: () => false,
    addCategories: () => {},
    enable: () => {},
    isCategorySet: () => false
};

export const Device = {
    os: "Android",
    osVersion: "13",
    deviceType: "Phone",
    language: "en",
    region: "US"
};

export const Screen = {
    mainScreen: {
        widthDIPs: 1024,
        heightDIPs: 768,
        scale: 1
    }
};

export const Utils = {
    ad: {},
    ios: {},
    layout: {
        toDevicePixels: (v) => v,
        toDeviceIndependentPixels: (v) => v
    },
    openUrl: (url) => {}
};

export const Application = {
    on: () => {},
    off: () => {},
    run: (args) => {},
    android: {},
    ios: {},
    launchEvent: "launch",
    exitEvent: "exit",
    getRootView: () => null
};

export class Observable {
    constructor() { this._observers = {}; }
    on(event, callback) { (this._observers[event] = this._observers[event] || []).push(callback); }
    off(event, callback) { 
        if (this._observers[event]) this._observers[event] = this._observers[event].filter(c => c !== callback);
    }
    notify(data) {
        if (this._observers[data.eventName]) {
            this._observers[data.eventName].forEach(cb => cb(data));
        }
    }
}

export class View extends Observable {
    constructor() { super(); this.style = {}; this.ios = {}; this.android = {}; }
    _addChildFromBuilder() {}
    _removeView() {}
}

export class LayoutBase extends View { addChild() {} removeChild() {} insertChild() {} }
export class ContentView extends View { get content() { return this._content; } set content(v) { this._content = v; } }
export class Frame extends View { static topmost() { return new Frame(); } navigate() {} goBack() {} }
export class Page extends View {}
export class ActionBar extends View { constructor() { super(); this.actionItems = { addItem:()=>{}, removeItem:()=>{} }; } }
export class Label extends View {}
export class Button extends View {}
export class TextField extends View {}
export class TextView extends View {}
export class Switch extends View {}
export class Slider extends View {}
export class StackLayout extends LayoutBase {}
export class GridLayout extends LayoutBase {}
export class FlexboxLayout extends LayoutBase {}
export class ScrollView extends View {}
export class Image extends View {}

export default fatObj;