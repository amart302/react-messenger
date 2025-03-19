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
    chats: [{ type: ObjectId, ref: "Chat", _id: false }],
    createdAt: { type: Date, default: () => Date.now() }
});

const chatSchema = new Schema({
    participant1: { type: ObjectId, required: true, ref: "User" },
    participant2: { type: ObjectId, required: true, ref: "User" },
    messages: [{
        userId: { type: ObjectId, required: true },
        username: { type: ObjectId, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: () => Date.now() }
    }],
    createdAt: { type: Date, default: () => Date.now() }
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
        const foundUser = await User.findOne({ _id: new Object(userId)}).select("-password")
            .populate({
                path: "chats",
                select: "-messages",
                populate: [
                    { path: "participant1", select: "username" },
                    { path: "participant2", select: "username" },
                ]
            });
        return foundUser;
    } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
        throw error;
    }
};

export async function findUser(username){
    try {
        const foundUser = await User.findOne({ username: { $regex: new RegExp(username, "i") } }).select("-email -password -chats -createdAt");
        if(!foundUser){
            throw createError("Пользователь не найден", 404, "username")
        }else{
            return foundUser;
        }
    } catch (error) {
        console.error("Ошибка при поиске пользователя:", error);
        throw error;
    }
};

export async function createOrGetChat(userId1, userId2){
    try {
        const chat = await Chat.findOne(
            {
                $or: [
                    { "participant1": new ObjectId(userId1), "participant2": new ObjectId(userId2) },
                    { "participant1": new ObjectId(userId2), "participant2": new ObjectId(userId1) }
                ]
            },
        ).populate([
                { path: "participant1", select: "username" },
                { path: "participant2", select: "username" },
        ]);

        if(chat){
            console.log("Чат уже существует");
            return {data: chat, exists: true};
        }
        const participant1 = new Types.ObjectId(userId1);
        const participant2 = new Types.ObjectId(userId2);
        const newChat = new Chat({
            participant1,
            participant2,
            messages: []
        });
        const savedChat = await newChat.save();
        
        await User.findOneAndUpdate(
            { _id: new ObjectId(userId1)},
            { $push: { chats: savedChat._id } },
        );
    
        await User.findOneAndUpdate(
            { _id: new ObjectId(userId2)},
            { $push: { chats: savedChat._id } },
        );
        const populatedChat = await Chat.findById(savedChat._id)
            .populate([
                { path: "participant1", select: "username" },
                { path: "participant2", select: "username" },
            ]);
        console.log("Чат успешно создан");
        return {data: populatedChat, exists: false};
    } catch (error) {
        console.error("Ошибка при попытке создать чат:", error);
        throw error;
    }
};

export async function getChatDataById(chatId){
    try {
        const chatData = await Chat.findOne({ _id: chatId })
            .populate({
                path: "chats",
                populate: [
                    { path: "participant1.userId", select: "username" },
                    { path: "participant2.userId", select: "username" },
                    { path: "messages.userId", select: "username" }
                ]
            });
        return chatData;
    } catch (error) {
        console.error("Ошибка получении данных чата:", error);
        throw error;
    }
};

export async function addNewMessage(chatId, userId, username, text){
    try {
        const chatData = await Chat.findOneAndUpdate(
            { _id: new ObjectId(chatId) },
            { $push: { messages: {
                userId: new ObjectId(userId),
                text: text,
            }}},
            { returnDocument: "after" }
        ).populate([
            { path: "participant1", select: "username" },
            { path: "participant2", select: "username" },
        ]);
        return chatData;
    } catch (error) {
        console.error("Ошибка при добавлении сообщения:", error);
        throw error;
    }
};