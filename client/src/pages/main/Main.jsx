import { useNavigate } from "react-router-dom";
import "./main.css";
import { useEffect, useRef, useState } from "react";
import ListOfChats from "../../components/listOfChats/ListOfChats";
import { useDispatch, useSelector } from "react-redux";
import EmojiSelector from "../../components/emojiSelector/EmojiSelector";

export default function Main(){
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(state => state.user);
    const chatData = useSelector(state => state.chatData);
    const [ chatInterlocutor, setChatInterlocutor ] = useState(null);
    const [ inputMessage, setInputMessage ] = useState("");
    const [ emojiSelectorStyles, setEmojiSelectorStyles ] = useState({ display: "none" });
    const ws = useRef(null);
    const blockRef = useRef(null);

    const userId = JSON.parse(sessionStorage.getItem("userId"));
    useEffect(() => {
        if(!userId){
            dispatch({type: "CLEAR_USER"});
            dispatch({type: "CLEAR_CHAT"});
            navigate("/login");
        }
    }, [userId, dispatch, navigate]);

    useEffect(() => {       
            ws.current = new WebSocket("ws://localhost:8080");
            ws.current.onopen = () => {
                console.log("Подключено к серверу");                
                if(userId && ws.current && ws.current.readyState === WebSocket.OPEN){
                    ws.current.send(JSON.stringify({ type: "GET_USER_DATA", userId:  userId}))
                }
            };
            
            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("Получено от сервера:", data);
                    
                    switch(data.type){
                        case "USER_DATA":
                            dispatch({ type: "SAVE_USER_DATA", payload: data.payload });
                            break;
                        case "CHAT_DATA":
                            dispatch({ type: "SAVE_CHAT_DATA", payload: data.payload });
                            scrollToBottom();
                            break;
                        case "USER_UPDATED":
                            dispatch({ type: "SAVE_USER_DATA", payload: data.payload });
                            break;
                        case "NEW_MESSAGE":
                            dispatch({ type: "SAVE_CHAT_DATA", payload: data.payload });
                            break;
                        default:
                            console.log("Неизвестный тип сообщения:", data.type);
                            dispatch({type: "CLEAR_USER"});
                            dispatch({type: "CLEAR_CHAT"});
                            navigate("/login");
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            
            ws.current.onerror = (error) => {
                console.error('Ошибка WebSocket:', error);
                ws.current.close();
            };

            ws.current.onclose = () => {
                reconnecting();
            };

            return () => {
                if(ws.current) ws.current.close();
            }
    }, [dispatch]);

    useEffect(() => {
        if (chatData && user) {
            sessionStorage.setItem("chatId", JSON.stringify(chatData._id));
            const interlocutor = chatData.participant1?.username === user.username 
                ? chatData.participant2 
                : chatData.participant1;
            setChatInterlocutor(interlocutor);
        }
    }, [chatData, user]);
        
    const scrollToBottom = () => {
        setTimeout(() => {
            if(blockRef.current){
                blockRef.current.scrollTo({
                    top: blockRef.current.scrollHeight,
                    behavior: "smooth"
                });
            };
        }, 100);
    };

    let count = 0;
    const reconnecting = () => {
        if(count < 5){
            ws.current = new WebSocket("ws://localhost:8080");
            console.log("Попытка переподключения");

            ws.current.ononpen = () => {
                console.log("Подключение установлено");
                count = 0;
            };

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("Получено от сервера:", data);
            };

            ws.current.onclose = () => {
                setTimeout(() => {
                    reconnecting();
                }, 1000);
            };
            count++;
        }else{
            dispatch({type: "CLEAR_USER"});
            dispatch({type: "CLEAR_CHAT"});
            navigate("/login");
        }
    };

    const sendMessage = () => {
        ws.current.send(JSON.stringify({ type: "ADD_NEW_MESSAGE", chatId: chatData._id, user: { userId: user._id, username: user.username}, text: inputMessage }));
        setInputMessage("");
    };
    
    const closeEmojiSelector = () => {
        if(emojiSelectorStyles.display == "none") setEmojiSelectorStyles({ display: "grid" });
        else setEmojiSelectorStyles({ display: "none" });
    };

    return(
        <div className="App">
            <ListOfChats ws={ws} scrollToBottom={scrollToBottom}/>
                {
                    chatInterlocutor && (
                        <main>
                            <div className="chat-header">
                                <img src="./images/userAvatar.png" alt="" />
                                {chatInterlocutor?.username}
                            </div>
                            <div className="chat-main" ref={blockRef}>
                                {
                                    chatData?.messages?.map(item => (
                                        (item.username === user?.username) ?
                                        <div className="message-container" style={{ marginLeft: "auto", borderRadius: "10px" }} key={item.createdAt} >
                                            <p>{item.text}</p>
                                        </div> :
                                        <div className="message-container" style={{ backgroundColor: "#E7E7E7", color: "#303030", marginRight: "auto", borderRadius: "10px" }} key={item.createdAt} >
                                            <p>{item.text}</p>
                                        </div>
                                    ))
                                }
                            </div>
                            <EmojiSelector inputMessage={inputMessage} setInputMessage={setInputMessage} emojiSelectorStyles={emojiSelectorStyles} />
                            <div className="chat-footer">
                                <div className="message-input-container">
                                    <input type="text" value={inputMessage} onKeyDown={(e) => {if(e.key === "Enter") {
                                        if(inputMessage){
                                            sendMessage();
                                            if(emojiSelectorStyles.display == "grid") setEmojiSelectorStyles({ display: "none" });
                                        }
                                    }}} onChange={(e) => {
                                        const value = e.target.value;
                                        setInputMessage(value);
                                    }} />
                                    <img src="./images/emojiSelectorIcon.svg" alt="" onClick={() => closeEmojiSelector()} />
                                    <button onClick={() => {
                                        if(inputMessage){
                                            sendMessage();
                                            if(emojiSelectorStyles.display == "grid") setEmojiSelectorStyles({ display: "none" });
                                        }
                                    }}>Send</button>
                                </div>
                            </div>
                        </main>
                    )
                }
        </div>
    )
}