/**
 * @typedef {Object}  stateLayerSwiper
 * @property {Boolean} active Whether the swiper should be active.
 * @property {Boolean} isMoving Whether the swiper is currently being moved.
 * @property {HTMLElement} swiper The DOM element for the swiper.
 * @property {String} sourceLayerId The id of the layer that is supposed to be manipulated.
 * @property {String} targetLayerId The id of the source layer for comparison.
 * @property {Number} valueX The current x-axis position of the swiper.
 * @property {Number} valueY The current y-axis position of the swiper.
 * @property {String} splitDirection The direction of the swiper ("vertical" or "horizontal").
 */
const state = {
    active: false,
    currentTimeSliderObject: null,
    isMoving: false,
    swiper: null,
    sourceLayerId: null,
    targetLayerId: null,
    valueX: null,
    valueY: null,
    splitDirection: "vertical"
};

export default state;
