import React from 'react';
import { Container, Row, Col, CardGroup } from 'reactstrap'
import { CardOptionsSelector } from './components/cardsOptionsSelector/cardOptionsSelector'

export class MainPage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            cardList: [],
            lang: "en"
        }
    }

    render() {
        return (
            <Container>
                <CardGroup>
                    <CardOptionsSelector
                        oracleId="713332c1-5bd8-400f-bfff-c1ca0697a043"
                        lang="ja"
                    ></CardOptionsSelector>
                    <CardOptionsSelector
                        oracleId="bceecc64-96f1-4e7b-8904-0aef90377764"
                        lang="ja"
                    ></CardOptionsSelector>
                    <CardOptionsSelector
                        oracleId="68954295-54e3-4303-a6bc-fc4547a4e3a3"
                        lang="ja"
                    ></CardOptionsSelector>
                    <CardOptionsSelector
                        oracleId="713332c1-5bd8-400f-bfff-c1ca0697a043"
                        lang="ko"
                    ></CardOptionsSelector>
                </CardGroup>
            </Container>
        )
    }
}

