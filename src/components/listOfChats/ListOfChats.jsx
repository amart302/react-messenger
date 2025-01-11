import { shallowEqual, useSelector } from "react-redux";
import "./listOfChats.css";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ListOfChats(){
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

    const createOrOpenChat = async () => {
        if(user._id == foundUser._id) return;

        try {
            const response = await axios.post("http://localhost:8080/api/createChat", {
                memberId1: user._id,
                memberId2: foundUser._id
            });
        } catch (error) {
            console.error("Ошибка при попытке создать чат:", error);
        }
    }

    return(
        <aside>
            <div className="search-container">
                <div className="search-input-wrapper">
                    <img src="./images/magnifier.svg" alt="" className="search-icon" />
                    <input type="text" onChange={(e) => {
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
                    (changingBlocks) ? ((foundUser) ? 
                    <div className="chat-container" onClick={() => createOrOpenChat()}>
                        <img src="./images/userAvatar.png" alt="" />
                        <p className="user-name">{foundUser.username}</p>
                    </div> :
                    <p>Пользователь не найден</p>) :
                
                    ((chats && !chats.length)
                    ? <p>У вас пока нету чатов</p>
                    : chats.map(item => (
                        <div className="chat-container">
                            <img src="./images/userAvatar.png" alt="" />
                            <p className="user-name">{(item.member1.username == user.username) ? item.member2.username : item.member1.username}</p>
                        </div>)))
                }
            </div>
        </aside>
    )
}