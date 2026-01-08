// The "Fat Mock" that ensures css-tree doesn't crash
const empty = {};
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

export const ApplicationSettings = { hasKey: () => false, getString: (k, d) => d, setString: () => {}, remove: () => {} };
export const Trace = { messageType: {}, categories: {}, write: () => {} };
export const Device = { os: "Android" };
export const Screen = { mainScreen: { widthDIPs: 1024, heightDIPs: 768, scale: 1 } };
export const Utils = { openUrl: () => {} };
export const Application = { on: () => {}, run: () => {}, launchEvent: "launch", exitEvent: "exit", getRootView: () => null };
export class Observable { constructor() { this._observers = {}; } on() {} }
export class View extends Observable { constructor() { super(); this.style = {}; } }
export class LayoutBase extends View {}
export class ContentView extends View {}
export class Frame extends View { static topmost() { return new Frame(); } }
export class Page extends View {}
export class ActionBar extends View {}
export class Label extends View {}
export class Button extends View {}

export default fatObj;