import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { defaultProperties, backwardCompatibilityProperties } from './properties';
import { IvyPinch } from './ivypinch';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
export const _defaultComponentProperties = {
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
export { PinchZoomComponent };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGluY2gtem9vbS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtcGluY2gtem9vbS9zcmMvbGliL3BpbmNoLXpvb20uY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LXBpbmNoLXpvb20vc3JjL2xpYi9waW5jaC16b29tLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxTQUFTLEVBRVQsWUFBWSxFQUNaLFdBQVcsRUFDWCxLQUFLLEVBQ2MsTUFBTSxFQUU1QixNQUFNLGVBQWUsQ0FBQztBQUd2QixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsK0JBQStCLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEYsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQzs7O0FBRXRDLE1BQU0sQ0FBQyxNQUFNLDJCQUEyQixHQUF3QjtJQUM1RCxRQUFRLEVBQUUsUUFBUTtJQUNsQixrQkFBa0IsRUFBRSxNQUFNO0lBQzFCLGVBQWUsRUFBRSxrQkFBa0I7Q0FDdEMsQ0FBQztBQUlGLE1BTWEsa0JBQWtCO0lBc0xQO0lBckxwQiwwQkFBMEIsQ0FBdUI7SUFDekMsU0FBUyxDQUFXO0lBQ3BCLFdBQVcsQ0FBdUI7SUFDbEMsd0JBQXdCLENBQXFCO0lBQzdDLG1CQUFtQixDQUFVO0lBQzdCLFVBQVUsQ0FBVztJQUNyQixlQUFlLENBQVU7SUFDekIsWUFBWSxDQUFXO0lBQ3ZCLFVBQVUsQ0FBa0M7SUFFcEQsSUFBeUIsVUFBVSxDQUFDLEtBQTBCO1FBQzFELElBQUksS0FBSyxFQUFFO1lBQ1AsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7U0FDNUI7SUFDTCxDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFFRCxxQkFBcUI7SUFDckIsSUFBa0MsdUNBQXVDLENBQUMs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O3NCQURmLFdBQVc7dUJBQUMsZ0JBQWdCO2dCQU16QixtQkFBbUI7c0JBRHRCLFdBQVc7dUJBQUMsd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICAgIENvbXBvbmVudCxcclxuICAgIEVsZW1lbnRSZWYsXHJcbiAgICBFdmVudEVtaXR0ZXIsXHJcbiAgICBIb3N0QmluZGluZyxcclxuICAgIElucHV0LFxyXG4gICAgT25EZXN0cm95LCBPbkluaXQsIE91dHB1dCxcclxuICAgIFNpbXBsZUNoYW5nZXNcclxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuXHJcbmltcG9ydCB7TW91c2Vab29tUG9pbnQsIFBpbmNoWm9vbVByb3BlcnRpZXMsIFpvb21FdmVudH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcclxuaW1wb3J0IHsgZGVmYXVsdFByb3BlcnRpZXMsIGJhY2t3YXJkQ29tcGF0aWJpbGl0eVByb3BlcnRpZXMgfSBmcm9tICcuL3Byb3BlcnRpZXMnO1xyXG5pbXBvcnQgeyBJdnlQaW5jaCB9IGZyb20gJy4vaXZ5cGluY2gnO1xyXG5cclxuZXhwb3J0IGNvbnN0IF9kZWZhdWx0Q29tcG9uZW50UHJvcGVydGllczogUGluY2hab29tUHJvcGVydGllcyA9IHtcclxuICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcclxuICAgIGRpc2FibGVab29tQ29udHJvbDogJ2F1dG8nLFxyXG4gICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgwLDAsMCwwLjg1KScsXHJcbn07XHJcblxyXG50eXBlIFByb3BlcnR5TmFtZSA9IGtleW9mIFBpbmNoWm9vbVByb3BlcnRpZXM7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICAgIHNlbGVjdG9yOiAncGluY2gtem9vbSwgW3BpbmNoLXpvb21dJyxcclxuICAgIGV4cG9ydEFzOiAncGluY2hab29tJyxcclxuICAgIHRlbXBsYXRlVXJsOiAnLi9waW5jaC16b29tLmNvbXBvbmVudC5odG1sJyxcclxuICAgIHN0eWxlVXJsczogWycuL3BpbmNoLXpvb20uY29tcG9uZW50LnNhc3MnXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIFBpbmNoWm9vbUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcclxuICAgIGRlZmF1bHRDb21wb25lbnRQcm9wZXJ0aWVzITogUGluY2hab29tUHJvcGVydGllcztcclxuICAgIHByaXZhdGUgcGluY2hab29tOiBJdnlQaW5jaDtcclxuICAgIHByaXZhdGUgX3Byb3BlcnRpZXMhOiBQaW5jaFpvb21Qcm9wZXJ0aWVzO1xyXG4gICAgcHJpdmF0ZSB6b29tQ29udHJvbFBvc2l0aW9uQ2xhc3M6IHN0cmluZyB8IHVuZGVmaW5lZDtcclxuICAgIHByaXZhdGUgX3RyYW5zaXRpb25EdXJhdGlvbiE6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RvdWJsZVRhcCE6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9kb3VibGVUYXBTY2FsZSE6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2F1dG9ab29tT3V0ITogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX2xpbWl0Wm9vbSE6IG51bWJlciB8ICdvcmlnaW5hbCBpbWFnZSBzaXplJztcclxuXHJcbiAgICBASW5wdXQoJ3Byb3BlcnRpZXMnKSBzZXQgcHJvcGVydGllcyh2YWx1ZTogUGluY2hab29tUHJvcGVydGllcykge1xyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9wcm9wZXJ0aWVzID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCBwcm9wZXJ0aWVzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9wZXJ0aWVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRyYW5zaXRpb25EdXJhdGlvblxyXG4gICAgQElucHV0KCd0cmFuc2l0aW9uLWR1cmF0aW9uJykgc2V0IHRyYW5zaXRpb25EdXJhdGlvbkJhY2t3YXJkQ29tcGF0aWJpbGl0eSh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3RyYW5zaXRpb25EdXJhdGlvbiA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBASW5wdXQoJ3RyYW5zaXRpb25EdXJhdGlvbicpIHNldCB0cmFuc2l0aW9uRHVyYXRpb24odmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl90cmFuc2l0aW9uRHVyYXRpb24gPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRyYW5zaXRpb25EdXJhdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJhbnNpdGlvbkR1cmF0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvdWJsZVRhcFxyXG4gICAgQElucHV0KCdkb3VibGUtdGFwJykgc2V0IGRvdWJsZVRhcEJhY2t3YXJkQ29tcGF0aWJpbGl0eSh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9kb3VibGVUYXAgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQElucHV0KCdkb3VibGVUYXAnKSBzZXQgZG91YmxlVGFwKHZhbHVlOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RvdWJsZVRhcCA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgZG91YmxlVGFwKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kb3VibGVUYXA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZG91YmxlVGFwU2NhbGVcclxuICAgIEBJbnB1dCgnZG91YmxlLXRhcC1zY2FsZScpIHNldCBkb3VibGVUYXBTY2FsZUJhY2t3YXJkQ29tcGF0aWJpbGl0eSh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RvdWJsZVRhcFNjYWxlID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEBJbnB1dCgnZG91YmxlVGFwU2NhbGUnKSBzZXQgZG91YmxlVGFwU2NhbGUodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9kb3VibGVUYXBTY2FsZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgZG91YmxlVGFwU2NhbGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RvdWJsZVRhcFNjYWxlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGF1dG9ab29tT3V0XHJcbiAgICBASW5wdXQoJ2F1dG8tem9vbS1vdXQnKSBzZXQgYXV0b1pvb21PdXRCYWNrd2FyZENvbXBhdGliaWxpdHkodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fYXV0b1pvb21PdXQgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQElucHV0KCdhdXRvWm9vbU91dCcpIHNldCBhdXRvWm9vbU91dCh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9hdXRvWm9vbU91dCA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgYXV0b1pvb21PdXQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F1dG9ab29tT3V0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGxpbWl0Wm9vbVxyXG4gICAgQElucHV0KCdsaW1pdC16b29tJykgc2V0IGxpbWl0Wm9vbUJhY2t3YXJkQ29tcGF0aWJpbGl0eSh2YWx1ZTogbnVtYmVyIHwgJ29yaWdpbmFsIGltYWdlIHNpemUnKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xpbWl0Wm9vbSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBASW5wdXQoJ2xpbWl0Wm9vbScpIHNldCBsaW1pdFpvb20odmFsdWU6IG51bWJlciB8ICdvcmlnaW5hbCBpbWFnZSBzaXplJykge1xyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9saW1pdFpvb20gPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGxpbWl0Wm9vbSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbGltaXRab29tO1xyXG4gICAgfVxyXG5cclxuICAgIEBJbnB1dCgpIGRpc2FibGVkITogYm9vbGVhbjtcclxuICAgIEBJbnB1dCgpIGRpc2FibGVQYW4hOiBib29sZWFuO1xyXG4gICAgQElucHV0KCkgb3ZlcmZsb3chOiAnaGlkZGVuJyB8ICd2aXNpYmxlJztcclxuICAgIEBJbnB1dCgpIHpvb21Db250cm9sU2NhbGUhOiBudW1iZXI7XHJcbiAgICBASW5wdXQoKSBkaXNhYmxlWm9vbUNvbnRyb2whOiAnZGlzYWJsZScgfCAnbmV2ZXInIHwgJ2F1dG8nO1xyXG4gICAgQElucHV0KCkgYmFja2dyb3VuZENvbG9yITogc3RyaW5nO1xyXG4gICAgQElucHV0KCkgbGltaXRQYW4hOiBib29sZWFuO1xyXG4gICAgQElucHV0KCkgbWluUGFuU2NhbGUhOiBudW1iZXI7XHJcbiAgICBASW5wdXQoKSBtaW5TY2FsZSE6IG51bWJlcjtcclxuICAgIEBJbnB1dCgpIGxpc3RlbmVycyE6ICdhdXRvJyB8ICdtb3VzZSBhbmQgdG91Y2gnO1xyXG4gICAgQElucHV0KCkgd2hlZWwhOiBib29sZWFuO1xyXG4gICAgQElucHV0KCkgYXV0b0hlaWdodCE6IGJvb2xlYW47XHJcbiAgICBASW5wdXQoKSBzdGVwWm9vbUZhY3RvciE6IG51bWJlcjtcclxuICAgIEBJbnB1dCgpIHdoZWVsWm9vbUZhY3RvciE6IG51bWJlcjtcclxuICAgIEBJbnB1dCgpIGRyYWdnYWJsZUltYWdlITogYm9vbGVhbjtcclxuXHJcbiAgICBAT3V0cHV0KCkgb25ab29tQ2hhbmdlOiBFdmVudEVtaXR0ZXI8Wm9vbUV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8Wm9vbUV2ZW50PigpO1xyXG5cclxuICAgIEBIb3N0QmluZGluZygnc3R5bGUub3ZlcmZsb3cnKVxyXG4gICAgZ2V0IGhvc3RPdmVyZmxvdygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzWydvdmVyZmxvdyddO1xyXG4gICAgfVxyXG5cclxuICAgIEBIb3N0QmluZGluZygnc3R5bGUuYmFja2dyb3VuZC1jb2xvcicpXHJcbiAgICBnZXQgaG9zdEJhY2tncm91bmRDb2xvcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzWydiYWNrZ3JvdW5kQ29sb3InXTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaXNUb3VjaFNjcmVlbigpIHtcclxuICAgICAgICB2YXIgcHJlZml4ZXMgPSAnIC13ZWJraXQtIC1tb3otIC1vLSAtbXMtICcuc3BsaXQoJyAnKTtcclxuICAgICAgICB2YXIgbXEgPSBmdW5jdGlvbiAocXVlcnk6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93Lm1hdGNoTWVkaWEocXVlcnkpLm1hdGNoZXM7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGluY2x1ZGUgdGhlICdoZWFydHonIGFzIGEgd2F5IHRvIGhhdmUgYSBub24gbWF0Y2hpbmcgTVEgdG8gaGVscCB0ZXJtaW5hdGUgdGhlIGpvaW5cclxuICAgICAgICAvLyBodHRwczovL2dpdC5pby92em5GSFxyXG4gICAgICAgIHZhciBxdWVyeSA9IFsnKCcsIHByZWZpeGVzLmpvaW4oJ3RvdWNoLWVuYWJsZWQpLCgnKSwgJ2hlYXJ0eicsICcpJ10uam9pbignJyk7XHJcbiAgICAgICAgcmV0dXJuIG1xKHF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaXNEcmFnZ2luZygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5waW5jaFpvb20gPyB0aGlzLnBpbmNoWm9vbS5pc0RyYWdnaW5nKCkgOiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGlzRGlzYWJsZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1snZGlzYWJsZWQnXTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2NhbGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGluY2hab29tLnNjYWxlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBpc1pvb21lZEluKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlID4gMTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2NhbGVMZXZlbCgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLnNjYWxlIC8gdGhpcy5fem9vbUNvbnRyb2xTY2FsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG1heFNjYWxlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBpbmNoWm9vbS5tYXhTY2FsZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaXNab29tTGltaXRSZWFjaGVkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlID49IHRoaXMubWF4U2NhbGU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IF96b29tQ29udHJvbFNjYWxlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb3BlcnRpZXNWYWx1ZSgnem9vbUNvbnRyb2xTY2FsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZikge1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdENvbXBvbmVudFByb3BlcnRpZXMgPSB0aGlzLmdldERlZmF1bHRDb21wb25lbnRQcm9wZXJ0aWVzKCk7XHJcbiAgICAgICAgdGhpcy5hcHBseVByb3BlcnRpZXNEZWZhdWx0KHRoaXMuZGVmYXVsdENvbXBvbmVudFByb3BlcnRpZXMsIHt9KTtcclxuICAgIH1cclxuXHJcbiAgICBuZ09uSW5pdCgpIHtcclxuICAgICAgICB0aGlzLmluaXRQaW5jaFpvb20oKTtcclxuXHJcbiAgICAgICAgLyogQ2FsbHMgdGhlIG1ldGhvZCB1bnRpbCB0aGUgaW1hZ2Ugc2l6ZSBpcyBhdmFpbGFibGUgKi9cclxuICAgICAgICB0aGlzLmRldGVjdExpbWl0Wm9vbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlzQ29udHJvbCgpIHtcclxuICAgICAgICBpZiAodGhpcy5pc0Rpc2FibGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXNbJ2Rpc2FibGVab29tQ29udHJvbCddID09PSAnZGlzYWJsZScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNUb3VjaFNjcmVlbiAmJiB0aGlzLnByb3BlcnRpZXNbJ2Rpc2FibGVab29tQ29udHJvbCddID09PSAnYXV0bycpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xyXG4gICAgICAgIGxldCBjaGFuZ2VkUHJvcGVydGllcyA9IHRoaXMuZ2V0UHJvcGVydGllcyhjaGFuZ2VzKTtcclxuICAgICAgICBjaGFuZ2VkUHJvcGVydGllcyA9IHRoaXMucmVuYW1lUHJvcGVydGllcyhjaGFuZ2VkUHJvcGVydGllcyk7XHJcblxyXG4gICAgICAgIHRoaXMuYXBwbHlQcm9wZXJ0aWVzRGVmYXVsdCh0aGlzLmRlZmF1bHRDb21wb25lbnRQcm9wZXJ0aWVzLCBjaGFuZ2VkUHJvcGVydGllcyk7XHJcbiAgICB9XHJcblxyXG4gICAgbmdPbkRlc3Ryb3koKSB7XHJcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlWm9vbSgpIHtcclxuICAgICAgICB0aGlzLnBpbmNoWm9vbS50b2dnbGVab29tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgem9vbVBvaW50KHBvaW50OiBNb3VzZVpvb21Qb2ludCkge1xyXG4gICAgICAgIHRoaXMucGluY2hab29tLnN0ZXBab29tKCdJTicsIHBvaW50KTtcclxuICAgIH1cclxuXHJcbiAgICB6b29tSW4oKSB7XHJcbiAgICAgICAgdGhpcy5waW5jaFpvb20uc3RlcFpvb20oJ0lOJyk7XHJcbiAgICB9XHJcblxyXG4gICAgem9vbU91dCgpIHtcclxuICAgICAgICB0aGlzLnBpbmNoWm9vbS5zdGVwWm9vbSgnT1VUJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzZXRab29tKCkge1xyXG4gICAgICAgIHRoaXMucGluY2hab29tLnJlc2V0U2NhbGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBkZXN0cm95KCkge1xyXG4gICAgICAgIGlmICh0aGlzLnBpbmNoWm9vbSkgdGhpcy5waW5jaFpvb20uZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW5pdFBpbmNoWm9vbSgpIHtcclxuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzWydkaXNhYmxlZCddKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHJvcGVydGllc1snZWxlbWVudCddID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcignLnBpbmNoLXpvb20tY29udGVudCcpO1xyXG4gICAgICAgIHRoaXMucGluY2hab29tID0gbmV3IEl2eVBpbmNoKHRoaXMucHJvcGVydGllcywgdGhpcy5vblpvb21DaGFuZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0UHJvcGVydGllcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XHJcbiAgICAgICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IHt9O1xyXG5cclxuICAgICAgICBmb3IgKHZhciBwcm9wIGluIGNoYW5nZXMpIHtcclxuICAgICAgICAgICAgaWYgKHByb3AgIT09ICdwcm9wZXJ0aWVzJykge1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllc1twcm9wXSA9IGNoYW5nZXNbcHJvcF0uY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChwcm9wID09PSAncHJvcGVydGllcycpIHtcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgPSBjaGFuZ2VzW3Byb3BdLmN1cnJlbnRWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcHJvcGVydGllcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlbmFtZVByb3BlcnRpZXMocHJvcGVydGllczogYW55KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgIGlmIChiYWNrd2FyZENvbXBhdGliaWxpdHlQcm9wZXJ0aWVzW3Byb3BdKSB7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW2JhY2t3YXJkQ29tcGF0aWJpbGl0eVByb3BlcnRpZXNbcHJvcF1dID0gcHJvcGVydGllc1twcm9wXTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wZXJ0aWVzW3Byb3BdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvcGVydGllcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFwcGx5UHJvcGVydGllc0RlZmF1bHQoZGVmYXVsdFByb3BlcnRpZXM6IFBpbmNoWm9vbVByb3BlcnRpZXMsIHByb3BlcnRpZXM6IFBpbmNoWm9vbVByb3BlcnRpZXMpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0UHJvcGVydGllcywgcHJvcGVydGllcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkZXRlY3RMaW1pdFpvb20oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucGluY2hab29tKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGluY2hab29tLmRldGVjdExpbWl0Wm9vbSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFByb3BlcnRpZXNWYWx1ZShwcm9wZXJ0eU5hbWU6IFByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXMgJiYgdGhpcy5wcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1twcm9wZXJ0eU5hbWVdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRDb21wb25lbnRQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RGVmYXVsdENvbXBvbmVudFByb3BlcnRpZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgLi4uZGVmYXVsdFByb3BlcnRpZXMsIC4uLl9kZWZhdWx0Q29tcG9uZW50UHJvcGVydGllcyB9O1xyXG4gICAgfVxyXG59XHJcbiIsIjxkaXYgY2xhc3M9XCJwaW5jaC16b29tLWNvbnRlbnRcIiBbY2xhc3MucHotZHJhZ2dpbmddPVwiaXNEcmFnZ2luZ1wiPlxyXG4gICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxyXG48L2Rpdj5cclxuXHJcbjwhLS0gQ29udHJvbDogb25lIGJ1dHRvbiAtLT5cclxuPGRpdlxyXG4gICAgY2xhc3M9XCJwei16b29tLWJ1dHRvbiBwei16b29tLWNvbnRyb2wtcG9zaXRpb24tYm90dG9tXCJcclxuICAgIFtjbGFzcy5wei16b29tLWJ1dHRvbi1vdXRdPVwiaXNab29tZWRJblwiXHJcbiAgICAqbmdJZj1cImlzQ29udHJvbCgpXCJcclxuICAgIChjbGljayk9XCJ0b2dnbGVab29tKClcIlxyXG4+PC9kaXY+XHJcbiJdfQ==