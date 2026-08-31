<script>
export default {
    name: "SimpleCard",
    props: {
        closeable: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        hoverable: {
            type: Boolean,
            default: false
        },
        icon: {
            type: String,
            default: null
        },
        iconSrc: {
            type: String,
            default: null
        },
        label: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            required: false,
            default: ""
        },
        text: {
            type: String,
            default: ""
        }
    },
    emits: ["click:close"]
};
</script>

<template lang="html">
    <div
        class="card shadow"
        :class="[{hoverable}, {disabled}, status === 'active' ? 'card-active' : '']"
    >
        <div class="card-body p-2 d-flex flex-row align-center">
            <div class="p-1 fs-3">
                <img
                    v-if="iconSrc"
                    :src="iconSrc"
                    alt=""
                    class="card-icon-img"
                >
                <i
                    v-else
                    :class="icon"
                />
            </div>
            <div class="ps-4 py-1 flex-grow-1">
                <div class="label">
                    {{ label }}
                </div>
                <div class="text">
                    {{ text }}
                </div>
            </div>
            <button
                v-if="closeable"
                type="button"
                class="btn-close align-self-start"
                aria-label="Close"
                @click.stop="$emit('click:close')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "../assets/style.scss";

    .card-icon-img {
        width: 1.5rem;
        height: 1.5rem;
        object-fit: contain;
    }

    .disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }
</style>
