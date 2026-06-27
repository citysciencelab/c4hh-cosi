<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "HrHeader",
    components: {
        FlatButton
    },
    props: {
        text: {
            type: String,
            required: true
        },
        showButton: {
            type: Boolean,
            required: false,
            default: true
        },
        buttonText: {
            type: String,
            required: false,
            default: ""
        }
    },
    emits: ["click:button"]
};
</script>

<template lang="html">
    <div>
        <p class="mb-4">
            {{ text }}
        </p>
        <div
            v-if="showButton"
            class="d-flex justify-content-center"
        >
            <FlatButton
                icon="bi bi-pencil-fill"
                :text="buttonText"
                :title="buttonText"
                :interaction="() => $emit('click:button')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>

