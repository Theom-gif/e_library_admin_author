import './index.css'
import { BrowserRouter } from "react-router-dom";
import AdminRoutes from "./admin/AdminRoutes";
import AuthorRoute from './author/AuthorRoute/AuthorRoute'
import { AuthProvider } from "./auth/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AdminRoutes />
        <AuthorRoute />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
