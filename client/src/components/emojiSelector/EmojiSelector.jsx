import "./emojiSelector.css";
import { useSelector } from "react-redux";

export default function EmojiSelector({ inputMessage, setInputMessage, emojiSelectorStyles}){
    const emojiPack = useSelector(state => state.emojiPack);

    const addEmoji = (emoji) => {
        setInputMessage(inputMessage + emoji);
    }

    return(
        <div className="emoji-container-parent" style={emojiSelectorStyles}>
            <div className="emoji-container">
                {
                    emojiPack.map((item, index) => (
                        <span key={index} onClick={() => addEmoji(item)}>{item}</span>
                    ))
                }
            </div>
        </div>
    )
}