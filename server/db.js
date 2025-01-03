const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

let db;
let userCollection;

async function connect(){
    try {
        await client.connect();
        db = client.db("messenger");
        userCollection = db.collection("users");
        console.log("Подключение к MongoDB  успешно");
    } catch (error) {
        console.error("Ошибка подключения в MongoDB");
        process.exit(1);
    }
}

connect();

async function registerUser(username, email, password){
    try {
        const existingEmail = await userCollection.findOne({ email });
        const existingUsername = await userCollection.findOne({ username });

        if(existingEmail){
            const error = new Error("Пользователь с таким почтой уже существует");
            error.statusCode = 409;
            throw error;
        }else if(existingUsername){
            const error = new Error("Пользователь с таким ником уже существует");
            error.statusCode = 409;
            throw error;
        }else{
            const newUser = {
                username: username,
                email: email,
                password: password,
                chats: [],
                createdAt: new Date()
            }

            const result = await userCollection.insertOne(newUser);
            console.log(newUser);
            
            return newUser;
        }
    } catch (error) {
        console.error("Ошибка при регистрации пользователя:", error);
        throw error;
    }
}

async function verificateUser(email, password){
    try {
        const foundUser = await userCollection.findOne({ email });
        const isPasswordValid = (foundUser) ? await bcrypt.compare(password, foundUser.password) : null;

        if(!foundUser || !isPasswordValid){
            
            const error = new Error("Неправильный логин или пароль");
            error.statusCode = 401;
            throw error;
        }else{
            return foundUser;
        }
    } catch (error) {
        console.error("Ошибка при проверке пользователя:", error);
        throw error;
    }
}

module.exports = { registerUser, verificateUser }