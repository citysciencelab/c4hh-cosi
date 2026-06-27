<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "HrFooter",
    components: {
        FlatButton
    },
    props: {
        cancelText: {
            type: String,
            default: "Cancel"
        },
        saveText: {
            type: String,
            default: "Save"
        }
    },
    emits: ["click:cancel", "click:save"]
};
</script>

<template lang="html">
    <div class="footer-container d-flex justify-content-between flex-wrap gap-2">
        <FlatButton
            :text="cancelText"
            :interaction="() => $emit('click:cancel')"
            icon="bi-arrow-counterclockwise"
            secondary
        />
        <FlatButton
            :text="saveText"
            :interaction="() => $emit('click:save')"
            icon="bi-save"
        />
    </div>
</template>

<style lang="scss" scoped>
.footer-container {
    position: relative;
    width: 100%;
}
</style>

