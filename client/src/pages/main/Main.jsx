import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ListOfChats from "../../components/listOfChats/ListOfChats";
import { useDispatch, useSelector } from "react-redux";
import EmojiSelector from "../../components/emojiSelector/EmojiSelector";
import "./main.css";


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
            navigate("/login");
        }
    }, [userId, dispatch, navigate]);

    const webSocketLogic = (event) => {
        const data = JSON.parse(event.data);
        console.log("Получено от сервера:", data.payload);
        
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
                navigate("/login");
        }
    };

    const cleanupWebSocket = () => {
        if(ws.current && ws.current.readyState){
            ws.current.onopen = null;
            ws.current.onmessage = null;
            ws.current.onerror = null;
            ws.current.onclose = null;
            ws.current.close();
        }
    };
    
    let count = 0;
    const reconnecting = () => {
        if(count < 5){
            console.log("Попытка переподключения");
            setupWebSocket();
            count++;
        }else{
            console.log("Превышено количество попыток переподключения. Перенаправление на страницу входа.");
            setTimeout(() => {
                navigate("/login");
            }, 1000);
        }
    };

    const setupWebSocket = () => {
        cleanupWebSocket();
        ws.current = new WebSocket("ws://localhost:8080");

        ws.current.onopen = () => {
            console.log("Подключено к серверу");
            if(ws.current && ws.current.readyState == WebSocket.OPEN){
                if(userId){
                    ws.current.send(JSON.stringify({ type: "GET_USER_DATA", userId: userId }));
                }
                count = 0;
            }
        };

        ws.current.onmessage = (event) => {
            try {
                webSocketLogic(event);
            } catch (error) {
                console.error(error);
            }
        };
        
        ws.current.onerror = (error) => {
            console.error("Ошибка WebSocket:", error);
            ws.current.close();
        };

        ws.current.onclose = () => {
            reconnecting();
        };
    }

    useEffect(() => {
        setupWebSocket();
        return () => cleanupWebSocket();
    }, [dispatch]);

    useEffect(() => {
        if (chatData && user) {
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

    const sendMessage = () => {
        ws.current.send(JSON.stringify({ type: "ADD_NEW_MESSAGE", chatId: chatData._id, user: { userId: user._id, username: user.username}, text: inputMessage }));
        setInputMessage("");
    };
    
    const closeEmojiSelector = () => {
        if(emojiSelectorStyles.display === "none") setEmojiSelectorStyles({ display: "grid" });
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
                                        (item.userId === user._id) ?
                                        <div className="message-container" style={{ marginLeft: "auto", borderRadius: "10px" }} key={item.createdAt} >
                                            {item.text}
                                        </div> :
                                        <div className="message-container" style={{ backgroundColor: "#E7E7E7", color: "#303030", marginRight: "auto", borderRadius: "10px" }} key={item.createdAt} >
                                            {item.text}
                                        </div>
                                    ))
                                }
                            </div>
                            <EmojiSelector inputMessage={inputMessage} setInputMessage={setInputMessage} emojiSelectorStyles={emojiSelectorStyles} setEmojiSelectorStyles={setEmojiSelectorStyles}/>
                            <div className="chat-footer">
                                <div className="message-input-container">
                                    <input type="text" value={inputMessage} onKeyDown={(e) => {if(e.key === "Enter") {
                                        if(inputMessage){
                                            sendMessage();
                                            if(emojiSelectorStyles.display === "grid") setEmojiSelectorStyles({ display: "none" });
                                        }
                                    }}} onChange={(e) => {
                                        const value = e.target.value;
                                        setInputMessage(value);
                                    }} />
                                    <div className="emojiSelectorBtn">
                                        <img src="./images/emojiSelectorIcon.svg" alt="" onClick={() => closeEmojiSelector()} />
                                    </div>
                                    <button onClick={() => {
                                        if(inputMessage){
                                            sendMessage();
                                            if(emojiSelectorStyles.display === "grid") setEmojiSelectorStyles({ display: "none" });
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