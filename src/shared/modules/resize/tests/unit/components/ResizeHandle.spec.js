import {config, mount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import ResizeHandle from "@shared/modules/resize/components/ResizeHandle.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/resize/components/ResizeHandle.vue", () => {
    let wrapper,
        host,
        container,
        setMainMenuWidthSpy,
        setSecondaryMenuWidthSpy;

    /**
     * helper function to set the geometry of an element by defining its offsetWidth, offsetHeight, offsetLeft, and offsetTop properties
     */
    function setElementGeometry (element, {width = 300, height = 200, left = 10, top = 20} = {}) {
        Object.defineProperty(element, "offsetWidth", {configurable: true, value: width});
        Object.defineProperty(element, "offsetHeight", {configurable: true, value: height});
        Object.defineProperty(element, "offsetLeft", {configurable: true, value: left});
        Object.defineProperty(element, "offsetTop", {configurable: true, value: top});
    }

    /**
     * create a test store with spies for the mutations that the component commits to update menu widths
     */
    function createTestStore () {
        return createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        ResizeHandle: {
                            namespaced: true,
                            mutations: {
                                setMainMenuWidth: setMainMenuWidthSpy,
                                setSecondaryMenuWidth: setSecondaryMenuWidthSpy
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * helper function to mount the component with default props and the test store, and reset the spies before each test
     */
    function mountComponent (props = {}) {
        const store = createTestStore();

        wrapper = mount(ResizeHandle, {
            global: {
                plugins: [store]
            },
            props: {
                side: "mainMenu",
                ...props
            },
            attachTo: host
        });
        setMainMenuWidthSpy.resetHistory();
        setSecondaryMenuWidthSpy.resetHistory();
    }

    beforeEach(() => {
        setMainMenuWidthSpy = sinon.spy();
        setSecondaryMenuWidthSpy = sinon.spy();

        container = document.createElement("div");
        container.id = "masterportal-container";
        setElementGeometry(container, {width: 1000, height: 800});
        document.body.appendChild(container);

        host = document.createElement("div");
        host.className = "resizable-host";
        setElementGeometry(host, {width: 300, height: 200, left: 15, top: 25});
        document.body.appendChild(host);
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
            wrapper = null;
        }
        if (host?.parentNode) {
            host.parentNode.removeChild(host);
        }
        if (container?.parentNode) {
            container.parentNode.removeChild(container);
        }
        Object.defineProperty(document, "visibilityState", {configurable: true, value: "visible"});
    });

    it("renders resize button and computes cursor class", () => {
        mountComponent({handlePosition: "right"});

        expect(wrapper.find("#resize-handle").exists()).to.be.true;
        expect(wrapper.find("#resize-handle").classes()).to.include("resize-handle-type-right");
        expect(wrapper.vm.cursorClass).to.equal("ew-resize");
    });

    it("uses targetElement selector if provided", () => {
        const targetElement = document.createElement("div");

        targetElement.id = "explicit-target";
        setElementGeometry(targetElement, {width: 420, height: 280});
        document.body.appendChild(targetElement);

        mountComponent({targetElement: "#explicit-target"});

        expect(wrapper.vm.handleElement).to.equal(targetElement);

        targetElement.remove();
    });

    it("moveHandle clamps width to min and max bounds", () => {
        mountComponent({minWidth: 0.2, maxWidth: 0.4});

        setElementGeometry(wrapper.vm.handleElement, {width: 200, height: 200, left: 15, top: 25});
        wrapper.vm.moveHandle("ArrowLeft");
        expect(wrapper.vm.handleElement.style.width).to.equal("200px");

        setElementGeometry(wrapper.vm.handleElement, {width: 400, height: 200, left: 15, top: 25});
        wrapper.vm.moveHandle("ArrowRight");
        expect(wrapper.vm.handleElement.style.width).to.equal("400px");
    });

    it("onMouseDown ignores non-left mouse button", () => {
        mountComponent();
        const startResizingSpy = sinon.spy(wrapper.vm, "startResizing");

        wrapper.vm.onMouseDown({button: 2});

        expect(startResizingSpy.notCalled).to.be.true;
    });

    it("onMouseMove snaps delta to grid and emits resizing", () => {
        mountComponent({grid: 10});

        wrapper.vm.initialCursorPosition = {x: 0, y: 0};
        wrapper.vm.initialRotation = 0;

        wrapper.vm.onMouseMove({
            clientX: 23,
            clientY: 27,
            buttons: 1
        });

        expect(wrapper.vm.deltaCursorPosition.x).to.equal(20);
        expect(wrapper.vm.deltaCursorPosition.y).to.equal(30);
        expect(setMainMenuWidthSpy.calledOnce).to.be.true;
        expect(wrapper.emitted("resizing")).to.have.lengthOf(1);
        expect(wrapper.emitted("resizing")[0][0].deltaCursorPosition.x).to.equal(20);
        expect(wrapper.emitted("resizing")[0][0].deltaCursorPosition.y).to.equal(30);
    });

    it("onMouseMove stops resizing when mouse buttons are no longer pressed", () => {
        mountComponent();
        const onMouseUpSpy = sinon.spy(wrapper.vm, "onMouseUp");

        wrapper.vm.onMouseMove({
            clientX: 23,
            clientY: 27,
            buttons: 0
        });

        expect(onMouseUpSpy.calledOnce).to.be.true;
        expect(wrapper.emitted("resizing")).to.be.undefined;
    });

    it("setNewSize commits main menu width to vuex", () => {
        mountComponent({side: "mainMenu", handlePosition: "right", minWidth: 0, maxWidth: 1});
        wrapper.vm.initialDimensions.width = 300;
        wrapper.vm.deltaCursorPosition.x = 50;

        wrapper.vm.setNewSize();

        expect(setMainMenuWidthSpy.calledOnce).to.be.true;
        expect(setMainMenuWidthSpy.firstCall.args[1]).to.equal(350);
        expect(setSecondaryMenuWidthSpy.notCalled).to.be.true;
    });

    it("onVisibilityChange stops resizing when document becomes hidden", () => {
        mountComponent();
        const onMouseUpSpy = sinon.spy(wrapper.vm, "onMouseUp");

        wrapper.vm.isResizing = true;
        Object.defineProperty(document, "visibilityState", {configurable: true, value: "hidden"});

        wrapper.vm.onVisibilityChange();

        expect(onMouseUpSpy.calledOnce).to.be.true;
    });

    it("onWindowBlur stops resizing while resize is active", () => {
        mountComponent();
        const onMouseUpSpy = sinon.spy(wrapper.vm, "onMouseUp");

        wrapper.vm.isResizing = true;
        wrapper.vm.onWindowBlur();

        expect(onMouseUpSpy.calledOnce).to.be.true;
    });

    it("uses touchcancel as cancel event while resizing on touch devices", async () => {
        mountComponent();
        const addEventListenerSpy = sinon.spy(document, "addEventListener"),
            removeEventListenerSpy = sinon.spy(document, "removeEventListener");

        wrapper.vm.touchDevice = true;
        wrapper.vm.isResizing = true;
        await wrapper.vm.$nextTick();

        expect(addEventListenerSpy.calledWith("touchmove", wrapper.vm.boundOnMouseMove)).to.be.true;
        expect(addEventListenerSpy.calledWith("touchend", wrapper.vm.boundOnMouseUp)).to.be.true;
        expect(addEventListenerSpy.calledWith("touchcancel", wrapper.vm.boundOnMouseUp)).to.be.true;

        wrapper.vm.isResizing = false;
        await wrapper.vm.$nextTick();

        expect(removeEventListenerSpy.calledWith("touchmove", wrapper.vm.boundOnMouseMove)).to.be.true;
        expect(removeEventListenerSpy.calledWith("touchend", wrapper.vm.boundOnMouseUp)).to.be.true;
        expect(removeEventListenerSpy.calledWith("touchcancel", wrapper.vm.boundOnMouseUp)).to.be.true;
    });
});
