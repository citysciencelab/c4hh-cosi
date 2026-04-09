<script>
import HrHeader from "../../shared/components/HrHeader.vue";
import HrFooter from "../../shared/components/HrFooter.vue";

export default {
    name: "UpdateRequirements",
    components: {
        HrHeader,
        HrFooter
    }
};
</script>

<template lang="html">
    <HrHeader
        :text="$t('additional:modules.updateRequirements.description')"
        :button-text="$t('additional:modules.updateRequirements.createMessage')"
    />
    <HrFooter
        :cancel-text="$t('additional:modules.updateRequirements.cancelButtonLabel')"
        :save-text="$t('additional:modules.updateRequirements.saveButtonLabel')"
    />
</template>

<style lang="scss" scoped>
</style>

