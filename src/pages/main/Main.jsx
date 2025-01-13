import { useNavigate } from "react-router-dom";
import "./main.css";
import { useEffect, useRef, useState } from "react";
import ListOfChats from "../../components/listOfChats/ListOfChats";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

export default function Main(){
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(state => state.user);
    const chatData = useSelector(state => state.chatData);
    const [ chatPartner, setChatPartner ] = useState(null);
    const ws = useRef(null);
    const [ inputMessage, setInputMessage ] = useState("");

    const userId = JSON.parse(sessionStorage.getItem("userId"));


    useEffect(() => {
        if(!userId){
            dispatch({type: "CLEAR_USER"});
            navigate("/login");
        }
    }, [userId, dispatch, navigate]);

    useEffect(() => {
            ws.current = new WebSocket('ws://localhost:8080');
            ws.current.onopen = () => {
                console.log("Подключено к серверу");                
                if(userId){
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
                            break;
                        case "USER_UPDATED":
                            dispatch({ type: "SAVE_USER_DATA", payload: data.payload });
                            break;
                        case "NEW_MESSAGE":
                            dispatch({ type: "SAVE_CHAT_DATA", payload: data.payload });
                            break;
                        default:
                            console.log("Неизвестный тип сообщения:", data.type);
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
                ws.current = new WebSocket('wss://your-websocket-url');
                console.log("Попыткак переподключения");

                
                ws.current.onclose = () => {
                    dispatch({type: "CLEAR_USER"});
                    navigate("/login");
                }
            };

            return () => {
                if(ws.current) ws.current.close();
            }
    }, [dispatch]);

    const requestChatData = (chatId) => {
        if(ws.current && ws.current.readyState == WebSocket.OPEN){
            ws.current.send(JSON.stringify({ type: "GET_CHAT_DATA", chatId: chatId }));
        }
    }

    useEffect(() => {
        if (chatData && chatData.memberData1 && chatData.memberData2 && user) {
            const partner = chatData.memberData1.username === user.username 
                ? chatData.memberData2 
                : chatData.memberData1;
            setChatPartner(partner);
        }
    }, [chatData, user]);
        
    const sendMessage = () => {
        if(inputMessage){
            ws.current.send(JSON.stringify({ type: "ADD_NEW_MESSAGE", chatId: chatData._id, user: { userId: user._id, username: user.username}, text: inputMessage }));
            setInputMessage("");
        }
    }
    
    return(
        <div className="App">
            <ListOfChats requestChatData={requestChatData} ws={ws}/>
            <main>
                {
                    chatPartner && user && (
                        <>
                            <div className="chat-header">
                                <img src="./images/userAvatar.png" alt="" />
                                {chatPartner.username}
                            </div>
                            <div className="chat-main">
                                {
                                    chatData.messages && chatData.messages.map(item => (
                                        (item.username == user.username) ?
                                        <div className="message-container" style={{ marginLeft: "auto", borderRadius: "10px 10px 0 10px" }} >
                                            <p>{item.text}</p>
                                        </div> :
                                        <div className="message-container" style={{ marginRight: "auto", borderRadius: "10px 10px 10px 0" }} >
                                            <p>{item.text}</p>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="chat-footer">
                                <div className="message-input-container">
                                    <input type="text" value={inputMessage} onKeyDown={(e) => {if(e.key == "Enter") sendMessage()}} onChange={(e) => {
                                        const value = e.target.value;
                                        setInputMessage(value);
                                    }} />
                                    <button onClick={() => sendMessage()}>Send</button>
                                </div>
                            </div>
                        </>
                        
                    )
                }
            </main>
        </div>
    )
}