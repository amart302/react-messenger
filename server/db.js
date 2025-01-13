const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { mongoURI } = require("./config");

const client = new MongoClient(mongoURI);

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
        console.error("Ошибка подключения в MongoDB", error);
        process.exit(1);
    }
}


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
            return newUser._id;
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
            return foundUser._id;
        }
    } catch (error) {
        console.error("Ошибка при проверке пользователя:", error);
        throw error;
    }
}

async function getUserData(userId){
    try {
        const foundUser = await userCollection.findOne({ _id: new ObjectId(userId) });
        
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
        const existingChat = await chatsCollection.findOne({
            $or: [
                { "memberData1.id": new ObjectId(userId1), "memberData2.id": new ObjectId(userId2) },
                { "memberData1.id": new ObjectId(userId2), "memberData2.id": new ObjectId(userId1) }
            ]
        });
        
        if(existingChat){
            console.log("Чат уже существует");
            
            return { message: "Чат уже существует", chatId: existingChat._id };
        }

        const member1 = await userCollection.findOne({ _id: new ObjectId(userId1) });
        const member2 = await userCollection.findOne({ _id: new ObjectId(userId2) });
        
        ['email', 'password', 'chats'].forEach(item => {
            delete member1[item];
            delete member2[item];
        });

        const chat = {
            memberData1: {
                id: new ObjectId(userId1),
                username: member1.username,
            },
            memberData2: {
                id: new ObjectId(userId2),
                username: member2.username
            },
            messages: [],
            createdAt: new Date()
        };

        const newChat = await chatsCollection.insertOne(chat);
        
        const updataMember1 = await userCollection.findOneAndUpdate(
            { _id: new ObjectId(userId1) },
            { $push: { chats: {
                chatId: newChat.insertedId,
                member1: member1,
                member2: member2
            }}}
        );

        const updataMember2 = await userCollection.findOneAndUpdate(
            { _id: new ObjectId(userId2) },
            { $push: { chats: {
                chatId: newChat.insertedId,
                member1: member1,
                member2: member2
            }}}
        );
        
        console.log("Чат успешно создан");
        return { message: "Чат успешно создан", chatId: newChat._id };
    } catch (error) {
        console.error("Ошибка при попытке создать чат:", error);
        throw error;
    }
}

async function getChatData(chatId){
    try {
        const foundChat = await chatsCollection.findOne({ _id: new ObjectId(chatId) });
        
        return foundChat;
    } catch (error) {
        console.error("Ошибка при поиске чата:", error);
        throw error;
    }
}

async function addNewMessage(chatId, userId, username, text){
    try {
        const chatData = await chatsCollection.findOneAndUpdate(
            { _id: new ObjectId(chatId) },
            { $push: { messages: {
                userId: userId,
                username: username,
                text: text
            }}},
            { returnDocument: "after" }
        );
        
        return chatData;
    } catch (error) {
        console.error("Ошибка при добавлении сообщения:", error);
        throw error;
    }
}

module.exports = { connect, registerUser, verificateUser, getUserData, findUser, createChat, getChatData, addNewMessage };