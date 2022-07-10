// https://www.freecodecamp.org/news/javascript-debounce-example/

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

// // USAGE //
// function postBounce(a,b,c){
//   console.log('Done', a, b, c);
// }
// const processChange = debounce(postBounce);
// for ( let ii = 0; ii < 1000; ii += 1 ) {
//   processChange(2,3,4)
// }
// // Will print Done 2 3 4 after bouncing is done


export {
  debounce
}