<script>
import HrHeader from "../../shared/components/HrHeader.vue";

export default {
    name: "UpdateRequirements",
    components: {
        HrHeader
    }
};
</script>

<template lang="html">
    <HrHeader
        :text="$t('additional:modules.updateRequirements.description')"
        :button-text="$t('additional:modules.updateRequirements.createMessage')"
    />
</template>

<style lang="scss" scoped>
</style>

