import * as i0 from '@angular/core';
import { EventEmitter, Component, Input, Output, HostBinding, NgModule } from '@angular/core';
import * as i1 from '@angular/common';
import { CommonModule } from '@angular/common';

const defaultProperties = {
    transitionDuration: 200,
    doubleTap: true,
    doubleTapScale: 2,
    limitZoom: 'original image size',
    autoZoomOut: false,
    zoomControlScale: 1,
    minPanScale: 1.0001,
    minScale: 0,
    listeners: 'mouse and touch',
    wheel: true,
    wheelZoomFactor: 0.2,
    draggableImage: false,
};
const backwardCompatibilityProperties = {
    'transition-duration': 'transitionDuration',
    transitionDurationBackwardCompatibility: 'transitionDuration',
    'double-tap': 'doubleTap',
    doubleTapBackwardCompatibility: 'doubleTap',
    'double-tap-scale': 'doubleTapScale',
    doubleTapScaleBackwardCompatibility: 'doubleTapScale',
    'auto-zoom-out': 'autoZoomOut',
    autoZoomOutBackwardCompatibility: 'autoZoomOut',
    'limit-zoom': 'limitZoom',
    limitZoomBackwardCompatibility: 'limitZoom',
};

class Touches {
    properties;
    element;
    elementPosition;
    eventType = undefined;
    handlers = {};
    startX = 0;
    startY = 0;
    lastTap = 0;
    doubleTapTimeout;
    doubleTapMinTimeout = 300;
    tapMinTimeout = 200;
    touchstartTime = 0;
    i = 0;
    isMousedown = false;
    _touchListeners = {
        touchstart: 'handleTouchstart',
        touchmove: 'handleTouchmove',
        touchend: 'handleTouchend',
    };
    _mouseListeners = {
        mousedown: 'handleMousedown',
        mousemove: 'handleMousemove',
        mouseup: 'handleMouseup',
        wheel: 'handleWheel',
    };
    _otherListeners = {
        resize: 'handleResize',
    };
    get touchListeners() {
        return this.properties.touchListeners ? this.properties.touchListeners : this._touchListeners;
    }
    get mouseListeners() {
        return this.properties.mouseListeners ? this.properties.mouseListeners : this._mouseListeners;
    }
    get otherListeners() {
        return this.properties.otherListeners ? this.properties.otherListeners : this._otherListeners;
    }
    constructor(properties) {
        this.properties = properties;
        this.element = this.properties.element;
        this.elementPosition = this.getElementPosition();
        this.toggleEventListeners('addEventListener');
    }
    destroy() {
        this.toggleEventListeners('removeEventListener');
    }
    toggleEventListeners(action) {
        let listeners;
        if (this.properties.listeners === 'mouse and touch') {
            listeners = Object.assign(this.touchListeners, this.mouseListeners);
        }
        else {
            listeners = this.detectTouchScreen() ? this.touchListeners : this.mouseListeners;
        }
        if (this.properties.resize) {
            listeners = Object.assign(listeners, this.otherListeners);
        }
        for (var listener in listeners) {
            const handler = listeners[listener];
            // Window
            if (listener === 'resize') {
                if (action === 'addEventListener') {
                    window.addEventListener(listener, this[handler], false);
                }
                if (action === 'removeEventListener') {
                    window.removeEventListener(listener, this[handler], false);
                }
                // Document
            }
            else if (listener === 'mouseup' || listener === 'mousemove') {
                if (action === 'addEventListener') {
                    document.addEventListener(listener, this[handler], false);
                }
                if (action === 'removeEventListener') {
                    document.removeEventListener(listener, this[handler], false);
                }
                // Element
            }
            else {
                if (action === 'addEventListener') {
                    this.element.addEventListener(listener, this[handler], false);
                }
                if (action === 'removeEventListener') {
                    this.element.removeEventListener(listener, this[handler], false);
                }
            }
        }
    }
    addEventListeners(listener) {
        const handler = this._mouseListeners[listener];
        window.addEventListener(listener, this[handler], false);
    }
    removeEventListeners(listener) {
        const handler = this._mouseListeners[listener];
        window.removeEventListener(listener, this[handler], false);
    }
    /*
     * Listeners
     */
    /* Touchstart */
    handleTouchstart = (event) => {
        this.elementPosition = this.getElementPosition();
        this.touchstartTime = new Date().getTime();
        if (this.eventType === undefined) {
            this.getTouchstartPosition(event);
        }
        this.runHandler('touchstart', event);
    };
    /* Touchmove */
    handleTouchmove = (event) => {
        const touches = event.touches;
        // Pan
        if (this.detectPan(touches)) {
            this.runHandler('pan', event);
        }
        // Pinch
        if (this.detectPinch(event)) {
            this.runHandler('pinch', event);
        }
    };
    handleLinearSwipe(event) {
        //event.preventDefault();
        this.i++;
        if (this.i > 3) {
            this.eventType = this.getLinearSwipeType(event);
        }
        if (this.eventType === 'horizontal-swipe') {
            this.runHandler('horizontal-swipe', event);
        }
        if (this.eventType === 'vertical-swipe') {
            this.runHandler('vertical-swipe', event);
        }
    }
    /* Touchend */
    handleTouchend = (event) => {
        const touches = event.touches;
        // Double Tap
        if (this.detectDoubleTap()) {
            this.runHandler('double-tap', event);
        }
        // Tap
        this.detectTap();
        this.runHandler('touchend', event);
        this.eventType = 'touchend';
        if (touches && touches.length === 0) {
            this.eventType = undefined;
            this.i = 0;
        }
    };
    /* Mousedown */
    handleMousedown = (event) => {
        this.isMousedown = true;
        this.elementPosition = this.getElementPosition();
        this.touchstartTime = new Date().getTime();
        if (this.eventType === undefined) {
            this.getMousedownPosition(event);
        }
        this.runHandler('mousedown', event);
    };
    /* Mousemove */
    handleMousemove = (event) => {
        //event.preventDefault();
        if (!this.isMousedown) {
            return;
        }
        // Pan
        this.runHandler('pan', event);
        // Linear swipe
        switch (this.detectLinearSwipe(event)) {
            case 'horizontal-swipe':
                event.swipeType = 'horizontal-swipe';
                this.runHandler('horizontal-swipe', event);
                break;
            case 'vertical-swipe':
                event.swipeType = 'vertical-swipe';
                this.runHandler('vertical-swipe', event);
                break;
        }
        // Linear swipe
        if (this.detectLinearSwipe(event) || this.eventType === 'horizontal-swipe' || this.eventType === 'vertical-swipe') {
            this.handleLinearSwipe(event);
        }
    };
    /* Mouseup */
    handleMouseup = (event) => {
        // Tap
        this.detectTap();
        this.isMousedown = false;
        this.runHandler('mouseup', event);
        this.eventType = undefined;
        this.i = 0;
    };
    /* Wheel */
    handleWheel = (event) => {
        this.runHandler('wheel', event);
    };
    /* Resize */
    handleResize = (event) => {
        this.runHandler('resize', event);
    };
    runHandler(eventName, response) {
        if (this.handlers[eventName]) {
            this.handlers[eventName](response);
        }
    }
    /*
     * Detection
     */
    detectPan(touches) {
        return (touches.length === 1 && !this.eventType) || this.eventType === 'pan';
    }
    detectDoubleTap() {
        if (this.eventType != undefined) {
            return;
        }
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;
        clearTimeout(this.doubleTapTimeout);
        if (tapLength < this.doubleTapMinTimeout && tapLength > 0) {
            return true;
        }
        else {
            this.doubleTapTimeout = setTimeout(() => {
                clearTimeout(this.doubleTapTimeout);
            }, this.doubleTapMinTimeout);
        }
        this.lastTap = currentTime;
        return undefined;
    }
    detectTap() {
        if (this.eventType != undefined) {
            return;
        }
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.touchstartTime;
        if (tapLength > 0) {
            if (tapLength < this.tapMinTimeout) {
                this.runHandler('tap', {});
            }
            else {
                this.runHandler('longtap', {});
            }
        }
    }
    detectPinch(event) {
        const touches = event.touches;
        return (touches.length === 2 && this.eventType === undefined) || this.eventType === 'pinch';
    }
    detectLinearSwipe(event) {
        const touches = event.touches;
        if (touches) {
            if ((touches.length === 1 && !this.eventType) || this.eventType === 'horizontal-swipe' || this.eventType === 'vertical-swipe') {
                return this.getLinearSwipeType(event);
            }
        }
        else {
            if (!this.eventType || this.eventType === 'horizontal-swipe' || this.eventType === 'vertical-swipe') {
                return this.getLinearSwipeType(event);
            }
        }
        return undefined;
    }
    getLinearSwipeType(event) {
        if (this.eventType !== 'horizontal-swipe' && this.eventType !== 'vertical-swipe') {
            const movementX = Math.abs(this.moveLeft(0, event) - this.startX);
            const movementY = Math.abs(this.moveTop(0, event) - this.startY);
            if (movementY * 3 > movementX) {
                return 'vertical-swipe';
            }
            else {
                return 'horizontal-swipe';
            }
        }
        else {
            return this.eventType;
        }
    }
    getElementPosition() {
        return this.element.getBoundingClientRect();
    }
    getTouchstartPosition(event) {
        this.startX = event.touches[0].clientX - this.elementPosition.left;
        this.startY = event.touches[0].clientY - this.elementPosition.top;
    }
    getMousedownPosition(event) {
        this.startX = event.clientX - this.elementPosition.left;
        this.startY = event.clientY - this.elementPosition.top;
    }
    moveLeft(index, event) {
        const touches = event.touches;
        if (touches) {
            return touches[index].clientX - this.elementPosition.left;
        }
        else {
            return event.clientX - this.elementPosition.left;
        }
    }
    moveTop(index, event) {
        const touches = event.touches;
        if (touches) {
            return touches[index].clientY - this.elementPosition.top;
        }
        else {
            return event.clientY - this.elementPosition.top;
        }
    }
    detectTouchScreen() {
        var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        var mq = function (query) {
            return window.matchMedia(query).matches;
        };
        if ('ontouchstart' in window) {
            return true;
        }
        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
    }
    /* Public properties and methods */
    on(event, handler) {
        if (event) {
            this.handlers[event] = handler;
        }
    }
}

