function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');

    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];

        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }

    return null;
}

function generateTime(minutes) {
    const hours = `${Math.floor(minutes / 60)}h`;
    const remainingMinutes = ` ${minutes % 60}m`;

    if (remainingMinutes === " 0m") {
        return hours
    } else {
        return hours + remainingMinutes
    }
}

function generateRelativeTimestamp(timestamp) {
    const secondsInMinute = 60;
    const secondsInHour = secondsInMinute * 60;
    const secondsInDay = secondsInHour * 24;
    const secondsInMonth = secondsInDay * 30;
    const secondsInYear = secondsInDay * 365;

    const now = Math.floor(Date.now() / 1000);
    const difference = now - timestamp;

    if (difference < 1) {
        return "Just now";
    }

    const timeUnits = [
        { value: secondsInYear, unit: "year" },
        { value: secondsInMonth, unit: "month" },
        { value: secondsInDay, unit: "day" },
        { value: secondsInHour, unit: "hour" },
        { value: secondsInMinute, unit: "minute" },
        { value: 1, unit: "second" },
    ];

    for (const { value, unit } of timeUnits) {
        const count = Math.floor(difference / value);

        if (count >= 1) {
            return count > 1 ? `${count} ${unit}s ago` : `${count} ${unit} ago`;
        }
    }

    return "Just now";
}

async function getFromApi(url) {
    let response;

    if (getCookie("au_id") !== null) {
        response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: getCookie("au_id"),
            },
        });
    } else {
        response = await fetch(url)
    }

    if (!response.ok) {
        return
    }

    return await response.json()
}