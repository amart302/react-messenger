const express = require("express");
const cors = require("cors");
const app = express();
const port = 8080;

const { registerUser, verificateUser } = require("./db")

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use(express.json());

app.post("/loginData", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await verificateUser(email, password);
        res.status(201).json({ message: "Данные получены успешно", redirect: "/" });
    } catch (error) {
        console.log(error);
        res.status(error.statusCode || 500).json({ message: error.message || "Ошибка сервера при обработке данных" });
    }
})

app.post("/registerData", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        console.log(req.body);
        const result = await registerUser(username, email, password);
        res.status(201).json({ message: "Данные получены успешно", redirect: "/" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Ошибка сервера при обработке данных" });
    }
})

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`); 
});