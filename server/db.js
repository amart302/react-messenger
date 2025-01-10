const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

let db;
let userCollection;
let chatsCollection;

async function connect(){
    try {
        await client.connect();
        db = client.db("messenger");
        userCollection = db.collection("users");
        chatsCollection = db.collection("chats");
        console.log("Подключение к MongoDB  успешно");
    } catch (error) {
        console.error("Ошибка подключения в MongoDB");
        process.exit(1);
    }
}

connect();

async function registerUser(username, email, password){
    try {
        const existingEmail = await userCollection.findOne({ email: email });
        const existingUsername = await userCollection.findOne({ username: username });

        if(existingEmail){
            const error = new Error("Пользователь с таким почтой уже существует");
            error.statusCode = 409;
            throw error;
        }else if(existingUsername){
            const error = new Error("Пользователь с таким ником уже существует");
            error.statusCode = 409;
            throw error;
        }else{
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = {
                username: username,
                email: email,
                password: hashedPassword,
                chats: [],
                createdAt: new Date()
            }

            const result = await userCollection.insertOne(newUser);
            return newUser;
        }
    } catch (error) {
        console.error("Ошибка при регистрации пользователя:", error);
        throw error;
    }
}

async function verificateUser(email, password){
    try {
        const foundUser = await userCollection.findOne({ email: email });
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

async function getUserData(userId){
    try {
        const id = new ObjectId(userId);
        const foundUser = await userCollection.findOne({ _id: id });
        
        delete foundUser.password;
        return foundUser;
    } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
        throw error;
    }
}

async function findUser(username){
    try {
        const foundUser = await userCollection.findOne({ username: { $regex: new RegExp(username, "i") } });

        if(foundUser){
            ['email', 'password', 'chats'].forEach(item => {
                delete foundUser[item];
            });

            
            return foundUser;
        }else{
            const error = new Error("Пользователь не найден");
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        console.error("Ошибка при поиске пользователя:", error);
        throw error;
    }
}

async function createChat(userId1, userId2){
    try {
        const id1 = new ObjectId(userId1);
        const id2 = new ObjectId(userId2);

        const existingChat = await chatsCollection.findOne({
            $or: [
                { member1: id1, member2: id2 },
                { member1: id2, member2: id1 }
            ]
        });
        
        if(existingChat){
            console.log("Чат уже существует");
            return existingChat;
        }

        const chat = {
            member1: id1,
            member2: id2,
            messages: [],
            createdAt: new Date()
        };

        const member1 = await userCollection.findOne({ _id: id1 });
        const member2 = await userCollection.findOne({ _id: id2 });

        ['email', 'password', 'chats'].forEach(item => {
            delete member1[item];
            delete member2[item];
        });

        const newChat = await chatsCollection.insertOne(chat);
        
        const updataMember1 = await userCollection.findOneAndUpdate(
            { _id: id1 },
            { $push: { chats: {
                chatId: newChat.insertedId,
                member1: member1,
                member2: member2
            }}}
        );

        const updataMember2 = await userCollection.findOneAndUpdate(
            { _id: id2 },
            { $push: { chats: {
                chatId: newChat.insertedId,
                member1: member1,
                member2: member2
            }}}
        );

        const foundChat = await chatsCollection.findOne({
            $or: [
                { member1: id1, member2: id2 },
                { member1: id2, member2: id1 }
            ]
        });

        console.log("Чат успешно создан");
        return foundChat;
    } catch (error) {
        console.error("Ошибка при попытке создать чат:", error);
        throw error;
    }
}

module.exports = { registerUser, verificateUser, getUserData, findUser, createChat }