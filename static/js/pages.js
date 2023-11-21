const content = document.querySelector('.page').querySelector('.content');
const header = document.querySelector('.header').querySelector('.content');

let page;

function newPage(pageName) {
    page = pageName

    let newURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}?p=${page}`

    window.history.pushState({path : newURL}, '', newURL);
}

function loadAbout() {
    if (page === "about") {
        return
    }

    newPage("about");

    fetch('/static/components/about/header.html').then(res => res.text()).then(text => {
        header.innerHTML = text;
    });

    fetch('/static/components/about/content.html').then(res => res.text()).then(text => {
        content.innerHTML = text;
    });
}

function loadObjects(objectPage) {
    if (page === objectPage) {
        return
    }

    fetch('/static/components/objects/header.html').then(res => res.text()).then(text => {
        header.innerHTML = text;
    });
    
    content.innerHTML = '';

    newPage(objectPage)

    getObjects(objectPage)
}

window.addEventListener('load', () => {
    const page = new URLSearchParams(window.location.search).get('p');

    if (page === "" || page === null) {
        loadObjects('all')
    } else if (page === "about") {
        loadAbout
    } else {
        loadObjects(page)
    }
}, false);