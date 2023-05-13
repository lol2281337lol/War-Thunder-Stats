import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
const app = express();
const port = 3000;

app.use(cors());

app.get('/fetch-data/:account', async (req, res) => {
  const { account } = req.params;
  const urls = [
    `https://thunderskill.com/ru/stat/${account}/vehicles/a#type=army&role=all&country=all`
  ];

  try {
    const data = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        const text = await response.text();
        return text;
      })
    );

    res.json({ data });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
