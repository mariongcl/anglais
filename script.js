// Configuration de ta connexion Supabase
const SUPABASE_URL = "https://xxblzfxzvclmuhnwoyvk.supabase.co";
const SUPABASE_KEY = "sb_publishable_pSkke6fICR5b0U2fAFF6Dw_N3ImOwYS";

// Corrigé : on ne peut pas nommer le client "supabase" quand la librairie
// globale s'appelle déjà "supabase". "const supabase = supabase.createClient(...)"
// tente de lire la variable avant qu'elle soit initialisée -> ReferenceError
// dès la première ligne exécutée, qui bloque tout le reste du script (donc
// plus aucun bouton ne répond).
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Accès sécurisé au localStorage (progression + page courante) ---
// Si localStorage est bloqué (navigation privée, aperçu en iframe, etc.),
// on bascule sur un repli en mémoire au lieu de planter tout le script.
const memoryFallback = {};

function storageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn(`localStorage indisponible, repli en mémoire pour "${key}"`, e);
        return memoryFallback[key] ?? null;
    }
}

function storageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`localStorage indisponible, sauvegarde en mémoire uniquement pour "${key}"`, e);
        memoryFallback[key] = value;
    }
}

let ALL_WORDS = [];

// Corrigé : la progression est maintenant indexée sur l'id stable du mot
// (fourni par Supabase) plutôt que sur son texte anglais/français. Avant,
// renommer un mot lui faisait perdre sa progression (ou la transférait
// vers un autre mot ayant le même texte).
let successENFR = JSON.parse(storageGet("successENFR")) || [];
let successFREN = JSON.parse(storageGet("successFREN")) || [];

let currentENFR = null;
let currentFREN = null;

let isFlippedENFR = false;
let isFlippedFREN = false;

let sortColumn = null;
let sortDirection = 1;
let editingIndex = null;

// Charge l'ensemble des mots depuis la bdd Supabase
async function loadWordsFromCloud() {
    const { data, error } = await supabaseClient
        .from('words')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Erreur lors du chargement des mots:", error);
        alert("Impossible de charger les mots depuis le serveur.");
        return;
    }

    ALL_WORDS = data || [];
    refreshTable();

    const activePage = storageGet("currentPage") || "home";
    if (activePage === 'enfr') nextENFR();
    if (activePage === 'fren') nextFREN();
}

function saveLocalProgress() {
    storageSet("successENFR", JSON.stringify(successENFR));
    storageSet("successFREN", JSON.stringify(successFREN));
}

function showPage(page) {
    document.getElementById("home-page").classList.add("hidden");
    document.getElementById("list-page").classList.add("hidden");
    document.getElementById("enfr-page").classList.add("hidden");
    document.getElementById("fren-page").classList.add("hidden");

    document.getElementById(page + "-page").classList.remove("hidden");

    storageSet("currentPage", page);

    cancelEdit();
    refreshTable();

    if (page === 'enfr') nextENFR();
    if (page === 'fren') nextFREN();
}

