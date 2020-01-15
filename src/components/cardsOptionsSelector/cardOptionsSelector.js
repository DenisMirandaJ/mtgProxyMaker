import React from 'react';
import { Card, Input, Label, CardImg, Row, Col, CardFooter, CardImgOverlay, Badge } from 'reactstrap';
import { getCardImageUrlFromJson } from '../../utils/cardJsonObjectDataExtraction'
import { fetchCardsByOracleId } from './requests/cardOptionsSelectorRequests'
import { FaLanguage } from 'react-icons/fa'
import './cardOptionsSelector.css'

export class CardOptionsSelector extends React.Component {

    /**
     * @prop {string} props.oracleId - unique id of the card, see https://mtg.gamepedia.com/Oracle
     * @prop {string} props.lang   - desired output language, see https://scryfall.com/docs/api/languages
     * @prop {string} quantity - number of copies of the card
     * 
     * @prop {state.object} cardsJson --  list of cards in Json format, see https://scryfall.com/docs/api/cards
     * @prop {state.object} currentSelectedCard -- card being displayed
     * @prop {state.Array} avaliableLanguages -- list of avaliable languages for the current selected set, see https://scryfall.com/docs/api/languages
     * @prop {state.Array} avaliableSets -- list of sets that holds the cards with oracle_id = props.oracleId
     * @prop {state.string} defaultLanguageOption -- language that should appear by default on the select Input
     * @prop {state.string} defaultSetOption -- most recent set in avaliable sets
     * @prop {state.Array} setOptions -- <option> elements displayed by the set Select input
     * @prop {state.bool} isOracleIdInvalid -- false if no card with the requiered oracle_id was found, true otherwise
     */
    constructor(props) {
        super(props)
        //Refs for the current content of the intendedLanguageSelector and setSelector inputs
        this.setSelectorRef = React.createRef()
        this.languageSelectorRef = React.createRef()
        this.languageCodes = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ru': 'Russian',
            'zhs': 'Chinese Simplified',
            'zht': 'Chinese Traditional',
            'he': 'Hebrew',
            'la': 'Latin',
            'grc': 'Ancient Greek',
            'ar': 'Arabic',
            'sa': 'Sanskrit',
            'px': 'Phyrexian'
        }
        //default value for the language and set input selectors
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

    /**
     * 
     * @param {Array} languages -- Array with the current avaliable languages 
     * @param {string} currentLanguage
     * @returns {Array} -- Array with JSX <option> objects, used to populate the language <Select> object
     */
    generateLanguageSelectOptions(languages, currentLanguage) {
        if (!languages.includes(currentLanguage)) {
            if (!languages.includes('en')) {
                currentLanguage = languages[0]
            }
        }
        let avaliableLanguagesJSX = Array.from([...new Set(languages)]).map((lang, index) => {
            if (lang === currentLanguage) {
                return <option value={lang} key={index} selected>{this.languageCodes[lang]}</option>
            }
            return <option value={lang} key={index}>{this.languageCodes[lang]}</option>
        })

        return avaliableLanguagesJSX
    }

    /**
     * 
     * @param {string} set 
     * @param {object} cards -- Object with the same structure as this.state.cardsJson 
     * @returns {Array} -- avaliable languages for the given set
     */
    getLanguagesInSet(set, cards) {
        let languages = cards.filter((cardJson) => {
            return cardJson['set_name'] === set
        }).map((cardJson) => {
            return cardJson["lang"]
        })
        //remove duplicates
        return Array.from([...new Set(languages)])
    }

    /**
     * This function is called everytime the props change
     * To initialize the component we need to do 3 things:
     * 1.-     fetch the list of cards using the 'oracleId' prop
     * 2.-     select the card from the list that will selected by default using the 'lang' prop
     * 3.-     obtain the list of avaliable languages and sets needed populate the setSelector and 
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
        //removing duplicates
        sets = Array.from([...new Set(sets)])

        //find the most recent card with lang == this.props.lang, order is ensured by the local API
        let currentSelectedCard = cards.find((card) => {
            return card['lang'] === this.props.lang
        })
        // if cards is not avaliable in the selected language
        if (currentSelectedCard === undefined) {
            currentSelectedCard = currentSelectedCard = cards.find((card) => {
                return card['lang'] === 'en'
            })
        }
        //if card is not avaliable even in english
        if (currentSelectedCard === undefined) {
            currentSelectedCard = currentSelectedCard = cards[0]
        }
        //extract the default initial values for both setSelector and languageSelector from 'currentSelectedCard' 
        let defaultSetOption = currentSelectedCard['set_name']
        let defaultLanguageOption = currentSelectedCard['lang']
        //get the avaliable languages for the chosen set
        let avaliableLanguages = this.getLanguagesInSet(defaultSetOption, cards)

        //generate the JSX <option> array needed by the set select input
        let setOptions = sets.map((set, index) => {
            if (set == defaultSetOption) {
                return <option key={index} selected>{set}</option>
            }
            return <option key={index}>{set}</option>
        })

        //setting the initial state
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
        //extarct value from the select inputs
        let selectedSet = this.setSelectorRef.current.value
        let selectedLang = this.languageSelectorRef.current.value

        //get the list of avaliable languages in the newly selected set
        let avaliableLanguages = this.getLanguagesInSet(selectedSet, this.state.cardsJson)
        //Change language if the new set does not have it (English is the default)
        if (!avaliableLanguages.includes(selectedLang)) {
            if (!avaliableLanguages.includes('en')) {
                selectedLang = avaliableLanguages[0]
            } else {
                selectedLang = 'en'
            }
        }
        //get the new card to be displayed
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
        let cardImageUrl = getCardImageUrlFromJson(this.state.currentSelectedCard, "normal")
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
                            <Label for="setSelector"><h4><FaLanguage /></h4></Label>
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