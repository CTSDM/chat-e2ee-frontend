import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import addContact from "../assets/person_add.svg";
import styles from "./NewPrivateMessage.module.css";
import { chatUtils } from "../utils/utils.js";
import DialogNewPrivateConnection from "./DialogNewPrivateConnection.jsx";
import { env } from "../../config/config.js";

export default function NewPrivateMessage({ active, contactList, setTarget, newConnection }) {
    const refContainer = useRef(null);
    const refAddContactButton = useRef(null);
    const refHandlerTimeout = useRef(setTimeout(() => {}, 0));
    const [toAdd, setToAdd] = useState(false);

    useEffect(() => {
        return () => clearTimeout(refHandlerTimeout.current);
    }, []);

    if (refContainer.current) {
        if (active) {
            clearTimeout(refHandlerTimeout.current);
            refContainer.current.style["visibility"] = "visible";
            refContainer.current.style["opacity"] = 1;
            refContainer.current.style["z-index"] = "1";
            refAddContactButton.current.style["visibility"] = "visible";
        } else {
            refContainer.current.style["opacity"] = 0;
            refContainer.current.style["z-index"] = "-1";
            refHandlerTimeout.current = setTimeout(() => {
                refContainer.current.style["visibility"] = "hidden";
                refAddContactButton.current.style["visibility"] = "hidden";
            }, 200);
        }
    }

    const usersIdArr = chatUtils.getUsersId(contactList);

    return (
        <div className={styles.container} ref={refContainer}>
            <div className={styles.general}>
                {usersIdArr.map((id) => {
                    const user = contactList[id];
                    return (
                        <button key={id} className={styles.user} onClick={() => setTarget(id)}>
                            {user.name}
                        </button>
                    );
                })}
            </div>
            <button className={styles.add} ref={refAddContactButton} onClick={() => setToAdd(true)}>
                <img src={addContact} alt="helper button" />
            </button>
            <DialogNewPrivateConnection
                state={toAdd}
                setState={setToAdd}
                textModal={"Connect"}
                onSubmit={newConnection}
                input={env.inputs.signup[1]}
            />
        </div>
    );
}

NewPrivateMessage.propTypes = {
    active: PropTypes.bool.isRequired,
    contactList: PropTypes.object.isRequired,
    setTarget: PropTypes.func.isRequired,
    newConnection: PropTypes.func.isRequired,
};
