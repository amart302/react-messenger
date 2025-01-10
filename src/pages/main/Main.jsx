import { useLocation, useNavigate } from "react-router-dom";
import "./main.css";
import { useEffect } from "react";
import ListOfChats from "../../components/listOfChats/ListOfChats";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

export default function Main(){
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(state => state.user);
    
    useEffect(() => {
        async function getUserData(){
            try {
                const userId = JSON.parse(sessionStorage.getItem("userId"));
                const response = await axios.get("http://localhost:8080/api/getUserData", {
                    params: { userId: userId }
                });
                if(userId){
                    dispatch({
                        type: "GET_USER_DATA",
                        payload: response.data.userData
                    });
                }else{
                    dispatch({type: "CLEAR_USER"});
                    navigate("/login");
                }
            } catch (error) {
                console.error("Ошибка при чтении данных пользователя:", error);
                dispatch({type: "CLEAR_USER"});
                navigate("/login");
            }
        }
        getUserData();
    }, []);

    return(
        <>
            <ListOfChats />
            <main>

            </main>
        </>
    )
}