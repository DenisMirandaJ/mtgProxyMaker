import React from 'react';
import { Card, Input, Label, CardImg, Row, Col, CardFooter, CardImgOverlay, Badge } from 'reactstrap';
import { getCardImageUrlFromJson } from '../../utils/cardJsonObjectDataExtraction'
import { fetchCardsByOracleId } from './requests/cardOptionsSelectorRequests'
import './cardOptionsSelector.css'

export class CardOptionsSelector extends React.Component {

    /**
     * @prop {string} props.oracleId - unique id of the card, see https://mtg.gamepedia.com/Oracle
     * @prop {string} props.lang   - desired output language, see https://scryfall.com/docs/api/languages
     * @prop {string} quantity - number of copies of the card
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
            avaliableLanguages: [],
            avaliableSets: [],
            defaultLanguageOption: '',
            defaultSetOption: '',
            setOptions: [],
            isOracleIdInvalid: false
        }
    }

    async componentDidMount() {
        this.initialize()
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.oracleId !== prevProps.oracleId) {
            this.initialize()
        }
        if (this.props.lang !== prevProps.lang) {
            this.initialize()
        }
        if (this.state.currentSelectedCard['id'] !== prevState.currentSelectedCard['id']) {
            console.log(this.props.key)
            this.props.parentHandler(this.state.currentSelectedCard, this.props.quantity, this.props.index)
        }
    }

    generateLanguageSelectOptions(languages, currentLanguage) {
        if (!languages.includes(currentLanguage)) {
            if (!languages.includes('en')) {
                currentLanguage = languages[0]
            }
        }
        let avaliableLanguagesJSX = Array.from([...new Set(languages)]).map((lang, index) => {
            if (lang === currentLanguage) {
                return <option key={index} selected>{lang}</option>
            }
            return <option key={index}>{lang}</option>
        })

        return avaliableLanguagesJSX
    }

    getLanguagesInSet(set, cards) {
        let languages = cards.filter((cardJson) => {
            return cardJson['set_name'] === set
        }).map((cardJson) => {
            return cardJson["lang"]
        })
        //remove duplicates
        return Array.from([...new Set(languages)])
    }

    findCard(cards, lang, set = null) {
        let currentSelectedCard = cards.find((cardJson) => {
            return (cardJson['lang'] === lang && cardJson['set_name'] === set)
        })
        //if no cards are found, find a car in english
        if (currentSelectedCard === undefined) {
            currentSelectedCard = cards.find((cardJson) => {
                return (cardJson['lang'] === 'en' && cardJson['set_name'] === set)
            })
        }
        //if for some weird reason the card is not avaliable in english, just pick the first one
        if (currentSelectedCard === undefined) {
            currentSelectedCard = cards[0]
        }

        return currentSelectedCard
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
                isOracleIdInvalid: true
            })
            return
        }

        //Obtain the avaliable sets in the cardList
        let sets = cards.map((cardJson) => {
            return cardJson['set_name']
        })
        sets = Array.from([...new Set(sets)])
        let currentSelectedCard = cards.find((card) => {
            return card['lang'] === this.props.lang
        })
        //extract the default initial values for both setSelector and languageSelector from 'currentSelectedCard' 
        let defaultSetOption = currentSelectedCard['set_name']
        let defaultLanguageOption = currentSelectedCard['lang']
        let avaliableLanguages = this.getLanguagesInSet(defaultSetOption, cards)

        let setOptions = sets.map((set, index) => {
            if (set == defaultSetOption) {
                return <option key={index} selected>{set}</option>
            }
            return <option key={index}>{set}</option>
        })

        this.setState({
            cardsJson: cards,
            currentSelectedCard: currentSelectedCard,
            avaliableSets: sets,
            avaliableLanguages: avaliableLanguages,
            defaultLanguageOption: defaultLanguageOption,
            defaultSetOption: defaultSetOption,
            setOptions: setOptions,
            isOracleIdInvalid: false
        })

    }

    /**
     * Update this.state.currentSelectedCard, using the current values of the set and language selector inputs 
     */
    updateCurrentSelectedCard() {
        let selectedSet = this.setSelectorRef.current.value
        let selectedLang = this.languageSelectorRef.current.value
        let avaliableLanguages = this.getLanguagesInSet(selectedSet, this.state.cardsJson)
        if (!avaliableLanguages.includes(selectedLang)) {
            if (!avaliableLanguages.includes('en')) {
                selectedLang = avaliableLanguages[0]
            } else {
                selectedLang = 'en'
            }
        }
        let selectedCard = this.state.cardsJson.find((cardJson) => {
            return cardJson['lang'] === selectedLang && cardJson['set_name'] === selectedSet
        })
        this.setState({
            currentSelectedCard: selectedCard,
            avaliableLanguages: avaliableLanguages,
            defaultLanguageOption: selectedLang
        })
    }

    render() {
        let languageOptionsJSX = this.generateLanguageSelectOptions.call(this, this.state.avaliableLanguages, this.state.defaultLanguageOption)
        let cardImageUrl = getCardImageUrlFromJson(this.state.currentSelectedCard, "small")
        return (
            <Card inverse>
                <CardImg src={cardImageUrl} alt="Card image cap" />
                <CardImgOverlay>
                    <h3 body className="text-right"><Badge pill>X{this.props.quantity}</Badge></h3>
                </CardImgOverlay>
                <CardFooter>
                    <Row>
                        <Col xs='auto'>
                            <Label for="intendedlanguageSelector">Set</Label>
                        </Col>
                        <Col>
                            <Input
                                type="select"
                                innerRef={this.setSelectorRef}
                                selected={this.state.defaultSetOption}
                                onChange={this.updateCurrentSelectedCard.bind(this)}
                                id="setSelector"
                            >
                                {this.state.setOptions}
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
                                selected={this.state.defaultLanguageOption}
                                onChange={this.updateCurrentSelectedCard.bind(this)}
                                id="intendedlanguageSelector"
                            >
                                {languageOptionsJSX}
                            </Input>
                        </Col>
                    </Row>
                </CardFooter>

            </Card >
        )
    }
}