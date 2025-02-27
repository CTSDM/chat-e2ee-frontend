import { createBrowserRouter } from "react-router-dom";
import Root from "./routes/Root.jsx";
import ErrorComponent from "./components/ErrorComponent.jsx";
import Login from "./routes/Login.jsx";
import { actionLogin, actionSignup } from "./routes/actions/actions.js";
import Signup from "./routes/Signup.jsx";
import Homepage from "./routes/Homepage.jsx";
import Logout from "./routes/Logout.jsx";

const routesConfig = [
    {
        path: "/",
        element: <Root />,
        errorElement: <ErrorComponent />,
        children: [
            {
                path: "/",
                element: <Homepage />,
                errorElement: <ErrorComponent />,
            },
            {
                path: "/login",
                element: <Login />,
                action: actionLogin,
                errorElement: <ErrorComponent />,
            },
            {
                path: "/signup",
                element: <Signup />,
                action: actionSignup,
                errorElement: <ErrorComponent />,
            },
            {
                path: "/logout",
                element: <Logout />,
                errorElement: <ErrorComponent />,
            },
        ],
    },
];

const routes = createBrowserRouter(routesConfig);

export default routes;
export { routesConfig };
