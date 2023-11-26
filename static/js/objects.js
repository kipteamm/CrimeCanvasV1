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

function createObject(object) {
    const wrapper = document.createElement('div');

    let players = '';

    object.player_amounts.forEach(player => {
        players += `<span class="tag"><i class="fa-solid fa-users"></i>${player}</span>`
    })

    let languages = '';

    object.languages.forEach(language => {
        languages += '<img class="flag" src="/static/images/flags/' + language + '.svg">'
    })

    isWishlisted = 'regular'

    if (object.wishlisted) {
        isWishlisted = 'solid'
    }

    wrapper.id = object.id;
    wrapper.classList.add('object')
    wrapper.setAttribute('onclick', `viewObject('${object.id}')`)
    wrapper.innerHTML = `
        <div class="top">
            <img class="object-banner" src="/static/game/${object.id}/banner.jpg">

            <div class="image-overlay"></div>

            <div class="tags">
                ${players}<span class="tag"><i class="fa-solid fa-clock"></i>${generateTime(object.time)}</span><span class="tag">${object.age}</span>
            </div>
        </div>

        <div class="bottom">
            <h2>${object.title}</h2>
            <p>
                ${object.description}
            </p>

            <h3>Languages</h3>
            ${languages}

            <div class="actions">
                <span><i class="fa-solid fa-star"></i>${object.rating}</span>
                <span><i class="fa-${isWishlisted} fa-heart" onclick="wishlist('${object.id}')"></i></span>
            </div>
        </div>
    `

    return wrapper
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

async function getObjects(objectPage) {
    const objects = await getFromApi(`/api/objects/${objectPage}`)

    objects.objects.forEach(object => {
        content.appendChild(createObject(object))
    });
}

const preview = document.querySelector('.object-preview');
const overlay = document.querySelector('.dark-overlay');

let currentObject = null;

async function viewObject(objectID) {
    preview.style.bottom = '0';

    overlay.classList.add('active')

    document.body.style.overflowY = 'hidden';

    if (currentObject === objectID) {
        return   
    }

    preview.id = `${objectID}-preview`;

    currentObject = objectID

    const objectData = await getFromApi(`/api/object/${objectID}/`)

    preview.querySelector('.object-banner').src = `/static/game/${objectData.id}/banner.jpg`

    writeReview = ''

    if (objectData.owned && !objectData.reviewed) {
        writeReview = `<button class="primary" onclick="openReviewSection('${objectData.id}')">Write a review</button>`
    }

    preview.querySelector('.object-content').innerHTML = `
        <h1>${objectData.title}</h1>
        <p>${objectData.description}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</p>

        <h3>Specifications</h3>
        <ul>
            <li>
                Recommended age: ${objectData.age}
                <span>The recommended age is based on story difficulty and story themes.</span>
            </li>
            <li>Average time playing: ${generateTime(objectData.time)}</li>
            <li>Themes: ${objectData.themes.join(', ')}.</li>
        </ul>

        <h3>Includes</h3>
        <ul>
            <li>Includes a full setup guide.</li>
            <li>Includes a set of rules.</li>
            <li>Includes all files needed to set the game up.</li>
        </ul>

        <h3>Reviews (${objectData.rating.reviews})</h3>
        <div class="reviews">
            <div class="rating">
                ${generateRating(objectData.rating.total, 'Total')}
            </div>
            <div class="rating">
                ${generateRating(objectData.rating.story, 'Story')}
            </div>
            <div class="rating">
                ${generateRating(objectData.rating.gameplay, 'Gameplay')}
            </div>
            <div class="rating">
                ${generateRating(objectData.rating.difficulty, 'Difficulty')}
            </div>
            <div class="rating">
                ${generateRating(objectData.rating.enjoyment, 'Enjoyment')}
            </div>
            ${writeReview}

            <div class="review-section"></div>
        </div>
    `

    let players = '';
    let languages = '';

    objectData.player_amounts.forEach(player => {
        players += generateOption(player, players === '')
    });

    objectData.languages.forEach(language => {
        languages += generateOption(`<img src="/static/images/flags/${language}.svg">`, languages === '')
    });

    isWishlisted = 'Wishlist'

    if (objectData.wishlisted) {
        isWishlisted = 'Remove wishlist'
    }

    buyButton = `<button class="primary buy-button" onclick="addToCart('${objectData.id}')">Add to cart</button>`

    if (objectData.owned) {
        buyButton = `<button class="primary buy-button" onclick="loadObjects('collection')">Owned${page === 'collection' ? '' : ' (see collection)'}</button>`
    } else if (page === 'testing') {
        buyButton = `<button class="primary buy-button" onclick="test('${objectData.id}')">Test</button>`
    }

    preview.querySelector('.object-actions').innerHTML = `
        <h3>€<span id="price">10</span> EUR</h3> 

        <h3>Players</h3>
        <div class="radio-options">
            ${players}
        </div>

        <h3>Languages</h3>
        <div class="radio-options">
            ${languages}
        </div>
        
        ${buyButton}
        <button class="secondary" onclick="wishlist('${objectData.id}')">${isWishlisted}</button>
    `

    const reviewSection = preview.querySelector('.review-section');
    const reviewsData = await getFromApi(`/api/object/${objectID}/reviews`)

    reviewsData.reviews.forEach((review) => {
        reviewSection.innerHTML += `
            <div class="review">
                <p>
                    ${generateScore(review.total)}・${generateRelativeTimestamp(review.creation_timestamp)}
                </p>
                <p>
                    ${review.review}
                </p>
            </div>
        `
    });
}

function closePreview() {
    preview.style.bottom = '-100vh';
    overlay.classList.remove('active')
    document.body.style.overflowY = 'scroll'
}

function generateOption(option, active) {
    let isActive = ''

    if (active) {
        isActive = ' active'
    }

    return `
    <div class="radio-container${isActive}" onclick="selectOption(this)">
        ${option}
    </div>
    `
}

function selectOption(elm) {
    elm.parentNode.querySelector('.active').classList.remove('active')

    elm.classList.add('active')
}

async function wishlist(objectID) {
    const url = `api/object/toggle-wishlist`;

    const data = {
        id : objectID
    }

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
            "Authorization": getCookie("au_id"),
            'X-CSRFToken': document.cookie.match(/csrftoken=([^ ;]+)/)[1],
        },
    });

    if (!response.ok) { 
        return
    }

    const object = document.getElementById(objectID)

    const wishlistIndicator = object.querySelector('.fa-heart')

    if (wishlistIndicator.classList.contains('fa-regular')) {
        wishlistIndicator.classList.remove('fa-regular')
        wishlistIndicator.classList.add('fa-solid')
    } else {
        wishlistIndicator.classList.remove('fa-solid')
        wishlistIndicator.classList.add('fa-regular')
    }

    const previewWishlistIndicator = preview.querySelector('button.secondary')

    console.log(previewWishlistIndicator.innerText)

    if (previewWishlistIndicator.innerText === 'Wishlist') {
        previewWishlistIndicator.innerText = 'Remove wishlist'
    } else {
        previewWishlistIndicator.innerText = 'Wishlist'
    }
}

