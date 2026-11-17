////////////////////////////////////
//////////// GAME STATE ////////////
////////////////////////////////////

const gameColors = [
    {name:"Rood",color:"#ff3434",textColor:"#ffffff",emoji:"🔴"},
    {name:"Oranje",color:"#ff7834",textColor:"#ffffff",emoji:"🟠"},
    {name:"Geel",color:"#ffd634",textColor:"#ffffff",emoji:"🟡"},
    {name:"Groen",color:"#40d52c",textColor:"#ffffff",emoji:"🟢"},
    {name:"Blauw",color:"#343eff",textColor:"#ffffff",emoji:"🔵"},
    {name:"Paars",color:"#9d34ff",textColor:"#ffffff",emoji:"🟣"},
]
const gameColumns = 4
let gameRows = 12
let gameGokNr = 0
let gameOver = false
let gameHintNr = 0
let gameGokHistory = []
let gameHuidigeGok = []
let gameTarget = []
let gameFeedback = []
let gameFeedbackSorted = []

function resetGameState(){
    const moeilijkheid = document.querySelector("#moeilijkheid-select").value
    if (moeilijkheid == "makkelijk") gameRows = 12
    else if (moeilijkheid == "normaal") gameRows = 10
    else gameRows = 8

    gameGokNr = 0
    gameOver = false
    gameHintNr = 0
    gameGokHistory = []
    gameHuidigeGok = []
    gameTarget = []
    gameFeedback = []
    gameFeedbackSorted = []
}

function shuffleArray(array){
    return (array.map((f) => ({f,sort:Math.random()})).sort((a,b) => a.sort - b.sort).map(({f}) => f))
}

///////////////////////////////////////
//////////// DRAW FUNCTIES ////////////
///////////////////////////////////////

function drawGame(){
    const tabelHtml = []

    for (let y = 0; y < gameRows; y++){
        const rijHtml = []
        
        for (let x = 0; x < gameColumns; x++){
            if (y === gameGokNr){
                //kolom is huidige gok
                if (gameHuidigeGok[x] !== undefined){
                    const color = gameColors[gameHuidigeGok[x]]
                    rijHtml.push('<td class="cell" style="background-color: '+color.color+';"></td>')
                }else{
                    rijHtml.push('<td class="cell"></td>')
                }

            }else if (gameGokHistory[y] !== undefined){
                //kolom is al gegokt geweest
                const gok = gameGokHistory[y]
                if (gok[x] !== undefined){
                    const color = gameColors[gok[x]]
                    rijHtml.push('<td class="cell" style="background-color: '+color.color+';"></td>')
                }else{
                    rijHtml.push('<td class="cell"></td>')
                }

            }else{
                //kolom is nog leeg
                rijHtml.push('<td class="cell"></td>')
            }
        }

        //teken deze rij
        if (y === gameGokNr) tabelHtml.push('<tr class="actieve-rij">'+rijHtml.join("")+'</tr>')
        else tabelHtml.push('<tr>'+rijHtml.join("")+'</tr>')
    }

    //teken de volledige tabel
    const spelContainer = document.querySelector("#spel-container")
    spelContainer.innerHTML = '<p>Mastermind</p><table>'+tabelHtml.join("")+'</table>'
}

function drawFeedback(){
    const tabelHtml = []

    for (let y = 0; y < gameRows; y++){
        const rijHtml = []
        
        for (let x = 0; x < gameColumns; x++){
            if (gameFeedback[y] !== undefined && gameFeedback[y][x] !== undefined){
                const cellFeedbackType = gameFeedback[y][x]
                if (cellFeedbackType == 2){
                    //volledig juist
                    rijHtml.push('<td class="cell" style="background-color: #ff3434;"></td>')

                }else if (cellFeedbackType == 1){
                    //juist, verkeerde positie
                    rijHtml.push('<td class="cell" style="background-color: #dddddd;"></td>')

                }else{
                    //fout, komt niet voor in patroon
                    rijHtml.push('<td class="cell"></td>')
                }
            }else{
                rijHtml.push('<td class="cell"></td>')
            }
        }

        //teken deze rij
        tabelHtml.push('<tr>'+rijHtml.join("")+'</tr>')
    }

    //teken de volledige tabel
    const spelContainer = document.querySelector("#feedback-container")
    spelContainer.innerHTML = '<p>Feedback</p><table>'+tabelHtml.join("")+'</table>'
}

