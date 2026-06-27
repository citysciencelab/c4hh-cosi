<script>
export default {
    props: {
        /** Component part of a workflow including errors */
        config: {
            type: Array,
            required: true
        }
    },
    computed: {
        errorList () {
            return this.config && Array.isArray(this.config)
                ? this.config
                : [];
        }
    }
};
</script>

<template>
    <div class="BimFactoryWorkflowInputErrors">
        <div
            v-for="(item, idx) in errorList"
            :key="idx"
            class="errorline"
        >
            <span v-if="errorList.length > 1">
                {{ idx + 1 }}.
            </span>

            <span v-if="item.msg !== ''">
                {{ $t('additional:modules.bimfactory.workflow.components.inputerrors.errorMessage') }}
            </span>

            <span
                v-if="item.msg !== ''"
                class="error"
            >
                {{ item.msg }}
            </span>
        </div>
    </div>
</template>

<style lang="scss">

#bim-factory {
    div.BimFactoryWorkflowInputErrors {

        div.errorline {
            font-size: smaller;
            margin: 0.5rem 0 0.5rem 0.813rem;
        }

        div {
            span.error {
                color: $light_red;
            }
        }
    }
}
</style>
