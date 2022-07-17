const characters = 
"ABCDEFGHIJKLMNOPQRSTUVYXYZabcdefghijklmnopqrstuvwxyz0123456789$_"
const max = characters.length


const uuid = (length = 16) => {
  let output = ""
  
  for ( let ii = 0; ii < length; ii += 1 ) {
    output += characters[Math.floor(Math.random() * max)]
  }
  
  return output
}


export { uuid }
