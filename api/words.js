const express = require('express');
const router  = express.Router();
const connectDB = require('./db');
const Word = require('./Word');

// Категории → regex
const CAT_REGEX = {
  tool:  /молоток|пила|ножниц|нож$|ножовка|дрель|сверло|плоскогубц|кусачки|монтировка|напильник|гвоздезабив/i,
  build: /стена|крыша|дверь|пол|потолок|фундамент|кирпич|штукатурк|цемент|бетон|каркас|балка|колонна/i,
  wood:  /дерев|древесин|берёз|береза|дуб|красное дерево|доска|плинтус|вагонка|хвойн/i,
  metal: /сталь|железо|медь|хром|алюмин|нержавеющ|металл|гвоздь|шуруп|гайка|болт|шарнир/i,
  size:  /метр|сантиметр|миллиметр|длина|ширина|высота|объём|объем|площадь|дециметр|размер|квадратн/i,
  mat:   /пластик|резина|стекло|силикон|нейлон|мрамор|эпоксид|лак|краска|клей|герметик/i,
  elec:  /кабель|провод|розетк|электр|лампоч|щит/i,
  plumb: /труб|водопровод|кран|насос|шланг|вентиль|фитинг/i,
};

// ── GET /api/words?cat=all  →  все слова (для фронта) ────────────
// Возвращает весь список сразу, как сейчас, но из MongoDB
router.get('/', async (req, res) => {
  try {
    await connectDB();
    const { cat = 'all', q = '' } = req.query;

    const filter = {};

    // Текстовый поиск
    if (q.trim()) {
      filter.text = { $regex: q.trim(), $options: 'i' };
    }

    // Фильтр по категории
    if (cat !== 'all' && CAT_REGEX[cat]) {
      // Если уже есть фильтр по тексту — добавляем AND через $and
      const catFilter = { text: CAT_REGEX[cat] };
      if (filter.text) {
        filter.$and = [{ text: filter.text }, catFilter];
        delete filter.text;
      } else {
        filter.text = CAT_REGEX[cat];
      }
    }

    const words = await Word.find(filter, { _id: 0 }).sort({ id: 1 }).lean();
    res.json(words);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ── GET /api/words/search?q=текст  →  автокомплит ───────────────
router.get('/search', async (req, res) => {
  try {
    await connectDB();
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const words = await Word
      .find({ text: { $regex: q, $options: 'i' } }, { _id: 0, id: 1, text: 1 })
      .sort({ id: 1 })
      .limit(10)
      .lean();

    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// ── GET /api/words/random?n=4&exclude=1,2,3  →  для квиза ───────
router.get('/random', async (req, res) => {
  try {
    await connectDB();
    const n = Math.min(50, parseInt(req.query.n) || 4);
    const exclude = (req.query.exclude || '')
      .split(',').map(Number).filter(Boolean);

    const filter = exclude.length ? { id: { $nin: exclude } } : {};
    const words = await Word.aggregate([
      { $match: filter },
      { $sample: { size: n } },
      { $project: { _id: 0 } },
    ]);

    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// ── GET /api/words/:id ───────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    await connectDB();
    const word = await Word.findOne(
      { id: parseInt(req.params.id) },
      { _id: 0 }
    ).lean();
    if (!word) return res.status(404).json({ error: 'Not found' });
    res.json(word);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