function drawCounters(){
    document.querySelector("#gok-teller").innerText = gameOver ? "Game Over!" : "Gok Nr. "+(gameGokNr+1).toString()+" van de "+gameRows.toString()
    document.querySelector("#hint-teller").innerText = "Aantal gebruikte hints: "+(gameHintNr).toString()
}

function drawDashboard(){
    const kleurKnoppen = document.querySelector("#kleur-knoppen")
    kleurKnoppen.innerHTML = ""
    for (let i = 0; i < gameColors.length; i++){
        const color = gameColors[i]
        kleurKnoppen.innerHTML += '<button class="kleur-knop" style="background-color: '+color.color+'; color: '+color.textColor+';" onClick="clickColor('+i+')">'+color.name+'</button>'
    }
}


////////////////////////////////////////
//////////// CLICK FUNCTIES ////////////
////////////////////////////////////////

/**@param {number} colorId */
function clickColor(colorId){
    if (gameOver) return
    if (gameHuidigeGok.length < gameColumns) gameHuidigeGok.push(colorId)
    drawGame()
}

function clickVerwijder(){
    if (gameOver) return
    if (gameHuidigeGok.length > 0) gameHuidigeGok.splice(gameHuidigeGok.length-1,1)
    drawGame()
}

function clickBevestig(){
    if (gameOver) return
    if (gameHuidigeGok.length !== gameColumns) return alert("Je moet "+gameColumns+" kleuren kiezen om je gok te bevestigen.")
    if (checkHuidigeGokBestaatAl()) return alert("Deze gok heb je al geprobeerd.")

    gameGokHistory.push(gameHuidigeGok)
    gameHuidigeGok = []
    generateFeedback()

    if (gameGokNr === (gameRows-1)){
        //laatste gok: check gewonnen of verloren
        gameOver = true
        if (checkIsSolutionCorrect()) alert("Proficiat! Je hebt de juiste reeks geraden in "+(gameGokNr+1)+" pogingen met "+gameHintNr+" hints.")
        else alert("Helaas! Je hebt niet de juiste reeks geraden.\nDe juiste oplossing was:\n"+getSolutionMessage())        
    
    }else if (checkIsSolutionCorrect()){
        //gewone gok
        gameOver = true
        alert("Proficiat! Je hebt de juiste reeks geraden in "+(gameGokNr+1)+" pogingen met "+gameHintNr+" hints.")
    }
    
    gameGokNr++
    drawCounters()
    drawGame()
    drawFeedback()
}

function clickHint(){
    if (gameOver || gameFeedbackSorted.length == 0 || gameGokHistory.length == 0) return
    const lastSortedFeedback = gameFeedbackSorted[gameFeedbackSorted.length-1]
    const lastColors = gameGokHistory[gameGokHistory.length-1]
    
    const randomIndex = Math.floor(Math.random() * lastColors.length)
    const randomColor = gameColors[lastColors[randomIndex]]
    const feedbackNr = lastSortedFeedback[randomIndex]
    const locatie = ["eerste","tweede","derde","vierde"][randomIndex]
    
    if (feedbackNr == 2) alert("De "+locatie+" kleur "+randomColor.name+" "+randomColor.emoji+" heeft een rood bolletje gekregen. (juiste plaats)")
    else if (feedbackNr == 1) alert("De "+locatie+" kleur "+randomColor.name+" "+randomColor.emoji+" heeft een wit bolletje gekregen. (foute plaats)")
    else alert("De "+locatie+" kleur "+randomColor.name+" "+randomColor.emoji+" heeft een zwart bolletje gekregen. (niet in het patroon)")

    gameHintNr++
    drawCounters()
}

function clickAutomatischInvullen(){
    const type = document.querySelector("#auto-select").value
    if (type == "dumb") autoGuessDumb()
    if (type == "smart") autoGuessSmart()
}

