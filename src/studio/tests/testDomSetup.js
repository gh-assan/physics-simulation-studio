// Inject required DOM elements for UIManager and studio tests
(function setupStudioDom() {
    const domMap = {
        playButton: 'button',
        pauseButton: 'button',
        resetButton: 'button',
        addBoxButton: 'button',
        viewportContainer: 'div',
        propertyInspector: 'div',
        tweakpaneContainer: 'div',
    };
    Object.entries(domMap).forEach(([id, tag]) => {
        if (!document.getElementById(id)) {
            let el = document.createElement(tag);
            el.id = id;
            document.body.appendChild(el);
        }
    });
})();
