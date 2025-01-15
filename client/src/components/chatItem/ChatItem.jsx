export default function ChatItem({ user, onClick }){
    return(
        <div className="chat-container" onClick={onClick}>
            <img src="./images/userAvatar.png" alt="" />
            <p className="user-name">{user.username}</p>
        </div>
    )
}