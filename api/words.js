const express = require('express');
const router  = express.Router();
const connectDB = require('./db');
const Word = require('./Word');

const CAT_REGEX = {
  greet:  /привет|здравствуй|добр|пока|имя|пожалуйста|спасибо|прости|извини|как дела|встреч/i,
  nums:   /число|сколько|цифр/i,
  family: /мама|папа|брат|сестр|дедуш|бабуш|сын|дочь|муж|жена|семья|ребенок|дети|родитель|тёт|дяд/i,
  body:   /голова|рука|нога|глаз|ухо|нос|рот|зуб|шея|спина|сердце|живот|палец/i,
  food:   /хлеб|вода|молоко|мясо|рыба|овощ|фрукт|суп|чай|кофе|сок|еда|обед|завтрак|ужин|есть|пить/i,
  time:   /сегодня|завтра|вчера|утро|вечер|ночь|день|неделя|месяц|год|час|минута|сейчас|когда|время/i,
  emot:   /радость|грусть|злой|счастл|любовь|страх|удивл|плакать|смеяться|чувств|плохо|хорошо|нравится/i,
  jobs:   /врач|учитель|полицей|пожарн|водитель|инженер|повар|юрист|директор|начальник|студент/i,
  home:   /квартира|комната|кухня|ванна|туалет|шкаф|кровать|диван|мебель|полка|плита|холодильник/i,
  med:    /больниц|болезн|лекарств|операц|температур|боль|здоровь|аптек|скорая|укол|таблетк/i,
  trans:  /машина|автобус|поезд|самолет|метро|такси|велосипед|водитель|билет|остановк/i,
};

router.get('/', async (req, res) => {
  try {
    await connectDB();
    const { cat = 'all', q = '' } = req.query;
    const filter = {};
    if (q.trim()) filter.text = { $regex: q.trim(), $options: 'i' };
    if (cat !== 'all' && CAT_REGEX[cat]) {
      const catFilter = { text: CAT_REGEX[cat] };
      if (filter.text) { filter.$and = [{ text: filter.text }, catFilter]; delete filter.text; }
      else filter.text = CAT_REGEX[cat];
    }
    const words = await Word.find(filter, { _id: 0 }).sort({ id: 1 }).lean();
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.json(words);
  } catch (err) { console.error(err); res.status(500).json({ error: 'DB error' }); }
});

router.get('/search', async (req, res) => {
  try {
    await connectDB();
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const words = await Word.find({ text: { $regex: q, $options: 'i' } }, { _id: 0, id: 1, text: 1 }).sort({ id: 1 }).limit(10).lean();
    res.json(words);
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
});

router.get('/random', async (req, res) => {
  try {
    await connectDB();
    const n = Math.min(50, parseInt(req.query.n) || 4);
    const exclude = (req.query.exclude || '').split(',').map(Number).filter(Boolean);
    const filter = exclude.length ? { id: { $nin: exclude } } : {};
    const words = await Word.aggregate([{ $match: filter }, { $sample: { size: n } }, { $project: { _id: 0 } }]);
    res.json(words);
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    await connectDB();
    const word = await Word.findOne({ id: parseInt(req.params.id) }, { _id: 0 }).lean();
    if (!word) return res.status(404).json({ error: 'Not found' });
    res.json(word);
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
});

module.exports = router;
