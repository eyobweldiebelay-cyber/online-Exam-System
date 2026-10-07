import {
    createContext,
    useContext,
    useState
} from "react";

import { loginUser } from "../pages/services/authService";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser =
            localStorage.getItem("user");

        if (!savedUser) {
            return null;
        }

        try {
            return JSON.parse(savedUser);
        } catch (error) {
            localStorage.removeItem("user");
            return null;
        }
    });

    const [loading, setLoading] = useState(false);

    async function login(username, password) {
        setLoading(true);

        try {
            const data = await loginUser(
                username,
                password
            );

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setUser(data.user);

            return data;
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}

export {
    AuthProvider,
    useAuth
};