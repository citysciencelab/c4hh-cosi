<script>
import {mapGetters, mapActions} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";
import {isWebLink} from "@shared/js/utils/urlHelper.js";
import {openSecuredPopup} from "@shared/js/utils/openSecuredPopup";

export default {
    name: "LandRegistryFileHelp",
    components: {
        FlatButton
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "linkToHelp",
            "landRegistryFileTourUrl"
        ]),
        /**
         * Checks whether the help link is present and uses a valid web URL.
         * @returns {boolean} True if the help link is valid.
         */
        helpLinkIsValid () {
            return Boolean(this.linkToHelp && this.isWebLink(this.linkToHelp));
        },
        /**
         * Checks whether the tour link is present and ends with .json.
         * @returns {boolean} True if the tour link is valid.
         */
        tourLinkIsValid () {
            return Boolean(this.landRegistryFileTourUrl && this.landRegistryFileTourUrl.endsWith(".json"));
        }
    },
    methods: {
        ...mapActions("Modules/LandRegistryFile", [
            "startGuidedTour"
        ]),
        isWebLink,
        /**
         * Opens the help link in a new browser tab if it is valid.
         * @returns {void}
         */
        openHelpLink () {
            if (this.helpLinkIsValid) {
                openSecuredPopup(this.linkToHelp, "_blank");
            }
        },
        /**
         * Switches to the search tab and starts the guided tour.
         * @returns {void}
         */
        prepareGuidedTour () {
            this.setCurrentTab("tabSearch");
            this.startGuidedTour();
        }
    }
};
</script>

<template lang="html">
    <div
        id="LandRegistryFileHelp"
        class="InnerLayoutFrame"
    >
        <div class="ScrollableContent">
            <p v-if="!helpLinkIsValid && !tourLinkIsValid">
                {{ $t('additional:modules.landRegistryFile.tabs.tabHelp.noHelpConfigured') }}
            </p>

            <FlatButton
                v-if="helpLinkIsValid"
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabHelp.openHelpButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabHelp.openHelpButtonLabel')"
                icon="bi-question-square"
                @click="openHelpLink()"
            />

            <FlatButton
                v-if="tourLinkIsValid"
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabHelp.startTourButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabHelp.startTourButtonLabel')"
                icon="bi-person-raised-hand"
                @click="prepareGuidedTour()"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #LandRegistryFileHelp{
        height: 100%;

        div.ScrollableContent {
            align-items: center;
            margin-top: 3rem;

            p {
                font-size: 1rem;
                line-height: 1.5rem;
            }
        }
    }
</style>

<style lang="scss">
    .driver-popover.landregistry-guided-tour {
        font-family: MasterPortalFont, sans-serif;
        /* driver.js sets inline top/left, so !important is required to keep the popover centered */
        top: 50% !important;
        left: 50% !important;
        right: auto !important;
        bottom: auto !important;
        transform: translate(-50%, -50%);

        .driver-popover-arrow {
            display: none;
        }

        .driver-popover-close-btn {
            width: 2.5rem;
            height: 2.5rem;
            padding: 0 0 .125rem;
            line-height: 1;
            font-size: 2rem;
            color: $black;
            opacity: .5;
            transition: opacity .15s ease-in-out;

            &:hover {
                opacity: .75;
            }

            &:focus-visible {
                opacity: 1;
                border-radius: .5rem;
                outline: .25rem solid var(--bs-focus-ring-color);
                outline-offset: -.5rem;
            }
        }

        .driver-popover-title {
            font-family: "MasterPortalFont Bold", sans-serif;
        }

        .driver-popover-footer {
            justify-content: space-between;

            .driver-popover-navigation-btns button+button {
                margin-left: auto;
            }
        }

        .driver-popover-footer button {
            min-height: 2.5rem;
            padding: 0 1rem;
            background-color: $secondary;
            border: 1px solid $secondary;
            border-radius: 50px;
            color: $white;
            font-family: MasterPortalFont, sans-serif;
            font-size: 1rem;
            text-shadow: none;

            &:hover {
                background-color: $primary;
                border-color: $primary;
                color: #001B3D;
            }

            &:active {
                background-color: $dark_blue;
                border-color: $dark_blue;
                color: $white;
            }
        }

        .driver-popover-footer button:focus-visible {
            outline: 3px solid var(--bs-focus-ring-color);
            outline-offset: 2px;
            background-color: $dark_blue;
            color: $white;
        }
    }
</style>
