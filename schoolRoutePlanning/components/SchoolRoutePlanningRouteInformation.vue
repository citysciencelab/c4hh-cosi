<script>
import {mapGetters} from "vuex";
import getters from "../store/gettersSchoolRoutePlanning";

export default {
    name: "SchoolRoutePlanningRouteInformation",
    computed: {
        ...mapGetters("Tools/SchoolRoutePlanning", Object.keys(getters))
    }

};
</script>

<template>
    <div
        v-if="routeDescription.length > 0"
        class="route-information-container"
    >
        <div class="result px-2 py-3 mb-3">
            <p>
                {{ $t("additional:modules.tools.schoolRoutePlanning.totalLength") }}
                <span class="highlight">
                    {{ routeLength }}
                </span>
            </p>
            <p>
                <small class="d-block mt-3">
                    {{ $t("additional:modules.tools.schoolRoutePlanning.from") }}
                </small>
                <span class="highlight">
                    {{ selectedAddress }}
                </span>
            </p>
            <p>
                <small class="d-block mt-3">
                    {{ $t("additional:modules.tools.schoolRoutePlanning.to") }}
                </small>
                <span class="highlight">
                    {{ `${selectedSchool.get("schulname")}, ${routeElements.SchuleingangTyp} (${routeElements.SchuleingangAdresse})` }}
                </span>
            </p>
        </div>
        <button
            id="tool-schoolRoutePlanning-show-route-description"
            type="button"
            class="btn btn-default btn-sm btn-block mb-3"
            data-bs-toggle="collapse"
            data-bs-target="#tool-schoolRoutePlanning-route-description"
        >
            {{ $t("additional:modules.tools.schoolRoutePlanning.showRouteDescription") }}
        </button>
        <ol
            id="tool-schoolRoutePlanning-route-description"
            class="collapse pl-2"
        >
            <li
                v-for="routePart in routeDescription"
                :key="routePart[0]"
                class="pb-1"
            >
                {{ routePart[1] }}
            </li>
        </ol>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    $background_color_1: rgb(229, 229, 229);

    .highlight {
        font-family: $font_family_accent;
        font-size: 15px;
    }

    .result {
        background-color: $background_color_1;
    }

    #tool-schoolRoutePlanning-show-route-description {
        font-size: $font-size-base;
        width: 100%;
    }

    @media (max-width: 767px) {
        #tool-schoolRoutePlanning-route-description {
            font-size: 14px;
        }
    }
</style>
