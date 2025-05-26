<script>
import InputText from "../../../src/shared/modules/inputs/components/InputText.vue";

export default {
    components: {
        InputText
    },
    props: {
        config: {
            type: Object,
            default () {
                return {};
            },
            required: true
        }
    },
    methods: {
        updateWorkflowFormData (machineName, value) {
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
            :value="config.component.defaultValue"
            :placeholder="config.component.defaultValue"
            @input="updateWorkflowFormData(config.component.machineName, $event.target.value)"
        />
    </div>
</template>

<style lang="scss">
div.BimFactoryWorkflowInputText {
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
</style>