class IvyPinch {
    properties = defaultProperties;
    onZoomChange;
    touches;
    element;
    elementTarget;
    parentElement;
    i = 0;
    scale = 1;
    initialScale = 1;
    elementPosition;
    eventType;
    startX = 0;
    startY = 0;
    moveX = 0;
    moveY = 0;
    initialMoveX = 0;
    initialMoveY = 0;
    moveXC = 0;
    moveYC = 0;
    lastTap = 0;
    draggingMode = false;
    distance = 0;
    doubleTapTimeout = 0;
    initialDistance = 0;
    events = {};
    maxScale;
    defaultMaxScale = 3;
    // Minimum scale at which panning works
    get minPanScale() {
        return this.getPropertiesValue('minPanScale');
    }
    get fullImage() {
        return this.properties.fullImage;
    }
    constructor(properties, onZoomChange) {
        this.element = properties.element;
        this.onZoomChange = onZoomChange;
        if (!this.element) {
            return;
        }
        this.elementTarget = this.element.querySelector('*').tagName;
        this.parentElement = this.element.parentElement;
        this.properties = Object.assign({}, defaultProperties, properties);
        this.detectLimitZoom();
        this.touches = new Touches({
            element: properties.element,
            listeners: properties.listeners,
            resize: properties.autoHeight,
            mouseListeners: {
                mousedown: 'handleMousedown',
                mouseup: 'handleMouseup',
                wheel: 'handleWheel',
            },
        });
        /* Init */
        this.setBasicStyles();
        /*
         * Listeners
         */
        this.touches.on('touchstart', this.handleTouchstart);
        this.touches.on('touchend', this.handleTouchend);
        this.touches.on('mousedown', this.handleTouchstart);
        this.touches.on('mouseup', this.handleTouchend);
        this.touches.on('pan', this.handlePan);
        this.touches.on('mousemove', this.handlePan);
        this.touches.on('pinch', this.handlePinch);
        if (this.properties.wheel) {
            this.touches.on('wheel', this.handleWheel);
        }
        if (this.properties.doubleTap) {
            this.touches.on('double-tap', this.handleDoubleTap);
        }
        if (this.properties.autoHeight) {
            this.touches.on('resize', this.handleResize);
        }
    }
    /* Touchstart */
    handleTouchstart = (event) => {
        this.touches.addEventListeners('mousemove', 'handleMousemove');
        this.getElementPosition();
        if (this.eventType === undefined) {
            this.getTouchstartPosition(event);
        }
    };
    /* Touchend */
    handleTouchend = (event) => {
        /* touchend */
        if (event.type === 'touchend') {
            this.i = 0;
            this.draggingMode = false;
            const touches = event.touches;
            // Min scale
            if (this.scale < 1) {
                this.scale = 1;
            }
            // Auto Zoom Out
            if (this.properties.autoZoomOut && this.eventType === 'pinch') {
                this.scale = 1;
            }
            // Align image
            if (this.eventType === 'pinch' || (this.eventType === 'pan' && this.scale > this.minPanScale)) {
                this.alignImage();
            }
            // Update initial values
            if (this.eventType === 'pinch' ||
                this.eventType === 'pan' ||
                this.eventType === 'horizontal-swipe' ||
                this.eventType === 'vertical-swipe') {
                this.updateInitialValues();
            }
            this.eventType = 'touchend';
            if (touches && touches.length === 0) {
                this.eventType = undefined;
            }
        }
        /* mouseup */
        if (event.type === 'mouseup') {
            this.draggingMode = false;
            this.updateInitialValues();
            this.eventType = undefined;
        }
        this.touches.removeEventListeners('mousemove', 'handleMousemove');
    };
    /*
     * Handlers
     */
    handlePan = (event) => {
        if (this.scale < this.minPanScale || this.properties.disablePan) {
            return;
        }
        event.preventDefault();
        const { clientX, clientY } = this.getClientPosition(event);
        if (!this.eventType) {
            this.startX = clientX - this.elementPosition.left;
            this.startY = clientY - this.elementPosition.top;
        }
        this.eventType = 'pan';
        this.moveX = this.initialMoveX + (this.moveLeft(event, 0) - this.startX);
        this.moveY = this.initialMoveY + (this.moveTop(event, 0) - this.startY);
        if (this.properties.limitPan) {
            this.limitPanY();
            this.limitPanX();
        }
        /* mousemove */
        if (event.type === 'mousemove' && this.scale > this.minPanScale) {
            this.centeringImage();
        }
        this.transformElement(0);
    };
    handleDoubleTap = (event) => {
        this.toggleZoom(event);
        return;
    };
    handlePinch = (event) => {
        event.preventDefault();
        if (this.eventType === undefined || this.eventType === 'pinch') {
            const touches = event.touches;
            if (!this.eventType) {
                this.initialDistance = this.getDistance(touches);
                const moveLeft0 = this.moveLeft(event, 0);
                const moveLeft1 = this.moveLeft(event, 1);
                const moveTop0 = this.moveTop(event, 0);
                const moveTop1 = this.moveTop(event, 1);
                this.moveXC = (moveLeft0 + moveLeft1) / 2 - this.initialMoveX;
                this.moveYC = (moveTop0 + moveTop1) / 2 - this.initialMoveY;
            }
            this.eventType = 'pinch';
            this.distance = this.getDistance(touches);
            this.scale = this.initialScale * (this.distance / this.initialDistance);
            this.moveX = this.initialMoveX - ((this.distance / this.initialDistance) * this.moveXC - this.moveXC);
            this.moveY = this.initialMoveY - ((this.distance / this.initialDistance) * this.moveYC - this.moveYC);
            this.handleLimitZoom();
            if (this.properties.limitPan) {
                this.limitPanY();
                this.limitPanX();
            }
            this.transformElement(0);
        }
    };
    handleWheel = (event) => {
        event.preventDefault();
        console.warn('handleWheel', event);
        let wheelZoomFactor = this.properties.wheelZoomFactor || 0;
        let zoomFactor = event.deltaY < 0 ? wheelZoomFactor : -wheelZoomFactor;
        let newScale = this.initialScale + zoomFactor;
        /* Round value */
        if (newScale < 1 + wheelZoomFactor) {
            newScale = 1;
        }
        else if (newScale < this.maxScale && newScale > this.maxScale - wheelZoomFactor) {
            newScale = this.maxScale;
        }
        if (newScale < 1 || newScale > this.maxScale) {
            return;
        }
        if (newScale === this.scale) {
            return;
        }
        this.getElementPosition();
        this.scale = newScale;
        /* Get cursor position over image */
        let xCenter = event.clientX - this.elementPosition.left - this.initialMoveX;
        let yCenter = event.clientY - this.elementPosition.top - this.initialMoveY;
        this.setZoom({
            scale: newScale,
            center: [xCenter, yCenter],
        });
    };
    handleResize = (_event) => {
        this.setAutoHeight();
    };
    handleLimitZoom() {
        const limitZoom = this.maxScale;
        const minScale = this.properties.minScale || 0;
        if (this.scale > limitZoom || this.scale <= minScale) {
            const imageWidth = this.getImageWidth();
            const imageHeight = this.getImageHeight();
            const enlargedImageWidth = imageWidth * this.scale;
            const enlargedImageHeight = imageHeight * this.scale;
            const moveXRatio = this.moveX / (enlargedImageWidth - imageWidth);
            const moveYRatio = this.moveY / (enlargedImageHeight - imageHeight);
            if (this.scale > limitZoom) {
                this.scale = limitZoom;
            }
            if (this.scale <= minScale) {
                this.scale = minScale;
            }
            const newImageWidth = imageWidth * this.scale;
            const newImageHeight = imageHeight * this.scale;
            this.moveX = -Math.abs(moveXRatio * (newImageWidth - imageWidth));
            this.moveY = -Math.abs(-moveYRatio * (newImageHeight - imageHeight));
        }
    }
    moveLeft(event, index = 0) {
        const clientX = this.getClientPosition(event, index).clientX;
        return clientX - this.elementPosition.left;
    }
    moveTop(event, index = 0) {
        const clientY = this.getClientPosition(event, index).clientY;
        return clientY - this.elementPosition.top;
    }
    /*
     * Detection
     */
    centeringImage() {
        const img = this.element.getElementsByTagName(this.elementTarget)[0];
        const initialMoveX = this.moveX;
        const initialMoveY = this.moveY;
        if (this.moveY > 0) {
            this.moveY = 0;
        }
        if (this.moveX > 0) {
            this.moveX = 0;
        }
        if (img) {
            this.limitPanY();
            this.limitPanX();
        }
        if (img && this.scale < 1) {
            if (this.moveX < this.element.offsetWidth * (1 - this.scale)) {
                this.moveX = this.element.offsetWidth * (1 - this.scale);
            }
        }
        return initialMoveX !== this.moveX || initialMoveY !== this.moveY;
    }
    limitPanY() {
        const imgHeight = this.getImageHeight();
        const scaledImgHeight = imgHeight * this.scale;
        const parentHeight = this.parentElement.offsetHeight;
        const elementHeight = this.element.offsetHeight;
        if (scaledImgHeight < parentHeight) {
            this.moveY = (parentHeight - elementHeight * this.scale) / 2;
        }
        else {
            const imgOffsetTop = ((imgHeight - elementHeight) * this.scale) / 2;
            if (this.moveY > imgOffsetTop) {
                this.moveY = imgOffsetTop;
            }
            else if (scaledImgHeight + Math.abs(imgOffsetTop) - parentHeight + this.moveY < 0) {
                this.moveY = -(scaledImgHeight + Math.abs(imgOffsetTop) - parentHeight);
            }
        }
    }
    limitPanX() {
        const imgWidth = this.getImageWidth();
        const scaledImgWidth = imgWidth * this.scale;
        const parentWidth = this.parentElement.offsetWidth;
        const elementWidth = this.element.offsetWidth;
        if (scaledImgWidth < parentWidth) {
            this.moveX = (parentWidth - elementWidth * this.scale) / 2;
        }
        else {
            const imgOffsetLeft = ((imgWidth - elementWidth) * this.scale) / 2;
            if (this.moveX > imgOffsetLeft) {
                this.moveX = imgOffsetLeft;
            }
            else if (scaledImgWidth + Math.abs(imgOffsetLeft) - parentWidth + this.moveX < 0) {
                this.moveX = -(imgWidth * this.scale + Math.abs(imgOffsetLeft) - parentWidth);
            }
        }
    }
    setBasicStyles() {
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.transformOrigin = '0 0';
        this.setImageSize();
        this.setDraggableImage();
    }
    removeBasicStyles() {
        this.element.style.display = '';
        this.element.style.alignItems = '';
        this.element.style.justifyContent = '';
        this.element.style.transformOrigin = '';
        this.removeImageSize();
        this.removeDraggableImage();
    }
    setDraggableImage() {
        const imgElement = this.getImageElement();
        if (imgElement) {
            imgElement.draggable = this.properties.draggableImage;
        }
    }
    removeDraggableImage() {
        const imgElement = this.getImageElement();
        if (imgElement) {
            imgElement.draggable = true;
        }
    }
    setImageSize() {
        const imgElement = this.element.getElementsByTagName(this.elementTarget);
        if (imgElement.length) {
            imgElement[0].style.maxWidth = '100%';
            imgElement[0].style.maxHeight = '100%';
            this.setAutoHeight();
        }
    }
    setAutoHeight() {
        const imgElement = this.element.getElementsByTagName(this.elementTarget);
        if (!this.properties.autoHeight || !imgElement.length) {
            return;
        }
        const imgNaturalWidth = imgElement[0].getAttribute('width');
        const imgNaturalHeight = imgElement[0].getAttribute('height');
        const sizeRatio = imgNaturalWidth / imgNaturalHeight;
        const parentWidth = this.parentElement.offsetWidth;
        imgElement[0].style.maxHeight = parentWidth / sizeRatio + 'px';
    }
    removeImageSize() {
        const imgElement = this.element.getElementsByTagName(this.elementTarget);
        if (imgElement.length) {
            imgElement[0].style.maxWidth = '';
            imgElement[0].style.maxHeight = '';
        }
    }
    getElementPosition() {
        this.elementPosition = this.element.parentElement.getBoundingClientRect();
    }
    getTouchstartPosition(event) {
        const { clientX, clientY } = this.getClientPosition(event);
        this.startX = clientX - this.elementPosition.left;
        this.startY = clientY - this.elementPosition.top;
    }
    getClientPosition(event, index = 0) {
        let clientX;
        let clientY;
        if (event.type === 'touchstart' || event.type === 'touchmove') {
            clientX = event.touches[index].clientX;
            clientY = event.touches[index].clientY;
        }
        if (event.type === 'mousedown' || event.type === 'mousemove') {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        return {
            clientX,
            clientY,
        };
    }
    resetScale() {
        this.scale = 1;
        this.moveX = 0;
        this.moveY = 0;
        this.updateInitialValues();
        this.transformElement(this.properties.transitionDuration);
    }
    updateInitialValues() {
        this.initialScale = this.scale;
        this.initialMoveX = this.moveX;
        this.initialMoveY = this.moveY;
        const event = {
            scale: this.initialScale,
            moveX: this.initialMoveX,
            moveY: this.initialMoveY
        };
        this.onZoomChange.emit(event);
    }
    getDistance(touches) {
        return Math.sqrt(Math.pow(touches[0].pageX - touches[1].pageX, 2) + Math.pow(touches[0].pageY - touches[1].pageY, 2));
    }
    getImageHeight() {
        const img = this.element.getElementsByTagName(this.elementTarget)[0];
        return img.offsetHeight;
    }
    getImageWidth() {
        const img = this.element.getElementsByTagName(this.elementTarget)[0];
        return img.offsetWidth;
    }
    transformElement(duration) {
        this.element.style.transition = 'all ' + duration + 'ms';
        this.element.style.transform =
            'matrix(' + Number(this.scale) + ', 0, 0, ' + Number(this.scale) + ', ' + Number(this.moveX) + ', ' + Number(this.moveY) + ')';
    }
    isTouchScreen() {
        const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        if ('ontouchstart' in window) {
            return true;
        }
        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return this.getMatchMedia(query);
    }
    getMatchMedia(query) {
        return window.matchMedia(query).matches;
    }
    isDragging() {
        if (this.properties.disablePan) {
            return false;
        }
        const imgHeight = this.getImageHeight();
        const imgWidth = this.getImageWidth();
        if (this.scale > 1) {
            return imgHeight * this.scale > this.parentElement.offsetHeight || imgWidth * this.scale > this.parentElement.offsetWidth;
        }
        if (this.scale === 1) {
            return imgHeight > this.parentElement.offsetHeight || imgWidth > this.parentElement.offsetWidth;
        }
        return undefined;
    }
    detectLimitZoom() {
        this.maxScale = this.defaultMaxScale;
        if (this.properties.limitZoom === 'original image size' && this.elementTarget === 'IMG') {
            // We are waiting for the element with the image to be available
            this.pollLimitZoomForOriginalImage();
        }
    }
    pollLimitZoomForOriginalImage() {
        let poll = setInterval(() => {
            let maxScaleForOriginalImage = this.getMaxScaleForOriginalImage();
            if (typeof maxScaleForOriginalImage === 'number') {
                this.maxScale = maxScaleForOriginalImage;
                clearInterval(poll);
            }
        }, 10);
    }
    getMaxScaleForOriginalImage() {
        let maxScale;
        let img = this.element.getElementsByTagName('img')[0];
        if (img.naturalWidth && img.offsetWidth) {
            maxScale = img.naturalWidth / img.offsetWidth;
        }
        return maxScale;
    }
    getImageElement() {
        const imgElement = this.element.getElementsByTagName(this.elementTarget);
        if (imgElement.length) {
            return imgElement[0];
        }
    }
    toggleZoom(event = false) {
        console.warn('toggleZoom', event);
        if (this.initialScale === 1) {
            if (event && event.changedTouches) {
                if (this.properties.doubleTapScale === undefined) {
                    return;
                }
                const changedTouches = event.changedTouches;
                this.scale = this.initialScale * this.properties.doubleTapScale;
                this.moveX =
                    this.initialMoveX - (changedTouches[0].clientX - this.elementPosition.left) * (this.properties.doubleTapScale - 1);
                this.moveY =
                    this.initialMoveY - (changedTouches[0].clientY - this.elementPosition.top) * (this.properties.doubleTapScale - 1);
            }
            else {
                let zoomControlScale = this.properties.zoomControlScale || 0;
                this.scale = this.initialScale * (zoomControlScale + 1);
                this.moveX = this.initialMoveX - (this.element.offsetWidth * (this.scale - 1)) / 2;
                this.moveY = this.initialMoveY - (this.element.offsetHeight * (this.scale - 1)) / 2;
            }
            this.centeringImage();
            this.updateInitialValues();
            this.transformElement(this.properties.transitionDuration);
        }
        else {
            this.resetScale();
        }
    }
    stepZoom(mode, point = undefined) {
        console.warn('stepZoom');
        let stepZoomFactor = this.properties.stepZoomFactor || 0;
        let zoomFactor = 0;
        if (mode === 'OUT') {
            zoomFactor = -stepZoomFactor;
        }
        if (mode === 'IN') {
            zoomFactor = stepZoomFactor;
        }
        let newScale = this.initialScale + zoomFactor;
        /* Round value */
        if (newScale < 1 + stepZoomFactor) {
            newScale = 1;
        }
        else if (newScale < this.maxScale && newScale > this.maxScale - stepZoomFactor) {
            newScale = this.maxScale;
        }
        if (newScale < 1 || newScale > this.maxScale) {
            return;
        }
        if (newScale === this.scale) {
            return;
        }
        this.getElementPosition();
        this.scale = newScale;
        /* Get cursor position over image */
        let newCenter = undefined;
        if (point) {
            let xCenter = point.clientX - this.elementPosition.left - this.initialMoveX;
            let yCenter = point.clientY - this.elementPosition.top - this.initialMoveY;
            newCenter = [xCenter, yCenter];
        }
        this.setZoom({
            scale: newScale,
            center: newCenter
        });
    }
    setZoom(properties) {
        this.scale = properties.scale;
        let xCenter;
        let yCenter;
        let visibleAreaWidth = this.element.offsetWidth;
        let visibleAreaHeight = this.element.offsetHeight;
        let scalingPercent = (visibleAreaWidth * this.scale) / (visibleAreaWidth * this.initialScale);
        if (properties.center) {
            xCenter = properties.center[0];
            yCenter = properties.center[1];
        }
        else {
            xCenter = visibleAreaWidth / 2 - this.initialMoveX;
            yCenter = visibleAreaHeight / 2 - this.initialMoveY;
        }
        this.moveX = this.initialMoveX - (scalingPercent * xCenter - xCenter);
        this.moveY = this.initialMoveY - (scalingPercent * yCenter - yCenter);
        this.centeringImage();
        this.updateInitialValues();
        this.transformElement(this.properties.transitionDuration);
    }
    alignImage() {
        const isMoveChanged = this.centeringImage();
        if (isMoveChanged) {
            this.updateInitialValues();
            this.transformElement(this.properties.transitionDuration);
        }
    }
    destroy() {
        this.removeBasicStyles();
        this.touches.destroy();
    }
    getPropertiesValue(propertyName) {
        if (this.properties && this.properties[propertyName]) {
            return this.properties[propertyName];
        }
        else {
            return defaultProperties[propertyName];
        }
    }
}

const _defaultComponentProperties = {
    overflow: 'hidden',
    disableZoomControl: 'auto',
    backgroundColor: 'rgba(0,0,0,0.85)',
};
class PinchZoomComponent {
    elementRef;
    defaultComponentProperties;
    pinchZoom;
    _properties;
    zoomControlPositionClass;
    _transitionDuration;
    _doubleTap;
    _doubleTapScale;
    _autoZoomOut;
    _limitZoom;
    set properties(value) {
        if (value) {
            this._properties = value;
        }
    }
    get properties() {
        return this._properties;
    }
    // transitionDuration
    set transitionDurationBackwardCompatibility(value) {
        if (value) {
            this._transitionDuration = value;
        }
    }
    set transitionDuration(value) {
        if (value) {
            this._transitionDuration = value;
        }
    }
    get transitionDuration() {
        return this._transitionDuration;
    }
    // doubleTap
    set doubleTapBackwardCompatibility(value) {
        if (value) {
            this._doubleTap = value;
        }
    }
    set doubleTap(value) {
        if (value) {
            this._doubleTap = value;
        }
    }
    get doubleTap() {
        return this._doubleTap;
    }
    // doubleTapScale
    set doubleTapScaleBackwardCompatibility(value) {
        if (value) {
            this._doubleTapScale = value;
        }
    }
    set doubleTapScale(value) {
        if (value) {
            this._doubleTapScale = value;
        }
    }
    get doubleTapScale() {
        return this._doubleTapScale;
    }
    // autoZoomOut
    set autoZoomOutBackwardCompatibility(value) {
        if (value) {
            this._autoZoomOut = value;
        }
    }
    set autoZoomOut(value) {
        if (value) {
            this._autoZoomOut = value;
        }
    }
    get autoZoomOut() {
        return this._autoZoomOut;
    }
    // limitZoom
    set limitZoomBackwardCompatibility(value) {
        if (value) {
            this._limitZoom = value;
        }
    }
    set limitZoom(value) {
        if (value) {
            this._limitZoom = value;
        }
    }
    get limitZoom() {
        return this._limitZoom;
    }
    disabled;
    disablePan;
    overflow;
    zoomControlScale;
    disableZoomControl;
    backgroundColor;
    limitPan;
    minPanScale;
    minScale;
    listeners;
    wheel;
    autoHeight;
    stepZoomFactor;
    wheelZoomFactor;
    draggableImage;
    onZoomChange = new EventEmitter();
    get hostOverflow() {
        return this.properties['overflow'];
    }
    get hostBackgroundColor() {
        return this.properties['backgroundColor'];
    }
    get isTouchScreen() {
        var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        var mq = function (query) {
            return window.matchMedia(query).matches;
        };
        if ('ontouchstart' in window) {
            return true;
        }
        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
    }
    get isDragging() {
        return this.pinchZoom ? this.pinchZoom.isDragging() : undefined;
    }
    get isDisabled() {
        return this.properties['disabled'];
    }
    get scale() {
        return this.pinchZoom.scale;
    }
    get isZoomedIn() {
        return this.scale > 1;
    }
    get scaleLevel() {
        return Math.round(this.scale / this._zoomControlScale);
    }
    get maxScale() {
        return this.pinchZoom.maxScale;
    }
    get isZoomLimitReached() {
        return this.scale >= this.maxScale;
    }
    get _zoomControlScale() {
        return this.getPropertiesValue('zoomControlScale');
    }
    constructor(elementRef) {
        this.elementRef = elementRef;
        this.defaultComponentProperties = this.getDefaultComponentProperties();
        this.applyPropertiesDefault(this.defaultComponentProperties, {});
    }
    ngOnInit() {
        this.initPinchZoom();
        /* Calls the method until the image size is available */
        this.detectLimitZoom();
    }
    isControl() {
        if (this.isDisabled) {
            return false;
        }
        if (this.properties['disableZoomControl'] === 'disable') {
            return false;
        }
        if (this.isTouchScreen && this.properties['disableZoomControl'] === 'auto') {
            return false;
        }
        return true;
    }
    ngOnChanges(changes) {
        let changedProperties = this.getProperties(changes);
        changedProperties = this.renameProperties(changedProperties);
        this.applyPropertiesDefault(this.defaultComponentProperties, changedProperties);
    }
    ngOnDestroy() {
        this.destroy();
    }
    toggleZoom() {
        this.pinchZoom.toggleZoom();
    }
    zoomPoint(point) {
        this.pinchZoom.stepZoom('IN', point);
    }
    zoomIn() {
        this.pinchZoom.stepZoom('IN');
    }
    zoomOut() {
        this.pinchZoom.stepZoom('OUT');
    }
    resetZoom() {
        this.pinchZoom.resetScale();
    }
    destroy() {
        if (this.pinchZoom)
            this.pinchZoom.destroy();
    }
    initPinchZoom() {
        if (this.properties['disabled']) {
            return;
        }
        this.properties['element'] = this.elementRef.nativeElement.querySelector('.pinch-zoom-content');
        this.pinchZoom = new IvyPinch(this.properties, this.onZoomChange);
    }
    getProperties(changes) {
        let properties = {};
        for (var prop in changes) {
            if (prop !== 'properties') {
                properties[prop] = changes[prop].currentValue;
            }
            if (prop === 'properties') {
                properties = changes[prop].currentValue;
            }
        }
        return properties;
    }
    renameProperties(properties) {
        for (var prop in properties) {
            if (backwardCompatibilityProperties[prop]) {
                properties[backwardCompatibilityProperties[prop]] = properties[prop];
                delete properties[prop];
            }
        }
        return properties;
    }
    applyPropertiesDefault(defaultProperties, properties) {
        this.properties = Object.assign({}, defaultProperties, properties);
    }
    detectLimitZoom() {
        if (this.pinchZoom) {
            this.pinchZoom.detectLimitZoom();
        }
    }
    getPropertiesValue(propertyName) {
        if (this.properties && this.properties[propertyName]) {
            return this.properties[propertyName];
        }
        else {
            return this.defaultComponentProperties[propertyName];
        }
    }
    getDefaultComponentProperties() {
        return { ...defaultProperties, ..._defaultComponentProperties };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: PinchZoomComponent, deps: [{ token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.0.0", type: PinchZoomComponent, selector: "pinch-zoom, [pinch-zoom]", inputs: { properties: "properties", transitionDurationBackwardCompatibility: ["transition-duration", "transitionDurationBackwardCompatibility"], transitionDuration: "transitionDuration", doubleTapBackwardCompatibility: ["double-tap", "doubleTapBackwardCompatibility"], doubleTap: "doubleTap", doubleTapScaleBackwardCompatibility: ["double-tap-scale", "doubleTapScaleBackwardCompatibility"], doubleTapScale: "doubleTapScale", autoZoomOutBackwardCompatibility: ["auto-zoom-out", "autoZoomOutBackwardCompatibility"], autoZoomOut: "autoZoomOut", limitZoomBackwardCompatibility: ["limit-zoom", "limitZoomBackwardCompatibility"], limitZoom: "limitZoom", disabled: "disabled", disablePan: "disablePan", overflow: "overflow", zoomControlScale: "zoomControlScale", disableZoomControl: "disableZoomControl", backgroundColor: "backgroundColor", limitPan: "limitPan", minPanScale: "minPanScale", minScale: "minScale", listeners: "listeners", wheel: "wheel", autoHeight: "autoHeight", stepZoomFactor: "stepZoomFactor", wheelZoomFactor: "wheelZoomFactor", draggableImage: "draggableImage" }, outputs: { onZoomChange: "onZoomChange" }, host: { properties: { "style.overflow": "this.hostOverflow", "style.background-color": "this.hostBackgroundColor" } }, exportAs: ["pinchZoom"], usesOnChanges: true, ngImport: i0, template: "<div class=\"pinch-zoom-content\" [class.pz-dragging]=\"isDragging\">\r\n    <ng-content></ng-content>\r\n</div>\r\n\r\n<!-- Control: one button -->\r\n<div\r\n    class=\"pz-zoom-button pz-zoom-control-position-bottom\"\r\n    [class.pz-zoom-button-out]=\"isZoomedIn\"\r\n    *ngIf=\"isControl()\"\r\n    (click)=\"toggleZoom()\"\r\n></div>\r\n", styles: [":host{position:relative;overflow:hidden;display:block}.pinch-zoom-content{height:inherit}.pz-dragging{cursor:all-scroll}.pz-zoom-button{position:absolute;z-index:1000;color:#fff;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgc3R5bGU9IiI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48ZyBjbGFzcz0iY3VycmVudExheWVyIiBzdHlsZT0iIj48dGl0bGU+TGF5ZXIgMTwvdGl0bGU+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6IiBpZD0ic3ZnXzEiIGNsYXNzPSIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSIvPjxwYXRoIGQ9Ik0xMiAxMGgtMnYySDl2LTJIN1Y5aDJWN2gxdjJoMnYxeiIgaWQ9InN2Z18zIiBjbGFzcz0iIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjEiLz48L2c+PC9zdmc+),url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48ZyBjbGFzcz0iY3VycmVudExheWVyIiBzdHlsZT0iIj48dGl0bGU+TGF5ZXIgMTwvdGl0bGU+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6TTcgOWg1djFIN3oiIGlkPSJzdmdfMiIgY2xhc3M9IiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjwvc3ZnPg==);background-color:#000c;background-position:center,-1000px;background-repeat:no-repeat,no-repeat;background-size:40px;width:56px;height:56px;border-radius:4px;opacity:.5;cursor:pointer;transition:opacity .1s;-webkit-user-select:none;user-select:none}.pz-zoom-button-out{background-position:-1000px,center}.pz-zoom-button:hover{opacity:.7}.pz-zoom-button.pz-zoom-control-position-right{right:16px;top:50%;margin-top:-28px}.pz-zoom-button.pz-zoom-control-position-right-bottom{right:16px;bottom:32px}.pz-zoom-button.pz-zoom-control-position-bottom{bottom:16px;left:50%;margin-left:-28px}.pz-zoom-control{position:absolute;background-color:#000c;border-radius:4px;overflow:hidden}.pz-zoom-control.pz-zoom-control-position-right{right:16px;top:50%;margin-top:-48px}.pz-zoom-control.pz-zoom-control-position-right-bottom{right:16px;bottom:32px}.pz-zoom-control.pz-zoom-control-position-bottom{bottom:16px;left:50%;margin-left:-48px}.pz-zoom-in,.pz-zoom-out{width:48px;height:48px;background-position:center;background-repeat:no-repeat;opacity:1;cursor:pointer}.pz-zoom-in:hover,.pz-zoom-out:hover{background-color:#fff3}.pz-zoom-control-position-bottom .pz-zoom-in,.pz-zoom-control-position-bottom .pz-zoom-out{float:right}.pz-disabled{opacity:.5;cursor:default}.pz-disabled:hover{background-color:#fff0}.pz-zoom-in{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgc3R5bGU9IiI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48ZyBjbGFzcz0iY3VycmVudExheWVyIiBzdHlsZT0iIj48dGl0bGU+TGF5ZXIgMTwvdGl0bGU+PHBhdGggZD0iTTE5IDEzaC02djZoLTJ2LTZINXYtMmg2VjVoMnY2aDZ2MnoiIGlkPSJzdmdfMSIgY2xhc3M9IiIgc3Ryb2tlPSJub25lIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjEiLz48cGF0aCBkPSJNLTE1LjgzNjczNDQyMDQ2MTY1Myw0NC41MzU0MDkzMDY3MTAxOCBoNTguMjA0MDgwODI3NTkzMDkgdi02LjU3NjIyNjcyMzM2OTIyMTUgSC0xNS44MzY3MzQ0MjA0NjE2NTMgeiIgZmlsbD0ibm9uZSIgaWQ9InN2Z18yIiBjbGFzcz0iIiBzdHJva2U9Im5vbmUiLz48L2c+PC9zdmc+)}.pz-zoom-out{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48ZyBjbGFzcz0iY3VycmVudExheWVyIiBzdHlsZT0iIj48dGl0bGU+TGF5ZXIgMTwvdGl0bGU+PHBhdGggZD0iTTE5IDEzSDV2LTJoMTR2MnoiIGlkPSJzdmdfMSIgY2xhc3M9IiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjwvc3ZnPg==)}\n"], dependencies: [{ kind: "directive", type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: PinchZoomComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pinch-zoom, [pinch-zoom]', exportAs: 'pinchZoom', template: "<div class=\"pinch-zoom-content\" [class.pz-dragging]=\"isDragging\">\r\n    <ng-content></ng-content>\r\n</div>\r\n\r\n<!-- Control: one button -->\r\n<div\r\n    class=\"pz-zoom-button pz-zoom-control-position-bottom\"\r\n    [class.pz-zoom-button-out]=\"isZoomedIn\"\r\n    *ngIf=\"isControl()\"\r\n    (click)=\"toggleZoom()\"\r\n></div>\r\n", styles: [":host{position:relative;overflow:hidden;display:block}.pinch-zoom-content{height:inherit}.pz-dragging{cursor:all-scroll}.pz-zoom-button{position:absolute;z-index:1000;color:#fff;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgc3R5bGU9IiI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48ZyBjbGFzcz0iY3VycmVudExheWVyIiBzdHlsZT0iIj48dGl0bGU+TGF5ZXIgMTwvdGl0bGU+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6IiBpZD0ic3ZnXzEiIGNsYXNzPSIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSIvPjxwYXRoIGQ9Ik0xMiAxMGgtMnYySDl2LTJIN1Y5aDJWN2gxdjJoMnYxeiIgaWQ9InN2Z18zIiBjbGFzcz0iIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjEiLz48L2c+PC9zdmc+),url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48ZyBjbGFzcz0iY3VycmVudExheWVyIiBzdHlsZT0iIj48dGl0bGU+TGF5ZXIgMTwvdGl0bGU+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6TTcgOWg1djFIN3oiIGlkPSJzdmdfMiIgY2xhc3M9IiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjwvc3ZnPg==);background-color:#000c;background-position:center,-1000px;background-repeat:no-repeat,no-repeat;background-size:40px;width:56px;height:56px;border-radius:4px;opacity:.5;cursor:pointer;transition:opacity .1s;-webkit-user-select:none;user-select:none}.pz-zoom-button-out{background-position:-1000px,center}.pz-zoom-button:hover{opacity:.7}.pz-zoom-button.pz-zoom-control-position-right{right:16px;top:50%;margin-top:-28px}.pz-zoom-button.pz-zoom-control-position-right-bottom{right:16px;bottom:32px}.pz-zoom-button.pz-zoom-control-position-bottom{bottom:16px;left:50%;margin-left:-28px}.pz-zoom-control{position:absolute;background-color:#000c;border-radius:4px;overflow:hidden}.pz-zoom-control.pz-zoom-control-position-right{right:16px;top:50%;margin-top:-48px}.pz-zoom-control.pz-zoom-control-position-right-bottom{right:16px;bottom:32px}.pz-zoom-control.pz-zoom-control-position-bottom{bottom:16px;left:50%;margin-left:-48px}.pz-zoom-in,.pz-zoom-out{width:48px;height:48px;background-position:center;background-repeat:no-repeat;opacity:1;cursor:pointer}.pz-zoom-in:hover,.pz-zoom-out:hover{background-color:#fff3}.pz-zoom-control-position-bottom .pz-zoom-in,.pz-zoom-control-position-bottom .pz-zoom-out{float:right}.pz-disabled{opacity:.5;cursor:default}.pz-disabled:hover{background-color:#fff0}.pz-zoom-in{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgc3R5bGU9IiI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48ZyBjbGFzcz0iY3VycmVudExheWVyIiBzdHlsZT0iIj48dGl0bGU+TGF5ZXIgMTwvdGl0bGU+PHBhdGggZD0iTTE5IDEzaC02djZoLTJ2LTZINXYtMmg2VjVoMnY2aDZ2MnoiIGlkPSJzdmdfMSIgY2xhc3M9IiIgc3Ryb2tlPSJub25lIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjEiLz48cGF0aCBkPSJNLTE1LjgzNjczNDQyMDQ2MTY1Myw0NC41MzU0MDkzMDY3MTAxOCBoNTguMjA0MDgwODI3NTkzMDkgdi02LjU3NjIyNjcyMzM2OTIyMTUgSC0xNS44MzY3MzQ0MjA0NjE2NTMgeiIgZmlsbD0ibm9uZSIgaWQ9InN2Z18yIiBjbGFzcz0iIiBzdHJva2U9Im5vbmUiLz48L2c+PC9zdmc+)}.pz-zoom-out{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48ZyBjbGFzcz0iY3VycmVudExheWVyIiBzdHlsZT0iIj48dGl0bGU+TGF5ZXIgMTwvdGl0bGU+PHBhdGggZD0iTTE5IDEzSDV2LTJoMTR2MnoiIGlkPSJzdmdfMSIgY2xhc3M9IiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjwvc3ZnPg==)}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }]; }, propDecorators: { properties: [{
                type: Input,
                args: ['properties']
            }], transitionDurationBackwardCompatibility: [{
                type: Input,
                args: ['transition-duration']
            }], transitionDuration: [{
                type: Input,
                args: ['transitionDuration']
            }], doubleTapBackwardCompatibility: [{
                type: Input,
                args: ['double-tap']
            }], doubleTap: [{
                type: Input,
                args: ['doubleTap']
            }], doubleTapScaleBackwardCompatibility: [{
                type: Input,
                args: ['double-tap-scale']
            }], doubleTapScale: [{
                type: Input,
                args: ['doubleTapScale']
            }], autoZoomOutBackwardCompatibility: [{
                type: Input,
                args: ['auto-zoom-out']
            }], autoZoomOut: [{
                type: Input,
                args: ['autoZoomOut']
            }], limitZoomBackwardCompatibility: [{
                type: Input,
                args: ['limit-zoom']
            }], limitZoom: [{
                type: Input,
                args: ['limitZoom']
            }], disabled: [{
                type: Input
            }], disablePan: [{
                type: Input
            }], overflow: [{
                type: Input
            }], zoomControlScale: [{
                type: Input
            }], disableZoomControl: [{
                type: Input
            }], backgroundColor: [{
                type: Input
            }], limitPan: [{
                type: Input
            }], minPanScale: [{
                type: Input
            }], minScale: [{
                type: Input
            }], listeners: [{
                type: Input
            }], wheel: [{
                type: Input
            }], autoHeight: [{
                type: Input
            }], stepZoomFactor: [{
                type: Input
            }], wheelZoomFactor: [{
                type: Input
            }], draggableImage: [{
                type: Input
            }], onZoomChange: [{
                type: Output
            }], hostOverflow: [{
                type: HostBinding,
                args: ['style.overflow']
            }], hostBackgroundColor: [{
                type: HostBinding,
                args: ['style.background-color']
            }] } });

class PinchZoomModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: PinchZoomModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0", ngImport: i0, type: PinchZoomModule, declarations: [PinchZoomComponent], imports: [CommonModule], exports: [PinchZoomComponent] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: PinchZoomModule, imports: [CommonModule] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: PinchZoomModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [PinchZoomComponent],
                    imports: [CommonModule],
                    exports: [PinchZoomComponent],
                    providers: [],
                    bootstrap: [],
                }]
        }] });

/*
 * Public API Surface of ngx-pinch-zoom
 */

/**
 * Generated bundle index. Do not edit.
 */

export { PinchZoomComponent, PinchZoomModule, _defaultComponentProperties };
//# sourceMappingURL=meddv-ngx-pinch-zoom.mjs.map
