import PropTypes from "prop-types";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import styles from "./NewGroup.module.css";
import UserSelector from "./UserSelector.jsx";
import InputText from "./InputComp.jsx";
import { chatUtils } from "../utils/utils.js";
import rightArrow from "../assets/right_arrow.svg";
import SearchContacts from "./SearchContacts.jsx";

export default function NewGroup({ state, setState, contactList, newGroup }) {
    const refGeneralContainer = useRef(null);
    const refContainerUsers = useRef(null);
    const refContainerData = useRef(null);
    const refButtonNextStep = useRef(null);
    const refButtonCreate = useRef(null);
    const refHandlerTimeout = useRef(setTimeout(() => {}, 0));
    const [listToAdd, setListToAdd] = useState([]);
    const [isMounted, setIsMounted] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        return () => {
            clearTimeout(refHandlerTimeout.current.generalContainer);
        };
    }, []);

    useEffect(() => {
        if (state.first) {
            setIsMounted(true);
        }
        if (refContainerUsers.current) {
            if (state.second) {
                enableContainer(refContainerData.current, true);
                enableContainer(refButtonCreate.current, true);
                enableContainer(refContainerUsers.current, false);
                enableContainer(refButtonNextStep.current, false);
            } else if (state.first) {
                setIsMounted(true);
                clearTimeout(refHandlerTimeout.current);
                enableContainer(refGeneralContainer.current, true);
                enableContainer(refContainerUsers.current, true);
                enableContainer(refButtonNextStep.current, true);
                enableContainer(refContainerData.current, false);
                enableContainer(refButtonCreate.current, false);
            } else {
                enableContainer(refContainerUsers.current, false);
                enableContainer(refButtonNextStep.current, false);
                enableContainer(refContainerData.current, false);
                enableContainer(refButtonCreate.current, false);
                enableContainer(refGeneralContainer.current, false);
                refHandlerTimeout.current = setTimeout(() => setIsMounted(false), 500);
            }
        }
    }, [state.first, state.second, isMounted]);

    function enableContainer(element, flag) {
        element.style["opacity"] = flag ? 1 : 0;
        element.style["z-index"] = flag ? "1" : "-1";
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
            enableContainer(refButtonCreate.current, false);
        }
    }

    const usersIdArr = useMemo(() => chatUtils.getUsersId(contactList, search), [state, search]);

    return isMounted ? (
        <div className={styles.general} ref={refGeneralContainer}>
            <div className={styles.userListContainer} ref={refContainerUsers}>
                <SearchContacts value={search} setValue={setSearch} />
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
            <div className={styles.groupNameContainer} ref={refContainerData}>
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
    ) : null;
}

NewGroup.propTypes = {
    state: PropTypes.object.isRequired,
    setState: PropTypes.func.isRequired,
    contactList: PropTypes.object.isRequired,
    newGroup: PropTypes.func.isRequired,
};
