<script>
import {mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersResetTree";
import mutations from "../store/mutationsResetTree";

export default {
    name: "ResetTree",
    computed: {
        ...mapGetters("Tools/ResetTree", Object.keys(getters))
    },
    watch: {
        /**
         * Listens to the active property change.
         * @param {Boolean} isActive Value deciding whether the tool gets activated or deactivated.
         * @returns {void}
         */
        active (isActive) {
            if (isActive) {
                this.reset();
            }
        }
    },
    /**
     * Put initialize here if mounting occurs after config parsing
     * @returns {void}
     */
    mounted () {
        this.applyTranslationKey(this.name);
    },
    methods: {
        ...mapMutations("Tools/ResetTree", Object.keys(mutations)),

        /**
         * Returns the path of the original state
         * @return {string} the path of the original state
         */
        getOriginStatePath () {
            let path = "";

            if (window.location.pathname) {
                const port = window.location.port ? ":" + window.location.port : "";

                path = window.location.protocol + "//" + window.location.hostname + port + window.location.pathname;
            }
            else {
                path = "/";
            }

            return path;
        },

        /**
         * resets the actual url to origin state
         * @returns {void}
         */
        reset () {
            window.location.href = this.getOriginStatePath();
        }
    }
};
</script>

<template lang="html">
    <div>&nbsp;</div>
</template>
