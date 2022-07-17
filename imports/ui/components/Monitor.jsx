/**
 * Monitor.jsx
 *
 * This component provides a barebones demonstration of how the
 * Heartbeat feature can be used.
 * 
 * The useInterval hook by Dan Abramov comes from here:
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 * 
 * When the Monitor component mounts, it gives itself a unique
 * _id, and asks the Heartbeat colection (via useTracker) if it
 * is 'live', that is, if it contains a document with that _id.
 * The value of `live` will initially be false. The value of
 * `paused` (which determines the state of a checkbox) will also
 * be false.
 * 
 * Immediately after the component is first rendered, a useEffect
 * call will trigger startHeartbeat(). Because of its dependencies,
 * startHeartbeat() will also be called when the value of `live`
 * `paused` changes. startHeartbeat calls the heartbeat Meteor
 * method; a callback sets the _id state and the `beat` state.
 * In other words, the server tells the component which _id it is
 * tracking, and how many milliseconds should pass between each
 * subsequent call to the Meteor heartbeat method.
 * 
 * The component uses Dan Abramov's useInterval hook to call 
 * the Meteor heartBeat method on a regular basis... but only if 
 * _id, beat and live are truthy and paused is falsy. 
 * 
 * You can break the connection in a number of ways:
 * 1. Check the Paused button (this doesn't actually break the
 *    connection, it just pauses the calls to heartbeat)
 * 2. Reloading the browser page (this may not interrupt the
 *    heartbeat for very long, but it will change the _id)
 * 3. Navigating to a different page
 * 4. Stopping the server
 * 5. Disconnecting WiFi or the Ethernet cable between the
 *    client and the network through which the server is accessed
 */


import { Meteor } from 'meteor/meteor'
import React, { useEffect, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data'
import Heartbeat, { heartBeat } from '/imports/api/heartbeat'

import { useInterval } from '/imports/api/hooks'
import { uuid } from '/imports/api/uuid'


let render = 0


export const Monitor = () => {
  const [ _id, set_id ] = useState(uuid(5)) // over 1 billion ids
  const [ beat, setBeat ] = useState(0)
  const [ paused, setPaused ] = useState(false)
  const [ status, setStatus ] = useState()
  

  const live  = useTracker(() => !!Heartbeat.findOne({ _id }))


  const startHeartbeat = () => {
    if (paused) {
      return
    }

    const callback = (error, { _id, BEAT }) => {
      if (error) {
        return console.log("Monitor useEffect callback error:", error);
      }

      set_id(_id) // This will cause a re-render
      setBeat(BEAT)
    }
    
    heartBeat.call({ _id }, callback)
  }


  const callHeartbeatIfActive = () => {
    // <<< FEEDBACK ONLY: CAN BE REMOVED
    checkConnectionStatus() // This may cause a re-render
    // FEEDBACK ONLY: CAN BE REMOVED >>>

    if ( !_id || !beat || !live || paused ) {
      return
    }

    heartBeat.call({ _id })
  }


  const checkConnectionStatus = () => {
    const statusNow = Meteor.status().status
    if (statusNow !== status) {      
      setStatus(statusNow)
    }
  }

  
  const togglePaused = event => {
    setPaused(event.target.checked)
  }


  useEffect(startHeartbeat, [live, paused])
  useInterval(callHeartbeatIfActive, beat);


  return (
    <div>
      <h1>Heartbeat: {++render}</h1>
      <p>(status: {status})</p>
      <label htmlFor="pause">
        <input
          type="checkbox"
          checked={paused}
          id="pause"
          onChange={togglePaused}
        />
        Paused
      </label>
      <p>{_id}</p>
    </div>
  )
}
