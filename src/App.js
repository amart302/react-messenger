import { Route, Routes } from 'react-router-dom';
import './App.css';
import Main from './pages/main/Main';
import NotFound from './pages/notFound/NotFound';
import AuthForms from './pages/authForms/AuthForms';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<AuthForms />}/>
      </Routes>
    </div>
  );
}

export default App;
