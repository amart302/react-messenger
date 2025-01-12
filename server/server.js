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

const { connect, registerUser, verificateUser, getUserData, findUser, createChat, getChatData } = require("./db");

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

app.get("/api/getUserData", async (req, res) => {
    const userId = req.query.userId;
    console.log(userId);
    
    try {
        const result = await getUserData(userId);
        
        res.status(201).json({ userData: result })
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

app.post("/api/createChat", async (req, res) => {
    try {
        const { memberId1, memberId2 } = req.body;
        const result = await createChat(memberId1, memberId2);
        console.log(result);
        
        res.status(201).json({ message: result.message, chatId: result.chatData._id });
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message });
    }
});

wss.on("connection", (ws) => {
    console.log('Новое соединение установлено');
    ws.on("message", async (message) => {
        const data = JSON.parse(message)
        console.log('Получено сообщение:', data);
        
        switch(data.type){
            case "GET_USER_DATA":
                clients.set(data.userId, ws);
                const userData = await getUserData(data.userId);
                
                ws.send(JSON.stringify({ type: "USER_DATA", payload: userData }));
                break;
            case "GET_CHAT_DATA":
                const chatData = await getChatData(data.chatId);
                ws.send(JSON.stringify({ type: "CHAT_DATA", payload: chatData}));
                break;
            case "ADD_MESSAGE":

                break;
            default:
                console.log("Неизвестный тип сообщения:", data.type);
        }
    });

    ws.on("close", () => {
        console.log("Клиент отключился");
    });
});