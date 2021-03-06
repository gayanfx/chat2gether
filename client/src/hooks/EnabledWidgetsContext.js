import React from 'react'

const EnabledWidgetsContext = React.createContext({
  enabledWidgets: {
    text: false,
    menu: false,
    video: false,
    countdown: false,
    profile: false,
    matches: false,
    stats: false,
    updatePref: false,
  },
  setEnabledWidgets: () => {},
  chatSettings: { micMute: false, speakerMute: false },
  setChatSettings: () => {},
  featureToggle: () => {},
})
export function useEnabledWidgets() {
  return React.useContext(EnabledWidgetsContext)
}

export function EnabledWidgetsProvider(props) {
  const { children } = props
  const [enabledWidgets, setEnabledWidgets] = React.useState({
    text: false,
    menu: false,
    video: false,
    countdown: false,
    profile: false,
    matches: false,
    stats: false,
    updatePref: false,
  })
  console.log('enabledWidgetsProvider render')

  const [chatSettings, setChatSettings] = React.useState({ micMute: false, speakerMute: false })

  const featureToggle = elem => {
    const { text, countdown, profile, video } = enabledWidgets
    setEnabledWidgets({ text, countdown, profile, video, [elem]: !enabledWidgets[elem] })
  }

  return (
    <EnabledWidgetsContext.Provider
      value={{ enabledWidgets, setEnabledWidgets, chatSettings, setChatSettings, featureToggle }}
    >
      {children}
    </EnabledWidgetsContext.Provider>
  )
}
