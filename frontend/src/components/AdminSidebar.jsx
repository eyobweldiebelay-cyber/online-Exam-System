
import { NavLink } from "react-router-dom";
import "../css/teacher/teacher-sidebar.css";

const menuItems = [
  { label: "Dashboard", path: "/admin", icon: "▦", end: true },
  { label: "Student Accounts", path: "/admin/students", icon: "♙" },
  { label: "Create Students Accounts", path: "/admin/student-import", icon: "▤" },
  { label: "Create Teacher Accounts", path: "/admin/teachers", icon: "♙" },
  {
    label: "Create Dean Accounts",
    path: "/admin/academic-deans",
    icon: "♧",
  },
  {
    label: "System Maintenance",
    path: "/admin/maintenance",
    icon: "⚙",
  },
];

export default function AdminSidebar() {
  return (
    <aside className="teacher-sidebar">
      <div className="teacher-sidebar-heading">
        <span className="teacher-sidebar-section-label">
          ADMINISTRATION
        </span>
      </div>

      <nav
        className="teacher-sidebar-nav"
        aria-label="Admin navigation"
      >
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `teacher-sidebar-link${isActive ? " active" : ""}`
            }
          >
            <span className="teacher-sidebar-icon" aria-hidden="true">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="teacher-sidebar-footer">
        <span className="teacher-sidebar-footer-mark">INU</span>

        <div>
          <strong>Injibara University</strong>
          <span>Administration Portal</span>
        </div>
      </div>
    </aside>
  );
}
