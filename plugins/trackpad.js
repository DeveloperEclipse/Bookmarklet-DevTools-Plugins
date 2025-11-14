(function() {
    'use strict';
    
    if (!window.DevToolsPlugin) {
        console.error('DevToolsPlugin API not found');
        return;
    }
    
    const circle = document.createElement('img');
    circle.src = 'https://static.vecteezy.com/system/resources/previews/017/178/335/non_2x/mouse-cursor-symbol-on-transparent-background-free-png.png';
    circle.style.cssText = `
        position: fixed;
        width: 24px;
        height: 24px;
        pointer-events: none;
        z-index: 999999;
        transition: all 0.05s ease-out;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes clickPulse {
            0% { transform: scale(1); }
            50% { transform: scale(0.85); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(circle);
    
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; height: 100%; background: var(--devtools-bg-primary); color: var(--devtools-text-primary); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;';
    
    const trackpadContainer = document.createElement('div');
    trackpadContainer.style.cssText = 'flex: 1; display: flex; flex-direction: column; padding: 16px; gap: 0;';
    
    const trackpad = document.createElement('div');
    trackpad.style.cssText = `
        flex: 1;
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        border: 2px solid #444;
        border-bottom: 1px solid #333;
        border-radius: 12px 12px 0 0;
        cursor: move;
        position: relative;
        overflow: hidden;
        touch-action: none;
        user-select: none;
        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    
    const textureOverlay = document.createElement('div');
    textureOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.01) 2px,
            rgba(255, 255, 255, 0.01) 4px
        );
        pointer-events: none;
    `;
    trackpad.appendChild(textureOverlay);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        height: 50px;
        gap: 1px;
        border-radius: 0 0 12px 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
    
    const leftClickBtn = document.createElement('div');
    leftClickBtn.style.cssText = `
        flex: 1;
        background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
        border: 2px solid #444;
        border-top: 1px solid #333;
        border-right: 1px solid #333;
        border-radius: 0 0 0 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #888;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.1s ease;
        user-select: none;
        text-transform: uppercase;
        letter-spacing: 1px;
    `;
    leftClickBtn.textContent = 'Left';
    
    const rightClickBtn = document.createElement('div');
    rightClickBtn.style.cssText = `
        flex: 1;
        background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
        border: 2px solid #444;
        border-top: 1px solid #333;
        border-left: 1px solid #333;
        border-radius: 0 0 12px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #888;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.1s ease;
        user-select: none;
        text-transform: uppercase;
        letter-spacing: 1px;
    `;
    rightClickBtn.textContent = 'Right';
    
    buttonContainer.appendChild(leftClickBtn);
    buttonContainer.appendChild(rightClickBtn);
    
    trackpadContainer.appendChild(trackpad);
    trackpadContainer.appendChild(buttonContainer);
    container.appendChild(trackpadContainer);
    
    let circleX = window.innerWidth / 2;
    let circleY = window.innerHeight * 0.4;
    let currentHoveredElement = null;
    let isLeftButtonHeld = false;
    let isRightButtonHeld = false;
    let dragStartElement = null;
    let dragStarted = false;
    let dragStartX = 0;
    let dragStartY = 0;
    
    let leftButtonTouchId = null;
    let rightButtonTouchId = null;
    let trackpadTouchId = null;
    
    function updateCirclePosition() {
        circleX = Math.max(0, Math.min(window.innerWidth - 24, circleX));
        circleY = Math.max(0, Math.min(window.innerHeight - 24, circleY));
        
        circle.style.left = circleX + 'px';
        circle.style.top = circleY + 'px';
        
        updateHoverState();
    }
    
    function updateHoverState() {
        const targetElement = document.elementFromPoint(circleX + 5, circleY + 5);
        
        if (isLeftButtonHeld || isRightButtonHeld) {
            const dragThreshold = 5;
            const distanceMoved = Math.sqrt(
                Math.pow(circleX - dragStartX, 2) + 
                Math.pow(circleY - dragStartY, 2)
            );
            
            if (!dragStarted && distanceMoved > dragThreshold && dragStartElement) {
                dragStarted = true;
                
                const dragStartEvent = new DragEvent('dragstart', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5,
                    button: isLeftButtonHeld ? 0 : 2
                });
                dragStartElement.dispatchEvent(dragStartEvent);
            }
            
            if (dragStarted && dragStartElement) {
                const dragEvent = new DragEvent('drag', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5,
                    button: isLeftButtonHeld ? 0 : 2
                });
                dragStartElement.dispatchEvent(dragEvent);
            }
            
            const moveEvent = new MouseEvent('mousemove', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5,
                buttons: isLeftButtonHeld ? 1 : 2,
                button: isLeftButtonHeld ? 0 : 2
            });
            
            if (dragStartElement) {
                dragStartElement.dispatchEvent(moveEvent);
            }
            
            if (targetElement && targetElement !== dragStartElement) {
                targetElement.dispatchEvent(moveEvent);
                
                if (dragStarted) {
                    const dragOverEvent = new DragEvent('dragover', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: circleX + 5,
                        clientY: circleY + 5
                    });
                    targetElement.dispatchEvent(dragOverEvent);
                }
            }
            
            document.dispatchEvent(moveEvent);
            
            currentHoveredElement = targetElement;
            return;
        }
        
        if (targetElement !== currentHoveredElement) {
            if (currentHoveredElement) {
                const mouseLeaveEvent = new MouseEvent('mouseleave', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5
                });
                const mouseOutEvent = new MouseEvent('mouseout', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5
                });
                currentHoveredElement.dispatchEvent(mouseLeaveEvent);
                currentHoveredElement.dispatchEvent(mouseOutEvent);
            }
            
            if (targetElement) {
                const mouseEnterEvent = new MouseEvent('mouseenter', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5
                });
                const mouseOverEvent = new MouseEvent('mouseover', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5
                });
                targetElement.dispatchEvent(mouseEnterEvent);
                targetElement.dispatchEvent(mouseOverEvent);
            }
            
            currentHoveredElement = targetElement;
        } else if (currentHoveredElement) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5
            });
            currentHoveredElement.dispatchEvent(mouseMoveEvent);
        }
    }
    
    updateCirclePosition();
    
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = (e.clientX - lastX) * 2;
        const deltaY = (e.clientY - lastY) * 2;
        
        circleX += deltaX;
        circleY += deltaY;
        
        updateCirclePosition();
        
        lastX = e.clientX;
        lastY = e.clientY;
    };
    
    const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        trackpad.style.cursor = 'move';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    
    trackpad.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        trackpad.style.cursor = 'grabbing';
        e.preventDefault();
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
    
    trackpad.addEventListener('wheel', (e) => {
        e.preventDefault();
        window.scrollBy(e.deltaX, e.deltaY);
    }, { passive: false });
    
    const handleTouchMove = (e) => {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch.identifier === trackpadTouchId) {
                const deltaX = (touch.clientX - lastX) * 2;
                const deltaY = (touch.clientY - lastY) * 2;
                
                circleX += deltaX;
                circleY += deltaY;
                
                updateCirclePosition();
                
                lastX = touch.clientX;
                lastY = touch.clientY;
                e.preventDefault();
                break;
            }
        }
    };
    
    const handleTouchEnd = (e) => {
        let trackpadTouchEnded = true;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === trackpadTouchId) {
                trackpadTouchEnded = false;
                break;
            }
        }
        
        if (trackpadTouchEnded) {
            trackpadTouchId = null;
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        }
    };
    
    trackpad.addEventListener('touchstart', (e) => {
        if (trackpadTouchId === null && e.touches.length > 0) {
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                if (touch.identifier !== leftButtonTouchId && touch.identifier !== rightButtonTouchId) {
                    trackpadTouchId = touch.identifier;
                    lastX = touch.clientX;
                    lastY = touch.clientY;
                    e.preventDefault();
                    
                    document.addEventListener('touchmove', handleTouchMove, { passive: false });
                    document.addEventListener('touchend', handleTouchEnd);
                    break;
                }
            }
        }
    });
    
    function clickAtCircle(isRightClick = false) {
        const targetElement = document.elementFromPoint(circleX + 5, circleY + 5);
        
        if (!targetElement) return;
        
        circle.style.animation = 'clickPulse 0.2s ease';
        setTimeout(() => {
            circle.style.animation = '';
        }, 200);
        
        const eventOptions = {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: circleX + 5,
            clientY: circleY + 5,
            button: isRightClick ? 2 : 0
        };
        
        const mousedownEvent = new MouseEvent('mousedown', eventOptions);
        const mouseupEvent = new MouseEvent('mouseup', eventOptions);
        const clickEvent = new MouseEvent(isRightClick ? 'contextmenu' : 'click', eventOptions);
        
        targetElement.dispatchEvent(mousedownEvent);
        targetElement.dispatchEvent(mouseupEvent);
        targetElement.dispatchEvent(clickEvent);
    }
    
    function addButtonHoverEffect(button) {
        button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)';
            button.style.color = '#aaa';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)';
            button.style.color = '#888';
        });
        
        button.addEventListener('mousedown', () => {
            button.style.background = 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)';
            button.style.transform = 'translateY(1px)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.background = 'linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)';
            button.style.transform = 'translateY(0)';
        });
    }
    
    addButtonHoverEffect(leftClickBtn);
    addButtonHoverEffect(rightClickBtn);
    
    leftClickBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        leftButtonTouchId = e.touches[0].identifier;
        
        const targetElement = document.elementFromPoint(circleX + 5, circleY + 5);
        if (targetElement) {
            isLeftButtonHeld = true;
            dragStartElement = targetElement;
            dragStarted = false;
            dragStartX = circleX;
            dragStartY = circleY;
            
            const mousedownEvent = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5,
                button: 0,
                buttons: 1
            });
            targetElement.dispatchEvent(mousedownEvent);
        }
    });
    
    leftClickBtn.addEventListener('touchend', (e) => {
        let ourTouchEnded = true;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === leftButtonTouchId) {
                ourTouchEnded = false;
                break;
            }
        }
        
        if (ourTouchEnded && isLeftButtonHeld) {
            e.preventDefault();
            leftButtonTouchId = null;
            
            if (dragStarted && dragStartElement) {
                const dragEndEvent = new DragEvent('dragend', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5,
                    button: 0
                });
                dragStartElement.dispatchEvent(dragEndEvent);
                
                const targetElement = document.elementFromPoint(circleX + 5, circleY + 5);
                if (targetElement) {
                    const dropEvent = new DragEvent('drop', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: circleX + 5,
                        clientY: circleY + 5
                    });
                    targetElement.dispatchEvent(dropEvent);
                }
            }
            
            const mouseupEvent = new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5,
                button: 0,
                buttons: 0
            });
            
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5,
                button: 0,
                buttons: 0
            });
            
            if (dragStartElement) {
                dragStartElement.dispatchEvent(mouseupEvent);
                if (!dragStarted) {
                    dragStartElement.dispatchEvent(clickEvent);
                }
            }
            
            isLeftButtonHeld = false;
            dragStartElement = null;
            dragStarted = false;
        }
    });
    
    leftClickBtn.addEventListener('click', (e) => {
        if (e.pointerType !== 'touch' && leftButtonTouchId === null) {
            clickAtCircle(false);
        }
    });
    
    rightClickBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        rightButtonTouchId = e.touches[0].identifier;
        
        const targetElement = document.elementFromPoint(circleX + 5, circleY + 5);
        if (targetElement) {
            isRightButtonHeld = true;
            dragStartElement = targetElement;
            dragStarted = false;
            dragStartX = circleX;
            dragStartY = circleY;
            
            const mousedownEvent = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5,
                button: 2,
                buttons: 2
            });
            targetElement.dispatchEvent(mousedownEvent);
        }
    });
    
    rightClickBtn.addEventListener('touchend', (e) => {
        let ourTouchEnded = true;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === rightButtonTouchId) {
                ourTouchEnded = false;
                break;
            }
        }
        
        if (ourTouchEnded && isRightButtonHeld) {
            e.preventDefault();
            rightButtonTouchId = null;
            
            if (dragStarted && dragStartElement) {
                const dragEndEvent = new DragEvent('dragend', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5,
                    button: 2
                });
                dragStartElement.dispatchEvent(dragEndEvent);
            }
            
            const mouseupEvent = new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5,
                button: 2,
                buttons: 0
            });
            
            const contextmenuEvent = new MouseEvent('contextmenu', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5,
                button: 2,
                buttons: 0
            });
            
            if (dragStartElement) {
                dragStartElement.dispatchEvent(mouseupEvent);
                if (!dragStarted) {
                    dragStartElement.dispatchEvent(contextmenuEvent);
                }
            }
            
            isRightButtonHeld = false;
            dragStartElement = null;
            dragStarted = false;
        }
    });
    
    rightClickBtn.addEventListener('click', (e) => {
        if (e.pointerType !== 'touch' && rightButtonTouchId === null) {
            clickAtCircle(true);
        }
    });
    
    const tabId = window.DevToolsPlugin.createTab({
        name: 'Trackpad',
        content: container
    });
    
    window.addEventListener('resize', () => {
        updateCirclePosition();
    });
    
    const pluginInfo = window.DevToolsPlugin.loadedPlugins?.get(document.currentScript?.src);
    if (pluginInfo) {
        pluginInfo.tabIds = pluginInfo.tabIds || [];
        pluginInfo.tabIds.push(tabId);
    }
    
    window.addEventListener('unload', () => {
        if (currentHoveredElement) {
            const mouseLeaveEvent = new MouseEvent('mouseleave', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            currentHoveredElement.dispatchEvent(mouseLeaveEvent);
        }
        
        if ((isLeftButtonHeld || isRightButtonHeld) && dragStartElement) {
            if (dragStarted) {
                const dragEndEvent = new DragEvent('dragend', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: circleX + 5,
                    clientY: circleY + 5,
                    button: isLeftButtonHeld ? 0 : 2
                });
                dragStartElement.dispatchEvent(dragEndEvent);
            }
            
            const mouseupEvent = new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: circleX + 5,
                clientY: circleY + 5,
                button: isLeftButtonHeld ? 0 : 2
            });
            dragStartElement.dispatchEvent(mouseupEvent);
        }
        
        if (circle.parentNode) {
            circle.parentNode.removeChild(circle);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    });
})();
