<script>
import axios from "axios";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import {mapGetters} from "vuex";

/**
 * Legend Single Layer
 * @module modules/LegendSingleLayer
 * @vue-prop {Object} legendObj - The Legend.
 */

export default {
    name: "LegendSingleLayer",
    components: {
        SpinnerItem
    },
    props: {
        legendObj: {
            type: Object && undefined,
            required: true
        },
        selectedLayer: {
            type: Number,
            required: false,
            default: null
        }
    },
    data () {
        return {
            imageSources: {}
        };
    },
    computed: {
        ...mapGetters(["isModuleAvailable"]),
        ...mapGetters("Modules/Legend", ["sldVersion"]),

        /**
         * Filters the legend object to return the appropriate legend entries based on the selected layer.
         * If no legend object is available, an empty array is returned.
         *
         * @returns {Array} The filtered legend entries:
         *   - Returns all legends grouped by layers if no layer is selected (`selectedLayer` is null or undefined).
         *   - Returns the legend entries for the selected layer group if a valid `selectedLayer` index is specified.
         *   - Returns an empty array if the `selectedLayer` index is out of bounds or no legend exists.
         */
        filteredLegend () {
            if (!this.legendObj || !this.legendObj.legend || !Array.isArray(this.legendObj.legend)) {
                return [];
            }

            const isGrouped = Array.isArray(this.legendObj.legend[0]);

            if (!isGrouped) {
                if (this.selectedLayer === null || this.selectedLayer === undefined) {
                    return this.legendObj.legend;
                }

                if (this.selectedLayer >= 0 && this.selectedLayer < this.legendObj.legend.length) {
                    return [this.legendObj.legend[this.selectedLayer]];
                }

                return [];
            }

            if (this.selectedLayer === null || this.selectedLayer === undefined) {
                return this.legendObj.legend.flat();
            }

            if (this.selectedLayer >= 0 && this.selectedLayer < this.legendObj.legend.length) {
                return this.legendObj.legend[this.selectedLayer];
            }

            return [];
        },

        /**
         * Returns true, if legend images have to be loaded by axios, so that the login interceptor can add the auth token.
         * @returns {Boolean} true, if the login module is available
         */
        loadImagesByAxios () {
            return this.isModuleAvailable("login");
        }
    },
    watch: {
        filteredLegend: {
            handler (legendParts) {
                this.loadImageSources(legendParts);
            },
            immediate: true
        },
        legendObj (legendObj) {
            this.removeUnusedImageSources(legendObj);
        }
    },
    beforeUnmount () {
        this.isUnmounted = true;
        Object.values(this.imageSources).forEach(src => {
            if (src?.startsWith("blob:")) {
                URL.revokeObjectURL(src);
            }
        });
    },
    methods: {
        scaleImg (evt, legendPart) {
            if (legendPart.imageScale !== null && legendPart.imageScale !== undefined) {
                evt.target.width = legendPart.imageScale * evt.target.naturalWidth;
            }
        },

        /**
         * Returns the url of a legend string, extended by the sld version for GetLegendGraphic requests.
         * @param {String} legendPart The legend url.
         * @returns {String|undefined|null} The legend url or the given value, if it is undefined or null.
         */
        getLegendUrl (legendPart) {
            if (legendPart === undefined || legendPart === null) {
                return legendPart;
            }
            return legendPart + (legendPart.toUpperCase().includes("GETLEGENDGRAPHIC") && this.sldVersion ? "&sld_version=" + this.sldVersion : "");
        },

        /**
         * Returns true, if the given src has to be loaded by axios.
         * @param {String} src The image source.
         * @returns {Boolean} true, if the src is an url to load.
         */
        isFetchableUrl (src) {
            return typeof src === "string" && !(/^(?:data:|blob:|\s*<)/).test(src);
        },

        /**
         * Returns the src for an legend image. If images are loaded by axios, the object url is returned after loading.
         * @param {String} src The image source.
         * @returns {String|undefined} The image source to use.
         */
        getImageSrc (src) {
            if (!this.loadImagesByAxios || !this.isFetchableUrl(src)) {
                return src;
            }
            return this.imageSources[src];
        },

        /**
         * Returns true, if the given image source is currently loaded by axios.
         * @param {String} src The image source.
         * @returns {Boolean} true, if the image is loading
         */
        isImageLoading (src) {
            return this.loadImagesByAxios && this.isFetchableUrl(src) && this.imageSources[src] === undefined;
        },

        /**
         * Collects the image urls of the given legend parts.
         * @param {Array} legendParts The legend parts.
         * @returns {String[]} The image urls.
         */
        collectImageUrls (legendParts) {
            return legendParts
                .flatMap(legendPart => {
                    if (typeof legendPart === "string" && !legendPart.endsWith(".pdf")) {
                        return [this.getLegendUrl(legendPart)];
                    }
                    if (Array.isArray(legendPart?.graphic)) {
                        return legendPart.graphic;
                    }
                    if (typeof legendPart?.graphic === "string" && !legendPart.graphic.endsWith(".pdf")) {
                        return [legendPart.graphic];
                    }
                    return [];
                })
                .filter(url => this.isFetchableUrl(url));
        },

        /**
         * Loads the legend images by axios, so that the login interceptor adds the auth token.
         * @param {Array} legendParts The legend parts.
         * @returns {Promise<void>} resolves, if all images are loaded
         */
        async loadImageSources (legendParts) {
            if (!this.loadImagesByAxios) {
                return;
            }

            await Promise.all(this.collectImageUrls(legendParts)
                .filter(url => !Object.hasOwn(this.imageSources, url))
                .map(url => this.loadImage(url)));
        },

        /**
         * Revokes and removes the image sources, that are not part of the given legend object anymore.
         * The image sources of all layer groups are kept, so that switching the selected layer does not reload them.
         * @param {Object} legendObj The legend object.
         * @returns {void}
         */
        removeUnusedImageSources (legendObj) {
            const legendParts = Array.isArray(legendObj?.legend) ? legendObj.legend.flat() : [],
                  usedUrls = new Set(this.collectImageUrls(legendParts));

            Object.entries(this.imageSources)
                .filter(([url]) => !usedUrls.has(url))
                .forEach(([url, src]) => {
                    if (src?.startsWith("blob:")) {
                        URL.revokeObjectURL(src);
                    }
                    delete this.imageSources[url];
                });
        },

        /**
         * Loads an image and stores its object url. If loading fails, the original url is used.
         * @param {String} url The image url.
         * @returns {Promise<void>} resolves, if the image is loaded
         */
        async loadImage (url) {
            this.imageSources[url] = undefined;

            try {
                const response = await axios.get(url, {responseType: "blob"});

                if (this.isUnmounted || !Object.hasOwn(this.imageSources, url)) {
                    return;
                }
                this.imageSources[url] = URL.createObjectURL(response.data);
            }
            catch (error) {
                console.warn(`Legend image could not be loaded by axios, using original url: ${url}`, error);
                this.imageSources[url] = url;
            }
        }
    }
};
</script>

