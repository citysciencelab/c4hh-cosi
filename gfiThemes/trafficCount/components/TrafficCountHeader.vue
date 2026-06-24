<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "TrafficCountHeader",
    components: {
        FlatButton
    },
    props: {
        direction: {
            type: String,
            required: true
        },
        isHeavyTrafficAvailable: {
            type: Boolean,
            required: true
        },
        isMqttLive: {
            type: Boolean,
            required: true
        },
        lastUpdate: {
            type: String,
            required: true
        },
        meansOfTransport: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    },
    data () {
        return {
            meansOfTransportIcons: {
                Anzahl_Fahrraeder: "bi-bicycle",
                Anzahl_Kfz: "bi-car-front",
                Anzahl_Schwerverkehr: "bi-truck"
            }
        };
    },
    computed: {
        /**
         * Gets the indication if heavy traffic is available, if the means of transport is "Anzahl_Kfz".
         * @return {String} The indication.
         */
        heavyTrafficIndication () {
            if (this.meansOfTransport !== "Anzahl_Kfz") {
                return "";
            }

            return this.isHeavyTrafficAvailable ? this.$t("additional:modules.tools.gfi.themes.trafficCount.isHeavyTrafficAvailable") : this.$t("additional:modules.tools.gfi.themes.trafficCount.isHeavyTrafficNotAvailable");
        },

        /**
         * Gets the icon class for the current means of transport.
         * @return {String} The icon class.
         */
        meansOfTransportIcon () {
            return this.meansOfTransportIcons[this.meansOfTransport];
        }
    }

};
</script>
<template>
    <div class="mb-3">
        <div class="d-flex flex-row align-items-center p-3 rounded-3 background-color">
            <div class="fs-1 p-2">
                <i :class="['bi', meansOfTransportIcon]" />
            </div>
            <div class="ms-4">
                <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.idLabel") }}</span>
                <span class="header-color"> {{ title }} </span>
                <br>
                <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.typeLabel") }}</span>
                <span class="header-color"> {{ type }} </span>
                <br>
                <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.directionLabel") }}</span>
                <span class="header-color"> {{ direction }} </span>
                <br>
                <span class="header-color"> {{ heavyTrafficIndication }} </span>
            </div>
            <div class="ms-auto">
                <FlatButton
                    :icon="'bi-cloud-arrow-down'"
                    :aria-label="$t('additional:modules.storyCreator.preview')"
                    :text="'Download'"
                    :customclass="'mb-0'"
                />
            </div>
        </div>
        <div class="p-2">
            <div class="d-flex flex-row align-items-center">
                <span class="pt-1">
                    <i class="bi bi-arrow-clockwise fs-5 me-3" />
                </span>
                <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.lastupdateLabel") }} {{ lastUpdate }}</span>
                <br>
            </div>
            <div v-if="!isMqttLive">
                <small>{{ $t("additional:modules.tools.gfi.themes.trafficCount.autoUpdateNote") }}</small>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
    .background-color {
        background-color: rgba($light_grey, 0.5);
    }

    .header-color {
        color: $secondary;
    }
</style>
