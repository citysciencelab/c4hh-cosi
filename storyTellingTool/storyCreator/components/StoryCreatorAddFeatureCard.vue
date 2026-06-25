<script>
import {mapGetters} from "vuex";

export default {
    name: "StoryCreatorAddFeatureCard",

    emits: ["click:close", "addContent"],

    data () {
        return {
            content: null
        };
    },

    computed: {
        ...mapGetters(["visibleSubjectDataLayerConfigs"]),

        /**
         * Returns true if there is at least one visible subject layer that is not a 3D layer, otherwise false.
         * @returns {Boolean} Returns true if there is at least one visible subject layer that is not a 3D layer, otherwise false.
         */
        existsVisibleSubjectLayer () {
            return this.visibleSubjectDataLayerConfigs
                .filter(layer => !layer.is3DLayer)
                .length > 0;
        }
    }
};

</script>

<template lang="html">
    <div
        class="card border-0 rounded-3 bg-light p-4"
    >
        <div class="d-flex align-items-center justify-content-between mb-3">
            <strong class="h4 fw-normal mb-0">
                {{ $t("additional:modules.storyCreator.addElementDropdown.items.feature") }}
            </strong>
            <button
                type="button"
                class="btn-close ms-2"
                aria-label="Close"
                @click="$emit('click:close')"
            />
        </div>
        <div class="bg-white rounded-3 p-4 d-flex flex-column align-items-center text-center justify-content-center">
            <div class="d-flex flex-column align-items-center text-center">
                <i class="bi bi-geo-alt-fill fs-1 mb-3" />
                <template v-if="existsVisibleSubjectLayer">
                    <strong class="mb-2">{{ $t("additional:modules.storyCreator.chapter.noFeatureLinked") }}</strong>
                    <p
                        class="text-muted mb-0 px-2 px-md-5"
                    >
                        {{ $t("additional:modules.storyCreator.chapter.addFeatureDescription") }}
                    </p>
                    <div class="dot-flashing my-3" />
                </template>
                <p
                    v-else
                    class="text-muted mb-0"
                >
                    {{ $t("additional:modules.storyCreator.chapter.noSubjectLayerHint") }}
                </p>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .dot-flashing {
        position: relative;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: $dark_grey;
        color: $dark_grey;
        animation: dot-flashing 1s infinite linear alternate;
        animation-delay: 0.5s;
    }

    .dot-flashing::before,
    .dot-flashing::after {
        content: "";
        display: inline-block;
        position: absolute;
        top: 0;
    }

    .dot-flashing::before {
        left: -12px;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: $dark_grey;
        color: $dark_grey;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 0s;
    }

    .dot-flashing::after {
        left: 12px;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: $dark_grey;
        color: $dark_grey;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 1s;
    }

    @keyframes dot-flashing {
        0% {
            background-color: $dark_grey;
        }
        50%,
        100% {
            background-color: $light_grey;
        }
    }
</style>
