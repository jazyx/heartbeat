/**
 * /imports/api/methods/core/heartbeat.js
 *
 * This script manages the Heartbeat collection, which shares the
 * positions of each user's mouse or touch actions. 
 *
 * Imported by ../index.js and re-exported to
 *   Server: /server/main.js
 *   Client: /imports/ui/components/Heartbeats/Heartbeats.jsx
 *
 * ———————————————————————————————————————————————————————————————
 * See /imports/api/collections/core/heartbeat.js for structure and
 * other details
 */


import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'

import Heartbeat from '/imports/api/collections/heartbeat'
// console.log("Heartbeat:", Heartbeat);
// console.log("Heartbeat.insert:", Heartbeat.insert);

// console.log("Mongo:", Mongo);


import { debounce } from '/imports/api/tools/debounce.js'



// GARBAGE COLLECTION / GARBAGE COLLECTION / GARBAGE COLLECTION //


const STAY = 2000
const deathRow = {}


const killHeartbeat = ( _id ) => {
  delete deathRow[_id]
  let heart = { _id }

  const callback = (error, removedCount) => {
    if (error) {
      //console.log("error", JSON.stringify(error, null, '  '));
    } else {
      console.log(`Removed ${removedCount} records with _id ${_id}`)
    }
  }

  console.log(`kill Heartbeat
    Heartbeat: ${Heartbeat instanceof Mongo.Collection
              ? "Collection" : typeof Heartbeat}
    Heartbeat.remove(${JSON.stringify(heart)}, callback)
  `)

  Heartbeat.remove(heart, callback)
}


export const killMeLater = (id) => {
  const sentence = deathRow[id]

  if (sentence) {
    sentence(id)
  } else {
    console.log("Starting heartbeat for", id)
    deathRow[id] = debounce(killHeartbeat, STAY)
  } 
}
 
 
 
 // METHODS // METHODS / METHODS // METHODS / METHODS // METHODS //
 
export const heartBeat = {
  name: "heart.beat"

, call(heart, callback) {
    const options = {
      returnStubValue: true
    , throwStubExceptions: true
    }

    Meteor.apply(this.name, [heart], options, callback)
  }

, validate(heart) {
    new SimpleSchema({
      _id: { type: String, optional: true }
    }).validate(heart)
  }

, run({ _id }) {
    const existing = _id ? Heartbeat.findOne({ _id }) : null

    console.log("_id:", _id);
    

    if (!existing) {
      _id = Heartbeat.insert({})
    }
    
    killMeLater(_id)

    const time = (Math.floor(+ new Date() / 1000) % 1000)
    console.log("time:", time);

    const hearts = Heartbeat.find({})
                            .fetch()
                            .map( heart => heart._id )
    console.log("hearts:", hearts);
                           
    
    return { _id, beat: STAY  / 2 }
  }
}


const methods = [
  heartBeat
]


methods.forEach(method => {
  Meteor.methods({
    [method.name]: function (args) {
      method.validate.call(this, args)
      return method.run.call(this, args)
    }
  })
})