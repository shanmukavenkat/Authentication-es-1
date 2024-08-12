const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializerDbserver = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('The server is running http://localhost:3000/')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}
initializerDbserver()

//user register
//api 1

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)

  const selectUserQuery = `
    SELECT 
    * 
    FROM 
    user 
    WHERE 
    username = '${username}';`

  const dbUser = await db.get(selectUserQuery)

  // Checking the password length
  if (password.length < 5) {
    response.status(400)
    response.send('Password is too short')
    return
  } else if (dbUser) {
    response.status(400)
    response.send('User already exists')
  } else if (dbUser === undefined) {
    // Create the user
    const createUser = `INSERT INTO 
        user(username, name, password, gender, location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}');`

    await db.run(createUser)
    response.status(200)
    response.send('User created successfully')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectQuery = `SELECT 
    * 
    FROM 
    user 
    WHERE 
    username = '${username}';`
  const dbUser = await db.get(selectQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const userQuery = `SELECT 
    * 
  FROM 
    user 
  WHERE
    username = '${username}';`

  const dbUser = await db.get(userQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const passwordCheck = await bcrypt.compare(oldPassword, dbUser.password)

    if (passwordCheck === true) {
      if (newPassword.length > 5) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)

        const updateQuery = `UPDATE
          user
        SET
          password = '${hashedNewPassword}'
        WHERE
          username = '${username}';`

        await db.run(updateQuery)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
