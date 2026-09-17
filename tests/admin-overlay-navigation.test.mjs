import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const access = readFileSync(new URL('../delegators/delegator-access.js', import.meta.url), 'utf8');
const home = readFileSync(new URL('../home/index.js', import.meta.url), 'utf8');

test('Dashboard uses universal overlays and restores each panel on Back', () => {
    const stack = [];
    const restored = [];
    const context = {
        dashboardChildOverlays: new Map(),
        document: {
            activeElement: { isConnected: true, focus() {} },
            createComment: () => ({ replaceWith: node => restored.push(node) }),
            createElement: () => ({ appendChild() {} })
        },
        window: {
            syncGovernanceMenuOverlayAccessibility() {},
            createUniversalOverlay(options) {
                const element = { options, overlay: { remove() { stack.splice(stack.indexOf(element), 1); } } };
                stack.push(element);
                return element;
            }
        }
    };
    vm.createContext(context);
    vm.runInContext(access.slice(access.indexOf('function closeDashboardChildOverlay('), access.indexOf('function setRaffleOverlay(')), context);
    const menu = { hidden: false, before() {} };
    const draw = { hidden: true, before() {} };
    context.openDashboardChildOverlay('raffles', 'Raffles', menu);
    context.openDashboardChildOverlay('raffle-view', 'Draw', draw);
    assert.equal(stack.length, 2);
    assert.equal(draw.hidden, false);
    stack[1].options.closeOverlay();
    assert.equal(stack.length, 1);
    assert.equal(stack[0].options.titleText, 'Raffles');
    assert.equal(draw.hidden, true);
    assert.equal(restored[0], draw);
    stack[0].options.closeOverlay();
    assert.equal(stack.length, 0);
    assert.equal(context.dashboardChildOverlays.size, 0);
});

test('Hidden dashboard templates are excluded from the overlay stack', () => {
    const visible = { closest: () => null, z: 3200 };
    const hidden = { closest: () => ({}), z: 3400 };
    const code = home.slice(home.indexOf('function getTopGovernanceMenuOverlay('), home.indexOf('function getNextGovernanceOverlayZIndex('));
    const context = { document: { querySelectorAll: () => [visible, hidden] }, getComputedStyle: node => ({ zIndex: node.z }) };
    vm.createContext(context);
    vm.runInContext(code, context);
    assert.equal(context.getTopGovernanceMenuOverlay(), visible);
});

test('Dashboard no longer has separate Back and Escape handlers', () => {
    assert.doesNotMatch(access, /goBackRaffleOverlay|registerDashboardChildOverlay|governanceBackOverlay/);
    assert.doesNotMatch(access, /document.addEventListener\('keydown'/);
    assert.match(home, /back.addEventListener\('click', closeOverlay\)/);
});
