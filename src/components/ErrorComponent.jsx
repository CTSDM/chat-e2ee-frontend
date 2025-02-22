import { useRouteError } from "react-router-dom";

function ErrorComponent() {
    const error = useRouteError();

    return (
        <div>
            <h1>Ooops!</h1>
            <p>Sorry, an unexpected error has ocurred.</p>
            <p>
                <i>{error.statusText || error.message} </i>
            </p>
        </div>
    );
}

export default ErrorComponent;
