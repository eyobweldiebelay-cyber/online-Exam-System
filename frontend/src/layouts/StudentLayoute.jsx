import React from "react";
import { Outlet } from "react-router-dom";

import StudentNavbar from "../components/Studentnavbar";

function StudentLayout() {

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