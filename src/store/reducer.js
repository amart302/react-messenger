const initialState = {
    user: null,
    chatData: null
}

export function reducer(state = initialState, action){
    switch(action.type){
        case "GET_USER_DATA":
            return { ...state, user: action.payload };
        case "SAVE_USER_DATA":
            return { ...state, user: action.payload };
        case "CLEAR_USER":
            return{ ...state, user: null };
        case "SAVE_CHAT_DATA":
            return { ...state, chatData: action.payload };
        default:
            return state;
    }
}