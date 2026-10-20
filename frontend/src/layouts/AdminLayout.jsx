
import { Outlet, useLocation } from "react-router-dom";
import TeacherNavbar from "../components/TeacherNavbar";
import AdminSidebar from "../components/AdminSidebar";

import "../css/teacher/teacher-layout.css";
import "../css/teacher/teacher-sidebar.css";

const pageTitles = {
  "/admin": "Admin Dashboard",
  "/admin/students": "Student Management",
  "/admin/student-import": "Import Students",
  "/admin/teachers": "Teacher Account Management",
  "/admin/academic-deans": "Academic Dean Management",
  "/admin/maintenance": "System Maintenance",
};

export default function AdminLayout() {
  const location = useLocation();

  const pageTitle =
    pageTitles[location.pathname] || "Admin Panel";

  return (
    <div className="teacher-layout admin-layout">
      <TeacherNavbar pageTitle={pageTitle} />

      <div className="teacher-layout-body">
        <AdminSidebar />

        <main className="teacher-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
