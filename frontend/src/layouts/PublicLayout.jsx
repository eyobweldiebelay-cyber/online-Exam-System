
import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";

function PublicLayout() {
    return (
        <>
            <PublicNavbar />
            <Outlet />
        </>
    );
}

export default PublicLayout;