function autoGuessDumb(){
    if (gameOver || gameFeedbackSorted.length == 0 || gameGokHistory.length == 0) return
    const lastFeedback = [...gameFeedback[gameFeedback.length-1]]
    const lastColors = [...gameGokHistory[gameGokHistory.length-1]]
    
    const rood = lastFeedback.filter((f) => f == 2).length
    const wit = lastFeedback.filter((f) => f == 1).length
    const zwart = lastFeedback.filter((f) => f == 0).length

    if ((rood+wit) === 4){
        const randomColors = shuffleArray(lastColors)
        
        gameHuidigeGok = randomColors
        drawGame()
        alert("Er waren "+rood+" rode bolletjes en "+wit+" witte bolletjes, deze zetten we in een andere volgorde.")

    }else if ((rood+wit) === 3){
        const randomColors = shuffleArray(lastColors)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        
        gameHuidigeGok = randomColors
        drawGame()
        alert("Er waren "+rood+" rode bolletjes en "+wit+" witte bolletjes, deze zetten we in een andere volgorde.\nWe vervangen 1 kleur door een willekeurige andere kleur.")

    }else if ((rood+wit) === 2){
        const randomColors = shuffleArray(lastColors)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)

        gameHuidigeGok = randomColors
        drawGame()
        alert("Er waren "+rood+" rode bolletjes en "+wit+" witte bolletjes, deze zetten we in een andere volgorde.\nWe vervangen 2 kleuren door een willekeurige andere kleur.")


    }else if ((rood+wit) === 1){
        const randomColors = shuffleArray(lastColors)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        
        gameHuidigeGok = randomColors
        drawGame()
        alert("Er waren "+rood+" rode bolletjes en "+wit+" witte bolletjes, deze zetten we in een andere volgorde.\nWe vervangen 3 kleuren door een willekeurige andere kleur.")

    }else if ((rood+wit) === 0){
        const randomColors = [...lastColors]
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        randomColors[Math.floor(Math.random() * randomColors.length)] = Math.floor(Math.random() * gameColors.length)
        
        gameHuidigeGok = randomColors
        drawGame()
        alert("Er waren alleen zwarte bolletjes.\nWe vervangen alle kleuren door een willekeurige andere kleur.")

    }
}

function autoGuessSmart(){
    //het algoritme weet welke feedback bij welke kleur hoort,
    //dus misschien is dit een beetje cheaten
    if (gameOver || gameFeedbackSorted.length == 0 || gameGokHistory.length == 0) return
    const lastSortedFeedback = [...gameFeedbackSorted[gameFeedbackSorted.length-1]]
    const lastColors = [...gameGokHistory[gameGokHistory.length-1]]

    const correctColors = []
    const includedColors = []
    const invalidColors = []

    for (let i = 0; i < lastColors.length; i++){
        const color = lastColors[i]
        const feedback = lastSortedFeedback[i]

        if (feedback == 2) correctColors.push({color,location:i})
        if (feedback == 1) includedColors.push({color,location:i})
        if (feedback == 0) invalidColors.push(color)
    }

    const nieuweGok = new Array(gameColumns).fill(null)
    const uitleg = []

    //zet de correcte kleuren al op hun plaats
    for (const {location,color} of correctColors){
        nieuweGok[location] = color
        uitleg.push("Locatie "+(location+1)+" was rood, dus we laten deze staan.")
    }

    //zet de included kleuren op een willekeurige plaats
    for (const {color,location} of includedColors){
        //verkrijg alle lege indexes van de nieuwe gok, zonder de originele locatie
        const emptyIndexes = nieuweGok.reduce((collection,curr,index) => {
            if (curr === null && index !== location) collection.push(index)
            return collection
        },[])

        const randomIndex = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)]
        nieuweGok[randomIndex] = color
        uitleg.push("Locatie "+(location+1)+" was wit, dus deze verplaatsen we.")
    }

    //verkrijg alle kleuren die wel ingevuld mogen worden
    const validColors = [...gameColors.keys()].filter((color) => !invalidColors.includes(color))

    //vul de overige kleuren met een waarde die niet voorkomt in de "invalidColors"
    for (let i = 0; i < nieuweGok.length; i++){
        if (nieuweGok[i] === null){
            nieuweGok[i] = validColors[Math.floor(Math.random() * validColors.length)]
        }
    }
    if (invalidColors.length > 0) uitleg.push("De overige zwarte locaties vullen we aan met andere kleuren.")

    gameHuidigeGok = nieuweGok
    drawGame()

    alert(uitleg.join("\n"))
}

