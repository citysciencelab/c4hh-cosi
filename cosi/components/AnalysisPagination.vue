<script>
import {mapActions} from "vuex";

export default {
    name: "AnalysisPagination",
    props: {
        sets: {
            type: Array,
            default: () => []
        },
        activeSet: {
            type: Number,
            default: 0
        },
        downloads: {
            type: Array,
            default: () => ["Export"]
        },
        titles: {
            type: Object,
            default: () => ({})
        },
        addFunction: {
            type: Boolean,
            default: false
        },
        downloadCondition: {
            type: Boolean,
            default: true
        },
        removeCondition: {
            type: Boolean,
            default: true
        }
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        setActiveSet (index) {
            this.$emit("setActiveSet", index);
        },
        showInfo () {
            if (this.url) {
                return window.open(this.url, "_blank");
            }

            if (this.infoText) {
                this.cleanup();
                this.addSingleAlert({
                    category: "Info",
                    content: this.infoText,
                    displayClass: "info"
                });
            }

            return null;
        }
    }
};
</script>

<template>
    <div class="pagination">
        <div
            v-if="sets.length > 1"
            class="paginate btn_grp"
        >
            <button
                v-for="(set, index) in sets"
                :key="index"
                :class="{highlight: activeSet === index}"
                @click="setActiveSet(index)"
            >
                {{ index + 1 }}
            </button>
        </div>
        <div class="main btn_grp">
            <button
                v-if="sets.length > 1"
                class="nxt"
                :title="titles.prev"
                @click="$emit('setPrevNext',-1)"
            >
                <v-icon
                    dense
                >
                    mdi-chevron-left
                </v-icon>
            </button>
            <button
                v-if="sets.length > 1"
                class="nxt"
                :title="titles.next"
                @click="$emit('setPrevNext', +1)"
            >
                <v-icon
                    dense
                >
                    mdi-chevron-right
                </v-icon>
            </button>
            <button
                v-if="addFunction"
                class="pls"
                :title="titles.add"
                @click="$emit('addSet')"
            >
                <v-icon
                    dense
                >
                    mdi-plus-box-outline
                </v-icon>
            </button>
            <template v-if="downloadCondition">
                <button
                    v-for="(type, i) in downloads"
                    :key="type"
                    class="dl type"
                    :title="titles.downloads[i]"
                    @click="$emit('download' + type, activeSet)"
                >
                    {{ type }}
                    <v-icon
                        dense
                    >
                        mdi-download
                    </v-icon>
                </button>
            </template>
            <button
                v-if="sets.length > 1"
                class="dl dark"
                :title="titles.downloadAll"
                @click="$emit('downloadAll')"
            >
                <v-icon
                    dense
                >
                    mdi-folder-download
                </v-icon>
            </button>
            <button
                v-if="removeCondition"
                class="rm"
                :title="titles.remove"
                @click="$emit('removeSingle', activeSet)"
            >
                <v-icon
                    dense
                >
                    mdi-close
                </v-icon>
            </button>
            <button
                v-if="sets.length > 1"
                class="rm dark"
                :title="titles.removeAll"
                @click="$emit('removeAll')"
            >
                <v-icon
                    dense
                >
                    mdi-folder-remove
                </v-icon>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "../utils/variables.scss";
    .pagination {
        width:100%;
        display:flex;
        flex-flow:row wrap;
        justify-content:flex-end;
        margin:5px auto;
        padding-top: 10px;
        border-top: 1px solid #ccc;

        .btn_grp {
            flex:0 0 auto;
            display:flex;
            justify-content: flex-end;

            &.paginate {
                margin:3px;
            }

            &.main {
                margin-left: 5px;
                border-left: 1px solid #ccc;
                padding-left: 5px;
            }

            button {
                display:block;
                height:26px;
                width:26px;
                color:#222;
                font-weight:700;
                background: #eee;
                border:1px solid #eee;
                margin: 0px 1px;

                &.highlight {
                    background:white;
                    border:1px solid #888;
                }

                &.nxt {
                    height:36px;
                    width:36px;
                    border:1px solid #888;
                    background:white;
                }

                &.pls {
                    height:36px;
                    width:36px;
                    border:1px solid #888;
                    background:#ccc;
                    color:#222;
                    opacity:0.75
                }

                &.dl, &.rm {
                    height:36px;
                    width:36px;
                    color:whitesmoke;
                    opacity:0.75;

                    &.dark {
                        opacity:1
                    }

                    &.type {
                        width: auto;
                        padding: 0px 8px;
                        line-height: 36px;
                        color: whitesmoke;
                    }
                }

                &.dl {
                    background: $green;
                    border:1px solid $green;
                }

                &.rm {
                    background: $error_red;
                    border:1px solid $error_red;
                }
            }
        }
    }
</style>
