import { useContext } from "react";
import SearchMessages from "../components/SearchMessages.jsx";
import PreviewMessages from "../components/PreviewMessages.jsx";
import ChatRoom from "../components/ChatRoom.jsx";
import ButtonDialog from "../components/ButtonDialog.jsx";
import { Context } from "./utils/globalStateContext.js";
import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import routes from "../routes.jsx";
import styles from "./Homepage.module.css";
import { cryptoUtils } from "../utils/utils.js";

function Homepage() {
    const { isLogged, privateKey, contactList, setContactList } = useContext(Context);

    if (isLogged === false || privateKey === null) {
        routes.navigate("/login");
    }

    async function handleUpdatePublicKeys(publicUsername) {
        // here we have to make sure that the response handles beautifully all the different options
        const response = await requests.getPublicKey({ publicUsername });
        if (response.status === 200) {
            const publicKeyJWT = JSON.parse(response.publicKey);
            const publicKey = await cryptoUtils.importKey(publicKeyJWT, ["encrypt"]);
            setContactList((contactInfo) => {
                return { ...contactInfo, [publicUsername]: publicKey };
            });
        }
    }

    const contactNames = Object.keys(contactList);

    return (
        <div className={styles.container}>
            <div className={styles.leftSide}>
                <ButtonDialog
                    text={"Add connection"}
                    textModal={"Connect"}
                    onSubmit={handleUpdatePublicKeys}
                    input={env.inputs.signup[1]}
                />
                <SearchMessages />
                {contactNames.length === 0 ? <div>No users yet...</div> : null}
                {contactNames.map((contact) => (
                    <PreviewMessages key={contact} name={contact} />
                ))}
            </div>
            <div className={styles.rightSide}>
                <ChatRoom />
            </div>
        </div>
    );
}

export default Homepage;
