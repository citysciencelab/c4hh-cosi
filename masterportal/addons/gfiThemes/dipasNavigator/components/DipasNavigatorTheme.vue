<script>
import {mapGetters, mapActions} from "vuex";
import dayjs from "dayjs";

export default {
    name: "DipasNavigatorTheme",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters("Menu", [
            "expanded"
        ]),
        ...mapGetters(["isMobile"]),
        attributes: function () {
            return this.feature.getMappedProperties();
        },
        dateStart: function () {
            if (this.attributes && this.attributes.dateStart) {
                return dayjs(this.attributes.dateStart, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY");
            }
            return "";
        },
        dateEnd: function () {
            if (this.attributes && this.attributes.dateEnd) {
                return dayjs(this.attributes.dateEnd, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY");
            }
            return "";
        }
    },
    watch: {
        feature: {
            handler () {
                this.centerVisibleMap(this.feature);
            },
            deep: true
        }
    },
    mounted () {
        this.centerVisibleMap(this.feature);
    },
    methods: {
        ...mapActions("Maps", [
            "setCenter"
        ]),
        /**
         * Opens the given link in a new window.
         * @param {String} link Link to be opened in a new window.
         * @returns {void}
         */
        onClick (link) {
            window.open(link, "_blank");
        },
        /**
         * Center the visible map on the geometry of a feature
         *  take into account if the main menu sidebar is open or closed
         * @param {Object} feature feature in map to be used as center coordinate
         */
        centerVisibleMap (feature) {
            if (feature && !this.isMobile) {
                const coordinates = feature.getProperties().geometry.getCoordinates(),
                    map = mapCollection.getMap("2D"),
                    pixelAtCoordinates = map?.getPixelFromCoordinate(coordinates),
                    rightPadding = this.expanded("secondaryMenu")
                        ? document.getElementById("mp-menu-secondaryMenu").offsetWidth + 20
                        : 100,
                    leftPadding = this.expanded("mainMenu")
                        ? document.getElementById("mp-menu-mainMenu").offsetWidth + 20
                        : 20,
                    offset = (rightPadding - leftPadding) / 2;

                if (pixelAtCoordinates) {
                    const shiftedPixelX = [pixelAtCoordinates[0] + offset, pixelAtCoordinates[1]],
                        shiftedCoordinate = map.getCoordinateFromPixel(shiftedPixelX);

                    this.setCenter(shiftedCoordinate);
                }
            }
        }
    }
};
</script>

<template>
    <div class="dipas-navigator-theme">
        <div class="dipas-navigator-first-row">
            <div class="dipas-navigator-proceeding-status">
                <span class="dipas-navigator-location-icon">
                    <img
                        :src="attributes.status_icon"
                        alt="Icon for proceeding status"
                    >
                </span>
                <span class="dipas-navigator-status-label">{{ attributes.status }}</span>
            </div>

            <span class="dipas-navigator-dateRange">
                <span>{{ $t("additional:addons.gfiThemes.dipasNavigator.range") }}:</span>

                <span class="dipas-navigator-dateRange-dates">{{ dateStart }} - {{ dateEnd }}</span>
            </span>
        </div>

        <div class="dipas-navigator-title">
            {{ attributes.proceeding }}
        </div>

        <div class="dipas-navigator-themes">
            <span class="dipas-navigator-themes-key"> {{ $t("additional:addons.gfiThemes.dipasNavigator.themes") }}: </span>
            {{ attributes.themes }}
        </div>

        <div class="dipas-navigator-description">
            {{ attributes.description }}
        </div>

        <div class="dipas-navigator-initiators">
            {{ $t("additional:addons.gfiThemes.dipasNavigator.initiators") }}:
            <span class="dipas-navigator-responsible-list"> {{ attributes.responsible }} </span>
        </div>

        <a
            class="dipas-navigator-proceedingLink"
            role="button"
            tabindex="0"
            @click="onClick(attributes.link)"
            @keyup.enter="onClick(attributes.link)"
        >
            {{ attributes.link }}
        </a>

        <div class="dipas-navigator-proceedingNumbers">
            {{ attributes.numberContributions }} {{ $t("additional:addons.gfiThemes.dipasNavigator.contributions") }} |
            {{ attributes.numberComments }} {{ $t("additional:addons.gfiThemes.dipasNavigator.comments") }}
        </div>

        <div
            v-if="attributes.documentation.length"
            class="dipas-navigator-documentation"
        >
            {{ $t("additional:addons.gfiThemes.dipasNavigator.documentation") }}:
            <div
                v-for="document in attributes.documentation"
                :key="document.name"
                class="dipas-navigator-document"
                role="button"
                tabindex="0"
                @click="onClick(document.url)"
                @keyup.enter="onClick(document.url)"
            >
                <span class="dipas-navigator-document-icon">
                    <img
                        :src="document.icon"
                        alt="Icon for document"
                    >
                </span>
                {{ document.name }}
            </div>
        </div>
    </div>
</template>


<style lang="scss">
.vue-tool-content-body {
    border-radius: 15px;
}

.dipas-navigator-theme {
     max-width: 615px;
     color: $dark_grey;
     font-family: Roboto, sans-serif;
     font-size: 0.75rem;
     padding-left: 24px;
     padding-right: 15px;

    .dipas-navigator-first-row {
        display: flex;
        flex-direction: row;
    }

    .dipas-navigator-proceeding-status {
        background-color: #003063;
        width: fit-content;
        height: fit-content;
        padding: 6px 6px;
        margin: 10px 0px;
        color: $white;
        display: flex;

        .dipas-navigator-location-icon {
            img {
                height: 18px;
            }
        }

        .dipas-navigator-status-label {
            position: relative;
            top: 1px;
            padding: 0px 2px;
        }
    }

    .dipas-navigator-dateRange {
        margin: 18px 10px;
        position: relative;
        top: 1px;
        display: flex;

        span.dipas-navigator-dateRange-dates {
            padding-left: 3px;
        }
    }

    .dipas-navigator-title {
        font-size: 1rem;
        font-weight: bold;
        color: #003063;
    }

    .dipas-navigator-themes {
        font-size: 0.875rem;
        color: $dark_grey;
        margin: 3px 0px;

        span.dipas-navigator-themes-key {
            font-weight: bold;
        }
    }

    .dipas-navigator-description {
        font-size: 0.875rem;
        margin-bottom: 26px;
    }

    .dipas-navigator-initiators {
        margin-bottom: 8px;
        display: inline-flex;

        .dipas-navigator-responsible-list {
            padding-left: 5px;
        }
    }

    a.dipas-navigator-proceedingLink {
        color: #003063;
        text-decoration: underline;
        cursor: pointer;
        display: block;
    }

    .dipas-navigator-proceedingNumbers {
        margin: 8px 0px 14px 0px;
    }

    .dipas-navigator-documentation {
        font-weight: bold;
        margin-bottom: 20px;
        display: flex;
        flex-direction: row;
        align-items: baseline;

        .dipas-navigator-document {
            font-weight: normal;
            background-color: #003063;
            border-radius: 15px;
            color: $white;
            padding: 6px 6px;
            text-overflow: ellipsis;
            white-space: nowrap;
            height: 28px;
            max-width: 145px;
            overflow: hidden;
            margin-left: 10px;
            cursor: pointer;

            img {
                height: 18px;
            }
        }
    }
}

</style>
