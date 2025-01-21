import "./emojiSelector.css";
import { useSelector } from "react-redux";
import { Twemoji } from "react-emoji-render";

export default function EmojiSelector({ inputMessage, setInputMessage, emojiSelectorStyles}){
    const emojiPack = Array.from(
        "😊😂🤣😅😢😡🤯🥳🤩😱🥺😇🤗😜🤪😏😴🤑🤠🥰😘🤓😍🤔😁😆😇🤠🤡💀👽🤖👍👏🙌💡🔥🎉💘💝💖💗💓💔💞💕💟✨😎🙏👀💬💭🚀🌈🍕🍦☕📚🎶📷🎁💌👻👾🤖🎃💩🙈🙉🙊🦄🐶🐱🐼🐧🦁🐨🦋🐝🌻🌞🌝🌚🌍🍀🍁🍂🍃🌸🌺🌼🌷⚡🌟🌠🎨📝📩📤📥🔍🔎🔐🔒🔓💤💢💣💥💦💨💫👣" +
        "🧠👄🦷👅👂🦻👃🧒🧑👨👩👱👴👵🤴👸🤵👰🤰🤱👼🎅🤶🧙🧚🧛🧜🧝🧞🧟💁🙋🙇🤦🤷💆💇🚶🏃💃🕺🧖🧗🤺🏇🏂🏄🚣🏊🚴🚵🤸🤼🤽🤾🤹🧘🛀🛌👫" +
        "🐵🐒🦍🦧🐶🐕🦮🐩🐺🦊🦝🐱🐈🦁🐯🐅🐆🐴🐎🦄🦓🦌🐮🐂🐃🐄🐷🐖🐗🐽🐏🐑🐐🐪🐫🦙🦒🐘🦏🦛🐭🐁🐀🐹🐰🐇🦔🦇🐻🐻🐨🐼🦥🦦🦨🦘🦡🐾🦃🐔🐓🐣🐤🐥🐦🐧🦅🦆🦢🦉🦩🦚🦜🐸🐊🐢🦎🐍🐲🐉🦕🦖🐳🐋🐬🐟🐠🐡🦈🐙🐚🐌🦋🐛🐜🐝🐞🦗🦂🦟🦠💐🌸💮🌹🥀🌺🌻🌼🌷🌱🌲🌳🌴🌵🌾🌿🍀🍁🍂🍃🍇🍈🍉🍊🍋🍌🍍🥭🍎🍏🍐🍑🍒🍓🥝🍅🥥🥑🍆🥔🥕🌽🥒🥬🥦🧄🧅🍄🥜🌰🍞🥐🥖🥨🥯🥞🧇🧀🍖🍗🥩🥓🍔🍟🍕🌭🥪🌮🌯🥙🧆🥚🍳🥘🍲🥣🥗🍿🧈🧂🥫🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🥮🍡🥟🥠🥡🦀🦞🦐🦑🦪🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯🍼🥛☕🍵🍶🍾🍷🍸🍹🥤🧃🧉🧊🥢🍴🥄🔪🏺🌍🌎🌏🌐🧭🌋🗻🧱🏡🏢🏣🏤🏥🏦🏨🏩🏪🏫🏬🏭🏯🏰💒🗼🗽⛪🕌🛕🕍🕋⛲⛺🌁🌃🌄🌅🌆🌇🌉🎠🎡🎢💈🎪🚂🚃🚄🚅🚆🚇🚈🚉🚊🚝🚞🚋🚌🚍🚎🚐🚑🚒🚓🚔🚕🚖🚗🚘🚙🚚🚛🚜🛵🦽🦼🛺🚲🛴🛹🚏⛽🚨🚥🚦🛑🚧⚓⛵🛶🚤🚢🛫🛬🪂💺🚁🚟🚠🚡🚀🛸🧳⌛⏳⌚⏰🧨🎈🎉🎊🎎🎏🎐🎀🎁🎫🏆🏅🥇🥈🥉⚽⚾🥎🏀🏐🏈🏉🎾🥏🎳🏏🏑🏒🥍🏓🏸🥊🥋🥅⛳🎣🤿🎽🎿🛷🥌🎯🪀🪁🎱🎮🎰🎲🧩🧸🎨🧵🧶👓🥽🥼🦺👔👕👖🧣🧤🧥🧦👗👘🥻🩳👚👛👜👝🎒👞👟🥾🥿👠👡🩰👢👑👒🎩🎓🧢📿💄💍💎🔇🔈🔉🔊📢📣📯🔔🔕🎼🎵🎶🎷🎸🎹🎺🎻🪕🥁📱📲📞📟📠🔋🔌💻💽💾💿📀🧮🎥🎬📺📷📸📹📼🔍🔎💡🔦🏮🪔📔📕📖📗📘📙📚📓📒📃📜📄📰📑🔖💰💴💵💶💷💸💳🧾💹📧📨📩📤📥📦📫📪📬📭📮📝💼📁📂📅📆📈📉📊📋📌📍📎📏📐🔒🔓🔏🔐🔑🔨🪓🔫🏹🔧🔩🦯🔗🧰🧲🧪🧫🧬🔬🔭📡💉🩸💊🩹🩺🚪🪑🚽🚿🛁🧻🧸🧷🧹🧺🧻🧼🧽🧴"
    );

    const addEmoji = (emoji) => {
        setInputMessage(inputMessage + emoji);
    }

    return(
        <div className="emoji-container-parent" style={emojiSelectorStyles}>
            <div className="emoji-container">
                {
                    emojiPack.map((item, index) => (
                        <Twemoji text={item} key={index} onClick={() => addEmoji(item)} />
                    ))
                }
            </div>
        </div>
    )
}