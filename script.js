let ALL_WORDS = localStorage.getItem("customWords") 
    ? JSON.parse(localStorage.getItem("customWords")) 
    : [];

let successENFR = JSON.parse(localStorage.getItem("successENFR")) || [];
let successFREN = JSON.parse(localStorage.getItem("successFREN")) || [];

let currentENFR = null;
let currentFREN = null;

let isFlippedENFR = false;
let isFlippedFREN = false;

let sortDirection = 1;

function save() {
    localStorage.setItem("customWords", JSON.stringify(ALL_WORDS));
    localStorage.setItem("successENFR", JSON.stringify(successENFR));
    localStorage.setItem("successFREN", JSON.stringify(successFREN));
}

function showPage(page) {
    document.getElementById("home-page").classList.add("hidden");
    document.getElementById("list-page").classList.add("hidden");
    document.getElementById("enfr-page").classList.add("hidden");
    document.getElementById("fren-page").classList.add("hidden");

    document.getElementById(page + "-page").classList.remove("hidden");

    localStorage.setItem("currentPage", page);

    refreshTable();
    
    if (page === 'enfr') nextENFR();
    if (page === 'fren') nextFREN();
}

function refreshTable() {
    const body = document.getElementById("tableBody");
    body.innerHTML = "";

    ALL_WORDS.forEach((word, index) => {
        body.innerHTML += `
        <tr>
            <td>${word.en}</td>
            <td>${word.fr}</td>
            <td>${word.description || ""}</td>
            <td>
                <button class="delete-btn" onclick="deleteWord(${index})">
                    🗑️
                </button>
            </td>
        </tr>
        `;
    });

    document.getElementById("totalWords").textContent = ALL_WORDS.length;
    document.getElementById("totalWordsHome").textContent = ALL_WORDS.length;
}

function addWord() {
    const en = document.getElementById("newEnglish").value.trim();
    const fr = document.getElementById("newFrench").value.trim();
    const description = document.getElementById("newDescription").value.trim();

    if (!en || !fr) {
        alert("Complète les champs Anglais et Français");
        return;
    }

    ALL_WORDS.push({ en, fr, description });
    save();
    refreshTable();

    document.getElementById("newEnglish").value = "";
    document.getElementById("newFrench").value = "";
    document.getElementById("newDescription").value = "";

    nextENFR();
    nextFREN();
}

function deleteWord(index) {
    if (!confirm("Supprimer ce mot ?")) {
        return;
    }

    ALL_WORDS.splice(index, 1);
    save();
    refreshTable();

    nextENFR();
    nextFREN();
}

function sortTable(column) {
    ALL_WORDS.sort((a, b) => {
        let x = (a[column] || "").toLowerCase();
        let y = (b[column] || "").toLowerCase();

        if (x < y) return -1 * sortDirection;
        if (x > y) return 1 * sortDirection;
        return 0;
    });

    sortDirection *= -1;
    refreshTable();
}

function nextENFR() {
    document.getElementById("card-enfr-inner").classList.remove("is-flipped");
    isFlippedENFR = false;

    if (ALL_WORDS.length === 0) {
        document.getElementById("left-enfr").textContent = "0";
        document.getElementById("right-enfr").textContent = "0";
        document.getElementById("card-enfr-text-front").textContent = "Dictionnaire vide";
        document.getElementById("card-enfr-text-back").textContent = "Ajoutez des mots";
        currentENFR = null;
        return;
    }

    const remaining = ALL_WORDS.filter(w => !successENFR.includes(w.en));

    document.getElementById("left-enfr").textContent = remaining.length;
    document.getElementById("right-enfr").textContent = successENFR.length;

    if (remaining.length === 0) {
        document.getElementById("card-enfr-text-front").textContent = "🎉 Terminé !";
        document.getElementById("card-enfr-text-back").textContent = "Bravo";
        currentENFR = null;
        return;
    }

    currentENFR = remaining[Math.floor(Math.random() * remaining.length)];
    document.getElementById("card-enfr-text-front").textContent = currentENFR.en;
    document.getElementById("card-enfr-text-back").textContent = currentENFR.fr;
}

function flipENFR() {
    if (!currentENFR) return;
    isFlippedENFR = !isFlippedENFR;
    document.getElementById("card-enfr-inner").classList.toggle("is-flipped");
}

function successCard() {
    if (!currentENFR) return;

    if (!successENFR.includes(currentENFR.en)) {
        successENFR.push(currentENFR.en);
        save();
    }
    nextENFR();
}

function wrongCard() {
    nextENFR();
}

function nextFREN() {
    document.getElementById("card-fren-inner").classList.remove("is-flipped");
    isFlippedFREN = false;

    if (ALL_WORDS.length === 0) {
        document.getElementById("left-fren").textContent = "0";
        document.getElementById("right-fren").textContent = "0";
        document.getElementById("card-fren-text-front").textContent = "Dictionnaire vide";
        document.getElementById("card-fren-text-back").textContent = "Ajoutez des mots";
        currentFREN = null;
        return;
    }

    const remaining = ALL_WORDS.filter(w => !successFREN.includes(w.fr));

    document.getElementById("left-fren").textContent = remaining.length;
    document.getElementById("right-fren").textContent = successFREN.length;

    if (remaining.length === 0) {
        document.getElementById("card-fren-text-front").textContent = "🎉 Terminé !";
        document.getElementById("card-fren-text-back").textContent = "Bravo";
        currentFREN = null;
        return;
    }

    currentFREN = remaining[Math.floor(Math.random() * remaining.length)];
    document.getElementById("card-fren-text-front").textContent = currentFREN.fr;
    document.getElementById("card-fren-text-back").textContent = currentFREN.en;
}

function flipFREN() {
    if (!currentFREN) return;
    isFlippedFREN = !isFlippedFREN;
    document.getElementById("card-fren-inner").classList.toggle("is-flipped");
}

function successCardFR() {
    if (!currentFREN) return;

    if (!successFREN.includes(currentFREN.fr)) {
        successFREN.push(currentFREN.fr);
        save();
    }
    nextFREN();
}

function wrongCardFR() {
    nextFREN();
}

function resetProgress() {
    successENFR = [];
    successFREN = [];
    save();

    nextENFR();
    nextFREN();
    alert("Progression réinitialisée");
}

refreshTable();
const lastPage = localStorage.getItem("currentPage") || "home";
showPage(lastPage);
