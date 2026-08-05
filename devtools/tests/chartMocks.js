
import {vi} from "vitest";

/**
 * Lightweight Chart.js test double. Minimal fake replacement for Chart.js to be used in unit tests. It is not a full implementation of Chart.js and does not provide any charting functionality.
 * It is only intended to be used as a test double for unit tests that require a Chart.js instance.
 */
class MockChart {
    /**
     * @param {HTMLCanvasElement|CanvasRenderingContext2D|null} _canvas mocked canvas or rendering context
     * @param {Object} chartsConfig chart configuration handed to Chart.js
     */
    constructor (_canvas, chartsConfig) {
        this.config = chartsConfig;
        this.data = chartsConfig.data;
        this.stop = vi.fn();
        this.destroy = vi.fn();
        this.update = vi.fn();
        this.render = vi.fn();
    }

    static defaults = {
        font: {},
        color: ""
    };

    static Legend = class {
    };

    /**
     * @returns {{stop: Function, destroy: Function}} mocked chart lookup result
     */
    static getChart () {
        return {
            stop: vi.fn(),
            destroy: vi.fn()
        };
    }
}

/**
 * @returns {{Chart: typeof MockChart}} mocked chart.js module
 */
function createChartJsMockModule () {
    return {
        Chart: MockChart
    };
}

/**
 * @returns {{default: typeof MockChart}} mocked chart.js/auto module
 */
function createChartJsAutoMockModule () {
    return {
        default: MockChart
    };
}

export {MockChart, createChartJsMockModule, createChartJsAutoMockModule};
