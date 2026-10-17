
import { Outlet } from "react-router-dom";
import TeacherNavbar from "../components/TeacherNavbar";
import TeacherSidebar from "../components/TeacherSidebar";
import "../css/teacher/teacher-layout.css";
import "../css/teacher/teacher-sidebar.css";

export default function TeacherLayout() {
  return (
    <div className="teacher-layout">
      <TeacherNavbar />

      <div className="teacher-layout-body">
        <TeacherSidebar />

        <main className="teacher-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}