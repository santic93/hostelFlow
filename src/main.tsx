
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./i18n";
ReactDOM.createRoot(document.getElementById("root")!).render(
  
    <AuthProvider>
      <App />
    </AuthProvider>

);