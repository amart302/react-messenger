import { useLocation, useNavigate } from "react-router-dom";
import "./main.css";
import { useEffect } from "react";
import ListOfChats from "../../components/listOfChats/ListOfChats";
import { useDispatch, useSelector } from "react-redux";
import { clearUser, setUser } from "../../store/reducer";

export default function Main(){
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(state => state.user);
    
    useEffect(() => {
        try {
            const storedUser = JSON.parse(sessionStorage.getItem("user"));

            if(storedUser){
                dispatch(setUser(storedUser));
            }else{
                dispatch(clearUser());
                navigate("/login");
            }
        } catch (error) {
            console.error("Ошибка при чтении данных пользователя:", error);
            dispatch(clearUser());
            navigate("/login");
        }
    }, []);

    return(
        <>
            <ListOfChats />
            <main>

            </main>
        </>
    )
}