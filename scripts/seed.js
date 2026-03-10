require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌  Задай MONGODB_URI в .env'); process.exit(1); }

const wordSchema = new mongoose.Schema({
  id:     { type: Number, required: true, unique: true },
  text:   { type: String, required: true },
  videos: { type: [String], required: true },
}, { versionKey: false });
wordSchema.index({ text: 'text' });
const Word = mongoose.model('Word', wordSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('🔗 Connected to MongoDB');

  const count = await Word.countDocuments();
  if (count > 0) {
    console.log(`ℹ️  Уже загружено ${count} слов. Пропускаю.`);
    console.log('   Чтобы перезалить: db.words.drop() → npm run seed');
    await mongoose.disconnect();
    return;
  }

  const words = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8')
  );
  console.log(`📦 Загружено ${words.length} слов из words.json`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < words.length; i += BATCH) {
    await Word.insertMany(words.slice(i, i + BATCH), { ordered: false });
    inserted += Math.min(BATCH, words.length - i);
    process.stdout.write(`\r   ${inserted}/${words.length}...`);
  }

  console.log(`\n🎉 Готово! Залито ${inserted} слов.`);
  await mongoose.disconnect();
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
