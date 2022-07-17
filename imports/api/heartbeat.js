/**
 * heartbeat.js
 * 
 * This script should be placed in the /imports/ directory at the
 * root of your project so that it can be accessed by both the
 * client and the server.
 * 
 * This script is designed to call a function (ACTION, hard-coded
 * below) if the connection between a client and the server breaks
 * for any reason. For example, in a multiple-user turn-taking
 * game, if the power goes out for one user, the game could become
 * blocked for other users, when the disconnected user is unable
 * to take their turn. To avoide this, you can set ACTION to a
 * function which will skip that player's turn. Note that, if the
 * player reconnects with the same _id some time later, they can
 * be seamlessly re-integrated into the game.
 * 
 * This script uses a Mongo collection (Heartbeat) which stores
 * no data in a MongoDB database. Heartbeat data is transient; not
 * saving it reduces the number of CPU cycles the feature uses.
 * 
 * The ACTION function is wrapped inside a debouncer function: 
 * deleteMeLater. Each time the debouncer function is called, it
 * resets a timeout. So long as deleteMeLater is called regularly
 * by the heartbeat method, the timeout will not trigger.
 * 
 * For technical reasons associated with the way Meteor works, the
 * debounced function triggered by the timeout also needs to be
 * wrapped by Meteor.bindEnvironment(). If this is not done,
 * errors may be thrown if a callback is used inside the debounced
 * function.
 * 
 * The full hierarchy is:
 *   
 *   A regular call to the the Meteor method "heart.beat" checks
 *   if a Heartbeat document exists with the given _id. (If no
 *   _id is given, a unique _id is automatically created. As soon
 *   as _id is confirmed to have a value, heartbeat calls...
 * 
 *   deleteMeLater(_id)
 *     Checks if a debouncer function exists in the `hearts
 *     object for the given _id. If not, it adds one, which it
 *     calls 'beating'. In either case it calls...
 *   
 *   beating(_id)
 *     Returned by the debounce() function. This wraps a
 *     stillHeartbeat function inside a function returned by
 *     Meteor.bindEnvironment(), and then wraps that inside a
 *     a function inside a closure created by...
 * 
 *   debounce(...)
 *     Creates a closure containing a setTimeout call. The timeout
 *     is cleared and reset each time beating() is called. When
 *     the call to heartbeat is delayed, so deleteMeLater is not
 *     called, and so beating() is not called either, the timeout
 *     will trigger the call to...
 * 
 *   The function returned by Meteor.bindEnvironment()
 *     Stores the current Meteor environment inside a Fiber,
 *     and triggers (in the appropriate closure)...
 * 
 *   stillHeartbeat(_id)
 *     Removes _id and its associated `beating` debouncer function
 *     from the `hearts` object, so that it will not be called
 *     again, and removes the document with the id `_id` from the
 *     Heartbeat collection.
 *
 *     A subsequent call to the `heartbeat` Meteor method from the
 *     client with the same _id will recreate the document and
 *     start waiting for the next dropped connection.
 *
 * The _id's of the currently active clients can be found from
 * Object.keys(hearts).
 */


import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'

// <<< HARD-CODED
const ACTION = (_id) => {
  // DO SOMETHING MORE IMPORTANT HERE //
  console.log(`User ${_id} has left the building.`);
  console.log("Remaining users:", Object.keys(hearts))
}

const BEAT = 1000     // milliseconds between heartbeats
// HARD-CODED >>>

const LATE = BEAT * 2 // time to consider that heartbeat was missed

// Save a debouncer function for each client's heart
const hearts = {} // { <_id>: <debouncer function>, ...}


// Create MongoDB-free collection, with different settings on
// the server (subscription) and on the client (publication).
let Heartbeat


// PUBLICATION //  PUBLICATION //  PUBLICATION //  PUBLICATION //

if (Meteor.isServer) {
  Heartbeat = new Meteor.Collection('heartbeat', { connection: null })

  Meteor.publish('heartbeat', function(filter={}){
    // `publish` requires the classic function() {} syntax for `this`
    const subscription = this

    const publication = Heartbeat.find(filter).observeChanges({
      added: function (id, fields) {
        subscription.added("heartbeat", id, fields)
      },
      changed: function(id, fields) {
        subscription.changed("heartbeat", id, fields)
      },
      removed: function (id) {
        subscription.removed("heartbeat", id)
      }
    })

    subscription.ready()

    subscription.onStop(() => {
      publication.stop()
    })
  })
}


// SUBSCRIPTION // SUBSCRIPTION // SUBSCRIPTION // SUBSCRIPTION //

if (Meteor.isClient) {
  // The server connection for the Heartbeat collection is null:
  // No records are permanently stored.
  Heartbeat = new Meteor.Collection('heartbeat')  
  Meteor.subscribe('heartbeat')
}



// Heartbeat and heartbeat are imported by 
// imports/ui/components/Monitor.jsx
// This script is also loaded by server/main.js in order to
// access the heartbeat method on the server.
export default Heartbeat

  

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
    
    if (!existing) {
      _id = Heartbeat.insert({ _id })

      // <<< TROUBLESHOOTING ONLY. NOT STRICTLY REQUIRED
      console.log(`Heart started for user '${_id}'`);
      const hearts = Heartbeat.find({})
                              .fetch()
                              .map( heart => ` '${heart._id}'`)
      console.log(`All beating hearts: [${hearts} ]`)
      // TROUBLESHOOTING ONLY. NOT STRICTLY REQUIRED >>
    }
    
    deleteMeLater(_id)                       
    
    return {
      _id, // to be used for subsequent calls
      BEAT // to set milliseconds between heartbeat calls
    }
  }
}


Meteor.methods({
  "heart.beat": function (args) {
    heartBeat.validate.call(this, args)
    return heartBeat.run.call(this, args)
  }
})



// Create a debouncer function. This will be called immediately
// and on every heartbeat. The function that is debounced will
// only be called if the next heartbeat is delayed by at least
// LATE milliseconds.
export const deleteMeLater = (_id) => {  
  let beating = hearts[_id]

  const debounce = (debouncedFunction, delay = 300) => {
    let timeout
    
    return (...args) => {      
      clearTimeout(timeout);
  
      timeout = setTimeout(
        () => debouncedFunction.apply(null, args),
        delay
      );      
    };
  }

  if (!beating) {
    // On the server, the call to stillHeartbeat needs to be 
    // wrapped in a Fiber, otherwise an error will be thrown.
    // https://docs.meteor.com/api/environment.html#Meteor-EnvironmentVariable-withValue
    beating = debounce(Meteor.bindEnvironment(stillHeartbeat), LATE)
    hearts[_id] = beating
  } 

  beating(_id)
}


// This function will only be called if a heartbeat is missed
const stillHeartbeat = ( _id ) => {
  delete hearts[_id]
  
  let heart = { _id }

  const callback = (error, removedCount) => {
    if (error) {
      console.log("error", error);
    } else {
      ACTION(_id)
    }
  }

  Heartbeat.remove(heart, callback)
}