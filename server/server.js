import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import cors from "cors";
import { body, validationResult} from "express-validator";

import { registerUser, verificateUser, getUserData, findUser, createOrGetChat, getChatDataById, addNewMessage } from "./db.js" ;

import { corsOrigin, port } from "./config.js";

const app = express();
const server = app.listen(port, () => {
    console.clear();
    console.log(`Сервер запущен на http://localhost:${port}`);
});
const wss = new WebSocketServer({ server });
const clients = new Map();

app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.post("/api/loginData", [
    body("email").isEmail().withMessage("Некорректный email"),
    body("password").isLength({ min: 6 }).withMessage("Минимальная длина 6 символов")
], async (req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({ message: "Некорректно введены данные" })
    }

    const { email, password } = req.body;
    
    try {
        const result = await verificateUser(email, password);
        res.status(201).json({ message: "Данные получены успешно", redirect: "/", userId: result });
    } catch (error) {
        if(!error.code) error.code = 500;
        res.status(error.code).json({ message: (error.code == 500) ? "Ошибка сервера при обработке данных" : error.message });
    }
});

app.post("/api/registerData", [
    body("email").isEmail().withMessage("Некорректный email"),
    body("password").isLength({ min: 6 }).withMessage("Минимальная длина 6 символов")
], async (req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({ message: "Некорректно введены данные" })
    }

    const { username, email, password } = req.body;

    try {
        const result = await registerUser(username, email, password);
        res.status(201).json({ message: "Данные получены успешно", redirect: "/", userId: result});
    } catch (error) {        
        if(!error.code) error.code = 500;
        res.status(error.code).json({ message: (error.code == 500) ? "Ошибка сервера при обработке данных" : error.message });
    }
});

app.get("/api/findUser", async (req, res) => {
    const username = req.query.username;
    try {
        const result = await findUser(username);
        
        res.status(201).json({ message: "Пользователь найден", foundUser: result });
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message })
    }
});


const handleError = (ws, type, error) => {
    console.error(`Ошибка при обработке запроса ${type}:`, error);
    ws.send(JSON.stringify({ 
        type: "ERROR", 
        payload: { message: `Ошибка при обработке запроса ${type}`, details: error.message }
    }));
};

const sendData = async (connection, type, data) => {
    if(connection && connection.ws.readyState === WebSocket.OPEN){
        try {
            switch(type){
                case "CHAT_DATA":
                    if(connection.activeChat?.toString() == data._id.toString()){
                        connection.ws.send(JSON.stringify({ type: type, payload: data }));
                    }
                    break;
                case "USER_DATA":
                    const userData = await getUserData(data);
                    if(userData) connection.ws.send(JSON.stringify({ type: type, payload: userData }));
                    break;
            }
        } catch (error) {
            console.error("Ошибка при отправке данных через WebSocket:", error);
        }
    }else{
        console.log("Соединение закрыто или не готово");
    }
};

wss.on("connection", (ws) => {
    console.log('Новое соединение установлено');
    let participantConnection1 = null;
    let participantConnection2 = null;
    ws.on("message", async (message) => {
        console.log(`Получено сообщение: ${message}`);
        const data = JSON.parse(message);
        switch(data.type){
            case "GET_USER_DATA":
                try {
                    clients.set(data.userId, { ws, activeChat: null });
                    const userData = await getUserData(data.userId);
                    ws.send(JSON.stringify({ type: "USER_DATA", payload: userData }));
                } catch (error) {
                    handleError(ws, data.type, error);
                }
                break;
            case "GET_CHAT_DATA":
                try {
                    const chatData = await createOrGetChat(data.userId1, data.userId2);
                    participantConnection1 = clients.get(data.userId1.toString()) || null;
                    participantConnection2 = clients.get(data.userId2.toString()) || null;
                    
                    if(participantConnection1) sendData(participantConnection1, "USER_DATA", data.userId1.toString());
                    if(participantConnection2) sendData(participantConnection2, "USER_DATA", data.userId2.toString());
                    participantConnection1.activeChat = chatData._id;
                    ws.send(JSON.stringify({ type: "CHAT_DATA", payload: chatData}));
                } catch (error) {
                    handleError(ws, data.type, error);
                }
                break;
            case "ADD_NEW_MESSAGE":
                try {
                    const chatData = await addNewMessage(data.chatId, data.user.userId, data.user.username, data.text);
                    
                    if(participantConnection1) sendData(participantConnection1, "CHAT_DATA", chatData);
                    if(participantConnection2) sendData(participantConnection2, "CHAT_DATA", chatData);
                } catch (error) {
                    handleError(ws, data.type, error);
                }
                break;
            default:
                console.log("Неизвестный тип сообщения:", data.type);
        }
    });

    ws.on("close", () => {
        console.log("Клиент отключился");
        for (const [userId, connection] of clients.entries()) {
            if (connection.ws === ws) {
                clients.delete(userId);
                break;
            }
        }
    });
});