
/*-----------------
     modulos
------------------*/
const express = require('express');
const handlebars = require('express-handlebars');
const mongoose = require('mongoose');
const path = require('path');
const admin = require('./routes/admin');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
require('./models/Postagem');
const Postagem = mongoose.model('postagens');
require('./models/Categoria');
const Categoria = mongoose.model('categorias');
const usuarios = require('./routes/usuario');
const passport = require('passport');
require('./config/auth')(passport);
/*-----------------
    configurações
------------------*/
//sessão
app.use(session({
    secret: "cursodenode",
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

//body parser mas não
app.use(express.urlencoded({ extended: false }));

//handlebars
app.engine('handlebars', handlebars.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

//Mongoose
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1/blogapp").then(function () {
    console.log("MongoDB conectado.");
}).catch(function (erro) {
    console.log("Houve um erro de conexão:" + erro);
});

//Public



app.use(express.static(path.join(__dirname, "public")));
/*-----------------
     rotas
------------------*/
app.get('/', (req, res) => {
    Postagem.find().populate('categoria').sort({ data: 'desc' }).lean().then((postagens) => {
        res.render('index', { postagens: postagens });
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno');
        res.redirect('/404');
    });
});

app.get('/404', (req, res) => {
    res.send('Error 404!');
})

app.use('/admin', admin);
app.use('/usuarios', usuarios);

app.get('/postagem/:slug', (req, res) => {
    Postagem.findOne({ slug: req.params.slug }).lean().then((postagem) => {
        if (postagem) {
            res.render('postagem/index', { postagem: postagem });
        } else {
            req.flash('error_msg', 'Esta postagem não existe!');
            res.redirect('/');
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno.');
        res.redirect('/');
    });
});

app.get('/categorias', (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render('categorias/index', { categorias: categorias });
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno ao listar as categorias.');
        res.redirect('/');
    });
});

app.get('/categorias/:slug', (req, res) => {
    Categoria.findOne({ slug: req.params.slug }).lean().then((categoria) => {
        if (categoria) {
            Postagem.find({ categoria: categoria._id }).lean().then((postagens) => {
                res.render('categorias/postagens', { postagens: postagens, categoria: categoria });
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro ao listar os posts!');
                res.redirect('/');
            })
        } else {
            req.flash('error_msg', 'Esta categoria não existe.');
            res.redirect('/');
        }
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao carregar a página desta categoria.');
        res.redirect('/');
    });
});


/*-----------------
    outros
------------------*/
const PORT = 8080;

app.listen(PORT, function () {
    console.log("Servidor rodando na URL http://localhost:" + PORT);
});