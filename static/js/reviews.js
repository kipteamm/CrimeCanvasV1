const reviewOverlay = document.querySelector('.review-overlay')
const reviewModal = document.querySelector('.review-modal');

let reviewedObject = null;
let reviewSection = 1;
let ratings = [];

function openReviewSection(objectID) {
    reviewModal.style.display = 'block';

    reviewOverlay.classList.add('active');

    reviewedObject = objectID
}

function closeReviewSection() {
    reviewModal.style.display = 'none';

    reviewOverlay.classList.remove('active')

    reviewModal.querySelector('textarea').value = '';
    ratings = [];
    reviewSection = 1;
    reviewedObject = null;
}

function nextSection() {
    console.log(reviewSection)

    const visibleSection = document.getElementById(`review-section-${reviewSection}`)
    const nextSection = document.getElementById(`review-section-${reviewSection + 1}`)

    visibleSection.style.marginLeft = "calc(var(--pdd) * -20)";
    nextSection.style.marginLeft = '0';

    setTimeout(() => {
        visibleSection.style.display = "none";
        nextSection.style.display = 'block';

        reviewSection ++;
    }, 100);
}

function setRating(rating, type) {
    nextSection();

    ratings.push(rating)
}

function showRating(rating, id) {
    const stars = document.getElementById(id).querySelectorAll('.fa-star');

    const isActive = '900';  // Use const to declare the variable

    for (let i = 0; i < stars.length; i++) {
        stars[i].style.fontWeight = i < rating ? isActive : 'normal';
    }
}

async function submitReview(button) {
    const url = `api/object/review`;

    review = button.parentNode.querySelector('textarea').value

    if (review === '') {
        review = null
    }

    const data = {
        id : reviewedObject,
        ratings : ratings,
        review : review
    }

    nextSection()

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
        nextSection()

        console.log(await response.json())

        /*
        setTimeout(() => {
            closeReviewSection()
            openReviewSection()

            return
        }, 3000);
        */
    }

    closeReviewSection()
}