<script>
import Badges from "../../badges/components/Badges.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "Card",
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
        data: {
            type: Array,
            required: true
        },
        downloadable: {
            type: Boolean,
            required: false,
            default: true
        },
        icon: {
            type: [Boolean, String],
            required: false,
            default: false
        },
        layoutStyle: {
            type: String,
            required: false,
            default: "list"
        },
        removable: {
            type: Boolean,
            required: false,
            default: true
        },
        status: {
            type: String,
            required: false,
            default: ""
        },
        title: {
            type: String,
            required: false,
            default: ""
        },
        visible: {
            type: Boolean,
            required: false,
            default: false
        }
    }
};
</script>

<template lang="html">
    <div
        class="card card-hover shadow mb-3"
        :class="status === 'active' ? 'card-active' : ''"
    >
        <div class="card-body d-flex align-items-center p-3">
            <div
                v-if="icon"
                class="ps-3 pe-5 fs-1"
            >
                <i :class="icon" />
            </div>
            <div
                v-if="layoutStyle === 'grid'"
                class="p-2 row grid flex-grow-1"
            >
                <div
                    v-for="(element, index) in data"
                    :key="index"
                    class="col-6"
                >
                    <div>
                        <i v-if="element?.icon" :class="element?.icon" class="me-2" />
                        <span>{{ element.label}}</span>
                    </div>
                    <div class="value">{{ element.value }}</div>
                </div>
            </div>
            <div
                v-else
                class="flex-grow-1 list"
            >
                <div
                    v-if="badgeList"
                    class="d-flex mb-2"
                >
                    <Badges
                        v-for="(badge, idx) in badgeList"
                        :key="idx"
                        :background-color="badge.backgroundColor"
                        :color="badge.color"
                        :icon="badge.icon"
                        :text="badge.text"
                    />
                </div>
                <div
                    v-for="(element, index) in data"
                    :key="index"
                    class="list-element lh-1 mb-3"
                >
                    <div class="mb-1">
                        <i
                            v-if="element?.icon"
                            :class="element.icon"
                            class="me-2"
                        />
                        <span v-if="element?.label">
                            {{ element.label }}
                        </span>
                    </div>
                    <div class="value">
                        {{ element.value }}
                    </div>
                </div>
            </div>
            <div class="d-flex align-self-center">
                <div class="dropdown">
                    <IconButton
                        v-if="downloadable"
                        class="dropdown-toggle p-1"
                        :aria="'Download'"
                        icon="bi bi-download"
                        :interaction="() => $emit('downloadSet')"
                        data-bs-toggle="dropdown"
                        data-bs-auto-close="outside"
                    />
                    <slot name="download-menu" />
                </div>
                <IconButton
                    v-if="visible"
                    class="p-1"
                    :aria="'visible'"
                    :icon="status === 'active' ? 'bi bi-eye' : 'bi bi-eye-slash'"
                    :interaction="() => $emit('hideSet')"
                />
                <IconButton
                    v-if="removable"
                    class="p-1"
                    :aria="'Löschen'"
                    icon="bi bi-trash"
                    :interaction="() => $emit('removeSet')"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @import "../assets/style.scss";

    .grid {
        .value {
            color: $secondary;
            font-family: "MasterPortalFont Bold";
        }
    }

    .list {
        .list-element {
            .value {
                color: $secondary;
            }
            &:first-child {
                .value:first-child {
                    font-family: "MasterPortalFont Bold";
                    font-size: $font_size_big;
                }
            }
            &:last-child {
                margin-bottom: 0 !important;
                > div {
                    margin-right: 5px;
                }
            }
        }
    }
</style>
