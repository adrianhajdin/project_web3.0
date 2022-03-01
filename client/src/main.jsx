import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import {TransactionsProvider} from './context/TransactionContext'

ReactDOM.render(
  <React.StrictMode>
    <TransactionsProvider>
      <App />
    </TransactionsProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
