require('dotenv').config();
const express    = require('express');
const compression = require('compression');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors({origin:'*'}));
app.use(express.json());
app.use((req,res,next)=>{
  if(req.path.startsWith('/api/')){
    res.setHeader('X-Content-Type-Options','nosniff');
  }
  next();
});

// API
app.use('/api/words', require('./api/words'));

// Статика (index.html — без words.json, данные идут через API)
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () => console.log(`✅  http://localhost:${PORT}`));
module.exports = app;
