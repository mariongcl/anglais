let customWords =
JSON.parse(localStorage.getItem("customWords"));

let ALL_WORDS =
customWords && customWords.length
    ? customWords
    : [...WORDS];

let successENFR =
JSON.parse(localStorage.getItem("successENFR")) || [];

let successFREN =
JSON.parse(localStorage.getItem("successFREN")) || [];

let currentENFR = null;
let currentFREN = null;

let isFlippedENFR = false;
let isFlippedFREN = false;

let sortDirection = 1;

function save(){

    localStorage.setItem(
        "customWords",
        JSON.stringify(ALL_WORDS)
    );

    localStorage.setItem(
        "successENFR",
        JSON.stringify(successENFR)
    );

    localStorage.setItem(
        "successFREN",
        JSON.stringify(successFREN)
    );
}

function showPage(page){

    document.getElementById("home-page").classList.add("hidden");
    document.getElementById("list-page").classList.add("hidden");
    document.getElementById("enfr-page").classList.add("hidden");
    document.getElementById("fren-page").classList.add("hidden");

    document.getElementById(page + "-page")
        .classList.remove("hidden");

    localStorage.setItem("currentPage", page);

    refreshTable();
}

function refreshTable(){

    const body =
    document.getElementById("tableBody");

    body.innerHTML = "";

    ALL_WORDS.forEach((word,index)=>{

        body.innerHTML += `
        <tr>
            <td>${word.en}</td>
            <td>${word.fr}</td>
            <td>${word.description || ""}</td>
            <td>
                <button
                    class="delete-btn"
                    onclick="deleteWord(${index})">
                    🗑️
                </button>
            </td>
        </tr>
        `;
    });

    document.getElementById("totalWords").textContent =
    ALL_WORDS.length;

    document.getElementById("totalWordsHome").textContent =
    ALL_WORDS.length;
}

function addWord(){

    const en =
    document.getElementById("newEnglish").value.trim();

    const fr =
    document.getElementById("newFrench").value.trim();

    const description =
    document.getElementById("newDescription").value.trim();

    if(!en || !fr){
        alert("Complète les champs");
        return;
    }

    ALL_WORDS.push({
        en,
        fr,
        description
    });

    save();

    refreshTable();

    document.getElementById("newEnglish").value="";
    document.getElementById("newFrench").value="";
    document.getElementById("newDescription").value="";

    nextENFR();
    nextFREN();
}

function deleteWord(index){

    if(!confirm("Supprimer ce mot ?")){
        return;
    }

    ALL_WORDS.splice(index,1);

    save();

    refreshTable();

    nextENFR();
    nextFREN();
}

function sortTable(column){

    ALL_WORDS.sort((a,b)=>{

        let x =
        (a[column] || "").toLowerCase();

        let y =
        (b[column] || "").toLowerCase();

        if(x < y) return -1 * sortDirection;
        if(x > y) return 1 * sortDirection;

        return 0;
    });

    sortDirection *= -1;

    refreshTable();
}

function nextENFR(){

    const remaining =
    ALL_WORDS.filter(
        w => !successENFR.includes(w.en)
    );

    document.getElementById("left-enfr").textContent =
    remaining.length;

    document.getElementById("right-enfr").textContent =
    successENFR.length;

    if(remaining.length === 0){

        document.getElementById("card-enfr-text")
        .textContent =
        "🎉 Toutes les cartes sont apprises";

        return;
    }

    currentENFR =
    remaining[Math.floor(Math.random()*remaining.length)];

    isFlippedENFR=false;

    document.getElementById("card-enfr-text")
    .textContent =
    currentENFR.en;
}

function flipENFR(){

    if(!currentENFR) return;

    isFlippedENFR=!isFlippedENFR;

    document.getElementById("card-enfr-text")
    .textContent =
    isFlippedENFR
    ? currentENFR.fr
    : currentENFR.en;
}

function successCard(){

    if(!successENFR.includes(currentENFR.en)){
        successENFR.push(currentENFR.en);
        save();
    }

    nextENFR();
}

function wrongCard(){
    nextENFR();
}

function nextFREN(){

    const remaining =
    ALL_WORDS.filter(
        w => !successFREN.includes(w.fr)
    );

    document.getElementById("left-fren").textContent =
    remaining.length;

    document.getElementById("right-fren").textContent =
    successFREN.length;

    if(remaining.length === 0){

        document.getElementById("card-fren-text")
        .textContent =
        "🎉 Toutes les cartes sont apprises";

        return;
    }

    currentFREN =
    remaining[Math.floor(Math.random()*remaining.length)];

    isFlippedFREN=false;

    document.getElementById("card-fren-text")
    .textContent =
    currentFREN.fr;
}

function flipFREN(){

    if(!currentFREN) return;

    isFlippedFREN=!isFlippedFREN;

    document.getElementById("card-fren-text")
    .textContent =
    isFlippedFREN
    ? currentFREN.en
    : currentFREN.fr;
}

function successCardFR(){

    if(!successFREN.includes(currentFREN.fr)){
        successFREN.push(currentFREN.fr);
        save();
    }

    nextFREN();
}

function wrongCardFR(){
    nextFREN();
}

function resetProgress(){

    successENFR=[];
    successFREN=[];

    save();

    nextENFR();
    nextFREN();

    alert("Progression réinitialisée");
}

refreshTable();
nextENFR();
nextFREN();

const lastPage =
localStorage.getItem("currentPage") || "home";

showPage(lastPage);
