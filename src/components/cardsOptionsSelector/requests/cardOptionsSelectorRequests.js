import Axios from "axios";

/**
 * fetch every card that shares the same oracle_id from the local DB
 * @param {string} oracleId - Unique id for each printed card, see https://mtg.gamepedia.com/Oracle
 * @returns {object} - Card Json object, it's structure is described at https://scryfall.com/docs/api/cards 
 */
export async function fetchCardsByOracleId(oracleId) {
    try {
        const response = await Axios.get("http://localhost:8000/api/" + oracleId)
        if (response === undefined || response['data'] === undefined) {
            throw Error('received null response from local server')
        }
        return response['data']
    } catch (err) {
        console.log(err.message)
        console.log("Could not access the local database")
        return []
    }
}

