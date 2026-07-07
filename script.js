const words = [
    {en:"Apple", fr:"Pomme"},
    {en:"Dog", fr:"Chien"},
    {en:"Cat", fr:"Chat"},
    {en:"House", fr:"Maison"},
    {en:"Book", fr:"Livre"},
    {en:"Water", fr:"Eau"},
    {en:"Car", fr:"Voiture"},
    {en:"School", fr:"École"},
    {en:"Friend", fr:"Ami"},
    {en:"Computer", fr:"Ordinateur"}
];

let index = 0;

const english = document.getElementById("english");
const french = document.getElementById("french");
const card = document.getElementById("card");

function displayWord() {
    english.textContent = words[index].en;
    french.textContent = words[index].fr;

    document.getElementById("current").textContent = index + 1;
    document.getElementById("total").textContent = words.length;

    card.classList.remove("flipped");
}

card.addEventListener("click", () => {
    card.classList.toggle("flipped");
});

function nextWord() {
    index++;

    if(index >= words.length){
        index = 0;
    }

    displayWord();
}

function shuffleWords() {
    words.sort(() => Math.random() - 0.5);
    index = 0;
    displayWord();
}

displayWord();
