<script>
export default {
    props: {
        config: {
            type: Object,
            default () {
                return {};
            },
            required: true
        }
    }
};
</script>

<template>
    <div class="BimFactoryWorkflowInputText">
        Input Component
    </div>
</template>

<style lang="scss" scoped>

.BimFactoryWorkflowInputText {
  outline: dashed 2px red;
}

</style>
