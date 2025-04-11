<script>
import getters from "../store/gettersBimFactory";
import {mapGetters} from "vuex";

export default {
    props: {
        workflowId: {
            type: Number,
            required: true
        }
    },
    computed: {
        ...mapGetters("Modules/BimFactory", Object.keys(getters)),
        currentWorkflow () {
            const result = this.workflowsJSON?.workflows?.filter((workflow) => {
                return workflow.id === this.workflowId;
            });

            if (result && result.length === 1) {
                return result[0];
            }

            return null;
        },
        foregroundLayers () {
            return this.currentWorkflow?.layerIds.foreground;
        },
        backgroundLayers () {
            return this.currentWorkflow?.layerIds.background;
        }
    },
    watch: {
        workflowId (value) {
            console.warn("Die Layer müssen geändert werden!:" + value);
        }
    },
    mounted () {
        console.warn("Die Layer müssen geändert werden!");
    }
};
</script>

<template>
    <div class="bimFactoryWorkflow">
        <button @click="$emit('openWorkflow', 'start')">
            {{ $t('additional:modules.bimfactory.workflow.back') }}
        </button>

        <p>
            {{ currentWorkflow?.name }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
    div.bimFactoryWorkflow {
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;
    }
</style>
