import { Touches } from './touches';
import { defaultProperties } from './properties';
export class IvyPinch {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXZ5cGluY2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtcGluY2gtem9vbS9zcmMvbGliL2l2eXBpbmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFFcEMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sY0FBYyxDQUFDO0FBS2pELE1BQU0sT0FBTyxRQUFRO0lBQ2pCLFVBQVUsR0FBd0IsaUJBQWlCLENBQUM7SUFDNUMsWUFBWSxDQUEwQjtJQUM5QyxPQUFPLENBQU07SUFDYixPQUFPLENBQU07SUFDYixhQUFhLENBQU07SUFDbkIsYUFBYSxDQUFNO0lBQ25CLENBQUMsR0FBVyxDQUFDLENBQUM7SUFDUCxLQUFLLEdBQVcsQ0FBQyxDQUFDO0lBQ3pCLFlBQVksR0FBVyxDQUFDLENBQUM7SUFDekIsZUFBZSxDQUFNO0lBQ3JCLFNBQVMsQ0FBTTtJQUNmLE1BQU0sR0FBVyxDQUFDLENBQUM7SUFDbkIsTUFBTSxHQUFXLENBQUMsQ0FBQztJQUNuQixLQUFLLEdBQVcsQ0FBQyxDQUFDO0lBQ2xCLEtBQUssR0FBVyxDQUFDLENBQUM7SUFDbEIsWUFBWSxHQUFXLENBQUMsQ0FBQztJQUN6QixZQUFZLEdBQVcsQ0FBQyxDQUFDO0lBQ3pCLE1BQU0sR0FBVyxDQUFDLENBQUM7SUFDbkIsTUFBTSxHQUFXLENBQUMsQ0FBQztJQUNuQixPQUFPLEdBQVcsQ0FBQyxDQUFDO0lBQ3BCLFlBQVksR0FBWSxLQUFLLENBQUM7SUFDOUIsUUFBUSxHQUFXLENBQUMsQ0FBQztJQUNyQixnQkFBZ0IsR0FBVyxDQUFDLENBQUM7SUFDN0IsZUFBZSxHQUFXLENBQUMsQ0FBQztJQUM1QixNQUFNLEdBQVEsRUFBRSxDQUFDO0lBQ2pCLFFBQVEsQ0FBVTtJQUNsQixlQUFlLEdBQVcsQ0FBQyxDQUFDO0lBRTVCLHVDQUF1QztJQUN2QyxJQUFJLFdBQVc7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QUFDO1FBRTVDLElBQUksYUFBYSxFQUFFO1lBQ2YsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUM3RDtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsa0JBQWtCLENBQUMsWUFBMEI7UUFDekMsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDbEQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ3hDO2FBQU07WUFDSCxPQUFPLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQzFDO0lBQ0wsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG91Y2hlcyB9IGZyb20gJy4vdG91Y2hlcyc7XHJcbmltcG9ydCB7TW91c2Vab29tUG9pbnQsIFBpbmNoWm9vbVByb3BlcnRpZXMsIFpvb21FdmVudH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcclxuaW1wb3J0IHsgZGVmYXVsdFByb3BlcnRpZXMgfSBmcm9tICcuL3Byb3BlcnRpZXMnO1xyXG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcblxyXG50eXBlIFByb3BlcnR5TmFtZSA9IGtleW9mIFBpbmNoWm9vbVByb3BlcnRpZXM7XHJcblxyXG5leHBvcnQgY2xhc3MgSXZ5UGluY2gge1xyXG4gICAgcHJvcGVydGllczogUGluY2hab29tUHJvcGVydGllcyA9IGRlZmF1bHRQcm9wZXJ0aWVzO1xyXG4gICAgcHJpdmF0ZSBvblpvb21DaGFuZ2U6IEV2ZW50RW1pdHRlcjxab29tRXZlbnQ+O1xyXG4gICAgdG91Y2hlczogYW55O1xyXG4gICAgZWxlbWVudDogYW55O1xyXG4gICAgZWxlbWVudFRhcmdldDogYW55O1xyXG4gICAgcGFyZW50RWxlbWVudDogYW55O1xyXG4gICAgaTogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyBzY2FsZTogbnVtYmVyID0gMTtcclxuICAgIGluaXRpYWxTY2FsZTogbnVtYmVyID0gMTtcclxuICAgIGVsZW1lbnRQb3NpdGlvbjogYW55O1xyXG4gICAgZXZlbnRUeXBlOiBhbnk7XHJcbiAgICBzdGFydFg6IG51bWJlciA9IDA7XHJcbiAgICBzdGFydFk6IG51bWJlciA9IDA7XHJcbiAgICBtb3ZlWDogbnVtYmVyID0gMDtcclxuICAgIG1vdmVZOiBudW1iZXIgPSAwO1xyXG4gICAgaW5pdGlhbE1vdmVYOiBudW1iZXIgPSAwO1xyXG4gICAgaW5pdGlhbE1vdmVZOiBudW1iZXIgPSAwO1xyXG4gICAgbW92ZVhDOiBudW1iZXIgPSAwO1xyXG4gICAgbW92ZVlDOiBudW1iZXIgPSAwO1xyXG4gICAgbGFzdFRhcDogbnVtYmVyID0gMDtcclxuICAgIGRyYWdnaW5nTW9kZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgZGlzdGFuY2U6IG51bWJlciA9IDA7XHJcbiAgICBkb3VibGVUYXBUaW1lb3V0OiBudW1iZXIgPSAwO1xyXG4gICAgaW5pdGlhbERpc3RhbmNlOiBudW1iZXIgPSAwO1xyXG4gICAgZXZlbnRzOiBhbnkgPSB7fTtcclxuICAgIG1heFNjYWxlITogbnVtYmVyO1xyXG4gICAgZGVmYXVsdE1heFNjYWxlOiBudW1iZXIgPSAzO1xyXG5cclxuICAgIC8vIE1pbmltdW0gc2NhbGUgYXQgd2hpY2ggcGFubmluZyB3b3Jrc1xyXG4gICAgZ2V0IG1pblBhblNjYWxlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb3BlcnRpZXNWYWx1ZSgnbWluUGFuU2NhbGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgZnVsbEltYWdlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXMuZnVsbEltYWdlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BlcnRpZXM6IFBpbmNoWm9vbVByb3BlcnRpZXMsIG9uWm9vbUNoYW5nZTogRXZlbnRFbWl0dGVyPFpvb21FdmVudD4pIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBwcm9wZXJ0aWVzLmVsZW1lbnQ7XHJcbiAgICAgICAgdGhpcy5vblpvb21DaGFuZ2UgPSBvblpvb21DaGFuZ2U7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5lbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZWxlbWVudFRhcmdldCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcqJykudGFnTmFtZTtcclxuICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQgPSB0aGlzLmVsZW1lbnQucGFyZW50RWxlbWVudDtcclxuICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0UHJvcGVydGllcywgcHJvcGVydGllcyk7XHJcbiAgICAgICAgdGhpcy5kZXRlY3RMaW1pdFpvb20oKTtcclxuXHJcbiAgICAgICAgdGhpcy50b3VjaGVzID0gbmV3IFRvdWNoZXMoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBwcm9wZXJ0aWVzLmVsZW1lbnQsXHJcbiAgICAgICAgICAgIGxpc3RlbmVyczogcHJvcGVydGllcy5saXN0ZW5lcnMsXHJcbiAgICAgICAgICAgIHJlc2l6ZTogcHJvcGVydGllcy5hdXRvSGVpZ2h0LFxyXG4gICAgICAgICAgICBtb3VzZUxpc3RlbmVyczoge1xyXG4gICAgICAgICAgICAgICAgbW91c2Vkb3duOiAnaGFuZGxlTW91c2Vkb3duJyxcclxuICAgICAgICAgICAgICAgIG1vdXNldXA6ICdoYW5kbGVNb3VzZXVwJyxcclxuICAgICAgICAgICAgICAgIHdoZWVsOiAnaGFuZGxlV2hlZWwnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvKiBJbml0ICovXHJcbiAgICAgICAgdGhpcy5zZXRCYXNpY1N0eWxlcygpO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIExpc3RlbmVyc1xyXG4gICAgICAgICAqL1xyXG5cclxuICAgICAgICB0aGlzLnRvdWNoZXMub24oJ3RvdWNoc3RhcnQnLCB0aGlzLmhhbmRsZVRvdWNoc3RhcnQpO1xyXG4gICAgICAgIHRoaXMudG91Y2hlcy5vbigndG91Y2hlbmQnLCB0aGlzLmhhbmRsZVRvdWNoZW5kKTtcclxuICAgICAgICB0aGlzLnRvdWNoZXMub24oJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlVG91Y2hzdGFydCk7XHJcbiAgICAgICAgdGhpcy50b3VjaGVzLm9uKCdtb3VzZXVwJywgdGhpcy5oYW5kbGVUb3VjaGVuZCk7XHJcbiAgICAgICAgdGhpcy50b3VjaGVzLm9uKCdwYW4nLCB0aGlzLmhhbmRsZVBhbik7XHJcbiAgICAgICAgdGhpcy50b3VjaGVzLm9uKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZVBhbik7XHJcbiAgICAgICAgdGhpcy50b3VjaGVzLm9uKCdwaW5jaCcsIHRoaXMuaGFuZGxlUGluY2gpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzLndoZWVsKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG91Y2hlcy5vbignd2hlZWwnLCB0aGlzLmhhbmRsZVdoZWVsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXMuZG91YmxlVGFwKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG91Y2hlcy5vbignZG91YmxlLXRhcCcsIHRoaXMuaGFuZGxlRG91YmxlVGFwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXMuYXV0b0hlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLnRvdWNoZXMub24oJ3Jlc2l6ZScsIHRoaXMuaGFuZGxlUmVzaXplKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyogVG91Y2hzdGFydCAqL1xyXG5cclxuICAgIGhhbmRsZVRvdWNoc3RhcnQgPSAoZXZlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIHRoaXMudG91Y2hlcy5hZGRFdmVudExpc3RlbmVycygnbW91c2Vtb3ZlJywgJ2hhbmRsZU1vdXNlbW92ZScpO1xyXG4gICAgICAgIHRoaXMuZ2V0RWxlbWVudFBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmV2ZW50VHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0VG91Y2hzdGFydFBvc2l0aW9uKGV2ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIFRvdWNoZW5kICovXHJcblxyXG4gICAgaGFuZGxlVG91Y2hlbmQgPSAoZXZlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIC8qIHRvdWNoZW5kICovXHJcbiAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICd0b3VjaGVuZCcpIHtcclxuICAgICAgICAgICAgdGhpcy5pID0gMDtcclxuICAgICAgICAgICAgdGhpcy5kcmFnZ2luZ01vZGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgY29uc3QgdG91Y2hlcyA9IGV2ZW50LnRvdWNoZXM7XHJcblxyXG4gICAgICAgICAgICAvLyBNaW4gc2NhbGVcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2NhbGUgPCAxKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlID0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQXV0byBab29tIE91dFxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzLmF1dG9ab29tT3V0ICYmIHRoaXMuZXZlbnRUeXBlID09PSAncGluY2gnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlID0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQWxpZ24gaW1hZ2VcclxuICAgICAgICAgICAgaWYgKHRoaXMuZXZlbnRUeXBlID09PSAncGluY2gnIHx8ICh0aGlzLmV2ZW50VHlwZSA9PT0gJ3BhbicgJiYgdGhpcy5zY2FsZSA+IHRoaXMubWluUGFuU2NhbGUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsaWduSW1hZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWwgdmFsdWVzXHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRUeXBlID09PSAncGluY2gnIHx8XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV2ZW50VHlwZSA9PT0gJ3BhbicgfHxcclxuICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRUeXBlID09PSAnaG9yaXpvbnRhbC1zd2lwZScgfHxcclxuICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRUeXBlID09PSAndmVydGljYWwtc3dpcGUnXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVJbml0aWFsVmFsdWVzKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRUeXBlID0gJ3RvdWNoZW5kJztcclxuXHJcbiAgICAgICAgICAgIGlmICh0b3VjaGVzICYmIHRvdWNoZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV2ZW50VHlwZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogbW91c2V1cCAqL1xyXG4gICAgICAgIGlmIChldmVudC50eXBlID09PSAnbW91c2V1cCcpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmFnZ2luZ01vZGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVJbml0aWFsVmFsdWVzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRUeXBlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50b3VjaGVzLnJlbW92ZUV2ZW50TGlzdGVuZXJzKCdtb3VzZW1vdmUnLCAnaGFuZGxlTW91c2Vtb3ZlJyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBIYW5kbGVyc1xyXG4gICAgICovXHJcblxyXG4gICAgaGFuZGxlUGFuID0gKGV2ZW50OiBhbnkpID0+IHtcclxuICAgICAgICBpZiAodGhpcy5zY2FsZSA8IHRoaXMubWluUGFuU2NhbGUgfHwgdGhpcy5wcm9wZXJ0aWVzLmRpc2FibGVQYW4pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCB7IGNsaWVudFgsIGNsaWVudFkgfSA9IHRoaXMuZ2V0Q2xpZW50UG9zaXRpb24oZXZlbnQpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRUeXBlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRYID0gY2xpZW50WCAtIHRoaXMuZWxlbWVudFBvc2l0aW9uLmxlZnQ7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRZID0gY2xpZW50WSAtIHRoaXMuZWxlbWVudFBvc2l0aW9uLnRvcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZXZlbnRUeXBlID0gJ3Bhbic7XHJcbiAgICAgICAgdGhpcy5tb3ZlWCA9IHRoaXMuaW5pdGlhbE1vdmVYICsgKHRoaXMubW92ZUxlZnQoZXZlbnQsIDApIC0gdGhpcy5zdGFydFgpO1xyXG4gICAgICAgIHRoaXMubW92ZVkgPSB0aGlzLmluaXRpYWxNb3ZlWSArICh0aGlzLm1vdmVUb3AoZXZlbnQsIDApIC0gdGhpcy5zdGFydFkpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzLmxpbWl0UGFuKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGltaXRQYW5ZKCk7XHJcbiAgICAgICAgICAgIHRoaXMubGltaXRQYW5YKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBtb3VzZW1vdmUgKi9cclxuICAgICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ21vdXNlbW92ZScgJiYgdGhpcy5zY2FsZSA+IHRoaXMubWluUGFuU2NhbGUpIHtcclxuICAgICAgICAgICAgdGhpcy5jZW50ZXJpbmdJbWFnZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1FbGVtZW50KDApO1xyXG4gICAgfTtcclxuXHJcbiAgICBoYW5kbGVEb3VibGVUYXAgPSAoZXZlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIHRoaXMudG9nZ2xlWm9vbShldmVudCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfTtcclxuXHJcbiAgICBoYW5kbGVQaW5jaCA9IChldmVudDogYW55KSA9PiB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZXZlbnRUeXBlID09PSB1bmRlZmluZWQgfHwgdGhpcy5ldmVudFR5cGUgPT09ICdwaW5jaCcpIHtcclxuICAgICAgICAgICAgY29uc3QgdG91Y2hlcyA9IGV2ZW50LnRvdWNoZXM7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZXZlbnRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxEaXN0YW5jZSA9IHRoaXMuZ2V0RGlzdGFuY2UodG91Y2hlcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbW92ZUxlZnQwID0gdGhpcy5tb3ZlTGVmdChldmVudCwgMCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtb3ZlTGVmdDEgPSB0aGlzLm1vdmVMZWZ0KGV2ZW50LCAxKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVUb3AwID0gdGhpcy5tb3ZlVG9wKGV2ZW50LCAwKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVUb3AxID0gdGhpcy5tb3ZlVG9wKGV2ZW50LCAxKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVYQyA9IChtb3ZlTGVmdDAgKyBtb3ZlTGVmdDEpIC8gMiAtIHRoaXMuaW5pdGlhbE1vdmVYO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlWUMgPSAobW92ZVRvcDAgKyBtb3ZlVG9wMSkgLyAyIC0gdGhpcy5pbml0aWFsTW92ZVk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRUeXBlID0gJ3BpbmNoJztcclxuICAgICAgICAgICAgdGhpcy5kaXN0YW5jZSA9IHRoaXMuZ2V0RGlzdGFuY2UodG91Y2hlcyk7XHJcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLmluaXRpYWxTY2FsZSAqICh0aGlzLmRpc3RhbmNlIC8gdGhpcy5pbml0aWFsRGlzdGFuY2UpO1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVYID0gdGhpcy5pbml0aWFsTW92ZVggLSAoKHRoaXMuZGlzdGFuY2UgLyB0aGlzLmluaXRpYWxEaXN0YW5jZSkgKiB0aGlzLm1vdmVYQyAtIHRoaXMubW92ZVhDKTtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlWSA9IHRoaXMuaW5pdGlhbE1vdmVZIC0gKCh0aGlzLmRpc3RhbmNlIC8gdGhpcy5pbml0aWFsRGlzdGFuY2UpICogdGhpcy5tb3ZlWUMgLSB0aGlzLm1vdmVZQyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUxpbWl0Wm9vbSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcy5saW1pdFBhbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saW1pdFBhblkoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGltaXRQYW5YKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtRWxlbWVudCgwKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGhhbmRsZVdoZWVsID0gKGV2ZW50OiBhbnkpID0+IHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnNvbGUud2FybignaGFuZGxlV2hlZWwnLCBldmVudCk7XHJcblxyXG4gICAgICAgIGxldCB3aGVlbFpvb21GYWN0b3IgPSB0aGlzLnByb3BlcnRpZXMud2hlZWxab29tRmFjdG9yIHx8IDA7XHJcbiAgICAgICAgbGV0IHpvb21GYWN0b3IgPSBldmVudC5kZWx0YVkgPCAwID8gd2hlZWxab29tRmFjdG9yIDogLXdoZWVsWm9vbUZhY3RvcjtcclxuICAgICAgICBsZXQgbmV3U2NhbGUgPSB0aGlzLmluaXRpYWxTY2FsZSArIHpvb21GYWN0b3I7XHJcblxyXG4gICAgICAgIC8qIFJvdW5kIHZhbHVlICovXHJcbiAgICAgICAgaWYgKG5ld1NjYWxlIDwgMSArIHdoZWVsWm9vbUZhY3Rvcikge1xyXG4gICAgICAgICAgICBuZXdTY2FsZSA9IDE7XHJcbiAgICAgICAgfSBlbHNlIGlmIChuZXdTY2FsZSA8IHRoaXMubWF4U2NhbGUgJiYgbmV3U2NhbGUgPiB0aGlzLm1heFNjYWxlIC0gd2hlZWxab29tRmFjdG9yKSB7XHJcbiAgICAgICAgICAgIG5ld1NjYWxlID0gdGhpcy5tYXhTY2FsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChuZXdTY2FsZSA8IDEgfHwgbmV3U2NhbGUgPiB0aGlzLm1heFNjYWxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChuZXdTY2FsZSA9PT0gdGhpcy5zY2FsZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmdldEVsZW1lbnRQb3NpdGlvbigpO1xyXG4gICAgICAgIHRoaXMuc2NhbGUgPSBuZXdTY2FsZTtcclxuXHJcbiAgICAgICAgLyogR2V0IGN1cnNvciBwb3NpdGlvbiBvdmVyIGltYWdlICovXHJcbiAgICAgICAgbGV0IHhDZW50ZXIgPSBldmVudC5jbGllbnRYIC0gdGhpcy5lbGVtZW50UG9zaXRpb24ubGVmdCAtIHRoaXMuaW5pdGlhbE1vdmVYO1xyXG4gICAgICAgIGxldCB5Q2VudGVyID0gZXZlbnQuY2xpZW50WSAtIHRoaXMuZWxlbWVudFBvc2l0aW9uLnRvcCAtIHRoaXMuaW5pdGlhbE1vdmVZO1xyXG5cclxuICAgICAgICB0aGlzLnNldFpvb20oe1xyXG4gICAgICAgICAgICBzY2FsZTogbmV3U2NhbGUsXHJcbiAgICAgICAgICAgIGNlbnRlcjogW3hDZW50ZXIsIHlDZW50ZXJdLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBoYW5kbGVSZXNpemUgPSAoX2V2ZW50OiBhbnkpID0+IHtcclxuICAgICAgICB0aGlzLnNldEF1dG9IZWlnaHQoKTtcclxuICAgIH07XHJcblxyXG4gICAgaGFuZGxlTGltaXRab29tKCkge1xyXG4gICAgICAgIGNvbnN0IGxpbWl0Wm9vbSA9IHRoaXMubWF4U2NhbGU7XHJcbiAgICAgICAgY29uc3QgbWluU2NhbGUgPSB0aGlzLnByb3BlcnRpZXMubWluU2NhbGUgfHwgMDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2NhbGUgPiBsaW1pdFpvb20gfHwgdGhpcy5zY2FsZSA8PSBtaW5TY2FsZSkge1xyXG4gICAgICAgICAgICBjb25zdCBpbWFnZVdpZHRoID0gdGhpcy5nZXRJbWFnZVdpZHRoKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGltYWdlSGVpZ2h0ID0gdGhpcy5nZXRJbWFnZUhlaWdodCgpO1xyXG4gICAgICAgICAgICBjb25zdCBlbmxhcmdlZEltYWdlV2lkdGggPSBpbWFnZVdpZHRoICogdGhpcy5zY2FsZTtcclxuICAgICAgICAgICAgY29uc3QgZW5sYXJnZWRJbWFnZUhlaWdodCA9IGltYWdlSGVpZ2h0ICogdGhpcy5zY2FsZTtcclxuICAgICAgICAgICAgY29uc3QgbW92ZVhSYXRpbyA9IHRoaXMubW92ZVggLyAoZW5sYXJnZWRJbWFnZVdpZHRoIC0gaW1hZ2VXaWR0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG1vdmVZUmF0aW8gPSB0aGlzLm1vdmVZIC8gKGVubGFyZ2VkSW1hZ2VIZWlnaHQgLSBpbWFnZUhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5zY2FsZSA+IGxpbWl0Wm9vbSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZSA9IGxpbWl0Wm9vbTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuc2NhbGUgPD0gbWluU2NhbGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGUgPSBtaW5TY2FsZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgbmV3SW1hZ2VXaWR0aCA9IGltYWdlV2lkdGggKiB0aGlzLnNjYWxlO1xyXG4gICAgICAgICAgICBjb25zdCBuZXdJbWFnZUhlaWdodCA9IGltYWdlSGVpZ2h0ICogdGhpcy5zY2FsZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW92ZVggPSAtTWF0aC5hYnMobW92ZVhSYXRpbyAqIChuZXdJbWFnZVdpZHRoIC0gaW1hZ2VXaWR0aCkpO1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVZID0gLU1hdGguYWJzKC1tb3ZlWVJhdGlvICogKG5ld0ltYWdlSGVpZ2h0IC0gaW1hZ2VIZWlnaHQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZUxlZnQoZXZlbnQ6IGFueSwgaW5kZXg6IG51bWJlciA9IDApIHtcclxuICAgICAgICBjb25zdCBjbGllbnRYID0gdGhpcy5nZXRDbGllbnRQb3NpdGlvbihldmVudCwgaW5kZXgpLmNsaWVudFg7XHJcbiAgICAgICAgcmV0dXJuIGNsaWVudFggLSB0aGlzLmVsZW1lbnRQb3NpdGlvbi5sZWZ0O1xyXG4gICAgfVxyXG5cclxuICAgIG1vdmVUb3AoZXZlbnQ6IGFueSwgaW5kZXg6IG51bWJlciA9IDApIHtcclxuICAgICAgICBjb25zdCBjbGllbnRZID0gdGhpcy5nZXRDbGllbnRQb3NpdGlvbihldmVudCwgaW5kZXgpLmNsaWVudFk7XHJcbiAgICAgICAgcmV0dXJuIGNsaWVudFkgLSB0aGlzLmVsZW1lbnRQb3NpdGlvbi50b3A7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIERldGVjdGlvblxyXG4gICAgICovXHJcblxyXG4gICAgY2VudGVyaW5nSW1hZ2UoKSB7XHJcbiAgICAgICAgY29uc3QgaW1nID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRoaXMuZWxlbWVudFRhcmdldClbMF07XHJcbiAgICAgICAgY29uc3QgaW5pdGlhbE1vdmVYID0gdGhpcy5tb3ZlWDtcclxuICAgICAgICBjb25zdCBpbml0aWFsTW92ZVkgPSB0aGlzLm1vdmVZO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tb3ZlWSA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlWSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm1vdmVYID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVYID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbWcpIHtcclxuICAgICAgICAgICAgdGhpcy5saW1pdFBhblkoKTtcclxuICAgICAgICAgICAgdGhpcy5saW1pdFBhblgoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGltZyAmJiB0aGlzLnNjYWxlIDwgMSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tb3ZlWCA8IHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aCAqICgxIC0gdGhpcy5zY2FsZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZVggPSB0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGggKiAoMSAtIHRoaXMuc2NhbGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW5pdGlhbE1vdmVYICE9PSB0aGlzLm1vdmVYIHx8IGluaXRpYWxNb3ZlWSAhPT0gdGhpcy5tb3ZlWTtcclxuICAgIH1cclxuXHJcbiAgICBsaW1pdFBhblkoKSB7XHJcbiAgICAgICAgY29uc3QgaW1nSGVpZ2h0ID0gdGhpcy5nZXRJbWFnZUhlaWdodCgpO1xyXG4gICAgICAgIGNvbnN0IHNjYWxlZEltZ0hlaWdodCA9IGltZ0hlaWdodCAqIHRoaXMuc2NhbGU7XHJcbiAgICAgICAgY29uc3QgcGFyZW50SGVpZ2h0ID0gdGhpcy5wYXJlbnRFbGVtZW50Lm9mZnNldEhlaWdodDtcclxuICAgICAgICBjb25zdCBlbGVtZW50SGVpZ2h0ID0gdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAgICAgaWYgKHNjYWxlZEltZ0hlaWdodCA8IHBhcmVudEhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVZID0gKHBhcmVudEhlaWdodCAtIGVsZW1lbnRIZWlnaHQgKiB0aGlzLnNjYWxlKSAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgaW1nT2Zmc2V0VG9wID0gKChpbWdIZWlnaHQgLSBlbGVtZW50SGVpZ2h0KSAqIHRoaXMuc2NhbGUpIC8gMjtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdmVZID4gaW1nT2Zmc2V0VG9wKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVZID0gaW1nT2Zmc2V0VG9wO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNjYWxlZEltZ0hlaWdodCArIE1hdGguYWJzKGltZ09mZnNldFRvcCkgLSBwYXJlbnRIZWlnaHQgKyB0aGlzLm1vdmVZIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlWSA9IC0oc2NhbGVkSW1nSGVpZ2h0ICsgTWF0aC5hYnMoaW1nT2Zmc2V0VG9wKSAtIHBhcmVudEhlaWdodCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGltaXRQYW5YKCkge1xyXG4gICAgICAgIGNvbnN0IGltZ1dpZHRoID0gdGhpcy5nZXRJbWFnZVdpZHRoKCk7XHJcbiAgICAgICAgY29uc3Qgc2NhbGVkSW1nV2lkdGggPSBpbWdXaWR0aCAqIHRoaXMuc2NhbGU7XHJcbiAgICAgICAgY29uc3QgcGFyZW50V2lkdGggPSB0aGlzLnBhcmVudEVsZW1lbnQub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudFdpZHRoID0gdGhpcy5lbGVtZW50Lm9mZnNldFdpZHRoO1xyXG5cclxuICAgICAgICBpZiAoc2NhbGVkSW1nV2lkdGggPCBwYXJlbnRXaWR0aCkge1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVYID0gKHBhcmVudFdpZHRoIC0gZWxlbWVudFdpZHRoICogdGhpcy5zY2FsZSkgLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGltZ09mZnNldExlZnQgPSAoKGltZ1dpZHRoIC0gZWxlbWVudFdpZHRoKSAqIHRoaXMuc2NhbGUpIC8gMjtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdmVYID4gaW1nT2Zmc2V0TGVmdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlWCA9IGltZ09mZnNldExlZnQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2NhbGVkSW1nV2lkdGggKyBNYXRoLmFicyhpbWdPZmZzZXRMZWZ0KSAtIHBhcmVudFdpZHRoICsgdGhpcy5tb3ZlWCA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZVggPSAtKGltZ1dpZHRoICogdGhpcy5zY2FsZSArIE1hdGguYWJzKGltZ09mZnNldExlZnQpIC0gcGFyZW50V2lkdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEJhc2ljU3R5bGVzKCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmp1c3RpZnlDb250ZW50ID0gJ2NlbnRlcic7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnRyYW5zZm9ybU9yaWdpbiA9ICcwIDAnO1xyXG4gICAgICAgIHRoaXMuc2V0SW1hZ2VTaXplKCk7XHJcbiAgICAgICAgdGhpcy5zZXREcmFnZ2FibGVJbWFnZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZUJhc2ljU3R5bGVzKCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmFsaWduSXRlbXMgPSAnJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gJyc7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVJbWFnZVNpemUoKTtcclxuICAgICAgICB0aGlzLnJlbW92ZURyYWdnYWJsZUltYWdlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0RHJhZ2dhYmxlSW1hZ2UoKSB7XHJcbiAgICAgICAgY29uc3QgaW1nRWxlbWVudCA9IHRoaXMuZ2V0SW1hZ2VFbGVtZW50KCk7XHJcblxyXG4gICAgICAgIGlmIChpbWdFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGltZ0VsZW1lbnQuZHJhZ2dhYmxlID0gdGhpcy5wcm9wZXJ0aWVzLmRyYWdnYWJsZUltYWdlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVEcmFnZ2FibGVJbWFnZSgpIHtcclxuICAgICAgICBjb25zdCBpbWdFbGVtZW50ID0gdGhpcy5nZXRJbWFnZUVsZW1lbnQoKTtcclxuXHJcbiAgICAgICAgaWYgKGltZ0VsZW1lbnQpIHtcclxuICAgICAgICAgICAgaW1nRWxlbWVudC5kcmFnZ2FibGUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRJbWFnZVNpemUoKSB7XHJcbiAgICAgICAgY29uc3QgaW1nRWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0aGlzLmVsZW1lbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoaW1nRWxlbWVudC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaW1nRWxlbWVudFswXS5zdHlsZS5tYXhXaWR0aCA9ICcxMDAlJztcclxuICAgICAgICAgICAgaW1nRWxlbWVudFswXS5zdHlsZS5tYXhIZWlnaHQgPSAnMTAwJSc7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldEF1dG9IZWlnaHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0QXV0b0hlaWdodCgpIHtcclxuICAgICAgICBjb25zdCBpbWdFbGVtZW50ID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRoaXMuZWxlbWVudFRhcmdldCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5wcm9wZXJ0aWVzLmF1dG9IZWlnaHQgfHwgIWltZ0VsZW1lbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGltZ05hdHVyYWxXaWR0aCA9IGltZ0VsZW1lbnRbMF0uZ2V0QXR0cmlidXRlKCd3aWR0aCcpO1xyXG4gICAgICAgIGNvbnN0IGltZ05hdHVyYWxIZWlnaHQgPSBpbWdFbGVtZW50WzBdLmdldEF0dHJpYnV0ZSgnaGVpZ2h0Jyk7XHJcbiAgICAgICAgY29uc3Qgc2l6ZVJhdGlvID0gaW1nTmF0dXJhbFdpZHRoIC8gaW1nTmF0dXJhbEhlaWdodDtcclxuICAgICAgICBjb25zdCBwYXJlbnRXaWR0aCA9IHRoaXMucGFyZW50RWxlbWVudC5vZmZzZXRXaWR0aDtcclxuXHJcbiAgICAgICAgaW1nRWxlbWVudFswXS5zdHlsZS5tYXhIZWlnaHQgPSBwYXJlbnRXaWR0aCAvIHNpemVSYXRpbyArICdweCc7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlSW1hZ2VTaXplKCkge1xyXG4gICAgICAgIGNvbnN0IGltZ0VsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGhpcy5lbGVtZW50VGFyZ2V0KTtcclxuXHJcbiAgICAgICAgaWYgKGltZ0VsZW1lbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGltZ0VsZW1lbnRbMF0uc3R5bGUubWF4V2lkdGggPSAnJztcclxuICAgICAgICAgICAgaW1nRWxlbWVudFswXS5zdHlsZS5tYXhIZWlnaHQgPSAnJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RWxlbWVudFBvc2l0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudFBvc2l0aW9uID0gdGhpcy5lbGVtZW50LnBhcmVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VG91Y2hzdGFydFBvc2l0aW9uKGV2ZW50OiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IGNsaWVudFgsIGNsaWVudFkgfSA9IHRoaXMuZ2V0Q2xpZW50UG9zaXRpb24oZXZlbnQpO1xyXG5cclxuICAgICAgICB0aGlzLnN0YXJ0WCA9IGNsaWVudFggLSB0aGlzLmVsZW1lbnRQb3NpdGlvbi5sZWZ0O1xyXG4gICAgICAgIHRoaXMuc3RhcnRZID0gY2xpZW50WSAtIHRoaXMuZWxlbWVudFBvc2l0aW9uLnRvcDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDbGllbnRQb3NpdGlvbihldmVudDogYW55LCBpbmRleDogbnVtYmVyID0gMCkge1xyXG4gICAgICAgIGxldCBjbGllbnRYO1xyXG4gICAgICAgIGxldCBjbGllbnRZO1xyXG5cclxuICAgICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ3RvdWNoc3RhcnQnIHx8IGV2ZW50LnR5cGUgPT09ICd0b3VjaG1vdmUnKSB7XHJcbiAgICAgICAgICAgIGNsaWVudFggPSBldmVudC50b3VjaGVzW2luZGV4XS5jbGllbnRYO1xyXG4gICAgICAgICAgICBjbGllbnRZID0gZXZlbnQudG91Y2hlc1tpbmRleF0uY2xpZW50WTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdtb3VzZWRvd24nIHx8IGV2ZW50LnR5cGUgPT09ICdtb3VzZW1vdmUnKSB7XHJcbiAgICAgICAgICAgIGNsaWVudFggPSBldmVudC5jbGllbnRYO1xyXG4gICAgICAgICAgICBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNsaWVudFgsXHJcbiAgICAgICAgICAgIGNsaWVudFksXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXNldFNjYWxlKCkge1xyXG4gICAgICAgIHRoaXMuc2NhbGUgPSAxO1xyXG4gICAgICAgIHRoaXMubW92ZVggPSAwO1xyXG4gICAgICAgIHRoaXMubW92ZVkgPSAwO1xyXG4gICAgICAgIHRoaXMudXBkYXRlSW5pdGlhbFZhbHVlcygpO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtRWxlbWVudCh0aGlzLnByb3BlcnRpZXMudHJhbnNpdGlvbkR1cmF0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVJbml0aWFsVmFsdWVzKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbFNjYWxlID0gdGhpcy5zY2FsZTtcclxuICAgICAgICB0aGlzLmluaXRpYWxNb3ZlWCA9IHRoaXMubW92ZVg7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsTW92ZVkgPSB0aGlzLm1vdmVZO1xyXG4gICAgICAgIGNvbnN0IGV2ZW50ID0ge1xyXG4gICAgICAgICAgICBzY2FsZTogdGhpcy5pbml0aWFsU2NhbGUsXHJcbiAgICAgICAgICAgIG1vdmVYOiB0aGlzLmluaXRpYWxNb3ZlWCxcclxuICAgICAgICAgICAgbW92ZVk6ICB0aGlzLmluaXRpYWxNb3ZlWVxyXG4gICAgICAgIH0gYXMgWm9vbUV2ZW50XHJcbiAgICAgICAgdGhpcy5vblpvb21DaGFuZ2UuZW1pdChldmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RGlzdGFuY2UodG91Y2hlczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh0b3VjaGVzWzBdLnBhZ2VYIC0gdG91Y2hlc1sxXS5wYWdlWCwgMikgKyBNYXRoLnBvdyh0b3VjaGVzWzBdLnBhZ2VZIC0gdG91Y2hlc1sxXS5wYWdlWSwgMikpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEltYWdlSGVpZ2h0KCkge1xyXG4gICAgICAgIGNvbnN0IGltZyA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0aGlzLmVsZW1lbnRUYXJnZXQpWzBdO1xyXG4gICAgICAgIHJldHVybiBpbWcub2Zmc2V0SGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldEltYWdlV2lkdGgoKSB7XHJcbiAgICAgICAgY29uc3QgaW1nID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRoaXMuZWxlbWVudFRhcmdldClbMF07XHJcbiAgICAgICAgcmV0dXJuIGltZy5vZmZzZXRXaWR0aDtcclxuICAgIH1cclxuXHJcbiAgICB0cmFuc2Zvcm1FbGVtZW50KGR1cmF0aW9uOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNpdGlvbiA9ICdhbGwgJyArIGR1cmF0aW9uICsgJ21zJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID1cclxuICAgICAgICAgICAgJ21hdHJpeCgnICsgTnVtYmVyKHRoaXMuc2NhbGUpICsgJywgMCwgMCwgJyArIE51bWJlcih0aGlzLnNjYWxlKSArICcsICcgKyBOdW1iZXIodGhpcy5tb3ZlWCkgKyAnLCAnICsgTnVtYmVyKHRoaXMubW92ZVkpICsgJyknO1xyXG4gICAgfVxyXG5cclxuICAgIGlzVG91Y2hTY3JlZW4oKSB7XHJcbiAgICAgICAgY29uc3QgcHJlZml4ZXMgPSAnIC13ZWJraXQtIC1tb3otIC1vLSAtbXMtICcuc3BsaXQoJyAnKTtcclxuXHJcbiAgICAgICAgaWYgKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGluY2x1ZGUgdGhlICdoZWFydHonIGFzIGEgd2F5IHRvIGhhdmUgYSBub24gbWF0Y2hpbmcgTVEgdG8gaGVscCB0ZXJtaW5hdGUgdGhlIGpvaW5cclxuICAgICAgICAvLyBodHRwczovL2dpdC5pby92em5GSFxyXG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gWycoJywgcHJlZml4ZXMuam9pbigndG91Y2gtZW5hYmxlZCksKCcpLCAnaGVhcnR6JywgJyknXS5qb2luKCcnKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRNYXRjaE1lZGlhKHF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRNYXRjaE1lZGlhKHF1ZXJ5OiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93Lm1hdGNoTWVkaWEocXVlcnkpLm1hdGNoZXM7XHJcbiAgICB9XHJcblxyXG4gICAgaXNEcmFnZ2luZygpIHtcclxuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzLmRpc2FibGVQYW4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaW1nSGVpZ2h0ID0gdGhpcy5nZXRJbWFnZUhlaWdodCgpO1xyXG4gICAgICAgIGNvbnN0IGltZ1dpZHRoID0gdGhpcy5nZXRJbWFnZVdpZHRoKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNjYWxlID4gMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW1nSGVpZ2h0ICogdGhpcy5zY2FsZSA+IHRoaXMucGFyZW50RWxlbWVudC5vZmZzZXRIZWlnaHQgfHwgaW1nV2lkdGggKiB0aGlzLnNjYWxlID4gdGhpcy5wYXJlbnRFbGVtZW50Lm9mZnNldFdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zY2FsZSA9PT0gMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW1nSGVpZ2h0ID4gdGhpcy5wYXJlbnRFbGVtZW50Lm9mZnNldEhlaWdodCB8fCBpbWdXaWR0aCA+IHRoaXMucGFyZW50RWxlbWVudC5vZmZzZXRXaWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZGV0ZWN0TGltaXRab29tKCkge1xyXG4gICAgICAgIHRoaXMubWF4U2NhbGUgPSB0aGlzLmRlZmF1bHRNYXhTY2FsZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcy5saW1pdFpvb20gPT09ICdvcmlnaW5hbCBpbWFnZSBzaXplJyAmJiB0aGlzLmVsZW1lbnRUYXJnZXQgPT09ICdJTUcnKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGFyZSB3YWl0aW5nIGZvciB0aGUgZWxlbWVudCB3aXRoIHRoZSBpbWFnZSB0byBiZSBhdmFpbGFibGVcclxuICAgICAgICAgICAgdGhpcy5wb2xsTGltaXRab29tRm9yT3JpZ2luYWxJbWFnZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwb2xsTGltaXRab29tRm9yT3JpZ2luYWxJbWFnZSgpIHtcclxuICAgICAgICBsZXQgcG9sbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgbGV0IG1heFNjYWxlRm9yT3JpZ2luYWxJbWFnZSA9IHRoaXMuZ2V0TWF4U2NhbGVGb3JPcmlnaW5hbEltYWdlKCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWF4U2NhbGVGb3JPcmlnaW5hbEltYWdlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhTY2FsZSA9IG1heFNjYWxlRm9yT3JpZ2luYWxJbWFnZTtcclxuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwocG9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCAxMCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWF4U2NhbGVGb3JPcmlnaW5hbEltYWdlKCkge1xyXG4gICAgICAgIGxldCBtYXhTY2FsZSE6IG51bWJlcjtcclxuICAgICAgICBsZXQgaW1nID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXTtcclxuXHJcbiAgICAgICAgaWYgKGltZy5uYXR1cmFsV2lkdGggJiYgaW1nLm9mZnNldFdpZHRoKSB7XHJcbiAgICAgICAgICAgIG1heFNjYWxlID0gaW1nLm5hdHVyYWxXaWR0aCAvIGltZy5vZmZzZXRXaWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXhTY2FsZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRJbWFnZUVsZW1lbnQoKSB7XHJcbiAgICAgICAgY29uc3QgaW1nRWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0aGlzLmVsZW1lbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoaW1nRWxlbWVudC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGltZ0VsZW1lbnRbMF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZVpvb20oZXZlbnQ6IGFueSA9IGZhbHNlKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKCd0b2dnbGVab29tJywgZXZlbnQpXHJcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbFNjYWxlID09PSAxKSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudCAmJiBldmVudC5jaGFuZ2VkVG91Y2hlcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcy5kb3VibGVUYXBTY2FsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZWRUb3VjaGVzID0gZXZlbnQuY2hhbmdlZFRvdWNoZXM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5pbml0aWFsU2NhbGUgKiB0aGlzLnByb3BlcnRpZXMuZG91YmxlVGFwU2NhbGU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVYID1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxNb3ZlWCAtIChjaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYIC0gdGhpcy5lbGVtZW50UG9zaXRpb24ubGVmdCkgKiAodGhpcy5wcm9wZXJ0aWVzLmRvdWJsZVRhcFNjYWxlIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVZID1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxNb3ZlWSAtIChjaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZIC0gdGhpcy5lbGVtZW50UG9zaXRpb24udG9wKSAqICh0aGlzLnByb3BlcnRpZXMuZG91YmxlVGFwU2NhbGUgLSAxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCB6b29tQ29udHJvbFNjYWxlID0gdGhpcy5wcm9wZXJ0aWVzLnpvb21Db250cm9sU2NhbGUgfHwgMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLmluaXRpYWxTY2FsZSAqICh6b29tQ29udHJvbFNjYWxlICsgMSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVYID0gdGhpcy5pbml0aWFsTW92ZVggLSAodGhpcy5lbGVtZW50Lm9mZnNldFdpZHRoICogKHRoaXMuc2NhbGUgLSAxKSkgLyAyO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlWSA9IHRoaXMuaW5pdGlhbE1vdmVZIC0gKHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQgKiAodGhpcy5zY2FsZSAtIDEpKSAvIDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2VudGVyaW5nSW1hZ2UoKTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVJbml0aWFsVmFsdWVzKCk7XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtRWxlbWVudCh0aGlzLnByb3BlcnRpZXMudHJhbnNpdGlvbkR1cmF0aW9uKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlc2V0U2NhbGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RlcFpvb20obW9kZTogJ0lOJyB8ICdPVVQnLCBwb2ludDogTW91c2Vab29tUG9pbnQgPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdzdGVwWm9vbScpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHN0ZXBab29tRmFjdG9yID0gdGhpcy5wcm9wZXJ0aWVzLnN0ZXBab29tRmFjdG9yIHx8IDA7XHJcbiAgICAgICAgICAgIGxldCB6b29tRmFjdG9yID0gMFxyXG4gICAgICAgICAgICBpZihtb2RlID09PSAnT1VUJykge1xyXG4gICAgICAgICAgICAgICAgem9vbUZhY3RvciA9IC1zdGVwWm9vbUZhY3RvcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihtb2RlID09PSAnSU4nKSB7XHJcbiAgICAgICAgICAgICAgICB6b29tRmFjdG9yID0gc3RlcFpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IG5ld1NjYWxlPSB0aGlzLmluaXRpYWxTY2FsZSArIHpvb21GYWN0b3I7XHJcblxyXG4gICAgICAgICAgICAvKiBSb3VuZCB2YWx1ZSAqL1xyXG4gICAgICAgICAgICBpZiAobmV3U2NhbGUgPCAxICsgc3RlcFpvb21GYWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIG5ld1NjYWxlID0gMTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdTY2FsZSA8IHRoaXMubWF4U2NhbGUgJiYgbmV3U2NhbGUgPiB0aGlzLm1heFNjYWxlIC0gc3RlcFpvb21GYWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIG5ld1NjYWxlID0gdGhpcy5tYXhTY2FsZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG5ld1NjYWxlIDwgMSB8fCBuZXdTY2FsZSA+IHRoaXMubWF4U2NhbGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG5ld1NjYWxlID09PSB0aGlzLnNjYWxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0RWxlbWVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgPSBuZXdTY2FsZTtcclxuXHJcbiAgICAgICAgICAgIC8qIEdldCBjdXJzb3IgcG9zaXRpb24gb3ZlciBpbWFnZSAqL1xyXG4gICAgICAgICAgICBsZXQgbmV3Q2VudGVyID0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgIGlmKHBvaW50KXtcclxuICAgICAgICAgICAgICAgIGxldCB4Q2VudGVyID0gcG9pbnQuY2xpZW50WCAtIHRoaXMuZWxlbWVudFBvc2l0aW9uLmxlZnQgLSB0aGlzLmluaXRpYWxNb3ZlWDtcclxuICAgICAgICAgICAgICAgIGxldCB5Q2VudGVyID0gcG9pbnQuY2xpZW50WSAtIHRoaXMuZWxlbWVudFBvc2l0aW9uLnRvcCAtIHRoaXMuaW5pdGlhbE1vdmVZO1xyXG4gICAgICAgICAgICAgICAgbmV3Q2VudGVyID0gW3hDZW50ZXIsIHlDZW50ZXJdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldFpvb20oe1xyXG4gICAgICAgICAgICAgICAgc2NhbGU6IG5ld1NjYWxlLFxyXG4gICAgICAgICAgICAgICAgY2VudGVyOiBuZXdDZW50ZXJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Wm9vbShwcm9wZXJ0aWVzOiB7IHNjYWxlOiBudW1iZXI7IGNlbnRlcj86IG51bWJlcltdIH0pIHtcclxuICAgICAgICB0aGlzLnNjYWxlID0gcHJvcGVydGllcy5zY2FsZTtcclxuXHJcbiAgICAgICAgbGV0IHhDZW50ZXI7XHJcbiAgICAgICAgbGV0IHlDZW50ZXI7XHJcbiAgICAgICAgbGV0IHZpc2libGVBcmVhV2lkdGggPSB0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgbGV0IHZpc2libGVBcmVhSGVpZ2h0ID0gdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcclxuICAgICAgICBsZXQgc2NhbGluZ1BlcmNlbnQgPSAodmlzaWJsZUFyZWFXaWR0aCAqIHRoaXMuc2NhbGUpIC8gKHZpc2libGVBcmVhV2lkdGggKiB0aGlzLmluaXRpYWxTY2FsZSk7XHJcblxyXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLmNlbnRlcikge1xyXG4gICAgICAgICAgICB4Q2VudGVyID0gcHJvcGVydGllcy5jZW50ZXJbMF07XHJcbiAgICAgICAgICAgIHlDZW50ZXIgPSBwcm9wZXJ0aWVzLmNlbnRlclsxXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB4Q2VudGVyID0gdmlzaWJsZUFyZWFXaWR0aCAvIDIgLSB0aGlzLmluaXRpYWxNb3ZlWDtcclxuICAgICAgICAgICAgeUNlbnRlciA9IHZpc2libGVBcmVhSGVpZ2h0IC8gMiAtIHRoaXMuaW5pdGlhbE1vdmVZO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5tb3ZlWCA9IHRoaXMuaW5pdGlhbE1vdmVYIC0gKHNjYWxpbmdQZXJjZW50ICogeENlbnRlciAtIHhDZW50ZXIpO1xyXG4gICAgICAgIHRoaXMubW92ZVkgPSB0aGlzLmluaXRpYWxNb3ZlWSAtIChzY2FsaW5nUGVyY2VudCAqIHlDZW50ZXIgLSB5Q2VudGVyKTtcclxuXHJcbiAgICAgICAgdGhpcy5jZW50ZXJpbmdJbWFnZSgpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlSW5pdGlhbFZhbHVlcygpO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtRWxlbWVudCh0aGlzLnByb3BlcnRpZXMudHJhbnNpdGlvbkR1cmF0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBhbGlnbkltYWdlKCkge1xyXG4gICAgICAgIGNvbnN0IGlzTW92ZUNoYW5nZWQgPSB0aGlzLmNlbnRlcmluZ0ltYWdlKCk7XHJcblxyXG4gICAgICAgIGlmIChpc01vdmVDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlSW5pdGlhbFZhbHVlcygpO1xyXG4gICAgICAgICAgICB0aGlzLnRyYW5zZm9ybUVsZW1lbnQodGhpcy5wcm9wZXJ0aWVzLnRyYW5zaXRpb25EdXJhdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRlc3Ryb3koKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVCYXNpY1N0eWxlcygpO1xyXG4gICAgICAgIHRoaXMudG91Y2hlcy5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UHJvcGVydGllc1ZhbHVlKHByb3BlcnR5TmFtZTogUHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcyAmJiB0aGlzLnByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiJdfQ==