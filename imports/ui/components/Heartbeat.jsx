/**
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 * 
 * 
 */


import React, { useEffect, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data'
import Collection from '/imports/api/collections/heartbeat'
import { heartBeat } from '/imports/api/methods/heartbeat'
import { useInterval } from '/imports/api/tools/client/timing'


let render = 0


export const Heartbeat = () => {
  const [ _id, set_id ] = useState()
  const [ beat, setBeat ] = useState(0)
  const [ counter, setCounter ] = useState(0)
  const [ paused, setPaused ] = useState(false)
  
  const { connected } = useTracker(() => {
    const connected = !!Collection.findOne({ _id })
    return { connected }
  })

  render++
  console.log("render:", render, "_id:", _id, "beat:", beat, "connected:", connected);
  

  useInterval(
    () => {
      if ( !_id || !beat || !connected || paused ) {        
        return
      }

      heartBeat.call({ _id })
      setCounter(counter + 1)
    },
    beat
  );
  
  
  useEffect(() => {
    if (paused) {
      return
    }

    const callback = (error, { _id, beat } ) => {
      if (error) {
        return console.log("error:", error);   
      }

      set_id(_id) // This will cause a re-render
      setBeat(beat)
    }
    
    heartBeat.call({ _id }, callback)
  }, [connected, paused])


  const togglePaused = event => {
    setPaused(event.target.checked)
  }

  return (
    <div>
      <h1>Heartbeat {render}: {counter}</h1>
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
