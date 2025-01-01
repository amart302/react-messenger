import { useState } from "react";
import { useForm } from "react-hook-form";

import "./authForms.css";

export default function AuthForms(){
    const [ switchingForms, setSwitchingForms ] = useState(false);
    const { register, handleSubmit, formState: { errors }} = useForm();

    const onSubmit = (data) => {
        console.log(data);
    }

    return(
        <div className="forms-container">
            {
                !switchingForms && 
                <form onSubmit={handleSubmit(onSubmit)}>
                    <h2>Account Login</h2>
                    <div className="form-group">
                        <label htmlFor="">Email</label>
                        <input type="text" placeholder="example@gmail.com" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Password</label>
                        <input type="password" placeholder="******" />
                    </div>
                    <button>SIGN IN</button>
                    <span>Forgot <a>Password?</a></span>
                    <span>Create an account? <a onClick={() => setSwitchingForms(true)}>Sign up</a></span>
                </form> 
            }

            { 
                switchingForms && 
                <form onSubmit={handleSubmit(onSubmit)}>
                    <h2>Create account</h2>
                    <div className="form-group">
                        <label htmlFor="">Username</label>
                        <input type="text" placeholder="Amart" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Email</label>
                        <input type="text" placeholder="example@gmail.com" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Password</label>
                        <input type="password" placeholder="******" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Confirm Password</label>
                        <input type="password" placeholder="******" />
                    </div>
                    <button>SIGN UP</button>
                    <span>Do you have an account? <a onClick={() => setSwitchingForms(false)}>Sign in</a></span>
                </form> 
            }
        </div>
    )
}