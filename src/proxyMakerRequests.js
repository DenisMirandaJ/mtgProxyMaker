import Axios from 'axios'

export class Request {
    constructor(delay) {
        this.delay = delay
        this.lastRequestDate = Date()
    }

    async fetchCardJsonData(cardName) {
        if (Date() - this.lastRequestDate <= 100) {
            let cardJson = await Axios.get('https://api.scryfall.com/?fuzzy=' + cardName)
            return cardJson
        }
        function fectchCardJsonDataLater(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }
}