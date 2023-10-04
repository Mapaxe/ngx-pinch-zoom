import { ElementRef, EventEmitter, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MouseZoomPoint, PinchZoomProperties, ZoomEvent } from './interfaces';
import * as i0 from "@angular/core";
export declare const _defaultComponentProperties: PinchZoomProperties;
export declare class PinchZoomComponent implements OnInit, OnDestroy {
    private elementRef;
    defaultComponentProperties: PinchZoomProperties;
    private pinchZoom;
    private _properties;
    private zoomControlPositionClass;
    private _transitionDuration;
    private _doubleTap;
    private _doubleTapScale;
    private _autoZoomOut;
    private _limitZoom;
    set properties(value: PinchZoomProperties);
    get properties(): PinchZoomProperties;
    set transitionDurationBackwardCompatibility(value: number);
    set transitionDuration(value: number);
    get transitionDuration(): number;
    set doubleTapBackwardCompatibility(value: boolean);
    set doubleTap(value: boolean);
    get doubleTap(): boolean;
    set doubleTapScaleBackwardCompatibility(value: number);
    set doubleTapScale(value: number);
    get doubleTapScale(): number;
    set autoZoomOutBackwardCompatibility(value: boolean);
    set autoZoomOut(value: boolean);
    get autoZoomOut(): boolean;
    set limitZoomBackwardCompatibility(value: number | 'original image size');
    set limitZoom(value: number | 'original image size');
    get limitZoom(): number | 'original image size';
    disabled: boolean;
    disablePan: boolean;
    overflow: 'hidden' | 'visible';
    zoomControlScale: number;
    disableZoomControl: 'disable' | 'never' | 'auto';
    backgroundColor: string;
    limitPan: boolean;
    minPanScale: number;
    minScale: number;
    listeners: 'auto' | 'mouse and touch';
    wheel: boolean;
    autoHeight: boolean;
    stepZoomFactor: number;
    wheelZoomFactor: number;
    draggableImage: boolean;
    onZoomChange: EventEmitter<ZoomEvent>;
    get hostOverflow(): "hidden" | "visible";
    get hostBackgroundColor(): string;
    get isTouchScreen(): boolean;
    get isDragging(): boolean;
    get isDisabled(): boolean;
    get scale(): number;
    get isZoomedIn(): boolean;
    get scaleLevel(): number;
    get maxScale(): number;
    get isZoomLimitReached(): boolean;
    get _zoomControlScale(): any;
    constructor(elementRef: ElementRef);
    ngOnInit(): void;
    isControl(): boolean;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    toggleZoom(): void;
    zoomPoint(point: MouseZoomPoint): void;
    zoomIn(): void;
    zoomOut(): void;
    resetZoom(): void;
    destroy(): void;
    private initPinchZoom;
    private getProperties;
    private renameProperties;
    private applyPropertiesDefault;
    private detectLimitZoom;
    private getPropertiesValue;
    private getDefaultComponentProperties;
    static ɵfac: i0.ɵɵFactoryDeclaration<PinchZoomComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PinchZoomComponent, "pinch-zoom, [pinch-zoom]", ["pinchZoom"], { "properties": { "alias": "properties"; "required": false; }; "transitionDurationBackwardCompatibility": { "alias": "transition-duration"; "required": false; }; "transitionDuration": { "alias": "transitionDuration"; "required": false; }; "doubleTapBackwardCompatibility": { "alias": "double-tap"; "required": false; }; "doubleTap": { "alias": "doubleTap"; "required": false; }; "doubleTapScaleBackwardCompatibility": { "alias": "double-tap-scale"; "required": false; }; "doubleTapScale": { "alias": "doubleTapScale"; "required": false; }; "autoZoomOutBackwardCompatibility": { "alias": "auto-zoom-out"; "required": false; }; "autoZoomOut": { "alias": "autoZoomOut"; "required": false; }; "limitZoomBackwardCompatibility": { "alias": "limit-zoom"; "required": false; }; "limitZoom": { "alias": "limitZoom"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "disablePan": { "alias": "disablePan"; "required": false; }; "overflow": { "alias": "overflow"; "required": false; }; "zoomControlScale": { "alias": "zoomControlScale"; "required": false; }; "disableZoomControl": { "alias": "disableZoomControl"; "required": false; }; "backgroundColor": { "alias": "backgroundColor"; "required": false; }; "limitPan": { "alias": "limitPan"; "required": false; }; "minPanScale": { "alias": "minPanScale"; "required": false; }; "minScale": { "alias": "minScale"; "required": false; }; "listeners": { "alias": "listeners"; "required": false; }; "wheel": { "alias": "wheel"; "required": false; }; "autoHeight": { "alias": "autoHeight"; "required": false; }; "stepZoomFactor": { "alias": "stepZoomFactor"; "required": false; }; "wheelZoomFactor": { "alias": "wheelZoomFactor"; "required": false; }; "draggableImage": { "alias": "draggableImage"; "required": false; }; }, { "onZoomChange": "onZoomChange"; }, never, ["*"], false, never>;
}
