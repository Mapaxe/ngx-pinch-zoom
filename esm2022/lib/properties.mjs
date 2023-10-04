export const defaultProperties = {
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
export const backwardCompatibilityProperties = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydGllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1waW5jaC16b29tL3NyYy9saWIvcHJvcGVydGllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBZTtJQUN6QyxrQkFBa0IsRUFBRSxHQUFHO0lBQ3ZCLFNBQVMsRUFBRSxJQUFJO0lBQ2YsY0FBYyxFQUFFLENBQUM7SUFDakIsU0FBUyxFQUFFLHFCQUFxQjtJQUNoQyxXQUFXLEVBQUUsS0FBSztJQUNsQixnQkFBZ0IsRUFBRSxDQUFDO0lBQ25CLFdBQVcsRUFBRSxNQUFNO0lBQ25CLFFBQVEsRUFBRSxDQUFDO0lBQ1gsU0FBUyxFQUFFLGlCQUFpQjtJQUM1QixLQUFLLEVBQUUsSUFBSTtJQUNYLGVBQWUsRUFBRSxHQUFHO0lBQ3BCLGNBQWMsRUFBRSxLQUFLO0NBQ3hCLENBQUM7QUFFRixNQUFNLENBQUMsTUFBTSwrQkFBK0IsR0FBUTtJQUNoRCxxQkFBcUIsRUFBRSxvQkFBb0I7SUFDM0MsdUNBQXVDLEVBQUUsb0JBQW9CO0lBQzdELFlBQVksRUFBRSxXQUFXO0lBQ3pCLDhCQUE4QixFQUFFLFdBQVc7SUFDM0Msa0JBQWtCLEVBQUUsZ0JBQWdCO0lBQ3BDLG1DQUFtQyxFQUFFLGdCQUFnQjtJQUNyRCxlQUFlLEVBQUUsYUFBYTtJQUM5QixnQ0FBZ0MsRUFBRSxhQUFhO0lBQy9DLFlBQVksRUFBRSxXQUFXO0lBQ3pCLDhCQUE4QixFQUFFLFdBQVc7Q0FDOUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb3BlcnRpZXMgfSBmcm9tICcuL2ludGVyZmFjZXMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGRlZmF1bHRQcm9wZXJ0aWVzOiBQcm9wZXJ0aWVzID0ge1xyXG4gICAgdHJhbnNpdGlvbkR1cmF0aW9uOiAyMDAsXHJcbiAgICBkb3VibGVUYXA6IHRydWUsXHJcbiAgICBkb3VibGVUYXBTY2FsZTogMixcclxuICAgIGxpbWl0Wm9vbTogJ29yaWdpbmFsIGltYWdlIHNpemUnLFxyXG4gICAgYXV0b1pvb21PdXQ6IGZhbHNlLFxyXG4gICAgem9vbUNvbnRyb2xTY2FsZTogMSxcclxuICAgIG1pblBhblNjYWxlOiAxLjAwMDEsXHJcbiAgICBtaW5TY2FsZTogMCxcclxuICAgIGxpc3RlbmVyczogJ21vdXNlIGFuZCB0b3VjaCcsXHJcbiAgICB3aGVlbDogdHJ1ZSxcclxuICAgIHdoZWVsWm9vbUZhY3RvcjogMC4yLFxyXG4gICAgZHJhZ2dhYmxlSW1hZ2U6IGZhbHNlLFxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGJhY2t3YXJkQ29tcGF0aWJpbGl0eVByb3BlcnRpZXM6IGFueSA9IHtcclxuICAgICd0cmFuc2l0aW9uLWR1cmF0aW9uJzogJ3RyYW5zaXRpb25EdXJhdGlvbicsXHJcbiAgICB0cmFuc2l0aW9uRHVyYXRpb25CYWNrd2FyZENvbXBhdGliaWxpdHk6ICd0cmFuc2l0aW9uRHVyYXRpb24nLFxyXG4gICAgJ2RvdWJsZS10YXAnOiAnZG91YmxlVGFwJyxcclxuICAgIGRvdWJsZVRhcEJhY2t3YXJkQ29tcGF0aWJpbGl0eTogJ2RvdWJsZVRhcCcsXHJcbiAgICAnZG91YmxlLXRhcC1zY2FsZSc6ICdkb3VibGVUYXBTY2FsZScsXHJcbiAgICBkb3VibGVUYXBTY2FsZUJhY2t3YXJkQ29tcGF0aWJpbGl0eTogJ2RvdWJsZVRhcFNjYWxlJyxcclxuICAgICdhdXRvLXpvb20tb3V0JzogJ2F1dG9ab29tT3V0JyxcclxuICAgIGF1dG9ab29tT3V0QmFja3dhcmRDb21wYXRpYmlsaXR5OiAnYXV0b1pvb21PdXQnLFxyXG4gICAgJ2xpbWl0LXpvb20nOiAnbGltaXRab29tJyxcclxuICAgIGxpbWl0Wm9vbUJhY2t3YXJkQ29tcGF0aWJpbGl0eTogJ2xpbWl0Wm9vbScsXHJcbn07XHJcbiJdfQ==