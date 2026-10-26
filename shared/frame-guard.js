(function guardAgainstFraming() {
    if (window.top === window.self) return;

    document.documentElement.hidden = true;
    const blockInteraction = event => {
        event.preventDefault();
        event.stopImmediatePropagation();
    };
    ['click', 'submit', 'pointerdown', 'touchstart', 'keydown'].forEach(type => {
        document.addEventListener(type, blockInteraction, true);
    });
    document.addEventListener('DOMContentLoaded', () => {
        document.body?.replaceChildren();
    }, { once: true });
}());
