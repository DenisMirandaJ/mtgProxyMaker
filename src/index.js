import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {ProxyMaker} from './proxyMaker'
require('dotenv').config()
ReactDOM.render(<ProxyMaker />, document.getElementById('root'));
