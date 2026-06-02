<script>
import InputText from "../../../src/shared/modules/inputs/components/InputText.vue";

export default {
    components: {
        InputText
    },
    props: {
        config: {
            type: Object,
            required: true
        }
    },
    methods: {
        updateWorkflowFormData (machineName, value) {
            this.$store.commit("Modules/BimFactory/clearComponentErrors", {
                containerId: this.config.containerId,
                machineName: machineName,
                emptyError: true
            });

            this.$store.commit("Modules/BimFactory/updateWorkflowFormData", {
                containerId: this.config.containerId,
                machineName: machineName,
                value: value
            });
        }
    }
};
</script>

<template>
    <div class="BimFactoryWorkflowInputText">
        <InputText
            :id="config.component.machineName"
            :label="config.component.title"
            :model-value="config.component.defaultValue"
            :placeholder="config.component.defaultValue"
            @update:modelValue="val => updateWorkflowFormData(config.component.machineName, val)"
        />
    </div>
</template>

<style lang="scss">
#bim-factory {


    div.BimFactoryWorkflowInputText {
        /* necessary to get a dense form, because the InputText-Component uses class .mb-3 with '!important' to force 1rem margin-bottom */
        margin-bottom: -1rem;

        div.form-floating {
        > input {
                border: none;
                border-top: 0.0625rem solid grey;
                border-radius: 0;
                box-shadow: none;
                margin-top: 0.5rem;
            }
        }
    }
}
</style>
