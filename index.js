require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()


app.use(express.json())
app.use(cors())
app.use(express.static('build'))
app.use(morgan('tiny'))
morgan.token('body', (req, res) => {
    return JSON.stringify(req.body)
})

app.get('/', (req, res) => {
    res.send('<h1>NICE</h1>')
})

app.get('/info', (req, res) => {
    Person.countDocuments({}, (err, count) => {
        res.send(`<p>Phonebook has info for ${count} people</p><p>${new Date()}</p>`)
    })
})

app.get('/api/persons', (req, res, next) => {
    Person.find({})
        .then(result => {
            res.json(result.map(person => person.toJSON()))
        })
        .catch(err => next(err))
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id)
        .then(person => {
            if (person) {
                res.json(person.toJSON())
            } else {
                res.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
    const body = req.body

    if (!body.name || !body.number) {
        return res.status(400).json({
            error: 'name or number missing'
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save()
        .then(savedPerson => savedPerson.toJSON())
        .then(savedAndFormattedPerson => res.json(savedAndFormattedPerson))
        .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
    const body = req.body

    const person = {
        name: body.name,
        number: body.number
    }

    Person.findByIdAndUpdate(req.params.id, person, { new: true })
        .then(updatedPerson => updatedPerson.toJSON())
        .then(updatedAndFormattedPerson => res.json(updatedAndFormattedPerson))
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndRemove(req.params.id)
        .then(result => {
            res.status(204).end()
        })
        .catch(error => next(error))
})

const errorHandler = (error, req, res, next) => {
    console.error(error.message)

    if (error.name === 'Cast Error' && error.kind === 'ObjectId') {
        return res.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)  
})


