// DevTools JS Executor Plugin
(function() {
    'use strict';
    
    if (!window.DevToolsPlugin) {
        console.error('DevToolsPlugin API not found');
        return;
    }
    
    // Create main container
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; height: 100%; background: var(--devtools-bg-primary);';
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display: flex; gap: 8px; padding: 12px; background: var(--devtools-bg-secondary); border-bottom: 1px solid var(--devtools-border);';
    
    // Run button
    const runBtn = document.createElement('button');
    runBtn.textContent = 'Run';
    runBtn.style.cssText = 'padding: 6px 16px; background: var(--devtools-success); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;';
    
    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.style.cssText = 'padding: 6px 16px; background: var(--devtools-bg-tertiary); color: var(--devtools-text-primary); border: 1px solid var(--devtools-border); border-radius: 4px; cursor: pointer; font-size: 12px;';
    
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = 'padding: 6px 16px; background: var(--devtools-bg-tertiary); color: var(--devtools-text-primary); border: 1px solid var(--devtools-border); border-radius: 4px; cursor: pointer; font-size: 12px;';
    
    toolbar.appendChild(runBtn);
    toolbar.appendChild(clearBtn);
    toolbar.appendChild(copyBtn);
    
    // Create editor container
    const editorContainer = document.createElement('div');
    editorContainer.style.cssText = 'flex: 1; display: flex; overflow: hidden;';
    
    // Create code editor
    const editorWrapper = document.createElement('div');
    editorWrapper.style.cssText = 'flex: 1; display: flex; position: relative; overflow: auto; background: var(--devtools-bg-secondary);';
    
    const lineNumbers = document.createElement('div');
    lineNumbers.style.cssText = 'padding: 12px 8px; background: var(--devtools-bg-tertiary); color: var(--devtools-text-tertiary); font-family: "Menlo", "Monaco", "Courier New", monospace; font-size: 12px; line-height: 18px; user-select: none; text-align: right; min-width: 30px; border-right: 1px solid var(--devtools-border);';
    
    const codeDisplay = document.createElement('pre');
    codeDisplay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; padding: 12px; padding-left: 62px; margin: 0; background: transparent; color: var(--devtools-text-primary); font-family: "Menlo", "Monaco", "Courier New", monospace; font-size: 12px; line-height: 18px; pointer-events: none;';
    
    const codeInput = document.createElement('textarea');
    codeInput.style.cssText = 'flex: 1; padding: 12px; padding-left: 62px; background: transparent; color: transparent; caret-color: var(--devtools-text-primary); border: none; outline: none; font-family: "Menlo", "Monaco", "Courier New", monospace; font-size: 12px; line-height: 18px; resize: none; white-space: pre; tab-size: 4; position: relative; z-index: 1;';
    codeInput.spellcheck = false;
    
    editorWrapper.appendChild(lineNumbers);
    editorWrapper.appendChild(codeDisplay);
    editorWrapper.appendChild(codeInput);
    
    // Create output panel
    const outputPanel = document.createElement('div');
    outputPanel.style.cssText = 'width: 40%; display: flex; flex-direction: column; background: var(--devtools-bg-primary); border-left: 1px solid var(--devtools-border);';
    
    const outputHeader = document.createElement('div');
    outputHeader.style.cssText = 'padding: 8px 12px; background: var(--devtools-bg-secondary); border-bottom: 1px solid var(--devtools-border); font-size: 11px; font-weight: 600; color: var(--devtools-text-secondary); text-transform: uppercase;';
    outputHeader.textContent = 'Output';
    
    const outputContent = document.createElement('div');
    outputContent.style.cssText = 'flex: 1; padding: 12px; overflow: auto; font-family: "Menlo", "Monaco", "Courier New", monospace; font-size: 11px; line-height: 16px;';
    
    outputPanel.appendChild(outputHeader);
    outputPanel.appendChild(outputContent);
    
    editorContainer.appendChild(editorWrapper);
    editorContainer.appendChild(outputPanel);
    
    container.appendChild(toolbar);
    container.appendChild(editorContainer);
    
    // Update line numbers
    function updateLineNumbers() {
        const lines = codeInput.value.split('\n').length;
        lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('<br>');
    }
    
    // Update syntax highlighting
    function updateHighlighting() {
        if (typeof hljs !== 'undefined') {
            const result = hljs.highlight(codeInput.value, { language: 'javascript' });
            codeDisplay.innerHTML = result.value;
        } else {
            codeDisplay.textContent = codeInput.value;
        }
        updateLineNumbers();
    }
    
    // Execute code
    function executeCode() {
        const code = codeInput.value;
        outputContent.innerHTML = '';
        
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        
        const addOutput = (msg, type) => {
            const entry = document.createElement('div');
            entry.style.cssText = `margin: 2px 0; padding: 4px; border-left: 3px solid var(--devtools-${type}); background: var(--devtools-bg-secondary);`;
            
            const formatted = typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg);
            entry.innerHTML = `<span style="color: var(--devtools-${type});">${formatted.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
            outputContent.appendChild(entry);
        };
        
        console.log = (...args) => {
            addOutput(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'info');
            originalLog(...args);
        };
        console.error = (...args) => {
            addOutput(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'error');
            originalError(...args);
        };
        console.warn = (...args) => {
            addOutput(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'warning');
            originalWarn(...args);
        };
        console.info = (...args) => {
            addOutput(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'success');
            originalInfo(...args);
        };
        
        try {
            const startTime = performance.now();
            const result = eval(code);
            const endTime = performance.now();
            
            if (result !== undefined) {
                addOutput('Return: ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : result), 'accent');
            }
            
            addOutput('Execution time: ' + (endTime - startTime).toFixed(2) + 'ms', 'text-tertiary');
            
        } catch (error) {
            addOutput('Error: ' + error.message, 'error');
        } finally {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
        }
    }
    
    // Event listeners
    codeInput.addEventListener('input', updateHighlighting);
    codeInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeInput.scrollTop;
        codeDisplay.scrollTop = codeInput.scrollTop;
    });
    
    codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
            codeInput.selectionStart = codeInput.selectionEnd = start + 4;
            updateHighlighting();
        }
        if (e.ctrlKey && e.key === 'Enter') {
            executeCode();
        }
    });
    
    runBtn.addEventListener('click', executeCode);
    
    clearBtn.addEventListener('click', () => {
        codeInput.value = '';
        outputContent.innerHTML = '';
        updateHighlighting();
    });
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeInput.value).then(() => {
            copyBtn.style.background = 'var(--devtools-success)';
            copyBtn.style.color = 'white';
            setTimeout(() => {
                copyBtn.style.background = 'var(--devtools-bg-tertiary)';
                copyBtn.style.color = 'var(--devtools-text-primary)';
            }, 1000);
        });
    });
    
    // Initialize
    updateHighlighting();
    
    // Create tab
    window.DevToolsPlugin.createTab({
        name: 'JS Executor',
        content: container
    });
    
    window.DevToolsPlugin.utils.addConsoleEntry('JS Executor plugin loaded', 'info');
})();
