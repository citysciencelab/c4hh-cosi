import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import initialState from "./stateWmsTime.js";
import findCurrentTimeSliderObject from "../utils/findCurrentTimeSliderObject.js";

const getters = {
    ...generateSimpleGetters(initialState),
    // TimeSlider getters
    currentTimeSliderObject ({timeSlider: {currentLayerId, objects}}) {
        return findCurrentTimeSliderObject(currentLayerId, objects);
    },
    defaultValue (_, {currentTimeSliderObject}) {
        return currentTimeSliderObject.defaultValue;
    },
    defaultValueEnd (_, {currentTimeSliderObject}) {
        return currentTimeSliderObject.defaultValueEnd;
    },
    defaultDimensionName (_, {currentTimeSliderObject}) {
        return currentTimeSliderObject.dimensionName || "time";
    },
    dualRangeSlider (_, {currentTimeSliderObject}) {
        return currentTimeSliderObject?.dualRangeSlider || false;
    },
    /**
     * Test whether the current width surpasses the mobileWidth
     * (Width with which the mobile view is triggered).
     *
     * @param {Number} windowWidth Current width (window.innerWidth) of the window in px.
     * @returns {Boolean} True, if the mobile view is not shown; false, else.
     */
    minWidth ({windowWidth}) {
        const mobileWidth = 800;

        return windowWidth > mobileWidth;
    },
    staticDimensions (_, {currentTimeSliderObject}) {
        return currentTimeSliderObject?.staticDimensions || {};
    },
    timeRange (_, {currentTimeSliderObject}) {
        return currentTimeSliderObject?.timeRange || [];
    },
    displayFormat (_, {currentTimeSliderObject}) {
        return currentTimeSliderObject?.displayFormat;
    },
    displayTimezone (_, {currentTimeSliderObject}) {
        return currentTimeSliderObject?.displayTimezone;
    }
};

export default getters;
