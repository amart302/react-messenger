const express = require("express");
const cors = require("cors");
const app = express();
const port = 8080;

const { registerUser, verificateUser, findUser } = require("./db");

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use(express.json());

app.post("/api/loginData", async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await verificateUser(email, password);
        // console.log(result);
        delete result.confirmPassword;

        res.status(201).json({ message: "Данные получены успешно", redirect: "/", user: result });
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        res.status(error.statusCode).json({ message: (error.statusCode == 500) ? "Ошибка сервера при обработке данных" : error.message });
    }
})

app.post("/api/registerData", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const result = await registerUser(username, email, password);
        // console.log(result);
        delete result.confirmPassword;
        
        res.status(201).json({ message: "Данные получены успешно", redirect: "/", user: result});

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

app.listen(port, () => {
    console.clear();
    console.log(`Сервер запущен на http://localhost:${port}`); 
});