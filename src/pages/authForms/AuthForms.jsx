import { useState } from "react";
import { useForm } from "react-hook-form";
import bcrypt from "bcryptjs";

import "./authForms.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AuthForms(){
    const navigate = useNavigate();
    const [ errorMessage, setErrorMessage ] = useState(false);
    const [ switchingForms, setSwitchingForms ] = useState(false);
    const { register, handleSubmit, reset, formState: { errors }} = useForm();

    const hashedPassword = async (password) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            return hash;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    
    const onSubmitLogin = (data) => {
        setErrorMessage(false);
        delete data.username;
        delete data.confirmPassword;

        axios.post("http://localhost:8080/loginData", data)
            .then(res => {
                delete res.data.user.password;
                sessionStorage.setItem("user", JSON.stringify(res.data.user));
                
                setTimeout(() => navigate(res.data.redirect), 400);
            })
            .catch(error => {
                setErrorMessage(error.response.data.message);
            })
    }

    const onSubmitRegister = async (data) => {
        setErrorMessage(false);
        if(data.password == data.confirmPassword){
            data.password = await hashedPassword(data.password);

            axios.post("http://localhost:8080/registerData", data)
            .then(res => {
                delete res.data.user.password;
                sessionStorage.setItem("user", JSON.stringify(res.data.user));
                setTimeout(() => navigate(res.data.redirect), 400);
            })
            .catch(error => {
                setErrorMessage(error.response.data.message);
            })
        }else{
            setErrorMessage("Пароли не совпадают");
        }
    }

    return(
        <div className="forms-container">
            {
                !switchingForms && 
                <form onSubmit={handleSubmit(onSubmitLogin)}>
                    <h2>Вход</h2>
                    <div className="form-group">
                        <input type="text" placeholder="Email" {...register("email", { required: "Это поле обязательно для заполнения", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Некорректный email" } })}  />
                        { errors.email  && <p className="error-message">{ errors.email.message }</p>}
                        <input type="password" placeholder="Password" {...register("password", { required: "Это поле обязательно для заполнения", minLength: { value: 6, message: "Минимальная длина 6 символов" } })} />
                        { errors.password && <p className="error-message">{ errors.password.message }</p> }
                        { errorMessage && <p className="error-message">{ errorMessage }</p> }
                    </div>
                    <button>Войти</button>
                    <span>Забыли <a>пароль?</a></span>
                    <span>Создать аккаунт? <a onClick={() => {
                        setSwitchingForms(true);
                        setErrorMessage(false);
                        reset();
                    }}>Зарегистрироваться</a></span>
                </form> 
            }

            { 
                switchingForms && 
                <form onSubmit={handleSubmit(onSubmitRegister)}>
                    <h2>Регистрация</h2>
                    <div className="form-group">
                        <input type="text" placeholder="Username" {...register("username", { required: "Это поле обязательно для заполнения" })} />
                        { errors.username && <p className="error-message">{ errors.username.message }</p> }
                        <input type="text" placeholder="Email" {...register("email", { required: "Это поле обязательно для заполнения", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Некорректный email" } })}  />
                        { errors.email  && <p className="error-message">{ errors.email.message }</p>}
                        <input type="password" placeholder="Password" {...register("password", { required: "Это поле обязательно для заполнения", minLength: { value: 6, message: "Минимальная длина 6 символов" } })} />
                        { errors.password && <p className="error-message">{ errors.password.message }</p> }
                        <input type="password" placeholder="Confirm password" {...register("confirmPassword", { required: "Это поле обязательно для заполнения", minLength: { value: 6, message: "Минимальная длина 6 символов" } })} />
                        { errors.confirmPassword && <p className="error-message">{ errors.confirmPassword.message }</p> }
                        { errorMessage && <p className="error-message">{ errorMessage }</p> }
                    </div>
                    <button>Зарегистрироваться</button>
                    <span>У вас есть аккаунт? <a onClick={() => {
                        setSwitchingForms(false);
                        setErrorMessage(false);
                        reset();
                    }}>Войти</a></span>
                </form> 
            }
        </div>
    )
}