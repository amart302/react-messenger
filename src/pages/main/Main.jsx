import { useNavigate } from "react-router-dom";
import "./main.css";
import { useEffect } from "react";

export default function Main(){
    const navigate = useNavigate();
    const userData = JSON.parse(sessionStorage.getItem("user")) || null;
    
    useEffect(() => {
        
    }, [])
    
    
    return(
        <main>

        </main>
    )
}