const initialState = {
    user: null
}

export function reducer(state = initialState, action){
    switch(action.type){
        case "GET_USER_DATA":
            return { ...state, user: action.payload };
        case "CLEAR_USER":
            return{ ...state, user: null };
        default:
            return state;
    }
}