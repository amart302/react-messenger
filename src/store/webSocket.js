export function webSocketConnect() {
    const ws = new WebSocket('ws://localhost:8081');
    ws.onopen = () => {
        console.log('Подключено к серверу');
        ws.send('Привет, сервер!');
    };
    
    ws.onmessage = (event) => {
        console.log('Получено от сервера:', event.data);
    };
    
    ws.onclose = () => {
        console.log('Соединение закрыто');
    };
    
    ws.onerror = (error) => {
        console.error('Ошибка WebSocket:', error);
    };
}