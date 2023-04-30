const States = require('./Models/States');
const statesData = require('./DB/statesData.json');
const connectDB = require('./DB/MongoConnection');
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
var cors = require('cors');

app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;
app.use(cors());


// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(__dirname + '/index.html');
});


app.get('/states', async (req, res) => {
    const isContig = req.query.contig === 'true';

    let filteredStates = statesData;
    if (isContig) {
        filteredStates = statesData.filter(state => state.code !== 'AK' && state.code !== 'HI');
    } else if (req.query.contig === 'false') {
        filteredStates = statesData.filter(state => state.code === 'AK' || state.code === 'HI');
    }

    try {
        const dbStates = await States.find();

        const dbStatesMap = dbStates.reduce((map, dbState) => {
            map[dbState.stateCode] = dbState;
            return map;
        }, {});

        const states = filteredStates.map(state => {
            const dbState = dbStatesMap[state.code];
            return dbState ? { ...state, funfacts: dbState.funfacts } : state;
        });

        res.json(states);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});



// app.get('/states/', async (req, res) => {
//     try {
//         const dbStates = await States.find();

//         const dbStatesMap = dbStates.reduce((map, dbState) => {
//             map[dbState.stateCode] = dbState;
//             return map;
//         }, {});

//         const states = statesData.map(state => {
//             const dbState = dbStatesMap[state.code];
//             return dbState ? { ...state, funfacts: dbState.funfacts } : state;
//         });

//         res.json(states);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });



app.get('/states/:state', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(state => state.code === stateCode);

    if (!state) {
        return res.status(404).json({ error: 'Invalid state abbreviation parameter' });
    }

    try {
        const dbState = await States.findOne({ stateCode: stateCode });
        if (dbState) {
            state.funfacts = dbState.funfacts;
        }
        res.json(state);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});





app.get('/states/:state/funfact', async (req, res) => {
    const stateCode = (req.params.state).toUpperCase();
    const state = statesData.find(state => state.code === stateCode);

    try {
        if (!state) {
            return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
        }

        const dbState = await States.findOne({ stateCode });
        if (dbState) {
            const funfacts = dbState.funfacts;
            const randomFact = funfacts[Math.floor(Math.random() * funfacts.length)];
            res.json({ funfact: randomFact });
        } else {
            res.json({ message: `No Fun Facts found for ${state.state}` });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});




app.get('/states/:state/capital', (req, res) => {
    const stateCode = (req.params.state).toUpperCase();

    // Check if the state abbreviation is valid
    const state = statesData.find(state => state.code === stateCode);
    if (!state) {
        res.status(400).json({ message: 'Invalid state abbreviation parameter' });
        return;
    }

    res.send({ state: state.state, capital: state.capital_city });
});


app.get('/states/:state/nickname', (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(state => state.code === stateCode);

    if (!state) {
        res.status(400).json({ message: 'Invalid state abbreviation parameter' });
        return;
    }

    const nickname = state.nickname;
    res.send({ state: state.state, nickname: nickname });
});



app.get('/states/:state/population', (req, res) => {
    const stateCode = (req.params.state).toUpperCase();
    const state = statesData.find(s => s.code === stateCode);

    if (!state) {
        res.status(400).json({ message: 'Invalid state abbreviation parameter' });
        return;
    }

    const populationString = state.population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    res.send({ state: state.state, population: populationString });
});




app.get('/states/:state/admission', (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData?.find(s => s.code === stateCode);

    if (!state) {
        res.status(400).json({ message: 'Invalid state abbreviation parameter' });
    }

    res.send({ state: state.state, admitted: state.admission_date });
});


app.post('/states/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const funfacts = req.body.funfacts;

    if (!Array.isArray(funfacts)) {
        res.status(400).json({ message: 'State fun facts value must be an array' });
        return;
    }

    try {
        const state = statesData.find(s => s.code === stateCode);

        if (!state) {
            res.status(400).json({ message: 'Invalid state abbreviation parameter' });
            return;
        }

        const existingState = await States.findOne({ stateCode: stateCode });

        let newState;
        if (!existingState) {
            const mongoObject = {
                stateCode: state.code,
                funfacts: funfacts,
            };
            newState = await States.create(mongoObject);
        } else {
            existingState.funfacts.push(...funfacts.filter(f => !existingState.funfacts.includes(f)));
            await existingState.save();
            newState = existingState;
        }

        res.json(newState);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});



app.patch('/states/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const { index, funfacts } = req.body;

    try {
        const state = statesData.find(s => s.code === stateCode);

        if (!state) {
            return res.status(404).json({ message: "Invalid state abbreviation parameter" });
        }

        if (!index) {
            return res.status(400).json({ error: 'State fun fact index value required' });
        }

        let stateFromDB = await States.findOne({ stateCode: stateCode });

        if (!stateFromDB) {
            return res.status(404).json({ message: "No Fun Facts found for " + state.state });
        }

        const adjustedIndex = index - 1;

        if (adjustedIndex < 0 || adjustedIndex >= stateFromDB.funfacts.length) {
            return res.status(400).json({ message: "No Fun Facts found for " + state.state });
        }

        if (!funfacts || !Array.isArray(funfacts) || funfacts.length === 0) {
            return res.status(400).json({ message: "State fun fact value required" });
        }

        stateFromDB.funfacts[adjustedIndex] = funfacts[0];
        await stateFromDB.save();

        res.json(stateFromDB);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});






app.delete('/states/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const { index } = req.body;

    try {
        const state = statesData.find(s => s.code === stateCode);

        if (!state) {
            return res.status(404).json({ message: "Invalid state abbreviation parameter" });
        }

        if (!index) {
            return res.status(400).json({ error: 'State fun fact index value required' });
        }

        const adjustedIndex = index - 1;

        let stateFromDB = await States.findOne({ stateCode: stateCode });


        if (!stateFromDB) {
            return res.status(404).json({ message: "No Fun Facts found for " + state.state });
        }


        if (!stateFromDB.funfacts[adjustedIndex]) {
            return res.status(404).json({ error: 'No Fun Facts found for ' + state.state });
        }

        stateFromDB.funfacts.splice(adjustedIndex, 1);

        await stateFromDB.save();
        res.json(stateFromDB);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});





// catch-all route for 404 errors
app.get('*', (req, res) => {
    res.status(404).sendFile(__dirname + '/404.html');
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


