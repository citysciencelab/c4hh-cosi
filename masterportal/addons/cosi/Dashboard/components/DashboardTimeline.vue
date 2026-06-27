<script>
export default {
    name: "DashboardTimeline",
    props: {
        item: {
            type: Object,
            required: true
        },
        animationState: {
            type: Boolean,
            required: true
        }
    },
    emits: ["startAnimation", "stopAnimation"],
    computed: {
        /**
         * Checks if the animation is currently running by verifying if the item is visualized and the animation state is active.
         * @return {boolean} True if the animation is running, false otherwise.
         */
        isAnimationRunning () {
            return this.item.visualized && this.animationState;
        }
    },
    unmounted () {
        if (this.isAnimationRunning) {
            this.$emit("stopAnimation");
        }
    },
    methods: {
        /**
         * Emits either a "stopAnimation" or "startAnimation" event based on the current state of the animation.
         * @return {void}
         */
        handleAnimation () {
            if (this.isAnimationRunning) {
                this.$emit("stopAnimation");
            }
            else {
                this.$emit("startAnimation", this.item);
            }
        }
    }
};

</script>

<template lang="html">
    <div
        v-if="item.years.length > 1"
        class="statistic-visualization"
        role="button"
        tabindex="0"
        @click="handleAnimation(item)"
        @keypress="handleAnimation(item)"
    >
        <span class="d-flex flex-nowrap align-items-end">
            <template v-if="isAnimationRunning">
                <div class="ms-2 me-3 dot-flashing" />
                {{ $t('additional:modules.tools.cosi.dashboard.stopAnimation') }}
            </template>
            <template v-else>{{ $t('additional:modules.tools.cosi.dashboard.startAnimation') }}</template>
        </span>
    </div>
</template>

<style lang="scss" scoped>

    .statistic-visualization {
        color: #888;
        font-size: 0.8rem;
    }
    .statistic-visualization:hover {
        cursor: pointer;
        text-decoration: underline;
        .is-selected {
            color: $secondary;
        }
    }

    /**
    * ==============================================
    * Dot Flashing
    * ==============================================
    */
    .dot-flashing {
        margin-bottom: 6px;
        position: relative;
        width: 4px;
        height: 4px;
        border-radius: 5px;
        background-color: $dark_grey;
        color: $dark_grey;
        animation: dot-flashing 1s infinite linear alternate;
        animation-delay: 0.5s;
    }
    .dot-flashing::before, .dot-flashing::after {
        content: "";
        display: inline-block;
        position: absolute;
        top: 0;
    }
    .dot-flashing::before {
        left: -8px;
        width: 4px;
        height: 4px;
        border-radius: 5px;
        background-color: $dark_grey;
        color: $dark_grey;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 0s;
    }
    .dot-flashing::after {
        left: 8px;
        width: 4px;
        height: 4px;
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
        50%, 100% {
            background-color: $light_grey;
        }
    }
</style>
