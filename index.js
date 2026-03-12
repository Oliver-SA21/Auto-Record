const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('frontend/index');
});

app.get('/checador', (req, res) => {
    res.render('frontend/checador');
});

app.get('/chofer', (req, res) => {
    res.render('frontend/chofer');
});

app.get('/descargas', (req, res) => {
    res.render('frontend/Descargas');
});

app.get('/funciones', (req, res) => {
    res.render('frontend/Funciones');
});

app.get('/informacion', (req, res) => {
    res.render('frontend/informacion');
});

app.get('/nosotros', (req, res) => {
    res.render('frontend/Nosotros');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});