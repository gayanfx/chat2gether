import React from 'react'
import styled, { keyframes } from 'styled-components'
import HtmlParse from '../helpers/htmlParse3'
import VideoGrid from './VideoGrid'
import { useNotify } from '../hooks/NotifyContext'
import { useEnabledWidgets } from '../hooks/EnabledWidgetsContext'
import { Button } from './common'

const syncRotate = keyframes`
  0% {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
`

const StyledVideoPlayer = styled.div`
  display: ${props => (props.active ? 'block' : 'none')};

  position: relative;
  flex: 1;
  height: 100%;
  /* height: -webkit-fill-available; */
  background-color: #111;
  transition: all 0.4s;

  & > p {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
  }
`
const VideoContainer = styled.div`
  filter: ${props => props.disabled && 'brightness(40%)'};
  pointer-events: ${props => props.disabled && 'none'};

  width: 100%;
  height: auto;

  & > video {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: ${props => props.height || '100%'};
    transform: translateY(-50%);
    z-index: 1;
  }

  & > div {
    display: ${props => (props.disabled ? 'block' : 'none')};
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }

  & > p {
    font-size: 2rem;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`
const SearchButton = styled(Button)`
  position: absolute;
  left: 1rem;
  top: 1rem;
  box-shadow: 0 0 4px;
`
const SyncButton = styled(Button)`
  position: absolute;
  left: 6rem;
  top: 1rem;
  box-shadow: 0 0 4px;
  color: ${props => props.color};
  .rotate {
    color: inherit;
    transform-origin: center;
    transform-box: fill-box;
    animation: ${syncRotate} 3s linear;
  }
`

const SYNC = { OFF: 'off', REQUESTED: 'requested', UNACCEPTED: 'unaccepted', ACCEPTED: 'accepted' }
const UPDATE = { PAUSE: 'pause', PLAY: 'play', SEEKED: 'seeked' }

