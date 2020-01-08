export function getAvaliableLanguagesFromCardsJsonList(cardsJsonList) {
    //Obtain the avaliable languages on the cardList
    let languages = cardsJsonList.map((cardJsonList) => {
        return cardJsonList["lang"]
    })

    return languages
}

export function getAvaliableSetsFromCardsJsonList(cardsJsonList) {
    let sets = cardsJsonList.map((cardJson) => {
        return cardJson['set_name']
    })
    return sets
}