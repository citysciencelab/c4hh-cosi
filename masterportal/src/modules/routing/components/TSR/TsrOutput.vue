<script>
import {mapGetters, mapActions} from "vuex";
import RoutingDownload from "../RoutingDownload.vue";
import RoutingElevationProfile from "../RoutingElevationProfile.vue";

/**
 * TsrOutput
 * @module modules/TsrOutput
 */
export default {
    name: "TsrOutput",
    components: {
        RoutingDownload,
        RoutingElevationProfile
    },
    data: function () {
        return {
        };
    },
    computed: {
        ...mapGetters("Modules/Routing/TSR", ["waypoints", "tsrDuration", "tsrDistance"]),
        ...mapGetters("Modules/Routing", ["taskHandler", "tsrSettings"])
    },
    beforeMount () {
        this.removeTSRWaypointsDrawInteraction();
    },
    beforeUnmount () {
        this.createTSRWaypointsDrawInteraction();
    },
    methods: {
        ...mapActions("Modules/Routing/TSR", ["removeTSRWaypointsDrawInteraction", "createTSRWaypointsDrawInteraction"])
    }
};
</script>

<template>
    <div
        id="tsr-output"
    >
        <p>{{ $t('common:modules.routing.tsr.outputHeaderTSR') }}</p>

        <div
            v-for="(waypoint, idx) in waypoints"
            :key="idx"
            class="tsr-output-item"
        >
            <div
                v-if="idx === 0"
                class="d-flex align-items-center"
            >
                <span class="icon-with-number">
                    <i
                        class="bi bi-circle start-icon"
                    />
                    <span class="tsr-idx">{{ $t('common:modules.routing.startIndex') }}</span>
                </span>
                <span>{{ waypoint.getDisplayName() }}</span>
            </div>
            <div
                v-else-if="idx === (waypoints.length - 1) && waypoints[0].coordinates.toString() === waypoints[waypoints.length - 1].coordinates.toString()"
                class="d-flex align-items-center"
            >
                <span class="icon-with-number">
                    <i
                        class="bi bi-circle start-icon"
                    />
                    <span class="tsr-idx">{{ $t('common:modules.routing.startIndex') }}</span>
                </span>
                <span>{{ waypoints[0].getDisplayName() }}</span>
            </div>
            <div
                v-else-if="idx === (waypoints.length - 1) && waypoints[0].coordinates.toString() !== waypoints[waypoints.length - 1].coordinates.toString()"
                class="d-flex align-items-center"
            >
                <span class="icon-with-number">
                    <i
                        class="bi bi-circle end-icon"
                    />
                    <span class="tsr-idx">{{ $t('common:modules.routing.endIndex') }}</span>
                </span>
                <span>{{ waypoint.getDisplayName() }}</span>
            </div>
            <div
                v-else
                class="d-flex align-items-center"
            >
                <span class="icon-with-number">
                    <i
                        class="bi bi-circle waypoint-icon"
                    />
                    <span class="tsr-idx">{{ idx }}</span>
                </span>
                <span>{{ waypoint.getDisplayName() }}</span>
            </div>
        </div>

        <div>
            {{ $t('common:modules.routing.tsr.tsrDuration') }} {{ tsrDuration }}
        </div>
        <div>
            {{ $t('common:modules.routing.tsr.tsrDistance') }} {{ tsrDistance }}
        </div>
        <div v-if="tsrSettings.elevation">
            <hr>
            <RoutingElevationProfile />
        </div>
        <hr>
        <RoutingDownload />
    </div>
</template>

<style lang="scss" scoped>

#tsr-output p {
    margin-top: 20px;
    font-size: 1.25rem;
}

.tsr-output-item {
    margin-bottom: 20px;
}
.bi-circle {
    font-size: 25px;
    margin-right: 20px;
    margin-left: 10px;
    -webkit-text-stroke: 2px;
}

.icon-with-number {
  display: inline-block;
  position: relative;
}

.tsr-idx {
  position: absolute;
  top: 45%;
  left: 41%;
  transform: translate(-50%, -50%);
  font-family: "MasterPortalFont";
  font-weight: bold;
  color: black;
}

.start-icon {
    color: rgb(244, 34, 37);
}

.end-icon {
    color: rgb(51, 164, 71);
}

.waypoint-icon {
    color: rgb(0, 119, 182);
}

button {
    margin-top: 10px;
    margin-bottom: 10px;
}

</style>
