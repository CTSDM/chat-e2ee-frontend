import { vi, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import validEntries from "../../validEntries";
import ChatRoom from "../../../src/components/ChatRoom";
import { dataManipulationUtils as dataManipulation } from "../../../src/utils/utils";
import userEvent from "@testing-library/user-event";

const messages = validEntries.messages.valid;
const username = validEntries.messages.username;

// scrollIntoView is not defined in the jest module, so we define it here
window.HTMLElement.prototype.scrollIntoView = vi.fn;

describe("The component ", () => {
    it("should not render anything when the message is null", () => {
        render(<ChatRoom messages={null} handleOnSubmit={() => {}} username={username} />);
        const div = screen.queryByText(/\*/);
        expect(div).not.toBeInTheDocument();
    });

    it("should be rendered with an input text when the conversation starts.", () => {
        render(<ChatRoom messages={[]} handleOnSubmit={() => {}} username={username} />);
        const form = screen.getByRole("form");
        expect(form).toBeInTheDocument();
    });

    it("should render the messages with a valid messages array.", () => {
        render(<ChatRoom messages={messages} handleOnSubmit={() => {}} username={username} />);
        messages.forEach((message) => {
            expect(screen.getByText(message.content)).toBeInTheDocument();
            const dateFormatted = dataManipulation.getDateFormatted(message.createdAt);
            expect(screen.getByText(dateFormatted)).toBeInTheDocument();
        });
    });

    it("should call the handler function when a message is sent.", async () => {
        const handleOnSubmit = vi.fn();
        const user = userEvent.setup();
        render(<ChatRoom messages={[]} handleOnSubmit={handleOnSubmit} username={username} />);
        const inputText = screen.getByRole("textbox");
        await user.type(inputText, "test");
        const button = screen.getByRole("button");
        await user.click(button);
        expect(handleOnSubmit).toHaveBeenCalled();
    });

    it("should NOT call the handler function when an empty message is sent.", async () => {
        const handleOnSubmit = vi.fn();
        const user = userEvent.setup();
        render(<ChatRoom messages={[]} handleOnSubmit={handleOnSubmit} username={username} />);
        const button = screen.getByRole("button");
        await user.click(button);
        expect(handleOnSubmit).not.toHaveBeenCalled();
    });

    it("the messages sent/received by the user should have their respective classes.", () => {
        render(<ChatRoom messages={messages} handleOnSubmit={() => {}} username={username} />);
        messages.forEach((message) => {
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
    });
});
