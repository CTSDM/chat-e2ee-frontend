import PropTypes from "prop-types";
import { Fragment, useEffect, useRef, useState } from "react";
import styles from "./NewGroup.module.css";
import UserSelector from "./UserSelector.jsx";
import InputText from "./InputComp.jsx";
import { chatUtils } from "../utils/utils.js";
import rightArrow from "../assets/right_arrow.svg";

export default function NewGroup({ state, setState, contactList, newGroup }) {
    const refGeneralContainer = useRef(null);
    const refContainerUsers = useRef(null);
    const refContainerData = useRef(null);
    const refButtonNextStep = useRef(null);
    const refButtonCreate = useRef(null);
    const refHandlerTimeout = useRef({
        users: setTimeout(() => {}, 0),
        data: setTimeout(() => {}, 0),
        nextButton: setTimeout(() => {}, 0),
        createButton: setTimeout(() => {}, 0),
        generalContainer: setTimeout(() => {}, 0),
    });
    const [listToAdd, setListToAdd] = useState([]);

    useEffect(() => {
        return () => {
            clearTimeout(refHandlerTimeout.current.users);
            clearTimeout(refHandlerTimeout.current.data);
            clearTimeout(refHandlerTimeout.current.next);
            clearTimeout(refHandlerTimeout.current.create);
            clearTimeout(refHandlerTimeout.current.generalContainer);
        };
    }, []);

    if (refContainerUsers.current) {
        if (state.second) {
            clearTimeout(refHandlerTimeout.current.data);
            enableContainer(refContainerData.current, true);
            enableContainer(refContainerUsers.current, false, "users");
            enableContainer(refButtonNextStep.current, false, "next");
        } else if (state.first) {
            clearTimeout(refHandlerTimeout.current.users);
            enableContainer(refGeneralContainer.current, true);
            enableContainer(refContainerUsers.current, true);
            enableContainer(refButtonNextStep.current, true);
            enableContainer(refContainerData.current, false, "data");
            enableContainer(refButtonCreate.current, false, "create");
        } else {
            enableContainer(refContainerUsers.current, false, "users");
            enableContainer(refButtonNextStep.current, false, "next");
            enableContainer(refContainerData.current, false, "data");
            enableContainer(refButtonCreate.current, false, "create");
            enableContainer(refGeneralContainer.current, false, "generalContainer");
        }
    }

    function enableContainer(element, flag, type) {
        element.style["visibility"] = flag ? "visible" : "hidden";
        element.style["opacity"] = flag ? 1 : 0;
        element.style["z-index"] = flag ? "1" : "-1";
        if (flag === false) {
            refHandlerTimeout.current[type] = setTimeout(() => {
                element.style["visibility"] = "hidden";
            }, 200);
        }
    }

    function handleNextStep(e) {
        e.preventDefault();
        const listArr = [];
        const formData = new FormData(e.currentTarget);
        for (const pair of formData.entries()) {
            if (pair[1] === "on") {
                listArr.push(pair[0]);
            }
        }
        setState({ first: true, second: true });
        setListToAdd(listArr);
    }

    function handleLastStep(e) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const groupName = formData.get("groupName");
        newGroup(listToAdd, groupName);
        setListToAdd([]);
        setState({ first: false, second: false });
    }

    function handleChangeGroupName(e) {
        const value = e.currentTarget.value;
        if (value) {
            enableContainer(refButtonCreate.current, true);
        } else {
            enableContainer(refButtonCreate.current, false, "create");
        }
    }

    const usersIdArr = chatUtils.getUsersId(contactList);
    return (
        <div className={styles.general} ref={refGeneralContainer}>
            <div className={styles.container} ref={refContainerUsers}>
                <form className={styles.form} onSubmit={handleNextStep}>
                    {usersIdArr.map((id) => {
                        const name = contactList[id].name;
                        return (
                            <Fragment key={id}>
                                <UserSelector name={name} id={id} />
                            </Fragment>
                        );
                    })}
                    <button className={styles.add} ref={refButtonNextStep}>
                        <img src={rightArrow} alt="helper button" />
                    </button>
                </form>
            </div>
            <div className={styles.container} ref={refContainerData}>
                <form className={styles.form} onSubmit={handleLastStep}>
                    <InputText
                        type={"text"}
                        name="groupName"
                        placeholder="Group name"
                        minLength={1}
                        maxLength={99}
                        handleOnChange={handleChangeGroupName}
                    />
                    <button className={styles.next} ref={refButtonCreate}>
                        <img src={rightArrow} alt="helper button" />
                    </button>
                </form>
            </div>
        </div>
    );
}

NewGroup.propTypes = {
    state: PropTypes.object.isRequired,
    setState: PropTypes.func.isRequired,
    contactList: PropTypes.object.isRequired,
    newGroup: PropTypes.func.isRequired,
};
