import React from 'react';
import { Container, CardGroup, Form, Card, Input, Label, Button } from 'reactstrap'
import Axios from 'axios'
import { CardOptionsSelector } from './components/cardsOptionsSelector/cardOptionsSelector'
import './css/proxyMaker.css'

export class ProxyMaker extends React.Component {
    constructor(props) {
        super(props)

        this.deckInput = React.createRef()
        this.languageInput = React.createRef()

        this.cardOptionsSelectorComponents = []
        this.cardsJsonData = []

        this.state = {
            cardNameQuantityDic: [],
            lang: "en",
            cardsNotFound: [],
            cardsToPrint: [],
            isLocalServerDown: false
        }
    }

    /**
     * Converts the contents of deck input text area in to an object
     * that contains data required by  the CArdOptionSelector componenets
     * 
     * @param {string} input - Contents of the deck input 
     * @returns {Array.<Object>} - an array of objects with the structure {oracleId, quantity},
     *                              one per valid line of text on the input parameter 
     */
    async getCardNamesQuantityDic(input) {
        let quantity
        let dic = []
        let notFoundCards = []
        let lines = input.split(/\r?\n/g)
        let response = {}
        for (let i = 0; i < lines.length; i++) {
            let matches = lines[i].match(/([\s0-9]+)?(\s+x\s+)?([a-zA-Z0-9\s.,'-/]+)$/)
            if (!matches) {
                continue
            }
            try {
                let url = process.env.REACT_APP_LOCAL_API_CARD_DATA_ENDPOINT + matches[3]
                response = await Axios.get(url)
            } catch (err) {
                console.log(err.message)
                notFoundCards.push(matches[3])
                continue
            }
            if (matches[1] === undefined || matches[1].match(/^\s+$/)) {
                quantity = "1"
            } else {
                quantity = matches[1]
            }
            dic.push({
                oracleId: response['data']['oracle_id'],
                quantity: quantity,
            })
        }

        this.setState({
            cardsNotFound: notFoundCards
        })
        return dic
    }

    /**
     * Callback passed to CardOptionsSelector to gather it's internal data
     * @param {object} currentCardJson -- card data, see https://scryfall.com/docs/api/cards
     * @param {*} quantity -- how many of the card should be printed
     * @param {*} index -- id of the CardOptionsSelectorObject
     */
    getDataFromCardOptionSelector(currentCardJson, quantity, index) {
        let cardsToPrint = this.state.cardsToPrint
        let cardData = {
            'quantity': quantity,
            'cardJson': currentCardJson
        }
        cardsToPrint[index] = cardData
        this.setState({
            cardsToPrint: cardsToPrint
        })
    }

    async downloadDeck() {
        let response = {}
        try {
            response = await Axios.post(
                'http://localhost:8000/api/build/deck',
                { cardDic: this.state.cardsToPrint }
            )

            const link = document.createElement('a');
            link.href = 'http://localhost:8000/api/download/' + response['data'][0];
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.setState({
                isLocalServerDown: false
            })
        } catch {
            this.setState({
                isLocalServerDown: true
            })
        }
    }

    async onDeckInputSubmit() {
        let cardNameQuantityDic = await this.getCardNamesQuantityDic(this.deckInput.current.value)
        this.cardsJsonData = Array.apply(null, Array(cardNameQuantityDic.length))
        this.setState({
            cardNameQuantityDic: cardNameQuantityDic,
            cardsToPrint: []
        })
    }

    /**
     * Tranform this.state.cardNameQuantotyDic to an usable list of CardOptionsSelector JSX objects
     */
    getCardsOptionsSelectorComponents() {
        let cardOptionsViewers = this.state.cardNameQuantityDic.map((cardDic, index) => {
            return (
                <CardOptionsSelector
                    oracleId={cardDic['oracleId']}
                    lang={this.languageInput.current.value}
                    quantity={cardDic['quantity']}
                    class='cardOptionSelector'
                    parentHandler={this.getDataFromCardOptionSelector.bind(this)}
                    index={index}
                    key={index}
                />
            )
        })

        //Split the cards in chunks of size 'size'
        let arrays = [];
        let size = 5
        while (cardOptionsViewers.length > 0) {
            arrays.push(cardOptionsViewers.splice(0, size))
        }

        let cardGroups = arrays.map((cardGroup, index) => {
            if (index == arrays.length - 1) {
                if (cardGroup.length != size) {
                    while (cardGroup.length != size) {
                        cardGroup.push(<Card id='filler-card'></Card>)
                    }
                }
            }
            return (
                <CardGroup>
                    {cardGroup}
                </CardGroup>
            )
        })
        return cardGroups
    }

    render() {
        return (
            <Container style={{ width: '100%' }}>
                <Form id='deckInput'>
                    <Label for="deckTextArea"><h3>Enter your decklist</h3></Label>
                    <Input
                        type="textarea"
                        innerRef={this.deckInput}
                        rows='17'
                        noresize='true'
                        placeholder={'4 shock\n3 x Dovin\'s Veto'}
                        id="deckTextArea"
                        autoFocus
                    />
                    <Label for='languageInput'>
                        <span>
                            Language <span className="text-muted">(not all cards are avaliable in every language)</span>
                        </span>
                    </Label>
                    <Input
                        type='select'
                        innerRef={this.languageInput}
                        id='languageInput'
                    >
                        <option value='en'>English</option>
                        <option value='es'>Spanish</option>
                        <option value='fr'>French</option>
                        <option value='de'>German</option>
                        <option value='it'>Italian</option>
                        <option value='pt'>Portuguese</option>
                        <option value='ja'>Japanese</option>
                        <option value='ko'>Korean</option>
                        <option value='ru'>Russian</option>
                        <option value='zhs'>Chinese Simplified</option>
                        <option value='zht'>Chinese Traditional</option>
                        <option value='he'>Hebrew</option>
                        <option value='la'>Latin</option>
                        <option value='grc'>Ancient Greek</option>
                        <option value='ar'>Arabic</option>
                        <option value='sa'>Sanskrit</option>
                        <option value='px'>Phyrexian</option>
                    </Input>
                    <Button color="primary" onClick={this.onDeckInputSubmit.bind(this)} block id='submit-button'>Let's Proxy</Button>

                </Form>
                <Container md='6' center>
                    {this.getCardsOptionsSelectorComponents()}
                </Container>
                <Button onClick={this.downloadDeck.bind(this)}>Donwload</Button>
                {this.cardsJsonData}
            </Container>
        )
    }
}

