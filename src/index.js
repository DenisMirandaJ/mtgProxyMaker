import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {MainPage} from './mainpage'
require('dotenv').config()
ReactDOM.render(<MainPage />, document.getElementById('root'));
