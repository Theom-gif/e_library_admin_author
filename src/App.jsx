import { BrowserRouter } from "react-router-dom";
import AdminRoutes from "./admin/AdminRoutes";
import { AuthProvider } from "./auth/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AdminRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

