import { useSelector } from "react-redux";
import "./listOfChats.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import ChatItem from "../chatItem/ChatItem";

export default function ListOfChats({ ws, scrollToBottom }){
    const user = useSelector(state => state.user);
    const [ chats, setChats ] = useState([]);
    const [ inputValue, setInputValue ] = useState("");
    const [ foundUser, setFoundUser ] = useState(null);
    const [ changingBlocks, setChangingBlocks ] = useState(false);

    useEffect(() => {
        if(user) setChats(user.chats);
    }, [user])

    const findUser = async () => {
        if (!inputValue) return;
        try {
            const response = await axios.get("http://localhost:8080/api/findUser", {
                params: { username: inputValue }
            });
            console.log("Найденный пользователь:", response.data.foundUser);
            setFoundUser(response.data.foundUser);
            setChangingBlocks(true);
            return response.data;
        } catch (error) {
            console.error("Ошибка при поиске пользователя:", error);
            setFoundUser(null);
            setChangingBlocks(true);
        }
    };

    const createOrGetChat = (id) => {
        if(foundUser) if(user._id === id) return;
        try {
            scrollToBottom();
            if(ws.current && ws.current.readyState === WebSocket.OPEN){
                ws.current.send(JSON.stringify({ type: "GET_CHAT_DATA", userId1: user._id, userId2: id }));
            }
            setInputValue("");
            setChangingBlocks(false);
        } catch (error) {
            console.error("Ошибка при попытке создать чат:", error);
        }
    }

    return(
        <aside>
            <div className="search-container">
                <div className="search-input-wrapper">
                    <img src="./images/magnifier.svg" alt="" className="search-icon" />
                    <input type="text" value={inputValue} onKeyDown={(e) => {if(e.key === "Enter") findUser()}} onChange={(e) => {
                        const value = e.target.value.trim();
                        setInputValue(value);
                        if(!value){
                            setFoundUser(null);
                            setChangingBlocks(false);
                        }
                    }} className="search-input" placeholder="Search" />
                    <button onClick={() => findUser()}>Поиск</button>
                </div>
            </div>
            <div className="chats-section">
            {
                    (changingBlocks) ? (
                        (foundUser) ? (
                            <ChatItem key={foundUser.createdAt} user={foundUser} onClick={() => createOrGetChat(foundUser._id)} />
                        ) : (<p>Пользователь не найден</p>)
                    ) : chats?.length ? (
                        chats.map(item => {
                            const participant = item.participant1._id == user._id ? item.participant2 : item.participant1;
                            return (
                                <React.Fragment key={participant._id}>
                                    <ChatItem user={participant} onClick={() => createOrGetChat(participant._id)} />
                                </React.Fragment>
                            )
                        })
                    ) : (<p>У вас пока нету чатов</p>)
                }
            </div>
        </aside>
    )
}