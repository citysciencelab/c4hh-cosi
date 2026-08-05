<script>
import {mapActions, mapGetters, mapMutations, mapState} from "vuex";

export default {
    name: "BackendConnect",
    data () {
        return {
            email: "",
            password: ""
        };
    },
    computed: {
        ...mapState("Modules/Mpaddon", ["backendUrl", "loginBusy", "loginError", "user"]),
        ...mapGetters("Modules/Mpaddon", ["isAuthenticated"]),
        backendUrlLocal: {
            get () {
                return this.backendUrl;
            },
            set (val) {
                this.setBackendUrl(val);
            }
        }
    },
    methods: {
        ...mapActions("Modules/Mpaddon", ["login", "logout"]),
        ...mapMutations("Modules/Mpaddon", ["setBackendUrl"]),
        async submit () {
            try {
                await this.login({
                    backendUrl: this.backendUrl.trim(),
                    email: this.email.trim(),
                    password: this.password
                });
                this.password = "";
            }
            catch (e) {
                // store.loginError already set in the action
            }
        }
    }
};
</script>

<template>
    <div>
        <form
            v-if="!isAuthenticated"
            @submit.prevent="submit"
        >
            <div class="mb-2">
                <label
                    for="mpaddon-backend-url"
                    class="form-label small mb-1"
                >{{ $t("additional:modules.mpaddon.backendUrl") }}</label>
                <input
                    id="mpaddon-backend-url"
                    v-model="backendUrlLocal"
                    type="url"
                    required
                    placeholder="http://localhost:3000"
                    class="form-control form-control-sm"
                >
            </div>
            <div class="mb-2">
                <label
                    for="mpaddon-email"
                    class="form-label small mb-1"
                >{{ $t("additional:modules.mpaddon.email") }}</label>
                <input
                    id="mpaddon-email"
                    v-model="email"
                    type="email"
                    required
                    autocomplete="username"
                    class="form-control form-control-sm"
                >
            </div>
            <div class="mb-2">
                <label
                    for="mpaddon-password"
                    class="form-label small mb-1"
                >{{ $t("additional:modules.mpaddon.password") }}</label>
                <input
                    id="mpaddon-password"
                    v-model="password"
                    type="password"
                    required
                    autocomplete="current-password"
                    class="form-control form-control-sm"
                >
            </div>
            <p
                v-if="loginError"
                class="small text-danger mb-2"
            >
                {{ loginError }}
            </p>
            <button
                type="submit"
                class="btn btn-primary btn-sm w-100"
                :disabled="loginBusy"
            >
                {{ loginBusy ? $t("additional:modules.mpaddon.signingIn") : $t("additional:modules.mpaddon.signIn") }}
            </button>
        </form>
        <div
            v-else
            class="d-flex align-items-center justify-content-between"
        >
            <div class="small">
                <div class="fw-semibold">
                    {{ user.email }}
                </div>
                <div class="text-muted">
                    {{ user.role }} · {{ backendUrl }}
                </div>
            </div>
            <button
                class="btn btn-outline-secondary btn-sm"
                @click="logout()"
            >
                {{ $t("additional:modules.mpaddon.signOut") }}
            </button>
        </div>
    </div>
</template>
