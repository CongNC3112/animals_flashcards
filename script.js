let data = null;
let currentGroup = null;
let currentIndex = 0;
let startY = 0;

/* ===== LOAD JSON ===== */
fetch("data.json")
    .then(res => res.json())
    .then(json => {
        data = json;
        renderGroups();
    });

function debounce(fn, delay = 200) {
    let timeoutId;

    return function (...args) {
        this.disabled = true;

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
            this.disabled = false;
        }, delay);
    };
}

/* ===== RENDER GROUPS ===== */
function renderGroups() {
    const container = document.getElementById("groupScreen");
    container.innerHTML = "";

    data.groups.forEach(group => {
        container.innerHTML += `
    <div onclick="openGroup('${group.id}')"
        class="bg-white rounded-xl shadow-lg cursor-pointer hover:scale-105 transition
                aspect-[3/4] w-full flex flex-col">

        <div class="w-full aspect-square">
            <img src="${group.image}"
                class="w-full h-full object-contain">
        </div>

        <div class="flex-1 flex items-center justify-center">
            <p class="font-bold text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl">${group.name}</p>
        </div>

    </div>
`;
        // container.innerHTML += `
        //   <div onclick="openGroup('${group.id}')"
        //       class="w-36 lg:w-72 2xl:w-144 h-48 lg:h-96 2xl:192 bg-white rounded-xl shadow-lg cursor-pointer hover:scale-105 transition">
        //     <img src="${group.image}"
        //         class="w-full h-36 lg:h-72 2xl:h-144 object-cover rounded-t-xl">
        //     <p class="text-center font-bold mt-2">${group.name}</p>
        //   </div>
        // `;
    });
}

/* ===== OPEN FLASHCARDS ===== */
function openGroup(groupId) {
    currentGroup = data.groups.find(g => g.id === groupId);
    currentIndex = 0;

    document.getElementById("groupScreen").classList.add("hidden");
    document.getElementById("flashcardScreen").classList.remove("hidden");
    updateFlashcard();
}

const clickFlipCard = debounce(flipCard);
function flipCard() {    
    let flashcard = document.getElementById("flip-card-inner");
    flashcard.classList.toggle('[transform:rotateY(180deg)]');
    
    let iframe = document.getElementById("flashVideo").contentWindow;
    if (flashcard.classList.contains('[transform:rotateY(180deg)]')) {
        iframe.postMessage('{"event":"command","func":"playVideo","args":""}',"*");
    } else {
        iframe.postMessage('{"event":"command","func":"stopVideo","args":""}',"*");
    }
}


/* ===== UPDATE FLASHCARD ===== */
function updateFlashcard() {
    const mainImage = document.getElementById("flashImg");
    mainImage.classList.add("hidden");
    document.getElementById("loading").classList.remove("hidden");

    const card = currentGroup.flashcards[currentIndex];    
    document.getElementById("flashVideo").src = "https://www.youtube.com/embed/" + card.video + "?enablejsapi=1";
    document.getElementById("flashTitle").textContent = card.titleVi;
    document.getElementById("ipa").textContent = "";

    const progress = ((currentIndex + 1) / currentGroup.flashcards.length) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
    
    mainImage.onload = function() {
        document.getElementById("loading").classList.add("hidden");
        mainImage.classList.remove("hidden");
    };
    mainImage.src = card.image;
}

/* ===== SWIPE ===== */
const clickSwipeRight = debounce(swipeRight);
function swipeRight() {
    let flashcard = document.getElementById("flip-card-inner");
    if (flashcard.classList.contains('[transform:rotateY(180deg)]')) {
        flipCard();
    }

    const total = currentGroup.flashcards.length;
    const cardEl = document.getElementById("flashcard");

    cardEl.style.transform = "translateY(-100%)";
    cardEl.style.opacity = "0";
    setTimeout(() => {
        currentIndex = (currentIndex + 1) % total;
        updateFlashcard();
        cardEl.style.transform = "translateY(100%)";
        cardEl.style.opacity = "0";
        setTimeout(() => {
            cardEl.style.transform = "translateY(0)";
            cardEl.style.opacity = "1";
        }, 50);
    }, 300);
}

// function handleSwipe(distance) {
//   const total = currentGroup.flashcards.length;
//   const cardEl = document.getElementById("flashcard");
//   let transformStep1 = '';
//   let transformStep2 = '';
//   let index = 0;

//   if (distance < -50) {
//     // Swipe up
//     transformStep1 = "translateY(-100%)";
//     transformStep2 = "translateY(100%)";
//     index = (currentIndex + 1) % total;
//   } else if (distance > 50) {
//     // Swipe down
//     transformStep1 = "translateY(100%)";
//     transformStep2 = "translateY(-100%)";
//     index = (currentIndex - 1 + total) % total;
//   }

//   cardEl.style.transform = transformStep1;
//     cardEl.style.opacity = "0";
//     setTimeout(() => {
//       currentIndex = index;
//       updateFlashcard();
//       cardEl.style.transform = transformStep2;
//       cardEl.style.opacity = "0";
//       setTimeout(() => {
//         cardEl.style.transform = "translateY(0)";
//         cardEl.style.opacity = "1";
//       }, 50);
//     }, 300);
// }

// // Swipe/touch handlers
// const screen = document.getElementById("flip-card-inner");
// screen.addEventListener("touchstart", e => startY = e.touches[0].clientY);
// screen.addEventListener("touchend", e => handleSwipe(e.changedTouches[0].clientY - startY));
// screen.addEventListener("mousedown", e => startX = e.clientY);
// screen.addEventListener("mouseup", e => handleSwipe(e.clientY - startY));

/* ===== SPEECH ===== */
const clickSpeechVi = debounce(() => { speech('vi-VN') });
const clickSpeechEn = debounce(() => { speech('en-US') });

function speech(lang) {
    const card = currentGroup.flashcards[currentIndex];
    document.getElementById("flashTitle").textContent = lang.startsWith('vi') ? card.titleVi : card.titleEn;
    document.getElementById("ipa").textContent = lang.startsWith('vi') ? '' : card.ipa;

    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(document.getElementById("flashTitle").textContent);
    u.lang = lang;
    // u.pitch = 2;
    u.rate = lang.startsWith('vi') ? 0.85 : 0.8;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}

/* ===== GO BACK ===== */
const goBack = () => {
    let flashcard = document.getElementById("flip-card-inner");
    if (flashcard.classList.contains('[transform:rotateY(180deg)]')) {
        flipCard();
    }

    document.getElementById("flashcardScreen").classList.add("hidden");
    document.getElementById("groupScreen").classList.remove("hidden");

}
