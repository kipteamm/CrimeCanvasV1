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
        players += generateOption(player, players === '', true)
    });

    objectData.languages.forEach(language => {
        languages += generateOption(`<img src="/static/images/flags/${language}.svg">`, languages === '', false)
    });

    isWishlisted = 'Wishlist'

    if (objectData.wishlisted) {
        isWishlisted = 'Remove wishlist'
    }

    buyButton = ''    

    if (objectData.owned) {
        buyButton = `<button class="primary buy-button" onclick="${page === 'collection' ? '' : "loadObjects('collection')"}">Owned${page === 'collection' ? '' : ' (see collection)'}</button>`
    }

    if (!objectData.tested) {
        if (buyButton === '') {
            buyButton = `<button class="primary buy-button" onclick="test('${objectData.id}')">Test</button>`
        }

        preview.querySelector('.object-actions').innerHTML = `
            ${buyButton}
           <button class="secondary" onclick="wishlist('${objectData.id}')">${isWishlisted}</button>
        `
    } else if (page === 'collection') {
        preview.querySelector('.object-actions').innerHTML = `
           <button class="primary" onclick="setup('${objectData.id}')">Setup</button>
        `
    } else {
        if (buyButton === '') {
            buyButton = `<button class="primary buy-button" onclick="addToCart('${objectData.id}')">Add to cart</button>`
        }

        preview.querySelector('.object-actions').innerHTML = `
            <h3>€<span id="price">${objectData.player_amounts[0]}</span> EUR</h3> 

            <h3>Players</h3>
            <div class="radio-options">
                ${players}
            </div>

            <h3>Languages</h3>
            <div class="radio-options languages">
                ${languages}
            </div>
            
            ${buyButton}
            <button class="secondary" onclick="wishlist('${objectData.id}')">${isWishlisted}</button>
        `
    }

    const reviewSection = preview.querySelector('.review-section');
    const reviewsData = await getFromApi(`/api/object/${objectID}/reviews`)

    reviewsData.reviews.forEach((review) => {
        reviewSection.innerHTML += `
            <div class="review">
                <p>
                    Their experience: ${generateScore(review.total)}・${generateRelativeTimestamp(review.creation_timestamp)}
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

function generateOption(option, active, isPlayerAmount) {
    return `
    <div class="radio-container${isPlayerAmount ? ' player' : ''}${active ? ' active': ''}" onclick="selectOption(this)">
        ${option}
    </div>
    `
}

function selectOption(elm) {
    elm.parentNode.querySelector('.active').classList.remove('active')

    elm.classList.add('active')

    if (elm.classList.contains('player')) {
        document.getElementById('price').innerText = elm.innerText;
    }
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
        { min: 4, max: 4.5, adjective: "Excellent" },
        { min: 4.5, max: 4.75, adjective: "Outstanding" },
        { min: 4.75, max: 5, adjective: "Exceptional" }
    ];

    for (const range of adjectiveRanges) {
        if (total >= range.min && total < range.max) {
            return range.adjective;
        }
    }
}

async function addToCart() {
    const url = `api/cart/add`;

    const data = {
        id : objectID,
        price : parseInt(document.getElementById('price').innerText),
        language : document.querySelector('.languages').querySelector('.active').id
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
        sendAlert('Failed to add to cart')

        return
    }
}