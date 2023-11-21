function createObject(object) {
    const wrapper = document.createElement('div');

    wrapper.classList.add('object')
    wrapper.innerHTML = `
        <h1>${object.title}</h1>
        <p>
            ${object.description}
        </p>
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