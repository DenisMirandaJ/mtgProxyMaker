import React from 'react';
import { Card, Input, Label, Container, CardImg, CardImgOverlay, Row, Col, CardFooter } from 'reactstrap';
import { getCardImageUrlFromJson } from '../../utils/cardJsonObjectDataExtraction'
import { fetchCardsByOracleId } from './requests/cardOptionsSelectorRequests'
import { getAvaliableLanguagesFromCardsJsonList, getAvaliableSetsFromCardsJsonList } from './cardOptionsSelectorUtils'
import './cardOptionsSelector.css'

export class CardOptionsSelector extends React.Component {

    /**
     * @prop {string} props.oracleId - unique id of the card, see https://mtg.gamepedia.com/Oracle
     * @prop {string} props.lang   - desired output language, see https://scryfall.com/docs/api/languages
     * 
     * @state {object} state -- 
     */
    constructor(props) {
        super(props)

        //Arrays that hold the JSX <options> list for th intendedLanguageSelector and setSelector inputs
        this.avaliableLanguages = []
        this.avaliableSets = []

        //Refs for the current content of the intendedLanguageSelector and setSelector inputs
        this.setSelectorRef = React.createRef()
        this.languageSelectorRef = React.createRef()
        //default value for the language and set input selectors
        this.defaultLanguageOption = ""
        this.defaultSetOption = ""

        this.state = {
            cardsJson: [],
            currentSelectedCard: {},
            intendedLanguage: props.lang,
            set: "",
            fatalError: false
        }
    }

    async componentDidMount() {
        this.initialize()
    }

    /**
     * Get all the avaliable languages for a given cardList and set, as a JSX <options> for the the language selector input
     * @param {object} cards - cardJson Object, it's structure can be found at https://scryfall.com/docs/api/cards   
     * @param {string} set - the name of the set where we are looking for the avaliable languages
     * @param {currentLanguage} currentLanguage - We need this to avoid changing the selected language for the user 
     * @returns {Array{JSX}} a list of JSX <options>ready  to load the language selector input
     */
    getNewAvaliableLanguages(cards, set, currentLanguage) {
        let languages = cards.filter((cardJson) => {
            return cardJson['set_name'] === set
        })
            .map((cardJson) => {
                return cardJson["lang"]
            })
        //remove duplicates and convert to JSX to pass as <options> to the languageSelectorInput
        let avaliableLanguagesJSX = Array.from([...new Set(languages)]).map((lang, index) => {
            if (lang === currentLanguage) {
                return <option key={index} selected>{lang}</option>
            }
            return <option key={index}>{lang}</option>
        })

        return avaliableLanguagesJSX
    }

    /**
     * To initialize the component we need to do 3 things:
     * 1.-     fetch the list of cards using the 'oracleId' prop
     * 2.-     select the card from the list that will selected by default using the 'lang' prop
     * 3.-     obtain the list of avaliable languages and sets and populate the setSelector and 
     *         languageSelector inputs with that data
     */
    async initialize() {
        let cards = await fetchCardsByOracleId(this.props.oracleId)
        if (!Array.isArray(cards) || cards.length === 0) {
            this.setState({
                fatalError: true
            })
            return
        }

        //find a card in the intended language
        let currentSelectedCard = cards.find((cardJson) => {
            return cardJson['lang'] === this.props.lang
        })
        //if no cards are found, find a car in english
        if (currentSelectedCard === undefined) {
            currentSelectedCard = cards.find((cardJson) => {
                return cardJson['lang'] === 'en'
            })
        }
        //if for some weird reason the card is not avaliable in english, just picj the first one
        if (currentSelectedCard === undefined) {
            currentSelectedCard = cards[0]
        }
        //extract the default values for both setSelector and languageSelector from 'currentSelectedCard' 
        this.defaultSetOption = currentSelectedCard['set_name']
        this.defaultLanguageOption = currentSelectedCard['lang']


        //Obtain the avaliable languages for the set where 'currentSelectedCard' belongs
        //
        this.avaliableLanguages = this.getNewAvaliableLanguages(cards, this.defaultSetOption, this.defaultLanguageOption)
        //Obtain the avaliable sets on the cardList
        let sets = cards.map((cardJson) => {
            return cardJson['set_name']
        })
        //remove duplicates and convert to JSX to pass as <options> to the setSelectorInput
        this.avaliableSets = Array.from([...new Set(sets)]).map((set, index) => {
            if (set === this.defaultSetOption) {
                return <option key={index} selected>{set}</option>
            }
            return <option key={index}>{set}</option>
        })

        this.setState({
            cardsJson: cards,
            currentSelectedCard: currentSelectedCard,
            set: currentSelectedCard['set_name'],
            fatalError: false
        })

    }

    /**
     * Update this.state.currentSelectedCard, using the current values of the set and language selector inputs 
     */
    updateCurrentSelectedCard() {
        let selectedSet = this.setSelectorRef.current.value
        let selectedLang = this.languageSelectorRef.current.value
        let selectedCard = this.state.cardsJson.find((cardJson) => {
            return cardJson['lang'] === selectedLang && cardJson['set_name'] === selectedSet
        })
        this.setState({
            currentSelectedCard: selectedCard
        })
    }

    onSetSelectorInputChange() {
        this.avaliableLanguages = this.getNewAvaliableLanguages(this.state.cardsJson, 
            this.setSelectorRef.current.value, 
            this.languageSelectorRef.current.value
        )
        this.updateCurrentSelectedCard()
    }

    render() {
        let cardImageUrl = getCardImageUrlFromJson(this.state.currentSelectedCard, "small")
        return (
            <Card inverse>
                <CardImg width="100%" src={cardImageUrl} width='50px' alt="Card image cap" />
                <CardFooter>
                    <Row>
                        <Col xs='auto'>
                            <Label for="intendedlanguageSelector">Set</Label>
                        </Col>
                        <Col>
                            <Input
                                type="select"
                                innerRef={this.setSelectorRef}
                                selected={this.defaultSetOption}
                                onChange={this.onSetSelectorInputChange.bind(this)}
                                id="setSelector"
                            >
                                {this.avaliableSets}
                            </Input>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs='auto'>
                            <Label for="setSelector">Language</Label>
                        </Col>
                        <Col>
                            <Input
                                type="select"
                                innerRef={this.languageSelectorRef}
                                selected={this.defaultLanguageOption}
                                onChange={this.updateCurrentSelectedCard.bind(this)}
                                id="intendedlanguageSelector"
                            >
                                {this.avaliableLanguages}
                            </Input>
                        </Col>
                    </Row>
                </CardFooter>

            </Card >
        )
    }
}