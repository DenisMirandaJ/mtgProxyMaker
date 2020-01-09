import React from 'react';
import { Container, CardGroup, Col, Row, Card, Input, Label, Button, CardColumns } from 'reactstrap'
import Axios from 'axios'
import { CardOptionsSelector } from './components/cardsOptionsSelector/cardOptionsSelector'
import './css/proxyMaker.css'

export class ProxyMaker extends React.Component {
    constructor(props) {
        super(props)

        this.deckInput = React.createRef()
        this.languageInput = React.createRef()

        this.cardOptionsSelectorComponents = []

        this.state = {
            cardList: [],
            lang: "en"
        }
    }


    async getCardNamesQuantityDic(input) {
        let dic = []
        let lines = input.split(/\r?\n/g)
        for (let i = 0; i < lines.length; i++) {
            let matches = lines[i].match(/([\s0-9]+)?(\s+x\s+)?([a-zA-Z0-9\s.,'-/]+)$/)
            if (!matches) {
                continue
            }
            const response = await Axios.get('https://api.scryfall.com/cards/named?fuzzy=' + matches[3])
            dic.push({
                oracleId: response['data']['oracle_id'],
                quantity: matches[1]
            })
        }

        return dic
    }

    async onDeckInputSubmit() {
        let cardNameQuantityDic = await this.getCardNamesQuantityDic(this.deckInput.current.value)
        this.setState({
            cardList: cardNameQuantityDic
        })
    }

    getCardOptionsSelectorComponents() {
        let cardOptionsViewers = this.state.cardList.map((cardDic, index) => {
            return (
                <CardOptionsSelector
                    oracleId={cardDic['oracleId']}
                    lang={this.languageInput.current.value}
                    class='cardOptionSelector'
                />
            )
        })

        //Split the cards in chunks of size 'size
        let arrays = [];
        let size = 5
        while (cardOptionsViewers.length > 0) {
            arrays.push(cardOptionsViewers.splice(0, size))
        }

        let cardGroups = arrays.map( (cardGroup, index) => 
        {
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
                <Label for="deckTextArea"><h2>Enter your decklist</h2></Label>
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
                <Button color="primary" onClick={this.onDeckInputSubmit.bind(this)} block>Let's Proxy</Button>
                {this.getCardOptionsSelectorComponents()}

            </Container>
        )
    }
}

