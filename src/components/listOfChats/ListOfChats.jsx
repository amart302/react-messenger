import { shallowEqual, useDispatch, useSelector } from "react-redux";
import "./listOfChats.css";
import { useEffect, useState } from "react";
import axios from "axios";
import ChatItem from "../chatItem/ChatItem";

export default function ListOfChats({ requestChatData, ws }){
    const dispatch = useDispatch();
    const user = useSelector(state => state.user);
    const chatData = useSelector(state => state.chatData);
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

    const createOrOpenChat = async (id) => {
        if(foundUser) if(user._id == id) return;

        try {
            const response = await axios.post("http://localhost:8080/api/createChat", {
                memberId1: user._id,
                memberId2: id
            });
            ws.current.send(JSON.stringify({ type: "UPDATE_USER_DATA", userId: user._id }));
            
            requestChatData(response.data.chatId);
        } catch (error) {
            console.error("Ошибка при попытке создать чат:", error);
        }
    }

    const getChatPartner = (chat) => {
        if(user) return chat.member1.username === user.username ? chat.member2 : chat.member1;
    };

    return(
        <aside>
            <div className="search-container">
                <div className="search-input-wrapper">
                    <img src="./images/magnifier.svg" alt="" className="search-icon" />
                    <input type="text" onKeyDown={(e) => {if(e.key == "Enter") findUser()}} onChange={(e) => {
                        const value = e.target.value.trim();
                        setInputValue(value);
                        if(!value){
                            ws.current.send(JSON.stringify({ type: "UPDATE_USER_DATA", userId: user._id }));
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
                            <ChatItem user={foundUser} onClick={() => createOrOpenChat(foundUser._id)} />
                        ) : (<p>Пользователь не найден</p>)
                    ) : chats?.length ? (
                        chats.map(item => {
                            const partner = getChatPartner(item);
                            if(partner){
                                return (
                                    <ChatItem key={partner._id} user={partner} onClick={() => createOrOpenChat(partner._id)} />
                                )
                            }
                            
                        })
                    ) : (<p>У вас пока нету чатов</p>)
                }
            </div>
        </aside>
    )
}