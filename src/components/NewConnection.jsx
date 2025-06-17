import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import DialogNewPrivateConnection from "./DialogNewPrivateConnection.jsx";
import DialogNewGroup from "./DialogNewGroup.jsx";
import { env } from "../../config/config.js";
import styles from "./NewConnection.module.css";
import newMsgGroupImg from "../assets/person.svg";
import newMsgDirectImg from "../assets/group.svg";

function NewConnection({ contactList, newConnection, setErr, createGroup }) {
    const [hover, setHover] = useState(false);
    const [active, setActive] = useState(false);
    const [newPrivate, setNewPrivate] = useState(false);
    const [newGroup, setNewGroup] = useState(false);
    const refButton = useRef(null);
    const refContainer = useRef(null);
    const refList = useRef(null);
    // refHandlerTimer object to manage button debounce-ish
    const refHandlerTimer = useRef({
        active: setTimeout(() => {}, 0),
        hover: setTimeout(() => {}, 0),
    });

    useEffect(() => {
        const parentContainer = refContainer.current.parentElement;
        const handleMouseIn = () => setHover(true);
        const handleMouseOut = () => setHover(false);
        parentContainer.addEventListener("mouseenter", handleMouseIn);
        parentContainer.addEventListener("mouseleave", handleMouseOut);

        return () => {
            parentContainer.removeEventListener("mouseenter", handleMouseIn);
            parentContainer.removeEventListener("mouseenter", handleMouseOut);
        };
    }, []);

    useEffect(() => {
        clearTimeout(refHandlerTimer.current.hover);
        clearTimeout(refHandlerTimer.current.active);
        clearTimeout(refHandlerTimer.current.visibile);
        refHandlerTimer.current.hover = null;
        refHandlerTimer.current.active = null;
        refHandlerTimer.current.visible = null;
    }, []);

    useEffect(() => {
        if (hover) {
            clearTimeout(refHandlerTimer.current.hover);
            clearTimeout(refHandlerTimer.current.active);
            clearTimeout(refHandlerTimer.current.visible);
            refButton.current.style["transition-duration"] = "0.25s";
            refButton.current.style["bottom"] = "30px";
            refList.current.style["transition-duration"] = "0.25s";
            refList.current.style["bottom"] = "80px";
        } else {
            clearTimeout(refHandlerTimer.current);
            refButton.current.style["transition-duration"] = "0.08s";
            refList.current.style["transition-duration"] = "0.08s";
            refHandlerTimer.current.hover = setTimeout(() => {
                refButton.current.style["bottom"] = "-50px";
                refList.current.style["bottom"] = "30px";
            }, 500);
            refHandlerTimer.current.active = setTimeout(() => setActive(false), 625);
        }
    }, [hover]);

    useEffect(() => {
        if (active) {
            clearTimeout(refHandlerTimer.current.visible);
            refList.current.style["visibility"] = "visible";
            refList.current.style["opacity"] = 1;
        } else {
            refList.current.style["opacity"] = 0;
            refHandlerTimer.current.visible = setTimeout(() => {
                refList.current.style["visibility"] = "hidden";
            }, 625);
        }
    }, [active]);

    function handleOnClickGeneralNewConn() {
        setActive((previousValue) => !previousValue);
    }

    function handleNewPrivateConn() {
        setNewPrivate(true);
        setTimeout(() => setNewPrivate(false), 10);
        closeHelperMenus();
    }

    function handleNewGroup() {
        setNewGroup(true);
        setTimeout(() => setNewGroup(false), 10);
        closeHelperMenus();
    }

    function closeHelperMenus() {
        // when opening the dialog, the helper menu should be closed
        refHandlerTimer.current.active = setTimeout(() => setActive(false), 625);
        setHover(false);
    }

    return (
        <div className={styles.container} ref={refContainer}>
            <button className={styles.new} ref={refButton} onClick={handleOnClickGeneralNewConn}>
                {active ? "x" : "+"}
            </button>
            <div className={styles.list} ref={refList}>
                <button onClick={handleNewGroup}>
                    <img src={newMsgGroupImg} alt="group message" />
                    <span>New Group</span>
                </button>
                <button onClick={handleNewPrivateConn}>
                    <img src={newMsgDirectImg} alt="direct message" />
                    <span>New Message</span>
                </button>
                <DialogNewPrivateConnection
                    state={newPrivate}
                    textModal={"Connect"}
                    onSubmit={newConnection}
                    input={env.inputs.signup[1]}
                />
                <DialogNewGroup
                    state={newGroup}
                    contactList={contactList}
                    setErrMessage={setErr}
                    onSubmit={createGroup}
                />
            </div>
        </div>
    );
}

NewConnection.propTypes = {
    contactList: PropTypes.object.isRequired,
    newConnection: PropTypes.func.isRequired,
    setErr: PropTypes.func.isRequired,
    createGroup: PropTypes.func.isRequired,
};

export default NewConnection;
