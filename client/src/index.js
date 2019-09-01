import React from 'react'
import * as Sentry from '@sentry/browser'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import ApolloClient, { InMemoryCache } from 'apollo-boost'
import { ApolloProvider } from '@apollo/react-hooks'
import StylesProvider from '@material-ui/styles/StylesProvider'
import { MuiThemeProvider } from '@material-ui/core/styles'
import './index.css'
import App from './components/App'
import CustomMuiTheme from './components/CustomMuiTheme'
import { darkTheme } from './helpers/themes'

Sentry.init({ dsn: 'https://cfc156ae965449309801e5a8973ece80@sentry.io/1493191' })

const client = new ApolloClient({
  // uri: /* '/', */ 'http://localhost:4000', // removed to default to '/graphql'
  cache: new InMemoryCache(),
  request: operation => {
    operation.setContext({
      fetchOptions: {
        credentials: 'include',
      },
    })
  },
})

ReactDOM.render(
  <ApolloProvider client={client}>
    <MuiThemeProvider theme={CustomMuiTheme}>
      <ThemeProvider theme={darkTheme}>
        <StylesProvider injectFirst>
          <App />
        </StylesProvider>
      </ThemeProvider>
    </MuiThemeProvider>
  </ApolloProvider>,
  document.getElementById('root'),
)
