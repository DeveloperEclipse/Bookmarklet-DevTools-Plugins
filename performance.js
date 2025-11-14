// DevTools Performance Monitor Plugin
(function() {
    'use strict';
    
    // Check if DevToolsPlugin API is available
    if (!window.DevToolsPlugin) {
        console.error('DevToolsPlugin API not found');
        return;
    }
    
    // Create container for the performance tab
    const container = document.createElement('div');
    container.style.cssText = 'padding: 16px; overflow-y: auto; height: 100%; background: var(--devtools-bg-primary); color: var(--devtools-text-primary); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;';
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 20px;';
    header.innerHTML = '<h3 style="margin: 0 0 8px 0; color: var(--devtools-text-primary); font-size: 18px;">Performance Monitor</h3><div style="color: var(--devtools-text-secondary); font-size: 12px;">Real-time performance metrics</div>';
    container.appendChild(header);
    
    // Create metrics grid
    const metricsGrid = document.createElement('div');
    metricsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;';
    container.appendChild(metricsGrid);
    
    // Metric card creator
    function createMetricCard(title, unit = '') {
        const card = document.createElement('div');
        card.style.cssText = 'background: var(--devtools-bg-secondary); border: 1px solid var(--devtools-border); border-radius: 8px; padding: 12px;';
        
        const cardTitle = document.createElement('div');
        cardTitle.style.cssText = 'color: var(--devtools-text-secondary); font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;';
        cardTitle.textContent = title;
        
        const cardValue = document.createElement('div');
        cardValue.style.cssText = 'color: var(--devtools-text-primary); font-size: 24px; font-weight: bold; font-family: "Menlo", "Monaco", "Courier New", monospace;';
        cardValue.textContent = '0';
        
        const cardUnit = document.createElement('span');
        cardUnit.style.cssText = 'color: var(--devtools-text-tertiary); font-size: 14px; margin-left: 4px; font-weight: normal;';
        cardUnit.textContent = unit;
        
        cardValue.appendChild(cardUnit);
        card.appendChild(cardTitle);
        card.appendChild(cardValue);
        
        return { card, value: cardValue };
    }
    
    // Create metric cards
    const fpsCard = createMetricCard('FPS', 'fps');
    const memoryCard = createMetricCard('Memory', 'MB');
    const nodesCard = createMetricCard('DOM Nodes', '');
    const listenersCard = createMetricCard('Event Listeners', '');
    const jsHeapCard = createMetricCard('JS Heap', 'MB');
    const layoutsCard = createMetricCard('Layouts/sec', '');
    
    metricsGrid.appendChild(fpsCard.card);
    metricsGrid.appendChild(memoryCard.card);
    metricsGrid.appendChild(nodesCard.card);
    metricsGrid.appendChild(listenersCard.card);
    metricsGrid.appendChild(jsHeapCard.card);
    metricsGrid.appendChild(layoutsCard.card);
    
    // Create FPS chart
    const chartSection = document.createElement('div');
    chartSection.style.cssText = 'background: var(--devtools-bg-secondary); border: 1px solid var(--devtools-border); border-radius: 8px; padding: 16px; margin-bottom: 16px;';
    
    const chartTitle = document.createElement('div');
    chartTitle.style.cssText = 'color: var(--devtools-text-primary); font-size: 14px; font-weight: 600; margin-bottom: 12px;';
    chartTitle.textContent = 'FPS History (Last 60 seconds)';
    
    const chartCanvas = document.createElement('canvas');
    chartCanvas.width = 600;
    chartCanvas.height = 150;
    chartCanvas.style.cssText = 'width: 100%; height: 150px; image-rendering: -webkit-optimize-contrast;';
    
    chartSection.appendChild(chartTitle);
    chartSection.appendChild(chartCanvas);
    container.appendChild(chartSection);
    
    const ctx = chartCanvas.getContext('2d');
    const fpsHistory = new Array(60).fill(0);
    
    // Create controls
    const controlsSection = document.createElement('div');
    controlsSection.style.cssText = 'display: flex; gap: 10px; margin-bottom: 16px;';
    
    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause';
    pauseBtn.style.cssText = 'padding: 8px 16px; background: var(--devtools-bg-tertiary); color: var(--devtools-text-primary); border: 1px solid var(--devtools-border); border-radius: 4px; cursor: pointer; font-size: 12px;';
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear History';
    clearBtn.style.cssText = 'padding: 8px 16px; background: var(--devtools-bg-tertiary); color: var(--devtools-text-primary); border: 1px solid var(--devtools-border); border-radius: 4px; cursor: pointer; font-size: 12px;';
    
    const gcBtn = document.createElement('button');
    gcBtn.textContent = 'Force GC';
    gcBtn.style.cssText = 'padding: 8px 16px; background: var(--devtools-bg-tertiary); color: var(--devtools-text-primary); border: 1px solid var(--devtools-border); border-radius: 4px; cursor: pointer; font-size: 12px;';
    
    controlsSection.appendChild(pauseBtn);
    controlsSection.appendChild(clearBtn);
    controlsSection.appendChild(gcBtn);
    container.insertBefore(controlsSection, chartSection);
    
    // Performance tracking variables
    let frameCount = 0;
    let lastTime = performance.now();
    let currentFPS = 0;
    let isPaused = false;
    let animationId = null;
    let layoutCount = 0;
    let lastLayoutCheck = performance.now();
    
    // FPS calculation
    function calculateFPS() {
        frameCount++;
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        
        if (delta >= 1000) {
            currentFPS = Math.round((frameCount * 1000) / delta);
            frameCount = 0;
            lastTime = currentTime;
            
            // Update FPS history
            fpsHistory.shift();
            fpsHistory.push(currentFPS);
            
            // Calculate layouts per second
            const layoutDelta = currentTime - lastLayoutCheck;
            if (layoutDelta >= 1000) {
                const layoutsPerSec = Math.round((layoutCount * 1000) / layoutDelta);
                layoutsCard.value.firstChild.textContent = layoutsPerSec;
                layoutCount = 0;
                lastLayoutCheck = currentTime;
            }
        }
        
        return currentFPS;
    }
    
    // Get memory info
    function getMemoryInfo() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }
    
    // Count event listeners
    function countEventListeners() {
        let count = 0;
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            const listeners = getEventListeners ? getEventListeners(element) : {};
            Object.keys(listeners).forEach(event => {
                count += listeners[event].length;
            });
        });
        return count;
    }
    
    // Draw FPS chart
    function drawChart() {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--devtools-bg-primary');
        ctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--devtools-border');
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        // Horizontal lines
        for (let i = 0; i <= 4; i++) {
            const y = (chartCanvas.height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chartCanvas.width, y);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        
        // Draw FPS line
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--devtools-accent');
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const barWidth = chartCanvas.width / fpsHistory.length;
        fpsHistory.forEach((fps, index) => {
            const x = index * barWidth;
            const y = chartCanvas.height - (fps / 60) * chartCanvas.height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw current FPS text
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--devtools-text-primary');
        ctx.font = '12px monospace';
        ctx.fillText('60 FPS', 5, 15);
        ctx.fillText('30 FPS', 5, chartCanvas.height / 2 + 5);
        ctx.fillText('0 FPS', 5, chartCanvas.height - 5);
    }
    
    // Monitor DOM mutations for layout tracking
    const observer = new MutationObserver(() => {
        layoutCount++;
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });
    
    // Update loop
    function update() {
        if (!isPaused) {
            // Update FPS
            const fps = calculateFPS();
            fpsCard.value.firstChild.textContent = fps;
            
            // Update memory
            const memory = getMemoryInfo();
            memoryCard.value.firstChild.textContent = memory.used;
            jsHeapCard.value.firstChild.textContent = memory.total;
            
            // Update DOM nodes
            const nodeCount = document.querySelectorAll('*').length;
            nodesCard.value.firstChild.textContent = nodeCount.toLocaleString();
            
            // Update event listeners (expensive, do less frequently)
            if (frameCount % 30 === 0) {
                try {
                    // Simple approximation since getEventListeners is Chrome DevTools only
                    const approxListeners = document.querySelectorAll('[onclick], [onmouseover], [onmouseout], [onchange], [oninput]').length * 2;
                    listenersCard.value.firstChild.textContent = approxListeners;
                } catch (e) {
                    listenersCard.value.firstChild.textContent = 'N/A';
                }
            }
            
            // Draw chart
            drawChart();
            
            // Apply color coding to FPS
            if (fps >= 50) {
                fpsCard.value.style.color = 'var(--devtools-success)';
            } else if (fps >= 30) {
                fpsCard.value.style.color = 'var(--devtools-warning)';
            } else {
                fpsCard.value.style.color = 'var(--devtools-error)';
            }
            
            // Memory warning
            if (memory.used > memory.total * 0.9) {
                memoryCard.value.style.color = 'var(--devtools-error)';
            } else if (memory.used > memory.total * 0.7) {
                memoryCard.value.style.color = 'var(--devtools-warning)';
            } else {
                memoryCard.value.style.color = 'var(--devtools-text-primary)';
            }
        }
        
        animationId = requestAnimationFrame(update);
    }
    
    // Control handlers
    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
        pauseBtn.style.background = isPaused ? 'var(--devtools-accent)' : 'var(--devtools-bg-tertiary)';
        pauseBtn.style.color = isPaused ? 'white' : 'var(--devtools-text-primary)';
    });
    
    clearBtn.addEventListener('click', () => {
        fpsHistory.fill(0);
        frameCount = 0;
        layoutCount = 0;
        drawChart();
    });
    
    gcBtn.addEventListener('click', () => {
        if (window.gc) {
            window.gc();
            window.DevToolsPlugin.utils.addConsoleEntry('Garbage collection triggered', 'info');
        } else {
            alert('Garbage collection not available. Run Chrome with --js-flags="--expose-gc"');
        }
    });
    
    // Create the tab
    const tabId = window.DevToolsPlugin.createTab({
        name: 'Performance',
        content: container,
        onActivate: function() {
            if (!animationId) {
                update();
            }
        }
    });
    
    // Start monitoring
    update();
    
    // Store tab ID for cleanup if needed
    const pluginInfo = window.DevToolsPlugin.loadedPlugins?.get(document.currentScript?.src);
    if (pluginInfo) {
        pluginInfo.tabIds = pluginInfo.tabIds || [];
        pluginInfo.tabIds.push(tabId);
    }
    
    // Log success
    window.DevToolsPlugin.utils.addConsoleEntry('Performance Monitor plugin loaded successfully', 'info');
    
})();
