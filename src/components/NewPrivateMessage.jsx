import PropTypes from "prop-types";
import { useEffect, useRef, useState, useMemo } from "react";
import addContact from "../assets/person_add.svg";
import styles from "./NewPrivateMessage.module.css";
import { chatUtils } from "../utils/utils.js";
import DialogNewPrivateConnection from "./DialogNewPrivateConnection.jsx";
import SearchContacts from "./SearchContacts.jsx";
import NoConnections from "./NoConnections.jsx";
import penSvg from "../assets/stylus_pen.svg";
import { env, texts } from "../../config/config.js";

export default function NewPrivateMessage({ active, contactList, setTarget, newConnection }) {
    const refContainer = useRef(null);
    const refAddContactButton = useRef(null);
    const [toAdd, setToAdd] = useState(false);
    const [search, setSearch] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const refHandlerTimeout = useRef(setTimeout(() => {}, 0));

    useEffect(() => {
        return () => clearTimeout(refHandlerTimeout.current);
    }, []);

    useEffect(() => {
        if (active) {
            setIsMounted(true);
        }
        if (refContainer.current) {
            if (active) {
                clearTimeout(refHandlerTimeout.current);
                refContainer.current.style["opacity"] = 1;
                refAddContactButton.current.style["opacity"] = 1;
            } else {
                refContainer.current.style["opacity"] = 0;
                refAddContactButton.current.style["opacity"] = 0;
                refHandlerTimeout.current = setTimeout(() => setIsMounted(false), 500);
            }
        }
    }, [active, isMounted]);

    const contactsExist = chatUtils.getKeys(contactList).length > 0;
    const usersIdArr = useMemo(() => {
        return contactsExist ? chatUtils.getUsersId(contactList, search) : [];
    }, [active, search, contactsExist]);

    return isMounted ? (
        <div className={styles.container} ref={refContainer}>
            <SearchContacts value={search} setValue={setSearch} />
            <div className={styles.general}>
                {contactsExist ? null : <NoConnections imgSrc={penSvg} text={texts.noContacts} />}
                {usersIdArr.length > 0
                    ? usersIdArr.map((id) => {
                          const user = contactList[id];
                          return (
                              <button
                                  key={id}
                                  className={styles.user}
                                  onClick={() => setTarget(id)}
                              >
                                  {user.name}
                              </button>
                          );
                      })
                    : contactsExist
                      ? "No matches"
                      : null}
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
    ) : null;
}

NewPrivateMessage.propTypes = {
    active: PropTypes.bool.isRequired,
    contactList: PropTypes.object.isRequired,
    setTarget: PropTypes.func.isRequired,
    newConnection: PropTypes.func.isRequired,
};
