import bcrypt from "bcrypt";
import { mongoURI } from "./config.js";
import mongoose, { Schema, Types } from "mongoose";

const { ObjectId } = Types;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Подключение к MongoDB успешно"))
    .catch((err) => console.error("Ошибка подключения в MongoDB", err));

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    chats: [{ 
        chatId: { type: ObjectId },
        participant: {
            userId: { type: ObjectId },
            username: { type: String }
        }
    }],
    createdAt: { type: Date, default: new Date() }
});

const chatSchema = new Schema({
    participant1: {
        userId: { type: ObjectId, required: true },
        username: { type: String, required: true }
    },
    participant2: {
        userId: { type: ObjectId, required: true },
        username: { type: String, required: true }
    },
    messages: [{
        userId: { type: ObjectId },
        username: { type: String },
        text: { type: String },
        createdAt: { type: Date, default: new Date() }
    }],
    createdAt: { type: Date, default: new Date() }
});

const User = mongoose.model("User", userSchema);
const Chat = mongoose.model("Chat", chatSchema);

const createError = (message, code, field, originError = null) => {
    const error = new Error(message);
    error.code = code;
    error.field = field;
    if(originError){
        error.keyPattern = originError.keyPattern;
        error.keyValue = originError.keyValue;
    }
    return error;
};

export async function registerUser(username, email, password){
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            chats: []
        });

        const savedUser = await newUser.save();
        return savedUser._id;
    } catch (error) {
        if(error.code === 11000){
            if(error.keyPattern.username){
                throw createError("Пользователь с таким ником уже существует", 409, "username", error);
            }else if(error.keyPattern.email){
                throw createError("Пользователь с такой почтой уже существует", 409, "email", error);
            }
        }else{
            console.error("Ошибка при регистрации пользователя:", error);
            throw error;
        }
    }
};

export async function verificateUser(email, password){
    try {
        const foundUser = await User.findOne({ email: email });
        const isPasswordValid = (foundUser) ? await bcrypt.compare(password, foundUser.password) : null;

        if(!foundUser || !isPasswordValid){
            throw createError("Неправильный логин или пароль", 401, (!foundUser) ? "email" : "password");
        }else{
            return foundUser._id;
        }
    } catch (error) {
        console.error("Ошибка при проверке пользователя:", error);
        throw error;
    }
};

export async function getUserData(userId){
    try {
        const foundUser = await User.findOne({ _id: new Object(userId)});
        delete foundUser.password;
        return foundUser;
    } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
        throw error;
    }
};

export async function findUser(username){
    try {
        const foundUser = await User.findOne({ username: { $regex: new RegExp(username, "i") } });
        if(!foundUser){
            throw createError("Пользователь не найден", 404, "username")
        }else{
            ['email', 'password', 'chats'].forEach(item => {
                delete foundUser[item];
            });
            return foundUser;
        }
    } catch (error) {
        console.error("Ошибка при поиске пользователя:", error);
        throw error;
    }
};

export async function createorOpentChat(userId1, userId2){
    try {
        const existingChat = await Chat.findOne({
            $or: [
                { "participant1.userId": new ObjectId(userId1), "participant2.userId": new ObjectId(userId2) },
                { "participant1.userId": new ObjectId(userId2), "participant2.userId": new ObjectId(userId1) }
            ]
        });

        if(existingChat){
            console.log("Чат уже существует");
            return existingChat;
        }

        const participant1 = await User.findOne({ _id: new ObjectId(userId1) });
        const participant2 = await User.findOne({ _id: new ObjectId(userId2) });
        if (!participant1 || !participant2) {
            throw createError("Один из пользователей не найден", 404, "id")
        }

        const newChat = new Chat({
            participant1: {
                userId: new ObjectId(userId1),
                username: participant1.username
            },
            participant2: {
                userId: new ObjectId(userId2),
                username: participant2.username
            },
            messages: []
        });
        const savedChat = await newChat.save();
        await User.findByIdAndUpdate(
            { _id: new Object(userId1) },
            { $push: { chats: {
                chatId: savedChat._id,
                participant: {
                    userId: new ObjectId(userId2),
                    username: participant2.username
                }
        }}});
        await User.findByIdAndUpdate(
            { _id: new Object(userId2) },
            { $push: { chats: {
                chatId: savedChat._id,
                participant: {
                    userId: new ObjectId(userId1),
                    username: participant1.username
                }
        }}});
        console.log("Чат успешно создан");
        return savedChat;
    } catch (error) {
        console.error("Ошибка при попытке создать чат:", error);
        throw error;
    }
};

export async function addNewMessage(chatId, userId, username, text){
    try {
        const chatData = await Chat.findOneAndUpdate(
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
};