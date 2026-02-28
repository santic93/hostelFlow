
import ReactDOM from "react-dom/client";
import "./app/providers/i18n";
import "./styles/global.css";
import { AuthProvider } from "./app/providers/AuthContext";
import App from "./app/App";
ReactDOM.createRoot(document.getElementById("root")!).render(
  
    <AuthProvider>
      <App />
    </AuthProvider>

);