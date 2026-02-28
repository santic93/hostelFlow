import ReactDOM from "react-dom/client";
import App from "./app/App";
import { AuthProvider } from "./app/providers/AuthContext";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);