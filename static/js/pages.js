const content = document.querySelector('.page').querySelector('.page-content');
const header = document.querySelector('.header').querySelector('.content');

let page;

function updatePage(pageName) {
    page = pageName

    let newURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}?p=${page}`

    window.history.pushState({path : newURL}, '', newURL);
}

async function loadComponent(componentPath) {
    const response = await fetch(`/static/components/${componentPath}.html`);

    return await response.text();
}

async function loadAbout() {
    if (page === "about") {
        return
    }

    header.innerHTML = await loadComponent('about/header')
    content.innerHTML = await loadComponent('about/content')

    updatePage("about")
}

async function loadObjects(objectPage) {
    if (page === objectPage) {
        return
    }

    header.innerHTML = await loadComponent(`objects/${objectPage}_header`)
    content.innerHTML = '';

    updatePage(objectPage)

    getObjects(objectPage)
}

window.addEventListener('load', () => {
    const page = new URLSearchParams(window.location.search).get('p');

    if (page === "" || page === null) {
        loadObjects('all')
    } else if (page === "about") {
        loadAbout()
    } else {
        loadObjects(page)
    }
}, false);