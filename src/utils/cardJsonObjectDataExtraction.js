import React from 'react';

export var getCardNameFromJson = (cardJson) => {
    if (cardJson['card_faces'] != null) {
        return cardJson['card_faces'][0]['name']
    } else {
        return cardJson['name']
    }
}

export var getCardImageUrlFromJson = (cardJson, imageQuality) => {
    if (cardJson === undefined) {
        return 'https://via.placeholder.com/488x680.png'
    }
    if (cardJson['card_faces'] != null) {
        return cardJson['card_faces'][0]['image_uris'][imageQuality]
    } else if (cardJson['image_uris'] != null) {
        return cardJson['image_uris'][imageQuality]
    }
    return 'https://via.placeholder.com/488x680.png'
}

export var getCardTypeFromJson = (cardJson) => {
    if (cardJson['card_faces'] != null) {
        return cardJson['card_faces'][0]['type_line']
    } else if (cardJson['type_line'] != null) {
        return cardJson['type_line']
    }
    return 'no_type'
}

export var getCardPriceFromJson = (cardJson) => {
    if (cardJson['prices'] == null) {
        return "0"
    } else {
        return cardJson['prices']['usd']
    }
}

export var getCardManaCostSymbols = (manaCost) => {
    if (manaCost == null) {
        return ''
    }
    let manaSymbolsText = manaCost.match(/\{([^}]+)\}/g)
    if (manaSymbolsText == null) {
        return ""
    }
    manaSymbolsText = manaSymbolsText.map((text) => {
        return text.replace('{', '').replace('}', '').replace('/', '')
    })

    let manaSymbols = manaSymbolsText.map((symbol, index) => {
        return (
            <abbr key={index} className={"card-symbol card-symbol-" + symbol}></abbr>
        )
    })

    return manaSymbols;
}

export var getColorsFromJson = (cardJson) => {
    let mana_cost = ''
    if (cardJson['card_faces'] != null) {
        mana_cost = cardJson['card_faces'][0]['mana_cost']
    } else if (cardJson['mana_cost'] != null) {
        mana_cost = cardJson['mana_cost']
    } else {
        mana_cost = ''
    }

    let colors = []
    //Check regular mana colors
    if (mana_cost.includes('{W}')) {
        colors.push('{W}')
    }
    if (mana_cost.includes('{U}')) {
        colors.push('{U}')
    }
    if (mana_cost.includes('{B}')) {
        colors.push('{B}')
    }
    if (mana_cost.includes('{R}')) {
        colors.push('{R}')
    }
    if (mana_cost.includes('{G}')) {
        colors.push('{G}')
    }
    return colors
}

