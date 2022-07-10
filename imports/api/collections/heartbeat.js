import { Meteor } from 'meteor/meteor'

let Heartbeat


// Heartbeat = new Mongo.Collection('heartbeat');


// if (Meteor.isServer) {
//   Meteor.publish('heartbeat', () => Heartbeat.find({}));
// }


// if (Meteor.isClient) {
//   Meteor.subscribe("heartbeat")
// }



// let Heartbeat // MongoDB-free collection



// PUBLICATION // PUBLICATION // PUBLICATION // PUBLICATION //

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
        console.log(`subscription.removed("heartbeat", "${id}")`)
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
  Heartbeat = new Meteor.Collection('heartbeat') // connection undefined
  Meteor.subscribe('heartbeat')
}


export default Heartbeat