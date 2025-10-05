const actions = {
    loadSessionData ({commit}, session) {
        commit("setSessionToLoad", session);
    }
};

export default actions;
