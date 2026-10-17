
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";

import StudentNavbar from "../components/Studentnavbar";


function StudentLayout() {
    useEffect(() => {
        const savedTheme =
            localStorage.getItem("student-theme") || "light";

        document.documentElement.dataset.theme = savedTheme;
    }, []);

    return (
        <div className="student-layout">
            <StudentNavbar />

            <main className="student-main">
                <Outlet />
            </main>
        </div>
    );
}

export default StudentLayout;
