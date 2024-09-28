const express = require('express');
const app = express();
const translate = require('node-google-translate-skidz');

const cors = require('cors');
app.use(cors());

app.use(express.static('public'));

/*app.get('/', (req, res) => {
  res.send('¡Hello World!');
});*/

async function translateText(text) {
    if (!text) return '';
    try {
        const response = await translate({
            text: text,
            source: 'en', // Idioma de origen (puedes cambiarlo según sea necesario)
            target: 'es'  // Idioma de destino (español)
        });
        return response.translation;
    } catch (error) {
        console.error('Error translating text:', error);
        return text; // Devuelve el texto original en caso de error
    }
}

// Ruta para la traducción
app.get('/translate', async (req, res) => {
    const text = req.query.text;
    const translatedText = await translateText(text);
    res.json({ translatedText });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});