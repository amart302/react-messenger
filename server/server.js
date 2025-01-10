const express = require("express");
const cors = require("cors");
const app = express();
const { body, validationResult } = require("express-validator");
const { port, corsOrigin, jwtSecret } = require("./config");

const { connect, registerUser, verificateUser, getUserData, findUser, createChat } = require("./db");

app.use(cors({
    origin: corsOrigin,
    credentials: true
}))
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
})

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
})

app.get("/api/getUserData", async (req, res) => {
    const userId = req.query.userId;
    try {
        const result = await getUserData(userId);
        
        res.status(201).json({ userData: result })
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message });
    }
})

app.get("/api/findUser", async (req, res) => {
    const username = req.query.username;
    try {
        const result = await findUser(username);
        
        res.status(201).json({ message: "Пользователь найден", foundUser: result });
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message })
    }
})

app.post("/api/createChat", async (req, res) => {
    try {
        const { memberId1, memberId2 } = req.body;
        const result = await createChat(memberId1, memberId2);

        res.status(201).json({ message: "Чат создан", chat: result });
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message });
    }
})

app.listen(port, () => {
    console.clear();
    console.log(`Сервер запущен на http://localhost:${port}`);
    connect();
});