var p = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1)
  }, 200)
})
  .then(v => {
    console.log(v)

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(2)
      }, 200)
    })
  })
  .then(console.log)
