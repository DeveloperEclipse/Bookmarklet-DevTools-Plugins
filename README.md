# DevTools Plugin Guide

## Basic Plugin
```javascript
(function() {
    if (!window.DevToolsPlugin) return;
    
    DevToolsPlugin.createTab({
        name: 'My Plugin',
        content: '<div style="padding:20px">Hello World</div>'
    });
})();
```

## Plugin API

### Creating Tabs
```javascript
// Create tab - returns tab ID
const tabId = DevToolsPlugin.createTab({
    name: 'Tab Name',           // Required: tab label
    content: element,            // Required: HTMLElement or HTML string
    onActivate: function() {}    // Optional: called when tab selected
})

// Remove tab
DevToolsPlugin.removeTab(tabId)

// Get main container
DevToolsPlugin.getContainer()
```

### Utilities
```javascript
// Add console entry
DevToolsPlugin.utils.addConsoleEntry('message', 'info')
// Types: 'log', 'info', 'warn', 'error'

// Get all network requests
const requests = DevToolsPlugin.utils.getNetworkRequests()
// Returns array with: url, method, status, headers, response, body

// Get cookies
const cookies = DevToolsPlugin.utils.getCookies()
```

## CSS Variables
```css
/* Backgrounds */
var(--devtools-bg-primary)
var(--devtools-bg-secondary)
var(--devtools-bg-tertiary)

/* Text */
var(--devtools-text-primary)
var(--devtools-text-secondary)
var(--devtools-text-tertiary)

/* Colors */
var(--devtools-accent)
var(--devtools-error)
var(--devtools-warning)
var(--devtools-success)
var(--devtools-info)
var(--devtools-purple)

/* Borders */
var(--devtools-border)
var(--devtools-border-light)
```

## Example: FPS Counter
```javascript
(function() {
    if (!window.DevToolsPlugin) return;
    
    const div = document.createElement('div');
    div.style.cssText = 'padding:20px; color:var(--devtools-text-primary)';
    
    let fps = 0, lastTime = performance.now(), frames = 0;
    
    function update() {
        frames++;
        const now = performance.now();
        if (now - lastTime > 1000) {
            fps = frames;
            frames = 0;
            lastTime = now;
            div.innerHTML = `<h2>FPS: ${fps}</h2>`;
        }
        requestAnimationFrame(update);
    }
    
    DevToolsPlugin.createTab({
        name: 'FPS',
        content: div,
        onActivate: update
    });
})();
```

## Example: Network Monitor
```javascript
(function() {
    if (!window.DevToolsPlugin) return;
    
    const div = document.createElement('div');
    div.style.cssText = 'padding:20px';
    
    function refresh() {
        const requests = DevToolsPlugin.utils.getNetworkRequests();
        const failed = requests.filter(r => r.status >= 400);
        
        div.innerHTML = `
            <h3>Network Stats</h3>
            <p>Total Requests: ${requests.length}</p>
            <p>Failed: ${failed.length}</p>
            <ul>
                ${failed.map(r => `<li>${r.method} ${r.url} - ${r.status}</li>`).join('')}
            </ul>
        `;
    }
    
    DevToolsPlugin.createTab({
        name: 'Network Stats',
        content: div,
        onActivate: refresh
    });
})();
```
