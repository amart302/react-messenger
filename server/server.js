const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const app = express();
const { body, validationResult } = require("express-validator");
const { port, corsOrigin, jwtSecret } = require("./config");
const server = app.listen(port, () => {
    console.clear();
    console.log(`Сервер запущен на http://localhost:${port}`);
    connect();
});
const wss = new WebSocket.Server({ server });
const clients = new Map();

const { connect, registerUser, verificateUser, getUserData, findUser, createChat, getChatData, addNewMessage } = require("./db");

app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json());

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
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message });
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
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message });
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

app.post("/api/createOrOpenChat", async (req, res) => {
    try {
        const { userId1, userId2 } = req.body;
        const result = await createChat(userId1, userId2);
        
        res.status(201).json({ message: result.message, chatId: result.chatId });
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message });
    }
});

wss.on("connection", (ws) => {
    console.log('Новое соединение установлено');
    ws.on("message", async (message) => {
        const data = JSON.parse(message);
        
        switch(data.type){
            case "GET_USER_DATA":
                try {
                    clients.set(data.userId, ws);
                    const userData = await getUserData(data.userId);
                    ws.send(JSON.stringify({ type: "USER_DATA", payload: userData }));
                } catch (error) {
                    console.error(`Ошибка при обработке запроса ${data.type}:`, error);
                    ws.send(JSON.stringify({ type: "ERROR", payload: `Ошибка при обработке запроса ${data.type}` }));
                }
                break;
            case "GET_CHAT_DATA":
                const chatData = await createChat(data.userId1, data.userId2);
                ws.send(JSON.stringify({ type: "CHAT_DATA", payload: chatData}));
                break;
            case "GET_CHAT_DATA_BY_ID":
                try {
                    const chatData = await getChatData(data.chatId);                    
                    ws.send(JSON.stringify({ type: "CHAT_DATA", payload: chatData}));
                } catch (error) {
                    console.error(`Ошибка при обработке запроса ${data.type}:`, error);
                    ws.send(JSON.stringify({ type: "ERROR", payload: `Ошибка при обработке запроса ${data.type}` }));
                }
                break;
            case "UPDATE_USER_DATA":
                try {
                    const updatedUserData = await getUserData(data.userId);
                    ws.send(JSON.stringify({ type: "USER_UPDATED", payload: updatedUserData }));
                } catch (error) {
                    console.error(`Ошибка при обработке запроса ${data.type}:`, error);
                    ws.send(JSON.stringify({ type: "ERROR", payload: `Ошибка при обработке запроса ${data.type}` }));
                }
                break;
            case "ADD_NEW_MESSAGE":
                try {
                    const updatedChatData = await addNewMessage(data.chatId, data.user.userId, data.user.username, data.text);
                    const updateChatData = await getChatData(data.chatId);
                    
                    const participantConnection1 = await clients.get(updateChatData.participant1.userId.toString());
                    const participantConnection2 = await clients.get(updateChatData.participant2.userId.toString());
                    if(participantConnection1 && participantConnection1.readyState === WebSocket.OPEN){
                        participantConnection1.send(JSON.stringify({ type: "CHAT_DATA", payload: updateChatData}));
                    }
                    if(participantConnection2 && participantConnection2.readyState === WebSocket.OPEN){
                        participantConnection2.send(JSON.stringify({ type: "CHAT_DATA", payload: updateChatData}));
                    }
                    ws.send(JSON.stringify({ type: "CHAT_DATA", payload: updatedChatData}));
                } catch (error) {
                    console.error(`Ошибка при обработке запроса ${data.type}:`, error);
                    ws.send(JSON.stringify({ type: "ERROR", payload: `Ошибка при обработке запроса ${data.type}` }));
                }
                break;
            default:
                console.log("Неизвестный тип сообщения:", data.type);
        }
    });

    ws.on("close", () => {
        console.log("Клиент отключился");
    
        for (const [userId, clientWs] of clients.entries()) {
            if (clientWs === ws) {
                clients.delete(userId);
                break;
            }
        }
    });
});