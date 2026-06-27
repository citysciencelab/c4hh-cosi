<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "HrCard",
    components: {
        IconButton
    },
    props: {
        title: {
            type: String,
            required: false,
            default: ""
        },
        editAriaLabel: {
            type: String,
            required: false,
            default: "Bearbeiten"
        }
    },
    emits: ["click:edit"]
};
</script>

<template lang="html">
    <div class="card shadow mb-3">
        <div class="card-body position-relative p-3 p-md-4">
            <div class="mb-2">
                <slot name="above-title" />
            </div>
            <h5
                v-if="title"
                class="card-title mb-3"
            >
                {{ title }}
            </h5>
            <div class="card-text pe-5 pb-5">
                <slot />
            </div>
            <div class="position-absolute bottom-0 end-0 p-3">
                <IconButton
                    :aria="editAriaLabel"
                    icon="bi bi-pencil-fill"
                    :class-array="['btn-secondary']"
                    :interaction="() => $emit('click:edit')"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>

