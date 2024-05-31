import { app } from './app.js'

const port = process.env.PORT === undefined ? 8080 : parseInt(process.env.PORT, 10)

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
