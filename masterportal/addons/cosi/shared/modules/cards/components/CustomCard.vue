<script>
export default {
    name: "CustomCard",
    props: {
        closeable: {
            type: Boolean,
            default: false,
            required: false
        },
        hoverable: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            required: false,
            default: ""
        },
        selected: {
            type: Boolean,
            required: false,
            default: false
        },
        icon: {
            type: String,
            default: null,
            required: false
        }
    },
    emits: ["click:close"]
};
</script>

<template lang="html">
    <div
        class="card shadow-sm"
        :class="[{hoverable}, status === 'active' ? 'card-active' : '', selected ? 'card-selected' : '']"
    >
        <div class="card-body p-2 d-flex flex-row align-center">
            <div
                v-if="icon"
                class="p-1 fs-3 ms-3"
            >
                <i :class="icon" />
            </div>
            <div class="px-4 flex-grow-1">
                <slot />
            </div>
            <button
                v-if="closeable"
                type="button"
                class="btn-close align-self-start ms-3"
                aria-label="Close"
                @click="$emit('click:close')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "../assets/style.scss";
</style>
