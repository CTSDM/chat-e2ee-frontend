import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import styles from "./NewConnection.module.css";
import newMsgGroupImg from "../assets/person.svg";
import newMsgDirectImg from "../assets/group.svg";
import showOptions from "../assets/plus.svg";
import cancel from "../assets/cancel.svg";

function NewConnection({ newPrivate, creatingGroup, setNewPrivate, setNewGroup }) {
    const [hover, setHover] = useState(false);
    const [active, setActive] = useState(false);
    const [helperButtonSrc, setHelperButtonSrc] = useState(showOptions);
    const activationHelper = useRef(false); // helps to keep track of initial state for hover and newPrivate
    const refGeneralButton = useRef(null);
    const refContainer = useRef(null);
    const refList = useRef(null);
    // refHandlerTimer object to manage button debounce-ish
    const refHandlerTimer = useRef({
        active: setTimeout(() => {}, 0),
        hover: setTimeout(() => {}, 0),
    });

    useEffect(() => {
        function closeList(e) {
            const target = e.target;
            if (!refGeneralButton.current.contains(target) && !refList.current.contains(target)) {
                setActive(false);
            }
        }
        window.addEventListener("click", closeList);
        return () => window.removeEventListener("click", closeList);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // keyCode 27 is Escape
            if (e.keyCode === 27) {
                setActive(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

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
        if (newPrivate || creatingGroup) return;
        if (hover) {
            clearTimeout(refHandlerTimer.current.hover);
            clearTimeout(refHandlerTimer.current.active);
            clearTimeout(refHandlerTimer.current.visible);
            refGeneralButton.current.style["transition-duration"] = "0.25s";
            refGeneralButton.current.style["bottom"] = "30px";
            refGeneralButton.current.style["visibility"] = "visible";
            refList.current.style["transition-duration"] = "0.25s";
            refList.current.style["bottom"] = "80px";
        } else {
            clearTimeout(refHandlerTimer.current);
            refGeneralButton.current.style["transition-duration"] = "0.08s";
            refList.current.style["transition-duration"] = "0.08s";
            refHandlerTimer.current.hover = setTimeout(() => {
                refGeneralButton.current.style["bottom"] = "-50px";
                refList.current.style["bottom"] = "30px";
            }, 500);
            closeHelperMenus();
        }
    }, [hover]);

    useEffect(() => {
        const buttons = refList.current.querySelectorAll("button");
        if (active) {
            clearTimeout(refHandlerTimer.current.visible);
            refList.current.style["visibility"] = "visible";
            refList.current.style["opacity"] = 1;
            buttons.forEach((button) => {
                handleTabIndex(button, true);
            });
            setHelperButtonSrc(cancel);
        } else {
            refList.current.style["visibility"] = "hidden";
            refList.current.style["opacity"] = 0;
            buttons.forEach((button) => {
                handleTabIndex(button, false);
            });
            setHelperButtonSrc(showOptions);
        }
    }, [active]);

    useEffect(() => {
        if (!newPrivate && !creatingGroup && activationHelper.current === true) {
            setHover(true);
            activationHelper.current = false;
        }
    }, [newPrivate, creatingGroup]);

    function handleOnClickGeneralButton() {
        setActive((previousValue) => !previousValue);
    }

    function handleNewPrivateConn() {
        // we load the screen with the contacts
        // we hide the list, the button also goes hidden
        setNewPrivate(true);
        activationHelper.current = true;
        closeMenus();
    }

    function handleNewGroup() {
        setNewGroup({ first: true, second: false });
        activationHelper.current = true;
        closeMenus();
    }

    function closeMenus() {
        setHover(false);
        refGeneralButton.current.style["visibility"] = "hidden";
        refGeneralButton.current.style["bottom"] = "-50px";
        refList.current.style["visibility"] = "hidden";
    }

    function closeHelperMenus() {
        // when opening the dialog, the helper menu should be closed
        refHandlerTimer.current.active = setTimeout(() => {
            setHelperButtonSrc(showOptions);
            setActive(false);
        }, 625);
    }

    function handleTabIndex(element, add) {
        if (add) {
            element.tabIndex = "0";
        } else {
            element.tabIndex = "-1";
        }
    }

    return (
        <>
            <div className={styles.container} ref={refContainer}>
                <button
                    className={styles.general}
                    ref={refGeneralButton}
                    onClick={handleOnClickGeneralButton}
                >
                    <img src={helperButtonSrc} alt="helper button" />
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
                </div>
            </div>
        </>
    );
}
NewConnection.propTypes = {
    newPrivate: PropTypes.bool.isRequired,
    creatingGroup: PropTypes.bool.isRequired,
    setNewPrivate: PropTypes.func.isRequired,
    setNewGroup: PropTypes.func.isRequired,
};

export default NewConnection;
