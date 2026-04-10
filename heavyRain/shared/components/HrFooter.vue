<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";

export default {
    name: "HrFooter",
    components: {
        FlatButton,
        HrSnackbar
    },
    props: {
        cancelText: {
            type: String,
            default: "Cancel"
        },
        saveText: {
            type: String,
            default: "Save"
        },
        snackbarVisible: {
            type: Boolean,
            default: false
        },
        snackbarMessage: {
            type: String,
            default: ""
        },
        snackbarColor: {
            type: String,
            default: "success"
        }
    },
    emits: ["click:cancel", "click:save", "update:snackbarVisible"],
    methods: {
        updateVisible (val) {
            this.$emit("update:snackbarVisible", val);
        }
    }
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
        <HrSnackbar
            :model-value="snackbarVisible"
            :message="snackbarMessage"
            :color="snackbarColor"
            :closable="true"
            @update:model-value="updateVisible"
        />
    </div>
</template>

<style lang="scss" scoped>
.footer-container {
    position: relative;
    width: 100%;
}
</style>

