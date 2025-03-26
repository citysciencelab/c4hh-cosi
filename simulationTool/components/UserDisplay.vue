<script>
import {mapActions, mapGetters} from "vuex";

export default {
    name: "UserDisplay",
    props: {
        userId: {
            type: String,
            default: null
        }
    },
    data: () => ({
        user: null,
        requestState: {
            loading: false,
            error: null
        }
    }),
    computed: {
        ...mapGetters("Modules/Login", ["accessToken", "loggedIn"])
    },
    mounted () {
        this.getUserName();
    },
    methods: {
        ...mapActions("Modules/SimulationTool", ["fetchUserDetails"]),
        async getUserName () {
            if (!this.loggedIn || !this.userId) {
                // return "Anonymous*";
            }

            try {
                this.requestState.loading = true;
                this.user = await this.fetchUserDetails(this.userId);
            }
            catch (error) {
                this.requestState.error = error;
            }
            finally {
                this.requestState.loading = false;
            }
        }
    }
};
</script>

<template>
    <div v-if="requestState.loading">
        Loading ...
    </div>
    <div
        v-else
        class="user-display"
    >
        <div
            v-if="user"
            :title="`${user.email} (${user.firstName} ${user.lastName})`"
            :alt="`${user.email} (${user.firstName} ${user.lastName})`"
        >
            {{ user.firstName.toUpperCase()[0] + user.lastName.toUpperCase()[0] }}
        </div>
        <div
            v-else
            class="user-not-found"
        >
            User not found
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .user-display {
        display: flex;
        align-items: center;

        div {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: #555;
            color: white;
            padding: 5px;
            min-width: 1em;
            border-radius: 50%;
            vertical-align: middle;
        }

        div:before {
            content: '';
            float: left;
            width: auto;
            padding-bottom: 100%;
        }
    }
</style>
