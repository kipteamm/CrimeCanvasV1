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

    wrapper.id = object.id;
    wrapper.classList.add('object')
    wrapper.setAttribute('onclick', `viewObject('${object.id}')`)
    wrapper.innerHTML = `
        <div class="top">
            <img class="object-banner" src="/static/game/${object.id}/banner.jpg">

            <div class="image-overlay"></div>

            <div class="tags">
                ${players}<span class="tag"><i class="fa-solid fa-clock"></i>${generateTime(object.time)}</span>
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
                <span><i class="fa-regular fa-heart"></i></span>
        </div>
    `

    return wrapper
}

function getObjects(objectPage) {
    fetch(`/api/objects/${objectPage}`).then(res => res.json()).then(json => {
        json.objects.forEach(object => {
            content.appendChild(createObject(object))
        });
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

    currentObject = objectID

    const response = await fetch(`/api/object/${objectID}`)

    if (!response.ok) {
        return
    }

    const object = await response.json()

    preview.querySelector('.object-banner').src = `/static/game/${object.id}/banner.jpg`

    preview.querySelector('.object-content').innerHTML = `
        <h1>${object.title}</h1>
        <p>${object.description}</p>
    `

    let players = '';
    let languages = '';

    object.player_amounts.forEach(player => {
        players += generateOption(player)
    });

    object.languages.forEach(language => {
        languages += generateOption(`<img src="/static/images/flags/${language}.svg">`)
    });

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
        
        <button class="primary">Add to cart</button>
    `
}

function closePreview() {
    preview.style.bottom = '-100vh';
    overlay.classList.remove('active')
    document.body.style.overflowY = 'scroll'
}

function generateOption(option) {
    return `
    <div class="radio-container">
        ${option}
    </div>
    `
}