/** ******************* Component Starts */
export default function VideoPlayer(props) {
  const { socketHelper, roomId, userId } = props
  const [currentVideo, setCurrentVideo] = React.useState(null)
  const [isShown, setIsShown] = React.useState(false)
  const [parser, setParser] = React.useState(new HtmlParse(null))
  const [syncState, setSyncState] = React.useState(SYNC.OFF)
  const [videoUrl, setVideoUrl] = React.useState('')
  const [disabled, setDisabled] = React.useState(false)

  const player = React.useRef()

  const { enabledWidgets } = useEnabledWidgets()
  const active = enabledWidgets.video
  const { videoNotify, setVideoNotify } = useNotify()

  const coords = { x: window.innerWidth / 2, y: window.innerHeight / 3 }

  // When user presses search
  const onSubmitSearch = async newQuery => {
    if (!newQuery || newQuery === parser.search) return
    const newParser = new HtmlParse(newQuery)
    await newParser.parsePage()
    setParser(newParser)
  }

  // Boilerplate socket message
  const msg = {
    roomId,
    userId,
  }

  // Selecting local video from grid
  const selectVideo = async videoId => {
    const newVideoUrl = await HtmlParse.getUrl(videoId)
    setVideoUrl(newVideoUrl)
    setCurrentVideo(videoId)
    if (syncState === SYNC.ACCEPTED) {
      msg.videoId = videoId
      msg.videoUrl = newVideoUrl
      msg.type = 'setVideo'
      socketHelper.emit('videoPlayerSync', msg)
    }
  }

  // Changing sync state when remote user clicks sync button
  const receiveSyncMsg = newMsg => {
    if (newMsg.userId === userId) return
    let newState = syncState
    // Handle other user toggling on sync
    if (newMsg.type === 'start') {
      if (syncState === SYNC.OFF) {
        newState = SYNC.UNACCEPTED
      } else if (syncState === SYNC.REQUESTED) {
        newState = SYNC.ACCEPTED
        socketHelper.emit('videoPlayerSync', {
          ...msg,
          videoId: currentVideo,
          videoUrl,
          currentTime: player.current && player.current.currentTime,
          type: 'setVideo',
        })
      }
      // Handle other user toggling off sync
    } else if (newMsg.type === 'stop') {
      if (syncState === SYNC.UNACCEPTED) {
        newState = SYNC.OFF
      } else if (syncState === SYNC.ACCEPTED) {
        newState = SYNC.REQUESTED
      }
      // Handle other user changing the video
    } else if (newMsg.type === 'setVideo' && syncState === SYNC.ACCEPTED) {
      if (!active) setVideoNotify(true)
      if (!newMsg.videoId) return
      setCurrentVideo(newMsg.videoId)
      setVideoUrl(newMsg.videoUrl)
      if (player.current && newMsg.currentTime) {
        player.current.currentTime = parseFloat(newMsg.currentTime)
      }
    }
    // Notify if state was changed
    if (syncState !== newState && !active) {
      setVideoNotify(true)
    }
    setSyncState(newState)
  }

  // Changing local player when remote user updates player
  const receiveUpdateMsg = newMsg => {
    if (!player.current || newMsg.userId === userId || syncState !== SYNC.ACCEPTED) return
    // If other user paused the video
    if (newMsg.type === UPDATE.PAUSE) {
      player.current.pause()
      player.current.currentTime = newMsg.currentTime
    } else if (newMsg.type === UPDATE.PLAY) {
      player.current.play()
      player.current.currentTime = newMsg.currentTime
    } else if (newMsg.type === UPDATE.SEEKED) {
      player.current.currentTime = newMsg.currentTime
    } else return
    setDisabled(true)
  }

  const handlePlayerUpdate = e => {
    if (disabled) {
      setDisabled(false)
      return
    }
    msg.type = e.type
    msg.currentTime = e.target.currentTime
    socketHelper.emit('videoPlayerUpdate', msg)
  }

  // Setting listeners for Sync and Update socket requests
  React.useEffect(() => {
    if (!socketHelper) return
    socketHelper.socket.on('videoPlayerSync', receiveSyncMsg)
    socketHelper.socket.on('videoPlayerUpdate', receiveUpdateMsg)
    return () => {
      socketHelper.socket.off('videoPlayerSync')
      socketHelper.socket.off('videoPlayerUpdate')
    }
  }, [socketHelper, currentVideo, syncState, active])

  // Clearing the notify when player is made active
  React.useEffect(() => {
    if (videoNotify && active) {
      setVideoNotify(false)
    }
  }, [active])

  // Clicking the player's toggle sync button
  const toggleSync = () => {
    let newState = syncState
    if (syncState === SYNC.OFF) {
      newState = SYNC.REQUESTED
    } else if (syncState === SYNC.REQUESTED) {
      newState = SYNC.OFF
    } else if (syncState === SYNC.UNACCEPTED) {
      newState = SYNC.ACCEPTED
    } else if (syncState === SYNC.ACCEPTED) {
      newState = SYNC.UNACCEPTED
    }
    setSyncState(newState)
    if (syncState === SYNC.OFF || syncState === SYNC.UNACCEPTED) {
      msg.type = 'start'
    } else {
      msg.type = 'stop'
    }
    socketHelper.emit('videoPlayerSync', msg)
  }

  // Color for the sync button
  const getColor = React.useMemo(() => {
    if (syncState === SYNC.OFF) return '#fff'
    if (syncState === SYNC.ACCEPTED) return 'green'
    return '#ffe400'
  }, [syncState])

  const getSyncText = React.useCallback(() => {
    if (syncState === SYNC.OFF) return 'Request Sync'
    if (syncState === SYNC.REQUESTED) return 'Cancel Sync'
    if (syncState === SYNC.UNACCEPTED) return 'Accept Sync'
    return 'Synced'
  }, [syncState])

  const height = window.innerWidth > window.innerHeight ? 'auto' : '100%'

  // {syncState === SYNC.UNACCEPTED && <Notification />}
  // <i className={`fas fa-sync-alt ${syncState === SYNC.ACCEPTED ? 'rotate' : ''}`} />
  return (
    <>
      <VideoGrid
        videos={parser.videos}
        onSubmitSearch={onSubmitSearch}
        isShown={active && isShown}
        setIsShown={setIsShown}
        selectVideo={selectVideo}
      />
      <StyledVideoPlayer height={window.innerHeight} coords={coords} active={active}>
        <SearchButton data-cy="playerSearchButton" onClick={() => setIsShown(true)}>
          <i className="fas fa-search" />
        </SearchButton>
        <SyncButton data-cy="playerSyncButton" onClick={toggleSync} color={getColor} label={getSyncText()} />
        <VideoContainer disabled={disabled} height={height}>
          <div />
          {currentVideo ? (
            <video
              data-cy="playerVideo"
              ref={player}
              onPause={handlePlayerUpdate}
              onPlay={handlePlayerUpdate}
              onSeeked={handlePlayerUpdate}
              src={videoUrl}
              autoPlay
              controls
              playsInline
              allowFullScreen={false}
            />
          ) : (
            <p>Click the search and sync buttons in the top left!</p>
          )}
        </VideoContainer>
      </StyledVideoPlayer>
    </>
  )
}
