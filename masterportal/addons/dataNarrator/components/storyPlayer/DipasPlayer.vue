<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import TableOfContents from "./TableOfContents.vue";
import axios from "axios";
import getters from "../../store/gettersDataNarrator";
import mutations from "../../store/mutationsDataNarrator";

export default {
    name: "DipasPlayer",
    components: {
        TableOfContents
    },
    props: {
        storyConfPath: {
            type: String,
            default: null
        },
        // All steps of the current story
        steps: {
            type: Array,
            default: null
        },
        stepsObjects: {
            type: Array,
            default: null
        },
        isMobileDevice: {
            type: Boolean,
            default: false
        },
        screenOrientationType: {
            type: String,
            default: screen.orientation?.type
        }
    },
    data () {
        return {
            currentIndex: -1,
            loadedContent: null,
            showTableOfContents: false,
            storyProgress: 0,
            rotateRight: 0,
            rotateLeft: 0,
            ratioComparison: [
                {
                    ratioValue: 2.33333,
                    ratioClass: "ratio-21x9"
                },
                {
                    ratioValue: 1.77778,
                    ratioClass: "ratio-16x9"
                },
                {
                    ratioValue: 1.33333,
                    ratioClass: "ratio-4x3"
                },
                {
                    ratioValue: 1.00000,
                    ratioClass: "ratio-1x1"
                }
            ],
            rightButtonsPositionLeft: undefined,
            logoPositionLeft: undefined,
            toolWidth: undefined,
            disablePrevStep: true,
            prevToolWidth: this.toolWidth,
            scroller: null,
            toolBodyScrollTop: 0,
            originalToolBodyStyle: "",
            dipasPlayerHeadingStyle: "display: none;",
            dipasPlayerToolBodyStyle: "background-color: transparent !important; -ms-overflow-style: none; overflow-y: auto; max-height: 100%; padding: 0.25rem;"
        };
    },
    computed: {
        ...mapGetters("Modules/DataNarrator", Object.keys(getters)),
        ...mapGetters([
            "isMobile",
            "uiStyle"
        ]),
        ...mapGetters("Menu", [
            "mainMenu",
            "secondaryMenu",
            "secondaryExpanded",
            "mainExpanded",
            "menuBySide"
        ]),
        cssVars () {
            return {
                "--rotate-right": this.rotateRight + "deg",
                "--rotate-left": this.rotateLeft + "deg",
                "--tool-width": this.toolWidth,
                "--tool-header": this.secondaryExpanded ? "flex" : "none",
                "--tob-button-top": this.isMobilePortrait || (window.matchMedia("(max-width: 768px)").matches && this.screenOrientationType.startsWith("landscape")) ? "9%" : "12%",
                "--progress-bottom": this.isMobilePortrait || (window.matchMedia("(max-width: 768px)").matches && this.screenOrientationType.startsWith("landscape")) ? "12px" : "8px"
            };
        },
        showDipasLogo () {
            return this.storyConf?.showDipasLogo !== false; // Show DIPAS logo by default, unless explicitly set to false
        },
        isMobilePortrait () {
            return this.isMobileDevice && this.screenOrientationType.startsWith("portrait");
        }
    },
    watch: {
        secondaryExpanded (expanded) {
            if (expanded) {
                if (this.isMobilePortrait) {
                    this.applyMobilePortraitLayout();
                }
            }
        },
        mainExpanded (expanded) {
            if (!expanded && this.isMobilePortrait) {
                this.setExpandedBySide({expanded: true, side: "secondaryMenu"});
            }
            else if (expanded && !this.isMobilePortrait) {
                this.menuBySide("mainMenu").width = "40%";
            }
        },
        screenOrientationType (newType) {
            if (this.isMobileDevice && newType.startsWith("landscape")) {
                this.applyMobileLandscapeLayout();
            }
            else if (this.isMobileDevice && !newType.startsWith("landscape")) {
                this.applyMobilePortraitLayout();
            }
        }
    },
    created () {
        this.steps.forEach((step) => {
            this.loadStoryContents(step.htmlFile).then(data => {
                step.loadedContent = data?.replace(/<a(?![^>]*\btarget=)([^>]*)>/gi, "<a$1 target=\"_blank\">");
            }).catch(err => {
                console.error(err);
            });
        });

        const breakpoint = "(max-width: 768px)",
            mediaQuery = window.matchMedia(breakpoint),
            isMobile = mediaQuery.matches,
            orientationCheck = this.screenOrientationType.startsWith("landscape");

        if (isMobile && orientationCheck) {
            this.applyMobileLandscapeLayout();
        }
    },
    mounted () {
        if (this.storyConf.styleCSS) {
            const element = document.createElement("link");

            element.setAttribute("rel", "stylesheet");
            element.setAttribute("type", "text/css");
            element.setAttribute("href", this.storyConf.styleCSS);
            document.getElementsByTagName("head")[0].appendChild(element);
        }

        this.setExpandedBySide({expanded: true, side: "secondaryMenu"});

        if (window.matchMedia("(max-width: 768px)").matches && !this.isMobilePortrait) {
            this.menuBySide("secondaryMenu").width = "40%";
        }

        const heading = document.getElementById("mp-menu-navigation-secondaryMenu"),
            toolBody = document.getElementById("mp-body-secondaryMenu"),
            positionFix = this.storyConf.showHomeButton ? 250 : 190,
            resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];

                this.rightButtonsPositionLeft = entry.contentRect.width - positionFix + "px";
                this.toolWidth = toolBody.clientWidth + "px";

                if (window.matchMedia("(max-width: 768px)").matches && !this.isMobilePortrait) {
                    document.getElementById("secondaryMenu-toggle-button").style.right = document.getElementById("mp-menu-secondaryMenu").clientWidth - 15 + "px";
                    document.getElementById("mp-menu-secondaryMenu").style.removeProperty("left");
                    document.getElementsByClassName("btn-group-controls")[0].style.right = document.getElementById("mp-menu-secondaryMenu").clientWidth + 10 + "px";
                }
                else if (window.matchMedia("(max-width: 768px)").matches && this.isMobilePortrait) {
                    document.getElementsByClassName("btn-group-controls")[0].style.removeProperty("right");
                    this.addSingleAlert({
                        content: this.$t("additional:modules.dataNarrator.dipasPlayer.mobilePortraitMessage"),
                        category: "info",
                        once: true
                    });
                }
            });

        if (this.isMobilePortrait) {
            this.applyMobilePortraitLayout();
        }

        this.rightButtonsPositionLeft = toolBody.clientWidth - positionFix + "px";
        this.toolWidth = toolBody.clientWidth + "px";

        resizeObserver.observe(toolBody);

        if (toolBody) {
            toolBody.style.minWidth = "250px";
        }

        heading.setAttribute("style", this.dipasPlayerHeadingStyle);
        this.originalToolBodyStyle = toolBody.getAttribute("style");
        toolBody.setAttribute("style", this.dipasPlayerToolBodyStyle);

        this.scrollerSetup();

        // Add scroll event listener to toolBody
        if (toolBody) {
            toolBody.addEventListener("scroll", this.handleToolBodyScroll);
        }
    },
    activated () {
        // Handle KeepAlive visibility. Triggered if component is activated
        const heading = document.getElementById("mp-menu-navigation-secondaryMenu"),
            toolBody = document.getElementById("mp-body-secondaryMenu");

        heading.setAttribute("style", this.dipasPlayerHeadingStyle);
        this.originalToolBodyStyle = toolBody.getAttribute("style");
        toolBody.setAttribute("style", this.dipasPlayerToolBodyStyle);

        this.$nextTick(() => {
            if (toolBody && this.toolBodyScrollTop > 0) {
                toolBody.scrollTop = this.toolBodyScrollTop;
            }
            if (toolBody) {
                toolBody.addEventListener("scroll", this.handleToolBodyScroll);
            }
        });

        if (this.isMobilePortrait) {
            this.applyMobilePortraitLayout();
        }
    },
    deactivated () {
        // Handle KeepAlive visibility. Triggered if component is deactivated
        const heading = document.getElementById("mp-menu-navigation-secondaryMenu"),
            toolBody = document.getElementById("mp-body-secondaryMenu");

        heading?.style?.removeProperty("display");
        toolBody.setAttribute("style", this.originalToolBodyStyle || "");

        // Remove scroll event listener
        if (toolBody) {
            toolBody.removeEventListener("scroll", this.handleToolBodyScroll);

            toolBody.scrollTop = 0;
        }

        // remove the close button if GFI is opened
        document.getElementById("mp-menu-header-close-button-secondaryMenu")?.setAttribute("style", "display: none;");
        document.getElementById("mp-menu-navigation-reset-button-secondaryMenu")?.setAttribute("style", "display: none;");
    },
    methods: {
        ...mapMutations("Modules/DataNarrator", Object.keys(mutations)),
        ...mapMutations("Menu", ["setExpandedBySide"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapMutations([
            "setDeviceMode"
        ]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        /**
         * Updates the step html content
         * @param {Object} htmlFile name of the html file to load
         * @returns {void}
         */
        async loadStoryContents (htmlFile) {
            if (this.storyConf.htmlFolder && htmlFile) {
                const storybasepath = this.storyConfPath.endsWith("/") ? this.storyConfPath : this.storyConfPath + "/",
                    response = await axios.get(storybasepath + this.storyConf.htmlFolder + "/" + htmlFile),
                    data = await response.data;

                return data;
            }
            else if (htmlFile) {
                return axios.get("./assets/steps/" + htmlFile)
                    .then(response => {
                        if (!response || !response.data) {
                            throw new Error(`No data received for file: ${htmlFile}`);
                        }
                        return response.data;
                    });
            }

            return null;
        },
        /**
         * Closes the table of contents div
         * @returns {void}
         */
        closeTOC () {
            this.showTableOfContents = false;
        },
        /**
         * Scroll to previous step in the story
         * @returns {void}
         */
        goToPrevStep () {
            // this is necessary to go to the previous step if the masterportal is
            // incorporated via an Iframe and the application runs in Chrome
            this.$nextTick(() => {
                window.parent.scrollBy(0, 1);
            });

            // the timeout is necessary to go to the previous step if the masterportal is
            // incorporated via an Iframe and the application runs in Chrome
            setTimeout(() => {
                const scrollContainer = document.getElementById("mp-body-secondaryMenu");

                scrollContainer.scrollBy({top: -200, behavior: "auto"});
            }, 300);

        },
        /**
         * Scroll to next step in the story
         * @returns {void}
         */
        goToNextStep () {
            // this is necessary to go to the next step if the masterportal is
            // incorporated via an Iframe and the application runs in Chrome
            this.$nextTick(() => {
                window.parent.scrollBy(0, 1);
            });

            // the timeout is necessary to go to the next step if the masterportal is
            // incorporated via an Iframe and the application runs in Chrome
            setTimeout(() => {
                const scrollContainer = document.getElementById("mp-body-secondaryMenu");

                scrollContainer.scrollBy({top: 200, behavior: "auto"});
            }, 300);
        },
        /**
         * Close the tool
         * @returns {void}
         */
        callClose () {
            if (this.storyConf.showHomeButton) {
                this.changeCurrentComponent({type: "dipasStorySelector", side: "secondaryMenu", props: {name: "DipasStorySelector"}});
            }
        },
        /**
         * Converts a percentage value into degrees
         * @param {Number} percentage Perctentage to be converted to degrees
         * @returns {Number} Percentage in degrees
         */
        percentageToDegrees (percentage) {
            return percentage / 100 * 360;
        },
        /**
         * Calculates the aspect ratio of an iframe and returns the corresponding ratio class for styling
         * @param {HTMLElement} iframe the iframe to calculate the aspect ratio for
         * @returns {String} ratio class
         */
        getIframeAspectRatio (iframe) {
            const width = !isNaN(parseInt(iframe.width, 10)) ? parseInt(iframe.width, 10) : 16,
                height = !isNaN(parseInt(iframe.height, 10)) ? parseInt(iframe.height, 10) : 9,
                ratio = width / height,
                ratioDiffs = {};

            let ratioDiffsArray = [];

            this.ratioComparison.forEach((item, index) => {
                ratioDiffs[index] = [index, Math.abs(item.ratioValue - ratio)];
            });

            ratioDiffsArray = Object.entries(ratioDiffs);
            ratioDiffsArray.sort((a, b) => a[1][1] - b[1][1]);

            return this.ratioComparison[ratioDiffsArray[0][0]].ratioClass;
        },
        scrollerSetup () {
            const stepElements = this.$refs.stepper;

            if (!stepElements || stepElements.length === 0) {
                return;
            }

            // Disconnect previous observer if exists
            if (this._stepObserver) {
                this._stepObserver.disconnect();
            }

            // Remove all active classes
            stepElements.forEach(step => step.classList?.remove("active"));

            // Use a range of thresholds for smoother detection
            // thresholds control how often the observer fires as visibility changes
            // threshold: 0 — fires as soon as any part of the element is visible.
            // threshold: 1 — fires only when the entire element is visible.
            // threshold: [0, 0.1, 0.2, ..., 1] — fires at every 10% increment of visibility
            const thresholds = Array.from({length: 21}, (_, i) => i * 0.05); // [0, 0.05, ..., 1]

            // Track intersection ratios for each step
            // intersectionRatios tell you how much of each observed element is currently visible,
            // so it can be decided which one is “active”.
            const intersectionRatios = new Array(stepElements.length).fill(0);

            this._stepObserver = new IntersectionObserver(
                (entries) => {
                    // Update intersection ratios for all steps
                    entries.forEach(entry => {
                        const idx = stepElements.indexOf(entry.target);

                        intersectionRatios[idx] = entry.isIntersecting ? entry.intersectionRatio : 0;
                    });

                    // Find the step with the highest intersection ratio
                    let maxRatio = 0,
                        activeIndex = -1;

                    // find which step is most visible in the viewport and mark it as the "active" step.
                    intersectionRatios.forEach((ratio, idx) => {
                        if (ratio > maxRatio) {
                            maxRatio = ratio;
                            activeIndex = idx;
                        }
                    });

                    // Remove all active classes first
                    stepElements.forEach(step => step.classList.remove("active"));

                    // Set only the most visible step as active if any
                    if (activeIndex !== -1 && maxRatio > 0) {
                        const step = stepElements[activeIndex];

                        step.classList.add("active");

                        if (this.currentIndex !== activeIndex) {
                            this.currentIndex = activeIndex;
                            this.$emit("change", activeIndex);

                            // Handle iframe aspect ratio and progress
                            const iframeElement = step.querySelector("iframe"),
                                iframeDiv = step.getElementsByClassName("field_video")[0],
                                storyProgress = 100 / this.steps.length * (activeIndex + 1);

                            if (iframeElement && iframeDiv) {
                                const ratioClass = this.getIframeAspectRatio(iframeElement);

                                iframeDiv.classList.add("ratio", ratioClass);
                            }

                            if (storyProgress > 0) {
                                if (storyProgress <= 50) {
                                    this.rotateRight = this.percentageToDegrees(storyProgress);
                                    this.rotateLeft = 0;
                                }
                                else {
                                    this.rotateRight = 180;
                                    this.rotateLeft = this.percentageToDegrees(storyProgress - 50);
                                }
                            }
                        }
                    }
                    else {
                        this.currentIndex = -1;
                    }
                },
                {
                    root: null,
                    threshold: thresholds
                }
            );

            // Observe each step element
            stepElements.forEach(step => this._stepObserver.observe(step));
        },
        toggleTableOfContents () {
            this.showTableOfContents = !this.showTableOfContents;
        },
        handleToolBodyScroll (event) {
            this.toolBodyScrollTop = event.target.scrollTop;
        },
        applyMobileLandscapeLayout () {
            this.setDeviceMode("Desktop");
            this.$nextTick(() => {
                this.setExpandedBySide({expanded: true, side: "secondaryMenu"});
                this.menuBySide("secondaryMenu").width = "40%";
            });
        },
        applyMobilePortraitLayout () {
            if (this.isMobileDevice) {
                this.setDeviceMode("Mobile");

                const secondaryMenu = document.getElementById("mp-menu-secondaryMenu");

                secondaryMenu?.style.removeProperty("left");
            }

            this.$nextTick(() => {
                this.setExpandedBySide({expanded: true, side: "secondaryMenu"});

                const menuPanel = document.getElementById("mp-menu-secondaryMenu");

                // Use setTimeout to wait for the browser to complete orientation reflow
                setTimeout(() => {
                    if (menuPanel) {
                        menuPanel.style.transition = "top 0.3s ease";
                        menuPanel.style.top = "85%";
                    }

                    const scrollTarget = document.documentElement.scrollHeight > document.documentElement.clientHeight
                        ? document.documentElement
                        : document.body;

                    scrollTarget.scrollTop = scrollTarget.scrollHeight * 0.21;

                    if (scrollTarget.scrollTop === 0) {
                        window.scrollTo(0, document.body.scrollHeight * 0.21);
                    }

                    document.getElementById("mainMenu-toggle-button")?.setAttribute("style", "position: absolute;");
                }, 100);
            });
        }
    }
};
</script>

<template>
    <div
        class="d-flex w-100"
    >
        <div
            v-if="showTableOfContents"
            class="d-flex table-of-contents"
            :class="{table: uiStyle.toUpperCase() === 'TABLE'}"
            :style="cssVars"
        >
            <div class="d-flex justify-content-between tob-header">
                <div> {{ $t("additional:modules.dataNarrator.tableOfContents") }} </div>
                <button
                    class="bootstrap-icon closeTOC"
                    aria-label="$t('additional:modules.dataNarrator.dipasPlayer.closeTOC')"
                    @click="showTableOfContents ^= 1"
                >
                    <i class="bi-x" />
                </button>
            </div>

            <TableOfContents
                :steps="steps"
                :steps-objects="stepsObjects"
                :current-step="currentIndex"
                :story-title="storyConf.title"
                @close-toc="closeTOC"
            />
        </div>
        <div class="d-flex w-100">
            <div class="storyToolHeader">
                <div
                    v-if="isMobilePortrait"
                    class="drag-indicator"
                >
                    <span /><span /><span />
                </div>
                <a
                    v-if="showDipasLogo"
                    class="dipasLogo"
                    href="https://dipas.org/"
                    target="_blank"
                    :style="cssVars"
                >
                    <img
                        src="../../assets/DIPAS-Logo-RGB.png"
                        alt="DIPAS Logo"
                    >
                </a>
            </div>
            <div
                v-show="!showTableOfContents"
                id="dipasplayer"
                :style="cssVars"
            >
                <div
                    class="storyTitle"
                    tabindex="0"
                >
                    <h1 v-if="storyConf.title">
                        {{ storyConf.title }}
                    </h1>

                    <figure
                        v-if="storyConf.coverImagePath"
                        :alt="storyConf.coverImageAlt"
                    >
                        <img
                            v-if="storyConf.coverImagePath && storyConf.coverImagePath.length"
                            :alt="storyConf.coverImageAlt"
                            :src="storyConf.coverImagePath"
                        >

                        <figcaption v-if="storyConf.coverImageCaption">
                            <span> {{ storyConf.coverImageCaption }}</span>
                        </figcaption>

                        <figcaption v-if="storyConf.coverImageCopyright">
                            <span> ©  {{ storyConf.coverImageCopyright }}</span>
                        </figcaption>
                    </figure>
                </div>

                <div
                    v-for="(step, index) in steps"
                    ref="stepper"
                    :key="step.title"
                    class="stepper"
                    :class="{firstStep: index === 0, lastStep: index === steps.length - 1}"
                    :style="cssVars"
                >
                    <h2 v-if="step.title">
                        {{ step.title }}
                    </h2>

                    <figure
                        v-if="step.titleImage"
                        :alt="step.titleImageAlt"
                    >
                        <img
                            v-if="step.titleImage && step.titleImage.length"
                            :alt="step.titleImageAlt"
                            :src="step.titleImage"
                        >

                        <figcaption v-if="step.titleImageCaption">
                            <span> {{ step.titleImageCaption }}</span>
                        </figcaption>

                        <figcaption v-if="step.titleImageCopyright">
                            <span> ©  {{ step.titleImageCopyright }}</span>
                        </figcaption>
                    </figure>

                    <div
                        class="tool-dataNarrator-content"
                    >
                        <div
                            v-html="step.loadedContent"
                        />
                    </div>
                </div>
            </div>
            <div
                class="toolbar"
                :style="cssVars"
                role="toolbar"
                tabindex="0"
            >
                <div class="buttonrow">
                    <div class="nav-buttons">
                        <button
                            class="bootstrap-icon"
                            aria-label="$t('additional:modules.dataNarrator.dipasPlayer.goToPrevStep')"
                            :style="cssVars"
                            @click="goToPrevStep"
                        >
                            <i class="bi-chevron-up" />
                        </button>
                        <button
                            class="bootstrap-icon"
                            aria-label="$t('additional:modules.dataNarrator.dipasPlayer.goToNextStep')"
                            :style="cssVars"
                            @click="goToNextStep"
                        >
                            <i class="bi-chevron-down" />
                        </button>
                    </div>
                    <div
                        class="right-buttons"
                        :style="cssVars"
                    >
                        <div
                            class="progress"
                            :style="cssVars"
                        >
                            <span class="progress-left">
                                <span class="progress-bar" />
                            </span>
                            <span class="progress-right">
                                <span class="progress-bar" />
                            </span>
                            <button
                                class="bootstrap-icon tob-button"
                                :class="{ tobActive: showTableOfContents }"
                                aria-label="$t('additional:modules.dataNarrator.dipasPlayer.toggleTOC')"
                                @click="toggleTableOfContents"
                            >
                                <i class="bi-list-ul" />
                            </button>
                        </div>
                        <button
                            v-if="storyConf.showHomeButton"
                            class="bootstrap-icon home-button"
                            aria-label="$t('additional:modules.dataNarrator.dipasPlayer.openStoriesOverview')"
                            @click="callClose"
                        >
                            <i class="bi-house-door-fill" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.table-of-contents {
    position: absolute;
    background-color: white;
    border: 1px lightgray;
    height: calc(100vh - 115px);
    flex-direction: column;
    z-index: 1;
    bottom: 5rem;
    min-width: 15.625rem;

    &.table {
        height: calc(100vh - 90px);
        bottom: 4.688rem;
    }

    .tob-header {
        height: 2.5rem;
        width: 100%;
        text-align: left;
        font-size: 1.3rem;
        font-weight: bold;
        padding-left: 1.25rem;
        padding-top: 0.375rem;
        position: relative;
        background-color: white;
        top: 2rem;
        z-index: 10;
        margin: 15px 0;

        button.closeTOC {
            border: none;
            background: transparent;

            &.bootstrap-icon {
                font-size: 2rem;
                right: 0.938rem;
            }
        }
    }
}

.storyToolHeader {
    height: 45px;
    display: var(--tool-header);
    flex-direction: row;
    position: absolute;
    background-color: white;
    z-index: 1000;
    width: 97%;
    padding: 5px;
    top: 0;
    left: 0;

    .drag-indicator {
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 5px;

        span {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: #ccc;
            display: block;
        }
    }

    .headerTitle {
        padding: 5px 0 0 10px;
        font-size: 1rem;
        font-weight: bold;
    }

    a.dipasLogo {
        display: var(--tool-header);
        position: absolute;
        right: 1rem;
        height: 2rem;
    }
}

#dipasplayer {
    --h1Size: 1.875rem;
    --h2Size: 1.5rem;
    --pSize: 1rem;

    width: var(--initialToolWidth);
    @media (max-width: 767px) {
        width: var(--initialToolWidthMobile);
    }

    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;

    .storyTitle {
        margin: 40px 0px 10px;
        box-shadow: 0 4px 8px 0 rgb(0 0 0 / 50%);
        scroll-margin-top: 40px;

        >figure {
            >img {
                width: 100%;
                object-fit: cover;
            }

            figcaption {
                text-align: right;
                padding: 0 10px 0 0;
                font-size: 0.75rem;
            }
        }

        h1 {
            padding: 20px;
            color: var(--DipasColorsFont, #212529);
            font-size: var(--h1Size);
            hyphens: auto;
        }

        p {
            font-size: var(--pSize);
            margin-right: 0;
            padding: 0.625rem 1.25rem;
            line-height: 1.5rem;
            color: var(--DipasColorsFont, #212529);
        }
    }

    .stepper {
        min-height: 500px;
        margin: 10px 0;
        background-color: rgb(195, 195, 195) !important;
        box-shadow: 0 4px 8px 0 rgb(0 0 0 / 50%);
        opacity: 0.3;
        position: relative;
        scroll-margin-top: 50px;

        >figure {
            >img {
                width: 100%;
                object-fit: cover;
            }

            figcaption {
                text-align: right;
                padding: 0 10px 0 0;
                font-size: 0.75rem;
            }
        }

        h2 {
            padding: 16px 20px 10px;
            color: var(--DipasColorsFont, #212529);
            font-size: var(--h2Size);
            text-transform: none;
            font-weight: bold;
            hyphens: auto;
        }

        &.lastStep{
            margin-bottom: 60vh;
        }

        .tool-dataNarrator-content {
            overflow: auto;
            padding: 0.625rem 1.25rem;

            :deep() {
                .paragraph {
                    padding-bottom: 10px;
                }

                h3 {
                    font-size: 1.25rem;
                    line-height: 1.5rem;
                    color: var(--DipasColorsFont, #212529);
                    border-bottom: none;
                    margin: 0;
                }

                p {
                    font-size: var(--pSize);
                    margin-right: 0;
                    line-height: 1.5rem;
                    color: var(--DipasColorsFont, #212529);
                }

                figure {
                    img {
                        object-fit: contain;
                        object-position: top;
                        width: 100%;
                        height: auto;
                        max-height: 50vh;
                    }

                    figcaption {
                        text-align: right;
                        font-size: 0.75rem;
                    }
                }

                .paragraph_image_position_image_left {
                    display: flow-root;
                    .field_image {
                        figure {
                            float: left;
                            padding: 0.313rem 0.625rem 0 0;
                            width: 45%;
                            height: 100%;

                            img {
                                max-width: 100%;
                                max-height: 100%;
                                height: auto;
                                width: auto;
                            }

                            figcaption {
                                font-size: 0.75rem;
                                text-align: right;
                                line-height: 1rem;
                            }
                        }
                    }
                }

                .paragraph_image_position_image_right {
                    display: flow-root;
                    .field_image {
                        figure {
                            float: right;
                            padding: 0.313rem 0 0 0.625rem;
                            width: 45%;
                            height: 100%;

                            img {
                                max-width: 100%;
                                max-height: 100%;
                                height: auto;
                                width: auto;
                            }

                            figcaption {
                                font-size: 0.75rem;
                                text-align: right;
                                line-height: 1rem;
                            }
                        }
                    }
                }

                iframe {
                    width: 100% !important;
                    height: 100% !important;
                }
            }
        }

        &.active {
            background-color: white !important;
            opacity: 1;
        }
    }
}

.toolbar {
    position: fixed;
    height: 70px;
    bottom: 0;
    background-color: white;
    border-top: 3px solid var(--DipasColorsPrimary1, #003063);
    flex-direction: row;
    font-size: 1.7rem;
    display: flex;
    align-items: center;
    width: calc(var(--tool-width) - 7px);
    min-width: 250px;

    .buttonrow {
        bottom: 0.5rem;
        width: 100%;
        display: flex;
        flex-direction: row;
        position: relative;
        justify-content: space-between;

        .right-buttons {
            display: flex;
            margin-right: 0.625rem;
            position: relative;
            top: 1.125rem;

            .progress {
                width: 54px;
                height: 54px;
                background: none;
                position: relative;
                margin-right: 8px;
                bottom: var(--progress-bottom, 8px);

                &::after {
                    content: "";
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 4px solid white;
                    position: absolute;
                    top: 0;
                    left: 0;
                }
                >span {
                    width: 50%;
                    height: 100%;
                    overflow: hidden;
                    position: absolute;
                    top: 0;
                    z-index: 1;
                }

                .progress-bar {
                    width: 100%;
                    height: 100%;
                    background: none;
                    border-width: 4px;
                    border-style: solid;
                    position: absolute;
                    top: 0;
                    border-color: var(--DipasColorsPrimary1, #003063);
                }
                .progress-left {
                    left: 0;
                    .progress-bar {
                        left: 100%;
                        border-top-right-radius: 80px;
                        border-bottom-right-radius: 80px;
                        border-left: 0;
                        -webkit-transform-origin: center left;
                        transform-origin: center left;
                        transform: rotate(var(--rotate-left))
                    }
                }

                .progress-right {
                    right: 0;
                    .progress-bar {
                        left: -100%;
                        border-top-left-radius: 80px;
                        border-bottom-left-radius: 80px;
                        border-right: 0;
                        -webkit-transform-origin: center right;
                        transform-origin: center right;
                        transform: rotate(var(--rotate-right))
                    }
                }

                .tob-button {
                    text-align: center;
                    border: none;
                    background: transparent;
                    left: 50%;
                    top: var(--tob-button-top, 12%);
                    transform: translateX(-50%);
                    z-index: 1000;
                }

                .bootstrap-icon.tobActive {
                    ::before {
                        background-color: var(--DipasColorsPrimary1, #003063);
                        color: white;
                    }
                }
            }
        }

        .home-button {
            border: none;
            background-color: transparent;
            position: relative;
            bottom: 0.688rem;
            padding: 0;
       }

        .nav-buttons {
            border: none;
            background-color: white;
            margin: 0 0.625rem;
            position: relative;
            top: 0.5rem;
            padding: 0;
            gap: 10px;
            display: flex;


            :disabled {
                opacity: 0.3;
            }

            button {
                background-color: white;
                border: none;
                padding: 0;
            }

            i {
                border: 1px solid lightgrey;
                border-radius: 1.563rem;
                padding: 0.438rem;
                display: flex;
                width: 2.813rem;
                height: 2.813rem;
            }

            .bootstrap-icon {
                ::before {
                    color: var(--DipasColorsPrimary2, #e10019);
                    border: none;
                    font-size: 1rem;
                    -webkit-text-stroke: 0.125rem;
                }
            }
        }

        .bootstrap-icon {
            ::before {
                color: var(--DipasColorsPrimary1, #003063);
                border: 1px solid lightgrey;
                border-radius: 3.125rem;
                padding: 0.438rem;
                background-color: white;
                cursor: pointer;
            }
        }
    }
}

.mobileMessage {
    font-size: 1rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 3.5rem;
 }
</style>
