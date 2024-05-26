import { app } from './app.js'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
