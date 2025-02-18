import { useState } from "react";
import "./App.css";

function App() {
    const [value, setValue] = useState("");

    function handleChange(e) {
        setValue(e.currentTarget.value);
    }

    return (
        <>
            <h1>Title</h1>
            <input type="text" onChange={handleChange} value={value} />
        </>
    );
}

export default App;
