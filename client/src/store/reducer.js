const initialState = {
    user: null,
    chatData: null,
    emojiPack: Array.from("😊😂😍🤔👍👏🙌💡🔥🎉💘💝💖💗💓💔💞💕💟✨😎🙏👀💬💭🚀🌈🍕🍦☕📚🎶📷🎁💌😢😡🤯🥳🤩😱🥺😇🤗😜🤪😏😴🤑🤠🥰😘🤓👻💀👾🤖🎃💩🙈🙉🙊🦄🐶🐱🐼🐧🦁🐨🦋🐝🌻🌞🌝🌚🌍🍀🍁🍂🍃🌸🌺🌼🌷⚡🌟🌠🎨📝📩📤📥🔍🔎🔐🔒🔓💤💢💣💥💦💨💫👣😁😆😅🤣😇🤠🥳🤡👽🤖")
}

export function reducer(state = initialState, action){
    switch(action.type){
        case "SAVE_USER_DATA":
            return { ...state, user: action.payload };
        case "CLEAR_USER":
            return{ ...state, user: null };
        case "SAVE_CHAT_DATA":
            return { ...state, chatData: action.payload };
        case "CLEAR_CHAT":
            return { ...state, chatData: null };
        default:
            return state;
    }
}