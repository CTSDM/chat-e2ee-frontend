import { vi, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import validEntries from "../../validEntries";
import ChatRoom from "../../../src/components/ChatRoom";
import { dataManipulationUtils as dataManipulation } from "../../../src/utils/utils";
import userEvent from "@testing-library/user-event";

const contacts = validEntries.contactList;
const username = validEntries.user.publicUsername;
const directMessages = validEntries.privateMessages.valid;

// scrollIntoView is not defined in the jest module, so we define it here
window.HTMLElement.prototype.scrollIntoView = vi.fn;

describe("The component ", () => {
    it("should be rendered with an input text when the conversation starts.", () => {
        const target = "empty";
        render(
            <ChatRoom
                messages={directMessages}
                handleOnSubmit={() => {}}
                handleOnRender={() => {}}
                username={username}
                target={target}
            />,
        );
        const form = screen.getByRole("form");
        expect(form).toBeInTheDocument();
    });

    it("should render the username the user is talking with.", () => {
        const target = contacts[0];
        render(
            <ChatRoom
                target={target}
                messages={directMessages}
                handleOnSubmit={() => {}}
                handleOnRender={() => {}}
                username={username}
            />,
        );
        expect(screen.getByText(target)).toBeInTheDocument();
    });

    it("should render the messages with a valid messages object.", () => {
        contacts.forEach((contactOriginalCase) => {
            const contact = contactOriginalCase.toLowerCase();
            if (directMessages[contact]) {
                const { unmount } = render(
                    <ChatRoom
                        target={contact}
                        messages={directMessages}
                        handleOnSubmit={() => {}}
                        handleOnRender={() => {}}
                        username={username}
                    />,
                );
                const messagesArr = Object.values(directMessages[contact].messages);
                messagesArr.forEach((message) => {
                    expect(screen.getByText(message.content)).toBeInTheDocument();
                    const dateFormatted = dataManipulation.getDateFormatted(message.createdAt);
                    expect(screen.getByText(dateFormatted)).toBeInTheDocument();
                });
                unmount();
            }
        });
    });

    it("should call the handler function when a message is sent.", async () => {
        const handleOnSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <ChatRoom
                target={contacts[0]}
                messages={directMessages}
                handleOnSubmit={handleOnSubmit}
                handleOnRender={() => {}}
                username={username}
            />,
        );
        const inputText = screen.getByRole("textbox");
        await user.type(inputText, "test");
        const button = screen.getByRole("button");
        await user.click(button);
        expect(handleOnSubmit).toHaveBeenCalledOnce();
    });

    it("should NOT call the handler function when an empty message is sent.", async () => {
        const handleOnSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <ChatRoom
                target={contacts[0]}
                messages={directMessages}
                handleOnSubmit={handleOnSubmit}
                handleOnRender={() => {}}
                username={username}
            />,
        );
        const button = screen.getByRole("button");
        await user.click(button);
        expect(handleOnSubmit).not.toHaveBeenCalled();
    });

    it("should have the corresponding classes according to sent/received messages.", () => {
        contacts.forEach((contactOriginalCase) => {
            const contact = contactOriginalCase.toLowerCase();
            if (directMessages[contact]) {
                render(
                    <ChatRoom
                        target={contact}
                        messages={directMessages}
                        handleOnSubmit={() => {}}
                        handleOnRender={() => {}}
                        username={username}
                    />,
                );
                const messagesArr = Object.values(directMessages[contact].messages);
                messagesArr.forEach((message) => {
                    const div = screen.getByText(message.content);
                    const container = div.parentNode;
                    if (message.author === username) {
                        expect(container.classList.value.includes("sender")).toBeTruthy();
                        expect(container.classList.value.includes("receiver")).toBeFalsy();
                    } else {
                        expect(container.classList.value.includes("sender")).toBeFalsy();
                        expect(container.classList.value.includes("receiver")).toBeTruthy();
                    }
                });
            }
        });
    });

    it("should call the function handleOnRender once", () => {
        contacts.forEach((contactOriginalCase) => {
            const contact = contactOriginalCase.toLowerCase();
            if (directMessages[contact]) {
                const handleOnRender = vi.fn();
                render(
                    <ChatRoom
                        target={contact}
                        messages={directMessages}
                        handleOnSubmit={() => {}}
                        handleOnRender={handleOnRender}
                        username={username}
                    />,
                );
                expect(handleOnRender).toHaveBeenCalledOnce();
            }
        });
    });
});
