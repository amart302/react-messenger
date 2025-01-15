import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { mongoURI } from "./config.js";
import { userInfo } from "os";

const client = new MongoClient(mongoURI);

let db;
let userCollection;
let chatsCollection;

export async function connect(){
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


export async function registerUser(username, email, password){
    try {
        const existingUser = await userCollection.findOne({ 
            $or : [{ email: email }, { username: username }]
        });

        if(existingUser){
            const error = new Error(
                existingUser.email === email 
                    ? "Пользователь с таким почтой уже существует"
                    : "Пользователь с таким ником уже существует"
            );
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
                chatSession: null,
                createdAt: new Date()
            }

            const result = await userCollection.insertOne(newUser);
            return result.insertedId;
        }
    } catch (error) {
        console.error("Ошибка при регистрации пользователя:", error);
        throw error;
    }
}

export async function verificateUser(email, password){
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

export async function getUserData(userId){
    try {
        const foundUser = await userCollection.findOne({ _id: new ObjectId(userId) });
        
        delete foundUser.password;
        return foundUser;
    } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
        throw error;
    }
}

export async function findUser(username){
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

export async function createChat(userId1, userId2){
    try {
        const existingChat = await chatsCollection.findOne({
            $or: [
                { "participant1.userId": new ObjectId(userId1), "participant2.userId": new ObjectId(userId2) },
                { "participant1.userId": new ObjectId(userId2), "participant2.userId": new ObjectId(userId1) }
            ]
        });

        if(existingChat){
            console.log("Чат уже существует");
            return existingChat;
        }

        const participant1 = await userCollection.findOne({ _id: new ObjectId(userId1) });
        const participant2 = await userCollection.findOne({ _id: new ObjectId(userId2) });
        
        if (!participant1 || !participant2) {
            const error = new Error("Один из пользователей не найден");
            error.statusCode = 404;
            throw error;
        }

        ['email', 'password', 'chats'].forEach(item => {
            delete participant1[item];
            delete participant2[item];
        });

        const chat = {
            participant1: {
                userId: new ObjectId(userId1),
                username: participant1.username,
            },
            participant2: {
                userId: new ObjectId(userId2),
                username: participant2.username
            },
            messages: [],
            createdAt: new Date()
        };

        const newChat = await chatsCollection.insertOne(chat);
        
        await userCollection.findOneAndUpdate(
            { _id: new ObjectId(userId1) },
            { $push: { chats: {
                chatId: newChat.insertedId,
                participant1: participant1,
                participant2: participant2
            }}}
        );

        await userCollection.findOneAndUpdate(
            { _id: new ObjectId(userId2) },
            { $push: { chats: {
                chatId: newChat.insertedId,
                participant1: participant1,
                participant2: participant2
            }}}
        );
        
        console.log("Чат успешно создан");
        return chat;
    } catch (error) {
        console.error("Ошибка при попытке создать чат:", error);
        throw error;
    }
}

export async function getChatData(chatId){
    try {
        const foundChat = await chatsCollection.findOne({ _id: new ObjectId(chatId) });
        
        return foundChat;
    } catch (error) {
        console.error("Ошибка при поиске чата:", error);
        throw error;
    }
}

export async function addNewMessage(chatId, userId, username, text){
    try {
        const chatData = await chatsCollection.findOneAndUpdate(
            { _id: new ObjectId(chatId) },
            { $push: { messages: {
                userId: userId,
                username: username,
                text: text,
                createdAt: new Date()
            }}},
            { returnDocument: "after" }
        );
        
        return chatData;
    } catch (error) {
        console.error("Ошибка при добавлении сообщения:", error);
        throw error;
    }
}
