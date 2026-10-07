import api from "./api";

async function loginUser(username, password) {
    const response = await api.post(
        "/auth/login",
        {
            username,
            password
        }
    );

    return response.data;
}

async function changePassword(
    currentPassword,
    newPassword
) {
    const response = await api.patch(
        "/auth/change-password",
        {
            current_password: currentPassword,
            new_password: newPassword
        }
    );

    return response.data;
}

export {
    loginUser,
    changePassword
};