<template>
    <div
        class="layer-legend show"
    >
        <template
            v-if="legendObj && Object.keys(legendObj).length > 0"
        >
            <div
                v-for="(legendPart, index) in filteredLegend"
                :key="index"
                class="mt-2 layer-legend-container"
            >
                <!-- String -->
                <template
                    v-if="typeof legendPart === 'string'"
                >
                    <!--Legend as Image-->
                    <SpinnerItem
                        v-if="!legendPart.endsWith('.pdf') && isImageLoading(getLegendUrl(legendPart))"
                    />
                    <img
                        v-else-if="!legendPart.endsWith('.pdf') && !legendPart.endsWith('</svg>')"
                        :alt="legendPart.name ? legendPart.name : legendObj.name"
                        :src="getImageSrc(getLegendUrl(legendPart))"
                    >
                    <!--Legend as SVG-->
                    <div
                        v-if="legendPart.endsWith('</svg>')"
                    >
                        {{ legendPart }}
                    </div>
                    <!--Legend PDF as Link-->
                    <a
                        v-if="legendPart.endsWith('.pdf')"
                        :href="legendPart"
                        target="_blank"
                        :title="legendPart"
                    >
                        {{ $t("common:modules.legend.linkToPdf") }}
                    </a>
                </template>

                <!-- Object -->
                <template
                    v-if="typeof legendPart === 'object'"
                >
                    <div
                        v-if="Array.isArray(legendPart.graphic)"
                        class="images-row"
                    >
                        <SpinnerItem
                            v-if="isImageLoading(legendPart.graphic[0]) || isImageLoading(legendPart.graphic[1])"
                            custom-class="second-image"
                        />
                        <!--Legend as Image or SVG -->
                        <template v-else>
                            <img
                                :alt="legendPart.name ? legendPart.name : legendObj.name"
                                :src="getImageSrc(legendPart.graphic[1])"
                                :style="{
                                    width: legendPart.iconSize[0] + 'px',
                                    height: legendPart.iconSize[1] + 'px',
                                    margin: legendPart.iconSizeDifferenz + 'px'
                                }"
                                class="first-image"
                                @load="(evt) => scaleImg(evt, legendPart)"
                            >
                            <img
                                :alt="legendPart.name ? legendPart.name : legendObj.name"
                                :src="getImageSrc(legendPart.graphic[0])"
                                class="second-image"
                                @load="(evt) => scaleImg(evt, legendPart)"
                            >
                        </template>
                        <span
                            class="ms-4 image-name"
                        >
                            {{ $t(legendPart.name) }}
                        </span>
                    </div>
                    <div v-else>
                        <SpinnerItem
                            v-if="!legendPart.graphic.endsWith('.pdf') && isImageLoading(legendPart.graphic)"
                            custom-class="left"
                        />
                        <!--Legend as Image or SVG -->
                        <img
                            v-else-if="!legendPart.graphic.endsWith('.pdf')"
                            :alt="legendPart.name ? legendPart.name : legendObj.name"
                            :src="getImageSrc(legendPart.graphic)"
                            class="left"
                            @load="(evt) => scaleImg(evt, legendPart)"
                        >
                        <!--Legend PDF as Link-->
                        <a
                            v-if="legendPart.graphic.endsWith('.pdf')"
                            :href="legendPart.graphic"
                            target="_blank"
                            :title="legendPart.graphic"
                        >
                            {{ $t("common:modules.legend.linkToPdf") }}
                        </a>
                        <span
                            class="ms-4"
                        >
                            {{ $t(legendPart.name) }}
                        </span>
                    </div>
                </template>
            </div>
        </template>
        <template
            v-else
        >
            <p class="mt-3">
                {{ $t("common:modules.legend.noLegendForLayerInfo") }}
            </p>
        </template>
    </div>
</template>

<style lang="scss" scoped>

    .first-image {
        grid-column: 1;
        grid-row: 1;
        z-index: 1;
    }
    .second-image {
        grid-column: 1;
        grid-row: 1;
    }
    .image-name {
        grid-column: 2;
        grid-row: 1;
        display: flex;
        align-items: center;
    }
    .images-row{
        display: inline-grid;
    }
</style>
