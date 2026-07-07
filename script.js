const SUPABASE_URL = "https://xxblzfxzvclmuhnwoyvk.supabase.co";
const SUPABASE_KEY = "sb_publishable_pSkke6fICR5b0U2fAFF6Dw_N3ImOwYS";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let ALL_WORDS = [];
let successENFR = JSON.parse(localStorage.getItem("successENFR")) || [];
let successFREN = JSON.parse(localStorage.getItem("successFREN")) || [];

let currentENFR = null;
let currentFREN = null;

let isFlippedENFR = false;
let isFlippedFREN = false;

let sortDirection = 1;
let editingIndex = null; 

async function loadWordsFromCloud() {
    const { data, error } = await supabaseClient
        .from('words')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Erreur lors du chargement des mots:", error);
        return;
    }

    ALL_WORDS = data || [];
    refreshTable();
    
    const activePage = localStorage.getItem("currentPage") || "home";
    if (activePage === 'enfr') nextENFR();
    if (activePage === 'fren') nextFREN();
}

function saveLocalProgress() {
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

    cancelEdit(); 
    refreshTable();
    
    if (page === 'enfr') nextENFR();
    if (page === 'fren') nextFREN();
}

function refreshTable() {
    const body = document.getElementById("tableBody");
    body.innerHTML = "";

    ALL_WORDS.forEach((word, index) => {
        if (editingIndex === index) {
            body.innerHTML += `
            <tr>
                <td><input type="text" id="edit-en-${index}" class="table-input" value="${word.en}"></td>
                <td><input type="text" id="edit-fr-${index}" class="table-input" value="${word.fr}"></td>
                <td><input type="text" id="edit-desc-${index}" class="table-input" value="${word.description || ""}"></td>
                <td>
                    <button class="save-btn" onclick="saveEdit(${index}, ${word.id})">Enregistrer</button>
                    <button class="cancel-btn" onclick="cancelEdit()">Annuler</button>
                </td>
            </tr>
            `;
        } else {
            body.innerHTML += `
            <tr>
                <td>${word.en}</td>
                <td>${word.fr}</td>
                <td>${word.description || ""}</td>
                <td>
                    <button class="edit-btn" onclick="startEdit(${index})">Modifier</button>
                    <button class="delete-btn" onclick="deleteWord(${index}, ${word.id})">Supprimer</button>
                </td>
            </tr>
            `;
        }
    });

    document.getElementById("totalWords").textContent = ALL_WORDS.length;
    document.getElementById("totalWordsHome").textContent = ALL_WORDS.length;
}

function startEdit(index) {
    editingIndex = index;
    refreshTable();
}

function cancelEdit() {
    editingIndex = null;
    refreshTable();
}

async function saveEdit(index, id) {
    const newEn = document.getElementById(`edit-en-${index}`).value.trim();
    const newFr = document.getElementById(`edit-fr-${index}`).value.trim();
    const newDesc = document.getElementById(`edit-desc-${index}`).value.trim();

    if (!newEn || !newFr) {
        alert("Les champs Anglais et Français ne peuvent pas être vides.");
        return;
    }

    const { error } = await supabaseClient
        .from('words')
        .update({ en: newEn, fr: newFr, description: newDesc })
        .eq('id', id);

    if (error) {
        alert("Erreur lors de la modification");
        return;
    }

    const oldEn = ALL_WORDS[index].en;
    if (oldEn !== newEn && successENFR.includes(oldEn)) {
        successENFR = successENFR.map(w => w === oldEn ? newEn : w);
    }

    const oldFr = ALL_WORDS[index].fr;
    if (oldFr !== newFr && successFREN.includes(oldFr)) {
        successFREN = successFREN.map(w => w === oldFr ? newFr : w);
    }

    editingIndex = null;
    saveLocalProgress();
    await loadWordsFromCloud();
}

async function addWord() {
    const en = document.getElementById("newEnglish").value.trim();
    const fr = document.getElementById("newFrench").value.trim();
    const description = document.getElementById("newDescription").value.trim();

    if (!en || !fr) {
        alert("Complète les champs Anglais et Français");
        return;
    }

    const { error } = await supabaseClient
        .from('words')
        .insert([{ en, fr, description }]);

    if (error) {
        alert("Erreur lors de l'ajout du mot sur le serveur.");
        return;
    }

    document.getElementById("newEnglish").value = "";
    document.getElementById("newFrench").value = "";
    document.getElementById("newDescription").value = "";

    await loadWordsFromCloud();
}

async function deleteWord(index, id) {
    if (!confirm("Supprimer ce mot ?")) {
        return;
    }

    const { error } = await supabaseClient
        .from('words')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Erreur lors de la suppression.");
        return;
    }

    const wordToDelete = ALL_WORDS[index];
    successENFR = successENFR.filter(w => w !== wordToDelete.en);
    successFREN = successFREN.filter(w => w !== wordToDelete.fr);

    if (editingIndex === index) editingIndex = null;
    
    saveLocalProgress();
    await loadWordsFromCloud();
}

function sortTable(column) {
    editingIndex = null;

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

// Les fonctions flipENFR, successCard, wrongCard, nextFREN, flipFREN, successCardFR, wrongCardFR et resetProgress restent strictement identiques...
function flipENFR() {
    if (!currentENFR) return;
    isFlippedENFR = !isFlippedENFR;
    document.getElementById("card-enfr-inner").classList.toggle("is-flipped");
}

function successCard() {
    if (!currentENFR) return;
    if (!successENFR.includes(currentENFR.en)) {
        successENFR.push(currentENFR.en);
        saveLocalProgress();
    }
    nextENFR();
}

function wrongCard() { nextENFR(); }

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
        saveLocalProgress();
    }
    nextFREN();
}

function wrongCardFR() { nextFREN(); }

function resetProgress() {
    successENFR = [];
    successFREN = [];
    saveLocalProgress();
    nextENFR();
    nextFREN();
    alert("Progression réinitialisée");
}

loadWordsFromCloud();
const lastPage = localStorage.getItem("currentPage") || "home";
showPage(lastPage);
