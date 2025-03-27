import { vi, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import validEntries from "../../validEntries";
import ChatRoom from "../../../src/components/ChatRoom";
import { dataManipulationUtils as dataManipulation } from "../../../src/utils/utils";
import userEvent from "@testing-library/user-event";

const contacts = validEntries.contactList;
const username = validEntries.user.publicUsername;

// scrollIntoView is not defined in the jest module, so we define it here
window.HTMLElement.prototype.scrollIntoView = vi.fn;

describe("The component ", () => {
    it("should be rendered with an input text when the conversation starts.", () => {
        render(
            <ChatRoom
                messages={{}}
                handleOnSubmit={() => {}}
                handleOnRender={() => {}}
                username={username}
                target={contacts[0]}
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
                messages={{}}
                handleOnSubmit={() => {}}
                handleOnRender={() => {}}
                username={username}
            />,
        );
        expect(screen.getByText(target)).toBeInTheDocument();
    });

    it("should render the messages with a valid messages object.", () => {
        contacts.forEach((contact) => {
            const messages = validEntries.privateMessages.valid[contact];
            if (messages) {
                const { unmount } = render(
                    <ChatRoom
                        target={contact}
                        messages={messages}
                        handleOnSubmit={() => {}}
                        handleOnRender={() => {}}
                        username={username}
                    />,
                );
                const messagesArr = Object.values(messages);
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
                messages={{}}
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
                messages={{}}
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
        contacts.forEach((contact) => {
            const messages = validEntries.privateMessages.valid[contact];
            if (messages) {
                render(
                    <ChatRoom
                        target={contact}
                        messages={messages}
                        handleOnSubmit={() => {}}
                        handleOnRender={() => {}}
                        username={username}
                    />,
                );
                const messagesArr = Object.values(messages);
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
        contacts.forEach((contact) => {
            const messages = validEntries.privateMessages.valid[contact];
            if (messages) {
                const handleOnRender = vi.fn();
                render(
                    <ChatRoom
                        target={contact}
                        messages={messages}
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
