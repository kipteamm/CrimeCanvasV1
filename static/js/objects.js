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
                <span><i class="fa-solid fa-star"></i>5.0</span>
                <span><i class="fa-${isWishlisted} fa-heart" onclick="wishlist('${object.id}')"></i></span>
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

    if (objectData.owned) {
        writeReview = '<button class="primary" onclick="openReviewSection()">Write a review</button>'
    }

    preview.querySelector('.object-content').innerHTML = `
        <h1>${objectData.title}</h1>
        <p>${objectData.description}</p>

        <h3>Specifications</h3>
        <ul>
            <li>
                Recommended age: ${objectData.age}
                <span>The recommended age is based on story difficulty and story themes.</span>
            </li>
            <li>Average time playing: ${generateTime(objectData.time)}</li>
            <li>Themes: ${objectData.themes.join(', ')}.</li>
            <li>Includes a full setup guide.</li>
            <li>Includes a set of rules.</li>
            <li>Includes all files needed to set the game up.</li>
        </ul>

        <h3>Reviews (${objectData.reviews.length})</h3>
        <div class="reviews">
            <div class="rating">
                ${generateRating(objectData.ratings.total, 'Total')}
            </div>
            <div class="rating">
                ${generateRating(objectData.ratings.story, 'Story')}
            </div>
            <div class="rating">
                ${generateRating(objectData.ratings.gameplay, 'Gameplay')}
            </div>
            <div class="rating">
                ${generateRating(objectData.ratings.difficulty, 'Difficulty')}
            </div>
            <div class="rating">
                ${generateRating(objectData.ratings.enjoyment, 'Enjoyment')}
            </div>
            ${writeReview}
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
        buyButton = `<button class="primary buy-button" onclick="loadObjects('collection')">Owned (see collection)</button>`
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