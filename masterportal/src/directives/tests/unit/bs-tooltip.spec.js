import {vi, describe, it, expect, beforeEach, afterEach} from "vitest";
import {Tooltip} from "bootstrap";
import directive from "../../bs-tooltip.js";

vi.mock("bootstrap", () => {
    const TooltipMock = vi.fn();

    TooltipMock.getInstance = vi.fn();
    return {Tooltip: TooltipMock};
});

describe("src/directives/bs-tooltip.js", () => {
    let element, mockInstance;

    beforeEach(() => {
        element = document.createElement("button");
        document.body.appendChild(element);

        mockInstance = {
            _config: {},
            disable: vi.fn(),
            dispose: vi.fn()
        };

        Tooltip.mockClear();
        Tooltip.getInstance.mockReset();
    });

    afterEach(() => {
        element.remove();
        vi.restoreAllMocks();
    });

    describe("mounted", () => {
        it("should create a Tooltip instance with the provided binding value", () => {
            const options = {placement: "bottom", customClass: "my-tooltip"};

            directive.mounted(element, {value: options});
            expect(Tooltip).toHaveBeenCalledWith(element, options);
        });

        it("should create a Tooltip instance with empty options when binding value is null", () => {
            directive.mounted(element, {value: null});
            expect(Tooltip).toHaveBeenCalledWith(element, {});
        });

        it("should create a Tooltip instance with empty options when binding value is undefined", () => {
            directive.mounted(element, {value: undefined});
            expect(Tooltip).toHaveBeenCalledWith(element, {});
        });
    });

    describe("updated", () => {
        it("should merge a new binding value into the existing Tooltip config", () => {
            mockInstance._config = {placement: "top"};
            Tooltip.getInstance.mockReturnValue(mockInstance);

            directive.updated(element, {value: {placement: "bottom", customClass: "new-class"}});

            expect(mockInstance._config.placement).toBe("bottom");
            expect(mockInstance._config.customClass).toBe("new-class");
        });

        it("should merge an empty object when binding value is null", () => {
            mockInstance._config = {placement: "top"};
            Tooltip.getInstance.mockReturnValue(mockInstance);

            directive.updated(element, {value: null});

            expect(mockInstance._config.placement).toBe("top");
        });

        it("merge an empty object when binding value is undefined", () => {
            mockInstance._config = {placement: "top"};
            Tooltip.getInstance.mockReturnValue(mockInstance);

            directive.updated(element, {value: undefined});

            expect(mockInstance._config.placement).toBe("top");
        });

        it("should do nothing when no Tooltip instance exists", () => {
            Tooltip.getInstance.mockReturnValue(null);
            expect(() => directive.updated(element, {value: {placement: "bottom"}})).not.toThrow();
        });

        it("should do nothing when the Tooltip instance has no _config", () => {
            mockInstance._config = null;
            Tooltip.getInstance.mockReturnValue(mockInstance);
            expect(() => directive.updated(element, {value: {placement: "bottom"}})).not.toThrow();
        });
    });

    describe("beforeUnmount", () => {
        let tooltipElement;

        beforeEach(() => {
            tooltipElement = document.createElement("div");
            tooltipElement.id = "tooltip-123";
            document.body.appendChild(tooltipElement);
            element.setAttribute("aria-describedby", "tooltip-123");
        });

        afterEach(() => {
            tooltipElement?.remove();
        });

        describe("tooltip DOM element removal", () => {
            it("should remove the tooltip DOM element when aria-describedby is set", () => {
                Tooltip.getInstance.mockReturnValue(null);

                directive.beforeUnmount(element);

                expect(document.getElementById("tooltip-123")).toBeNull();
            });

            it("should not throw when aria-describedby references a non-existent element", () => {
                element.setAttribute("aria-describedby", "tooltip-nonexistent");
                Tooltip.getInstance.mockReturnValue(null);

                expect(() => directive.beforeUnmount(element)).not.toThrow();
            });

            it("should not call getElementById when aria-describedby is not set", () => {
                element.removeAttribute("aria-describedby");
                Tooltip.getInstance.mockReturnValue(null);
                const getByIdSpy = vi.spyOn(document, "getElementById");

                directive.beforeUnmount(element);

                expect(getByIdSpy).not.toHaveBeenCalled();
            });
        });

        describe("instance teardown", () => {
            it("shoud call disable() on the Tooltip instance", () => {
                Tooltip.getInstance.mockReturnValue(mockInstance);

                directive.beforeUnmount(element);

                expect(mockInstance.disable).toHaveBeenCalledOnce();
            });

            it("should not call dispose() synchronously", () => {
                Tooltip.getInstance.mockReturnValue(mockInstance);

                directive.beforeUnmount(element);

                expect(mockInstance.dispose).not.toHaveBeenCalled();
            });

            it("should dispose() after the deferred setTimeout fires", () => {
                vi.useFakeTimers();
                Tooltip.getInstance.mockReturnValue(mockInstance);

                directive.beforeUnmount(element);
                expect(mockInstance.dispose).not.toHaveBeenCalled();

                vi.runAllTimers();
                expect(mockInstance.dispose).toHaveBeenCalledOnce();

                vi.useRealTimers();
            });

            it("should not call disable() or dispose() when no Tooltip instance exists", () => {
                Tooltip.getInstance.mockReturnValue(null);

                expect(() => directive.beforeUnmount(element)).not.toThrow();
            });
        });
    });
});
