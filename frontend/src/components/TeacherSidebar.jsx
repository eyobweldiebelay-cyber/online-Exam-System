
import { NavLink } from "react-router-dom";
import "../css/teacher/teacher-sidebar.css";

const menuItems = [
  { label: "Dashboard", path: "/teacher", icon: "▦", end: true },
  { label: "Students", path: "/teacher/students", icon: "♙" },
  { label: "Question Management", path: "/teacher/questions", icon: "☷" },
  { label: "Results", path: "/teacher/results", icon: "▤" },
  { label: "My Profile", path: "/teacher/profile", icon: "◉" },
];

export default function TeacherSidebar() {
  return (
    <aside className="teacher-sidebar">
      <div className="teacher-sidebar-heading">
        <span className="teacher-sidebar-section-label">TEACHER MENU</span>
      </div>

      <nav className="teacher-sidebar-nav" aria-label="Teacher navigation">
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
          <span>Online Examination</span>
        </div>
      </div>
    </aside>
  );
}
