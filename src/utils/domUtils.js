function getRelativePosition(point, object) {
    if (point < object.top) {
        return "top";
    } else if (point > object.bottom) {
        return "bottom";
    } else {
        return "in-between";
    }
}

function setMovementScrollBar(coord, scrollbar, messageContainer, position, direction, step) {
    // the timeinterval will only move in one direction
    const timerId = setInterval(() => {
        const box = scrollbar.getBoundingClientRect();
        // if cursor is on the same direction, we keep going
        // if cursor is inside or in the other direction, we stop
        const relativePosition = getRelativePosition(coord.coordY, box);
        if (relativePosition === position) {
            messageContainer.scrollTop = messageContainer.scrollTop + step * direction;
        }
    }, 250);
    return timerId;
}

export default { getRelativePosition, setMovementScrollBar };
