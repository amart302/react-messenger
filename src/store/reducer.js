const initialState = {
    user: JSON.parse(sessionStorage.getItem("user")) || null
}

export function reducer(state = initialState, action){
    switch(action.type){
        case "SET_USER":
            return { ...state, user: action.payload };
        case "CLEAR_USER":
            return{ ...state, user: null };
        default:
            return state;
    }
}

export const setUser = (user) => ({
    type: "SET_USER",
    payload: user,
});

export const clearUser = () => ({
    type: "CLEAR_USER",
});