function generateRating(rating, type) {
    stars = ''

    for (var i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fa fa-solid fa-star"></i>'
        } else {
            stars += '<i class="fa fa-regular fa-star"></i>'
        }
    }

    return `
        <span>${type}</span>
        <span>${stars}</span>
    `
}

async function test(objectID) {
    const url = `api/object/test`;

    const data = {
        id : objectID
    }

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
            "Authorization": getCookie("au_id"),
            'X-CSRFToken': document.cookie.match(/csrftoken=([^ ;]+)/)[1],
        },
    });

    if (!response.ok) { 
        return
    }

    const buyButton = document.getElementById(objectID).querySelector('.buy-button')

    buyButton.innerText = 'Owned (see collection)'
    buyButton.setAttribute('onclick', 'loadObjects("collection")')
}

function generateScore(total) {
    const adjectiveRanges = [
        { min: 0, max: 1, adjective: "Really Bad" },
        { min: 1, max: 1.5, adjective: "Bad" },
        { min: 1.5, max: 2, adjective: "Below Average" },
        { min: 2, max: 2.5, adjective: "Average" },
        { min: 2.5, max: 3, adjective: "Above Average" },
        { min: 3, max: 3.5, adjective: "Good" },
        { min: 3.5, max: 4, adjective: "Very Good" },
        { min: 4, max: 4.25, adjective: "Excellent" },
        { min: 4.25, max: 4.5, adjective: "Outstanding" },
        { min: 4.5, max: 5, adjective: "Exceptional" }
    ];

    for (const range of adjectiveRanges) {
        if (total >= range.min && total < range.max) {
            return range.adjective;
        }
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
