import { vi, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import validEntries from "../../validEntries";
import GroupChatRoom from "../../../src/components/GroupChatRoom.jsx";
import { dataManipulationUtils as dataManipulation } from "../../../src/utils/utils";
import userEvent from "@testing-library/user-event";

const groups = validEntries.groupList;
const username = validEntries.user.publicUsername;
const groupMessages = validEntries.groupMessages.valid;

// scrollIntoView is not defined in the jest module, so we define it here
window.HTMLElement.prototype.scrollIntoView = vi.fn;

describe("The component ", () => {
    it("should render the group id and the members number in the group", () => {
        groups.forEach((group) => {
            const groupName = group.name;
            const { unmount } = render(
                <GroupChatRoom
                    id={group.id}
                    name={groupName}
                    members={group.members}
                    messages={groupMessages}
                    handleOnSubmit={() => {}}
                    handleOnRender={() => {}}
                    username={username}
                />,
            );
            const div = screen.getByText(groupName, { exact: false });
            expect(div).toBeInTheDocument();
            unmount();
        });
    });

    it("should render only the names of the users who sent messages", () => {
        groups.forEach((group) => {
            const members = group.members;
            const messages = validEntries.groupMessages.valid[group.id].messages;
            const { unmount } = render(
                <GroupChatRoom
                    id={group.id}
                    name={group.name}
                    members={group.members}
                    messages={groupMessages}
                    handleOnSubmit={() => {}}
                    handleOnRender={() => {}}
                    username={username}
                />,
            );
            // let's check that all members that send message appear
            const membersToBeShown = {};
            for (const messageId in messages) {
                const author = messages[messageId].author;
                membersToBeShown[author] = true;
            }
            members.forEach((member) => {
                if (member !== username && membersToBeShown[member]) {
                    expect(screen.queryByText(member)).toBeInTheDocument();
                } else {
                    expect(screen.queryByText(member)).not.toBeInTheDocument();
                }
            });
            unmount();
        });
    });

    it("should have a double tick for the messages sent by the user that have been read by all the other users.", () => {
        groups.forEach((group) => {
            const members = group.members;
            const messages = validEntries.groupMessages.valid[group.id].messages;
            const { unmount } = render(
                <GroupChatRoom
                    id={group.id}
                    name={group.name}
                    members={group.members}
                    messages={groupMessages}
                    handleOnSubmit={() => {}}
                    handleOnRender={() => {}}
                    username={username}
                />,
            );
            for (const messageId in messages) {
                const message = messages[messageId];
                const imgRead = screen.queryByTestId(messageId).querySelector("img");
                if (message.author === username) {
                    expect(imgRead).toBeInTheDocument();
                    if (message.read.length === members.length - 1) {
                        expect(imgRead.src.includes("read")).toBeTruthy();
                    } else {
                        expect(imgRead.src.includes("notRead")).toBeTruthy();
                    }
                } else {
                    expect(imgRead).not.toBeInTheDocument();
                }
            }
            unmount();
        });
    });
});