/**@param {null|number} lvl */
function clickReset(lvl){
    resetGameState()
    if (typeof lvl === "number") generateExamplePattern(lvl)
    else generatePattern()

    drawDashboard()
    drawCounters()
    drawGame()
    drawFeedback()
}

//////////////////////////////////////////////
//////////// SPEL LOGIC & INLADEN ////////////
//////////////////////////////////////////////

function generatePattern(){
    gameTarget = []
    for (let i = 0; i < gameColumns; i++){
        const colorId = Math.floor(Math.random() * gameColors.length)
        gameTarget.push(colorId)
    }
}

function generateExamplePattern(pattern){
    if (pattern == 1) gameTarget = ["Rood","Blauw","Groen","Geel"].map((color) => gameColors.findIndex((c) => c.name === color))
    else if (pattern == 2) gameTarget = ["Paars","Groen","Paars","Rood"].map((color) => gameColors.findIndex((c) => c.name === color))
    else if (pattern == 3) gameTarget = ["Geel","Blauw","Geel","Oranje"].map((color) => gameColors.findIndex((c) => c.name === color))
}

function generateFeedback(){
    for (let y = 0; y < gameGokHistory.length; y++){
        //check als de feedback voor deze kolom al bestaat
        if (gameFeedback[y] == undefined){
            const gok = [...gameGokHistory[y]]
            const target = [...gameTarget]
            const sortedFeedback = new Array(gameColumns).fill(0) //0 == fout/zwart

            //eerst volledig juist (2) checken
            for (let x = 0; x < gok.length; x++){
                if (target[x] === gok[x]){
                    sortedFeedback[x] = 2

                    //we zetten target[x] op 'null' om aan te geven dat deze kleur in de target al verwerkt is
                    //we zetten gok[x] op 'null' om te vermijden dat deze locatie in de volgende lus nog eens gecheckt wordt
                    target[x] = null
                    gok[x] = null
                }
            }

            //dan juist, verkeerde locatie (1) checken
            for (let x = 0; x < gok.length; x++){
                if (gok[x] !== null && target.includes(gok[x])){
                    sortedFeedback[x] = 1

                    //we zetten target[kleurIndex] op 'null' om aan te geven dat deze kleur in de target al verwerkt is
                    //we zetten gok[x] op 'null' om te vermijden dat deze locatie in de volgende lus nog eens gecheckt wordt
                    const indexOfColor = target.indexOf(gok[x])
                    target[indexOfColor] = null
                    gok[x] = null
                }
            }

            //zet gokFeedback in willekeurige volgorde
            const randomGokFeedback = shuffleArray(sortedFeedback)
            gameFeedbackSorted.push(sortedFeedback)
            gameFeedback.push(randomGokFeedback)
        }
    }
}

function checkHuidigeGokBestaatAl(){
    const gevondenGok = gameGokHistory.find((gok) => {
        let gokkenZijnGelijk = (gok.length === gameHuidigeGok.length)
        for (let i = 0; i < gameHuidigeGok.length; i++){
            if (gameHuidigeGok[i] !== gok[i]) gokkenZijnGelijk = false
        }
        return gokkenZijnGelijk
    })
    if (gevondenGok) return true
    else return false
}

function checkIsSolutionCorrect(){
    if (gameFeedback.length == 0) return false
    const lastFeedback = gameFeedback[gameFeedback.length-1]
    if (lastFeedback.length !== gameTarget.length) return false
    return lastFeedback.every((feedbackType) => feedbackType === 2)
}

function getSolutionMessage(){
    return gameTarget.map((colorId) => gameColors[colorId].name).join(", ") + " (" + gameTarget.map((colorId) => gameColors[colorId].emoji).join(", ") + ")"
}

document.addEventListener("DOMContentLoaded",() => {
    document.querySelector("#moeilijkheid-select").value = "makkelijk"
    clickReset(null)

    document.querySelector("#moeilijkheid-select").addEventListener("input",() => {
        clickReset(null)
    })
})

///////////////////////////////////
//////////// SHORTCUTS ////////////
///////////////////////////////////

document.addEventListener("keypress",(event) => {
    if (event.key == "Enter"){
        event.preventDefault()
        clickBevestig()
    }
})