// Mock for @nativescript/core - Bun Web Integration
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
    os: "Web",
    osVersion: "Bun-Runtime",
    deviceType: "Browser",
    language: "en",
    region: "US"
};

export const Screen = {
    mainScreen: {
        widthDIPs: typeof window !== 'undefined' ? window.innerWidth : 1024,
        heightDIPs: typeof window !== 'undefined' ? window.innerHeight : 768,
        scale: typeof window !== 'undefined' ? window.devicePixelRatio : 1
    }
};

export const Utils = {
    ad: {},
    ios: {},
    layout: {
        toDevicePixels: (v) => v,
        toDeviceIndependentPixels: (v) => v
    },
    openUrl: (url) => typeof window !== 'undefined' && window.open(url, '_blank')
};

export const Application = {
    on: () => {},
    off: () => {},
    run: (args) => {
        console.log("[Mock] Application.run called", args);
        if (args && args.create) {
            const root = args.create();
            console.log("[Mock] Root view created:", root);
            if (typeof global !== 'undefined' && global.document) {
                global.document.appendChild(root);
                global.document.body = root;
                console.log("[Mock] Attached root to document");
            }
        }
    },
    android: {},
    ios: {}
};

export class Observable {
    on() {}
    off() {}
    notify() {}
}

export class View extends Observable {

    constructor() { super(); this.style = {}; this.ios = {}; this.android = {}; }

    on() {}

    off() {}

    notify() {}

    _addChildFromBuilder() {}

    _removeView() {}

}



// Mock all UI components used by svelte-native

export class LayoutBase extends View { addChild() {} removeChild() {} insertChild() {} }

export class ContentView extends View { get content() { return this._content; } set content(v) { this._content = v; } }

export class Frame extends View { static topmost() { return new Frame(); } navigate() {} goBack() {} }

export class Page extends View {}

export class ActionBar extends View { constructor() { super(); this.actionItems = { addItem:()=>{}, removeItem:()=>{} }; } }

export class NavigationButton extends View {}

export class ActionItem extends View {}

export class TabView extends View {}

export class TabViewItem extends View {}

export class ListView extends View {}

export class Label extends View {}

export class Button extends View {}

export class TextField extends View {}

export class TextView extends View {}

export class Switch extends View {}

export class Slider extends View {}

export class Progress extends View {}

export class ActivityIndicator extends View {}

export class Image extends View {}

export class HtmlView extends View {}

export class WebView extends View {}

export class DatePicker extends View {}

export class TimePicker extends View {}

export class ListPicker extends View {}

export class SearchBar extends View {}

export class SegmentedBar extends View {}

export class SegmentedBarItem extends View {}

export class ScrollView extends View {}

export class StackLayout extends LayoutBase {}

export class GridLayout extends LayoutBase {}

export class DockLayout extends LayoutBase {}

export class AbsoluteLayout extends LayoutBase {}

export class FlexboxLayout extends LayoutBase {}

export class WrapLayout extends LayoutBase {}

export class RootLayout extends LayoutBase {}

export class ProxyViewContainer extends LayoutBase {}

export class Placeholder extends View {}

export class FormattedString extends View {}

export class Span extends View {}



export class ObservableArray extends Array {

    constructor(args) { super(...(args || [])); }

    getItem(i) { return this[i]; }

    setItem(i, v) { this[i] = v; }

}



export class KeyframeAnimation {

    static keyframeAnimationFromInfo() { return new KeyframeAnimation(); }

    play() {}

    cancel() {}

}



export const createRequire = () => () => ({});



export default {

    Trace, Device, Screen, Utils, Application, Observable, 

    View, LayoutBase, ContentView, Frame, Page, ActionBar, NavigationButton, ActionItem,

    TabView, TabViewItem, ListView, Label, Button, TextField, TextView, Switch, Slider, 

    Progress, ActivityIndicator, Image, HtmlView, WebView, DatePicker, TimePicker, 

    ListPicker, SearchBar, SegmentedBar, SegmentedBarItem, ScrollView,

    StackLayout, GridLayout, DockLayout, AbsoluteLayout, FlexboxLayout, WrapLayout, RootLayout,

    ProxyViewContainer, Placeholder, FormattedString, Span, ObservableArray, KeyframeAnimation,

    createRequire

};
