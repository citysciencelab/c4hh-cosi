<script>
import HrHeader from "../../shared/components/HrHeader.vue";
import HrFooter from "../../shared/components/HrFooter.vue";

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Projects",
    components: {
        HrHeader,
        HrFooter
    }
};
</script>

<template lang="html">
    <HrHeader
        :text="$t('additional:modules.projects.description')"
        :button-text="$t('additional:modules.projects.createProject')"
    />
    <HrFooter
        :cancel-text="$t('additional:modules.projects.cancelButtonLabel')"
        :save-text="$t('additional:modules.projects.saveButtonLabel')"
    />
</template>

<style lang="scss" scoped>
</style>

