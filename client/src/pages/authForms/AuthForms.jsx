import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Toaster, toast } from "sonner";
import axios from "axios";
import "./authForms.css";


export default function AuthForms(){
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [ errorMessage, setErrorMessage ] = useState(false);
    const [ switchingForms, setSwitchingForms ] = useState(false);
    const { register, handleSubmit, reset, formState: { errors }} = useForm();

    useEffect(() => {
        sessionStorage.setItem("userId", null);
        dispatch({type: "CLEAR_USER_DATA"});
        dispatch({type: "CLEAR_CHAT_DATA"});
    }, []);
    
    const onSubmitLogin = async (data) => {
        setErrorMessage(false);
        delete data.username;
        delete data.confirmPassword;
    
        try {
            const response = await axios.post("http://localhost:8080/api/loginData", data);
            sessionStorage.setItem("userId", JSON.stringify(response.data.userId));
            toast.success("Успешный вход");
            setTimeout(() => navigate("/"), 800);
        } catch (error) {
            if(error.response){
                setErrorMessage(error.response.data.message);
            }else{
                setErrorMessage(error.message);
            }
        }
    };

    const onSubmitRegister = async (data) => {
        setErrorMessage(false);
    
        if (data.password !== data.confirmPassword) {
            setErrorMessage("Пароли не совпадают");
        }
    
        try {
            const response = await axios.post("http://localhost:8080/api/registerData", data);
            sessionStorage.setItem("userId", JSON.stringify(response.data.userId));
            toast.success("Успешная регистрация");
            setTimeout(() => navigate("/"), 800);
        } catch (error) {
            if(error.response){
                setErrorMessage(error.response.data.message);
            }else{
                setErrorMessage(error.message);
            }
        }
    };

    return(
        <div className="forms-container">
            <Toaster richColors position="top-center" />
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