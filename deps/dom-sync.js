// Bridge: Svelte Native Virtual DOM -> Browser Real DOM
// Reactive Version: Patches virtual nodes to update browser DOM in real-time

(function() {
    console.log("DOM Sync: Reactive Bridge Mode");
    const appRoot = document.getElementById('app-root') || document.body;

    function syncNode(vNode) {
        if (!vNode) return null;
        if (vNode._browserEl) return vNode._browserEl;

        let el;
        if (vNode.nodeType === 3) {
            // Bypass override for Text Nodes too!
            if (window.__originalCreateText) {
                el = window.__originalCreateText(vNode.text || "");
            } else {
                el = document.createTextNode(vNode.text || "");
            }
            vNode._browserEl = el;
            
            // Reactive text update
            // We use a property proxy for 'text'
            let val = vNode.text;
            Object.defineProperty(vNode, 'text', {
                get() { return val; },
                set(newVal) {
                    val = newVal;
                    el.textContent = newVal;
                },
                configurable: true
            });
        } else {
            const tagName = (vNode.tagName || 'div').toLowerCase();
            
            // Bypass our own hijack! We need REAL browser elements here.
            if (window.__originalCreateElement) {
                el = window.__originalCreateElement(tagName);
            } else {
                el = document.createElement(tagName);
            }
            
            vNode._browserEl = el;

            // Sync initial state
            if (vNode.className) el.className = vNode.className;
            if (vNode.id) el.id = vNode.id;
            
            const text = vNode.text || (vNode.getAttribute ? vNode.getAttribute('text') : null);
            if (text) el.innerText = text;

            // Reactive attribute update
            const originalSetAttr = vNode.setAttribute;
            vNode.setAttribute = function(key, value) {
                if (originalSetAttr) originalSetAttr.call(this, key, value);
                if (key === 'text') el.innerText = value;
                else if (key === 'class') el.className = value;
                else el.setAttribute(key, value);
            };

            // Reactive property update (Svelte often sets .text directly)
            let textVal = vNode.text;
            Object.defineProperty(vNode, 'text', {
                get() { return textVal; },
                set(newVal) {
                    textVal = newVal;
                    el.innerText = newVal;
                },
                configurable: true
            });

            // Reactive structural update
            const originalAppend = vNode.appendChild;
            vNode.appendChild = function(child) {
                const res = originalAppend.call(this, child);
                const childEl = syncNode(child);
                if (childEl) el.appendChild(childEl);
                return res;
            };

            const originalInsert = vNode.insertBefore;
            vNode.insertBefore = function(child, reference) {
                const res = originalInsert.call(this, child, reference);
                const childEl = syncNode(child);
                const refEl = reference ? reference._browserEl : null;
                el.insertBefore(childEl, refEl);
                return res;
            };

            const originalRemove = vNode.removeChild;
            vNode.removeChild = function(child) {
                const res = originalRemove.call(this, child);
                if (child._browserEl && child._browserEl.parentNode === el) {
                    el.removeChild(child._browserEl);
                }
                return res;
            };

            // Initial children
            if (vNode.childNodes) {
                vNode.childNodes.forEach(child => {
                    const childEl = syncNode(child);
                    if (childEl) el.appendChild(childEl);
                });
            }

            // Event mapping
            el.onclick = (e) => {
                e.stopPropagation();
                if (vNode.notify) {
                    vNode.notify({ eventName: 'tap', object: vNode });
                }
            };
        }

        return el;
    }

    // Monitor global.document initialization
    const interval = setInterval(() => {
        if (!window.global || !global.document) {
            return; // Wait for SN to init
        }

        // Svelte Native implementation details vary.
        // It might use .body, or just append to document directly.
        // We look for a root that is NOT head.
        let virtualRoot = global.document.body;

        if (!virtualRoot) {
            // Fallback: Check direct children
            if (global.document.childNodes && global.document.childNodes.length > 0) {
                // Find first non-head element (likely our Frame or Page)
                virtualRoot = Array.from(global.document.childNodes).find(n => 
                    n.tagName && n.tagName.toLowerCase() !== 'head' && n.nodeType === 1
                );
                
                // If we found a Frame/Page, treat it as body
                if (virtualRoot) {
                    console.log("DOM Sync: Found virtual root via childNodes:", virtualRoot.tagName);
                    // Polyfill body for future reference
                    global.document.body = virtualRoot; 
                }
            }
        }

        if (virtualRoot) {
            clearInterval(interval);
            console.log("DOM Sync: Connected to Svelte Native Runtime. Root:", virtualRoot.tagName);
            
            // Sync Initial Tree
            const rootEl = syncNode(virtualRoot);
            if (rootEl) {
                appRoot.innerHTML = '';
                appRoot.appendChild(rootEl);
            } else {
                console.error("DOM Sync: Failed to create mirror for root");
            }
        } else {
             // Still waiting for app to mount...
             // console.log("Waiting for virtual root...");
        }
    }, 5000);

})();
