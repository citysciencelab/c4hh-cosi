<script>
import IconButton from "@/shared/modules/buttons/components/IconButton.vue";
import Badges from "../../badges/components/Badges.vue";

export default {
    name: "SimpleCard",
    components: {
        Badges,
        IconButton
    },
    props: {
        badgeList: {
            type: Array,
            required: false,
            default: () => []
        },
        closeable: {
            type: Boolean,
            default: true
        },
        closeIcon: {
            type: String,
            default: "bi bi-x-lg"
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
            <div class="px-4 py-1">
                <div class="label">
                    {{ label }}
                </div>
                <div class="text">
                    {{ text }}
                </div>
            </div>
            <div
                v-if="badgeList.length"
                class="d-flex flex-row flex-grow-1 gap-1"
            >
                <Badges
                    v-for="(badge, idx) in badgeList"
                    :key="idx"
                    :background-color="badge.backgroundColor"
                    :color="badge.color"
                    :text="badge.text"
                />
            </div>
            <IconButton
                v-if="closeable"
                class="p-1"
                :aria="'Löschen'"
                :icon="closeIcon"
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