function refreshTable() {
    const body = document.getElementById("tableBody");
    body.innerHTML = "";

    // Corrigé : construction des lignes via le DOM plutôt que par
    // concaténation de chaînes HTML. Avant, un mot/id/description contenant
    // un guillemet, un tiret (cas des UUID Supabase) ou un caractère "<"
    // pouvait casser le HTML généré ou les attributs onclick.
    ALL_WORDS.forEach((word, index) => {
        const tr = document.createElement("tr");

        if (editingIndex === index) {
            tr.appendChild(makeEditableCell(`edit-en-${index}`, word.en));
            tr.appendChild(makeEditableCell(`edit-fr-${index}`, word.fr));
            tr.appendChild(makeEditableCell(`edit-desc-${index}`, word.description || ""));

            const tdAction = document.createElement("td");

            const saveBtn = document.createElement("button");
            saveBtn.type = "button";
            saveBtn.className = "save-btn";
            saveBtn.textContent = "Enregistrer";
            saveBtn.addEventListener("click", () => saveEdit(index, word.id));

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "cancel-btn";
            cancelBtn.textContent = "Annuler";
            cancelBtn.addEventListener("click", cancelEdit);

            tdAction.append(saveBtn, cancelBtn);
            tr.appendChild(tdAction);
        } else {
            const tdEn = document.createElement("td");
            tdEn.textContent = word.en;

            const tdFr = document.createElement("td");
            tdFr.textContent = word.fr;

            const tdDesc = document.createElement("td");
            tdDesc.textContent = word.description || "";

            const tdAction = document.createElement("td");

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "edit-btn";
            editBtn.textContent = "Modifier";
            editBtn.addEventListener("click", () => startEdit(index));

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "delete-btn";
            delBtn.textContent = "Supprimer";
            delBtn.addEventListener("click", () => deleteWord(index, word.id));

            tdAction.append(editBtn, delBtn);
            tr.append(tdEn, tdFr, tdDesc, tdAction);
        }

        body.appendChild(tr);
    });

    document.getElementById("totalWords").textContent = ALL_WORDS.length;
    document.getElementById("totalWordsHome").textContent = ALL_WORDS.length;
}

function makeEditableCell(id, value) {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.className = "table-input";
    input.value = value; // assignation via la propriété JS -> aucune injection HTML possible
    td.appendChild(input);
    return td;
}

function startEdit(index) {
    editingIndex = index;
    refreshTable();
}

function cancelEdit() {
    editingIndex = null;
    refreshTable();
}

// Modifie un mot sur Supabase
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

    // Plus besoin de remapper successENFR/successFREN à la main ici :
    // la progression suit l'id du mot, pas son texte, donc un renommage
    // ne casse plus rien.
    editingIndex = null;
    await loadWordsFromCloud();
}

// Ajoute un mot sur Supabase
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

// Supprime un mot sur Supabase
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

    // Nettoyage : on retire aussi l'id des listes de progression pour
    // éviter qu'il reste orphelin indéfiniment dans le localStorage.
    successENFR = successENFR.filter(x => x !== id);
    successFREN = successFREN.filter(x => x !== id);

    if (editingIndex === index) editingIndex = null;

    saveLocalProgress();
    await loadWordsFromCloud();
}

function sortTable(column) {
    editingIndex = null;

    // Corrigé : on n'inverse le sens du tri que si on reclique sur la
    // même colonne. Avant, la direction restait partagée entre toutes les
    // colonnes, ce qui donnait un tri décroissant surprenant au premier
    // clic sur une nouvelle colonne.
    if (sortColumn === column) {
        sortDirection *= -1;
    } else {
        sortColumn = column;
        sortDirection = 1;
    }

    ALL_WORDS.sort((a, b) => {
        let x = (a[column] || "").toLowerCase();
        let y = (b[column] || "").toLowerCase();

        if (x < y) return -1 * sortDirection;
        if (x > y) return 1 * sortDirection;
        return 0;
    });

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

    const remaining = ALL_WORDS.filter(w => !successENFR.includes(w.id));

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

    if (!successENFR.includes(currentENFR.id)) {
        successENFR.push(currentENFR.id);
        saveLocalProgress();
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

    const remaining = ALL_WORDS.filter(w => !successFREN.includes(w.id));

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

    if (!successFREN.includes(currentFREN.id)) {
        successFREN.push(currentFREN.id);
        saveLocalProgress();
    }
    nextFREN();
}

function wrongCardFR() {
    nextFREN();
}

function resetProgress() {
    successENFR = [];
    successFREN = [];
    saveLocalProgress();

    nextENFR();
    nextFREN();
    alert("Progression réinitialisée");
}

// Lancement au démarrage de la page
loadWordsFromCloud();
const lastPage = storageGet("currentPage") || "home";
showPage(lastPage);
