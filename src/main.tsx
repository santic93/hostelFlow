
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./i18n";
import "./styles/global.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  
    <AuthProvider>
      <App />
    </AuthProvider>

);