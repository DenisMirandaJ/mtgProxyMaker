import React from 'react';
import { Container, CardGroup, Form, Card, Input, Label, Button, FormGroup, Row, Col, InputGroup, InputGroupAddon, InputGroupText, CardBody, CardTitle } from 'reactstrap'
import Axios from 'axios'
import { CardOptionsSelector } from './components/cardsOptionsSelector/cardOptionsSelector'
import './css/proxyMaker.css'

export class ProxyMaker extends React.Component {
    constructor(props) {
        super(props)

        this.deckInput = React.createRef()
        this.languageInput = React.createRef()
        this.printerWidthInput = React.createRef()
        this.pageSizeInput = React.createRef()

        this.cardOptionsSelectorComponents = []
        this.cardsJsonData = []

        this.state = {
            cardNameQuantityDic: [],
            lang: "en",
            cardsNotFound: [],
            cardsToPrint: [],
            selectedFileType: 'pdf',
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

    handleRadioBtnInput(event) {
        console.log(event.target.value)
        this.setState({
            selectedFileType: event.target.value
        })
    }

    async downloadDeck() {
        let response = {}
        try {
            if (this.state.selectedFileType === 'img') {
                response = await Axios.post(
                    'http://localhost:8000/api/build/deck',
                    {
                        cardDic: this.state.cardsToPrint,
                        filetype: 'img'
                    }
                )
            }
            else if (this.state.selectedFileType === 'pdf') {
                response = await Axios.post(
                    'http://localhost:8000/api/build/deck',
                    {
                        cardDic: this.state.cardsToPrint,
                        filetype: 'pdf',
                        paperSize: this.pageSizeInput.current.value
                    }
                )
            }
            const link = document.createElement('a')
            if (this.state.selectedFileType === 'img') {
                link.download = 'deck.png'
                link.href = 'http://localhost:8000/api/download/img/' + response['data'][0];
            } else if (this.state.selectedFileType === 'pdf') {
                link.download = 'deck.pdf'
                link.href = 'http://localhost:8000/api/download/pdf/' + response['data'][0];
            }
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
            <Container>
                <Label><h3>Enter your deck list</h3></Label>
                <Row>
                    <Col sm='12' xl='6'>
                        <Input type="textarea"
                            innerRef={this.deckInput}
                            rows='14'
                            noresize='true'
                            placeholder={'4 shock\n3 x Dovin\'s Veto'}
                            id="deckTextArea"
                            autoFocus
                        />
                    </Col>
                    <Col sm='12' xl='6'>
                        <Form id='deckOptions'>
                            <div id='options'>
                                <Label><b>Print Options</b></Label>
                                <Label style={{ display: 'block' }}>Download as: <sup><Button color='link'>Help</Button></sup></Label>
                                <Col>
                                    <div id='printOptions'>
                                        <FormGroup id='pdfOptions'>
                                            <InputGroup size='md'>
                                                <InputGroupAddon addonType="prepend" id='printOptionsInputGroup' style={{ width: '100%' }}>
                                                    <InputGroupText style={{ width: '25%' }}>
                                                        <Label check>
                                                            <Input addon type="radio" value='pdf' name="options" onChange={this.handleRadioBtnInput.bind(this)} checked={this.state.selectedFileType === 'pdf'} />{' '}
                                                            {'PDF'}
                                                        </Label>
                                                    </InputGroupText>
                                                    <InputGroupText style={{ width: '40%' }} >
                                                        <Label check for='pageSizeInput'>Page Size:</Label>
                                                    </InputGroupText>
                                                    <Input style={{ width: '35%' }}
                                                        type='select'
                                                        innerRef={this.pageSizeInput}
                                                        id='pageSizeInput'
                                                        bsSize='md'
                                                    >
                                                        <option value='letter'>Letter (215.9 x 279.4 mm)</option>
                                                        <option value='a4'>A4</option>
                                                    </Input>
                                                </InputGroupAddon>
                                            </InputGroup>
                                        </FormGroup>
                                        <FormGroup id='imgOptions'>
                                            <InputGroup size='md'>
                                                <InputGroupAddon addonType="prepend" style={{ width: '100%' }}>
                                                    <InputGroupText style={{ width: '25%' }}>
                                                        <Label check>
                                                            <Input addon type="radio" name="options" value="img" onChange={this.handleRadioBtnInput.bind(this)} checked={this.state.selectedFileType === "img"} />{' '}
                                                            {'PNG'}
                                                        </Label>
                                                    </InputGroupText>
                                                    <InputGroupText style={{ width: '40%' }}>
                                                        <Label check for='printWidthInput'>Printer width:</Label>
                                                    </InputGroupText>
                                                    <Input style={{ width: '22%' }}
                                                        type='number'
                                                        innerRef={this.printerWidthInput}
                                                        id='pageSizeInput'
                                                        bsSize='md'
                                                        defaultValue={900}
                                                    />
                                                    <InputGroupText style={{ width: '13%' }}>
                                                        <Label check for='printWidthInput'>mm</Label>
                                                    </InputGroupText>
                                                </InputGroupAddon>
                                            </InputGroup>
                                        </FormGroup>
                                    </div>
                                </Col>
                                <Label for='languageInput'>
                                    <span>
                                        <b>{'Language '}</b><span className="text-muted"> - not all cards are avaliable in every language  </span>
                                    </span>
                                </Label>
                                <Col>
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

                                </Col>
                                <Button color="primary" onClick={this.onDeckInputSubmit.bind(this)} block id='submit-button'>Customise card's art</Button>
                                <Button color="secondary" onClick={this.downloadDeck.bind(this)} block id='download-button'>Download deck</Button>
                            </div>
                        </Form>
                    </Col>
                </Row>
                <Container center>
                    <Card style={{width: '100%', marginTop: '20px'}}>
                        <CardTitle style={{marginLeft: '10px'}}><b>Cards options selector</b> <span className="text-muted"> - You can customise card's art and language  </span></CardTitle>
                        <CardBody>
                            {this.getCardsOptionsSelectorComponents()}
                        </CardBody>
                    </Card>
                </Container>
            </Container>
        )
    }
}

