<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "Card",
    components: {
        IconButton
    },
    props: {
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
            type: String,
            required: false,
            default: ""
        },
        layoutStyle: {
            type: String,
            required: false,
            default: "list"
        },
        removable  : {
            type: Boolean,
            required: false,
            default: true
        },
        status : {
            type: String,
            required: false,
            default: ""
        },
        visible  : {
            type: Boolean,
            required: false,
            default: true
        }
    }
};
</script>

<template lang="html">
    <div class="card mb-3 card-hover shadow" :class="status === 'active' ? 'card-active' : ''">
        <div class="card-body d-flex p-0 description align-items-center">
        <div class="p-3 fs-1"><i :class="icon"></i></div>
        <div
            v-if="layoutStyle === 'grid'"
            class="p-2 row grid"
        >
            <div
                v-for="(element, index) in data"
                :key="index"
                class="col-6"
            >
                <div>
                    <i v-if="element?.icon" :class="element?.icon" class="me-2" />
                    <span class="title">{{ element.label}}</span>
                </div>
                <div class="value">{{ element.value }}</div>
            </div>
        </div>
        <div
            v-else
            class="p-2 flex-grow-1 list"
        >
            <div
                v-for="(element, index) in data"
                :key="index"
                class="list-element"
            >
                <div>
                    <i v-if="element?.icon" :class="element?.icon" class="me-2" />
                    <span class="title">{{ element.label}}</span>
                </div>
                <div class="value"> {{ element.value }}</div>
            </div>
        </div>
        <div class="d-flex align-self-start buttons">
            <IconButton
                v-if="downloadable"
                class="p-1"
                :aria="'Download'"
                icon="bi bi-download"
                :interaction="() => $emit('downloadSet')"
            />
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
    .card-hover:hover {
        cursor: pointer;
        background-color: $light_blue;
        i {
            color: $secondary;
        }
    }

    .card-active {
        border-color: $secondary;
        border-width: 2px;
        i {
            color: $secondary;
        }
    }

    .grid {
        margin-right: 126px;
        .value {
            font-family: "MasterPortalFont Bold";
        }
    }

    .list {
        margin-right: 126px;
        .list-element {
            margin-bottom: 3px;
            &:first-child {
                .value {
                    font-family: "MasterPortalFont Bold";
                    font-size: $font_size_big;
                    color: $secondary;
                }
            }
            &:last-child {
                display: flex;
                > div {
                    margin-right: 5px;
                }
            }
        }
    }

    .buttons {
        position: absolute;
        right: 0;
        top: calc(50% - 20px);
    }
</style>