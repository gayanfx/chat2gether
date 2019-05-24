import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { compose, graphql, withApollo } from 'react-apollo'
import { CREATE_FEEDBACK } from '../queries/mutations'

const StyledSettings = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
`
const Blur = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  filter: blur(5px) saturate(20%);
  background-color: #000000aa;
`

const Container = styled.div`
  margin: auto;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  height: 40rem;
  width: 30rem;
  max-width: 90%;
  max-height: 90%;
  background-color: #313131;
  z-index: 50;
  border-radius: 0.5rem;
  box-shadow: 0 0 1rem #000;
  display: flex;
  flex-direction: column;
`
const Title = styled.h3`
  margin: 1rem 2rem;
  font-size: 2rem;
  padding: 1rem;
  border-bottom: 2px solid #222;
`
const SettingsList = styled.div`
  padding: 1.5rem;
  flex-grow: 1;

  label {
    font-size: 1.4rem;
    padding: 0;
  }
  option,
  select {
    font: inherit;
    padding: 0;
    max-width: 100%;
    cursor: pointer;
  }
`

const Actions = styled.div`
  display: flex;
  justify-content: space-evenly;
  justify-self: flex-end;
  font-size: 1.2rem;

  button {
    background-color: #aa32cc;
    height: 100%;
    width: 100%;
    border-radius: 0;
    padding: 1.5rem;
    box-shadow: 0 0 4px #555;
    font: inherit;
    font-size: 2rem;
    cursor: pointer;
  }
`

const FeedbackForm = styled.form`
  p {
    font-size: 1.4rem;
  }
  input {
    font-size: 1.2rem;
    border-radius: 1rem;
    padding: 0.5rem;
    min-height: 4rem;
    width: 100%;
  }
  button {
    font-size: 1.4rem;
    background-color: #555;
  }
`

function Settings(props) {
  const [devices, setDevices] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const getDevices = async () => {
    try {
      console.log(selectedVideo)
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const vids = allDevices.map((cur, idx) => {
        if (cur.kind === 'videoinput') {
          // console.log(cur.getCapabilities())
          return (
            <option key={idx} value={cur.deviceId}>
              {cur.label}
            </option>
          )
        }
        return null
      })
      setDevices(vids)
    } catch (e) {
      console.error(e)
      alert(e.message)
    }
  }

  useEffect(() => {
    const videoId = props.stream.getVideoTracks()[0].getSettings().deviceId
    setSelectedVideo(videoId)
    getDevices()
  }, [])

  const handleClose = (shouldApply = true) => {
    if (shouldApply) props.requestCamera(selectedVideo)
    props.setWidgetsActive({ ...props.widgetsActive, menu: false })
  }
  const handleFeedback = async e => {
    e.preventDefault()
    if (feedbackText.length < 1) return 0
    const { data, loading, error } = await props.CREATE_FEEDBACK({ variables: { data: { text: feedbackText } } })
    if (loading || error) console.log(loading, error)
    else {
      setFeedbackText('')
      setFeedbackMsg('Thanks for your feedback!')
    }
  }

  console.log(feedbackText)

  return (
    <StyledSettings>
      <Blur role="button" tabIndex={0} onClick={() => handleClose()} onKeyUp={() => handleClose()} />
      <Container>
        <Title>Settings</Title>
        <SettingsList>
          <label htmlFor="video-source">
            Video Source
            <select id="video-source" value={selectedVideo || ''} onChange={e => setSelectedVideo(e.target.value)}>
              {devices}
            </select>
          </label>

          <FeedbackForm onSubmit={handleFeedback}>
            <p>SendFeedback</p>
            <input value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
            {feedbackMsg}
            <button>Submit</button>
          </FeedbackForm>
        </SettingsList>
        <Actions>
          <button type="button" onClick={() => handleClose(false)} style={{ borderRight: '1px solid white' }}>
            Cancel
          </button>
          <button type="button" onClick={() => handleClose()}>
            Apply
          </button>
        </Actions>
      </Container>
    </StyledSettings>
  )
}

export default compose(graphql(CREATE_FEEDBACK, { name: 'CREATE_FEEDBACK' }))(withApollo(Settings))
