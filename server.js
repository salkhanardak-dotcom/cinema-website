const express = require("express");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* =======================
   DATABASE (Деректер қоры)
======================= */
const db = new sqlite3.Database("./database.db");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        )
    `);
});

// Ортақ дизайн үшін айнымалы (CSS)
const CSS_STYLE = `
<style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #141414; color: #fff; margin: 0; padding: 40px; display: flex; flex-direction: column; align-items: center; }
    h1, h2, h3 { color: #e50914; text-shadow: 2px 2px 4px rgba(0,0,0,0.6); }
    .card { background: #1f1f1f; border-radius: 8px; padding: 20px; margin: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); width: 320px; transition: 0.3s; border: 1px solid #333; }
    .card:hover { transform: translateY(-5px); border-color: #e50914; }
    .btn { background: #e50914; color: white; border: none; padding: 10px 25px; font-weight: bold; border-radius: 4px; cursor: pointer; transition: 0.2s; }
    .btn:hover { background: #b80710; }
    .btn-secondary { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-secondary:hover { background: #555; }
    input { width: 100%; padding: 10px; margin: 10px 0; background: #333; border: 1px solid #444; color: white; border-radius: 4px; box-sizing: border-box; }
    input:focus { border-color: #e50914; outline: none; }
    .flex-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; }
    .seat-row { display: flex; gap: 10px; justify-content: center; margin-bottom: 10px; }
    .ticket { border: 2px dashed #e50914; padding: 25px; width: 350px; background: #222; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.7); position: relative; }
    .ticket::before, .ticket::after { content: ''; position: absolute; top: 50%; width: 20px; height: 20px; background: #141414; border-radius: 50%; }
    .ticket::before { left: -11px; } .ticket::after { right: -11px; }
</style>
`;

/* =======================
   MOVIES DATA (Кинолар тізімі)
======================= */
let movies = [
    { id: 1, title: "Avengers: Endgame", rating: 9.2, price: 1500, img: "🎬" },
    { id: 2, title: "Interstellar", rating: 9.5, price: 2000, img: "🚀" },
    { id: 3, title: "The Dark Knight", rating: 8.7, price: 1200, img: "🦇" },
];

let selectedMovie = null;
let selectedCinema = null;
let selectedSeat = null;

const seats = [
    ["A1","A2","A3","A4","A5","A6"],
    ["B1","B2","B3","B4","B5","B6"],
    ["C1","C2","C3","C4","C5","C6"],
    ["VIP1","VIP2","VIP3","VIP4","VIP5","VIP6"],
];

/* =======================
   HOME PAGE (Авторизация және Кино таңдау бәрі бір жерде)
======================= */
app.get("/", (req, res) => {
    let sorted = [...movies].sort((a, b) => b.rating - a.rating);
    
    res.send(`
        ${CSS_STYLE}
        <h1>🍿 КИНЕМАТОГРАФ ЖҮЙЕСІ</h1>
        
        <div class="flex-container" style="margin-bottom: 40px;">
            <div class="card">
                <h3>🔐 Тіркелу</h3>
                <form method="POST" action="/auth/register">
                    <input name="name" placeholder="Атыңыз" required />
                    <input name="email" placeholder="Email" type="email" required />
                    <input name="password" placeholder="Құпия сөз" type="password" required />
                    <button class="btn">Тіркелу</button>
                </form>
            </div>
            
            <div class="card">
                <h3>🚪 Жүйеге кіру</h3>
                <form method="POST" action="/auth/login">
                    <input name="email" placeholder="Email" type="email" required />
                    <input name="password" placeholder="Құпия сөз" type="password" required />
                    <button class="btn" style="background: #0080ff;">Кіру</button>
                </form>
            </div>
        </div>

        <hr style="width: 80%; border: 1px solid #333; margin-bottom: 30px;">

        <h2>🎬 Қазір көрсетілімдегі фильмдер</h2>
        <div class="flex-container">
            ${sorted.map(m => `
                <div class="card">
                    <div style="font-size: 50px; text-align: center;">${m.img}</div>
                    <h2>${m.title}</h2>
                    <p style="color: #ffcc00;">⭐ Рейтинг: ${m.rating} / 10</p>
                    <p>💰 Билет бағасы: <b>${m.price} ₸</b></p>
                    <form method="POST" action="/movie">
                        <input type="hidden" name="id" value="${m.id}">
                        <button class="btn" style="width:100%;">Билет брондау</button>
                    </form>
                </div>
            `).join("")}
        </div>
    `);
});

/* AUTH PROCESSORS */
app.post("/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hash], (err) => {
        if (err) return res.send(`${CSS_STYLE} <div class="card"><h3>❌ Қателік</h3><p>Мұндай қолданушы бар немесе деректер дұрыс емес.</p><a href="/" class="btn-secondary">Қайту</a></div>`);
        res.send(`${CSS_STYLE} <div class="card"><h3>✅ Сәтті!</h3><p>Тіркелу сәтті аяқталды. Төмендегі батырмамен артқа қайтып кіріңіз.</p><a href="/" class="btn-secondary">Басты бет</a></div>`);
    });
});

app.post("/auth/login", (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.send(`${CSS_STYLE} <div class="card"><h3>❌ Қателік</h3><p>Email немесе құпия сөз қате!</p><a href="/" class="btn-secondary">Қайта көру</a></div>`);
        }
        res.send(`${CSS_STYLE} <div class="card"><h3>✅ Қош келдіңіз, ${user.name}!</h3><p>Жүйеге сәтті кірдіңіз. Енді төменнен кино таңдай аласыз.</p><a href="/" class="btn-secondary">Киноларды көру</a></div>`);
    });
});

app.post("/movie", (req, res) => {
    selectedMovie = movies.find(m => m.id == req.body.id);
    res.redirect("/cinema");
});

/* =======================
   CINEMA PAGE (Кинотеатр таңдау)
======================= */
app.get("/cinema", (req, res) => {
    if (!selectedMovie) return res.redirect("/");
    res.send(`
        ${CSS_STYLE}
        <h1>🏢 КИНОТЕАТР ТАҢДАУ</h1>
        <p style="font-size: 18px;">Фильм: <b style="color:#e50914;">${selectedMovie.title}</b></p>
        
        <form method="POST" action="/cinema" style="display: flex; gap: 20px; margin-top: 30px;">
            <button name="cinema" value="Mega Cinema" class="btn" style="padding: 20px 30px;">🌐 Mega Cinema (ALMATY)</button>
            <button name="cinema" value="Esentai IMAX" class="btn" style="padding: 20px 30px; background: #0080ff;">💎 Esentai IMAX</button>
            <button name="cinema" value="Kinopark 11" class="btn" style="padding: 20px 30px; background: #e5a909;">🍿 Kinopark 11</button>
        </form>
    `);
});

app.post("/cinema", (req, res) => {
    selectedCinema = req.body.cinema;
    res.redirect("/seats");
});

/* =======================
   SEATS PAGE (Орын таңдау)
======================= */
app.get("/seats", (req, res) => {
    if (!selectedMovie || !selectedCinema) return res.redirect("/");
    res.send(`
        ${CSS_STYLE}
        <h1>🪑 ОРЫН ТАҢДАУ СХЕМАСЫ</h1>
        <p>🎬 Кино: <b>${selectedMovie.title}</b> | 🏢 Кинотеатр: <b>${selectedCinema}</b></p>
        
        <div style="background: #333; width: 400px; text-align: center; padding: 5px; margin: 30px 0; border-radius: 0 0 50% 50%; font-weight: bold; font-size: 12px; color: #aaa;">
            ЭКРАН ОЫНДА
        </div>

        <div style="margin-top: 20px;">
            ${seats.map(row => `
                <div class="seat-row">
                    ${row.map(s => `
                        <form method="POST" action="/seat" style="margin:0">
                            <input type="hidden" name="seat" value="${s}">
                            <button style="width:55px; height:40px; cursor:pointer; background:${s.includes("VIP") ? "#ffcc00" : "#2ecc71"}; color: #000; font-weight: bold; border: none; border-radius: 5px; transition: 0.2s;">
                                ${s}
                            </button>
                        </form>
                    `).join("")}
                </div>
            `).join("")}
        </div>
        
        <div style="margin-top: 30px; display: flex; gap: 20px; font-size: 14px;">
            <div><span style="display:inline-block; width:15px; height:15px; background:#2ecc71; border-radius:3px;"></span> Кәдімгі орын</div>
            <div><span style="display:inline-block; width:15px; height:15px; background:#ffcc00; border-radius:3px;"></span> VIP Орын</div>
        </div>
    `);
});

app.post("/seat", (req, res) => {
    selectedSeat = req.body.seat;
    res.redirect("/payment");
});

/* =======================
   PAYMENT PAGE (Төлем жасау)
======================= */
app.get("/payment", (req, res) => {
    if (!selectedMovie || !selectedCinema || !selectedSeat) return res.redirect("/");
    res.send(`
        ${CSS_STYLE}
        <h1>💳 ҚАУІПСІЗ ТӨЛЕМ ЖАСАУ</h1>
        
        <div class="card" style="width: 350px;">
            <h3 style="margin-top:0; text-align:center;">Тапсырыс мәліметі</h3>
            <p>🎬 Фильм: <b>${selectedMovie.title}</b></p>
            <p>🏢 Кинотеатр: <b>${selectedCinema}</b></p>
            <p>🪑 Таңдалған орын: <b style="color: #ffcc00;">${selectedSeat}</b></p>
            <p>💵 Төлем соммасы: <b style="font-size: 20px; color:#e50914;">${selectedMovie.price} ₸</b></p>
        </div>

        <div class="card" style="width: 350px;">
            <form method="POST" action="/pay">
                <label>Карта нөмірі:</label>
                <input name="card" placeholder="4400 4321 8765 0987" max-length="16" required />
                <div style="display: flex; gap: 10px;">
                    <div>
                        <label>Мерзімі:</label>
                        <input placeholder="12/28" required />
                    </div>
                    <div>
                        <label>CVV:</label>
                        <input name="cvv" placeholder="***" type="password" max-length="3" required />
                    </div>
                </div>
                <label>Электронды пошта (билет жіберу үшін):</label>
                <input name="email" placeholder="myself@example.com" type="email" required />
                <button class="btn" style="width: 100%; margin-top: 15px; font-size: 16px;">Билетті сатып алу</button>
            </form>
        </div>
    `);
});

/* =======================
   TICKET GENERATOR (Соңғы Билетті шығару)
======================= */
app.post("/pay", (req, res) => {
    if (!selectedMovie || !selectedCinema || !selectedSeat) return res.redirect("/");
    let ticketId = Math.floor(Math.random() * 899999) + 100000;
    
    res.send(`
        ${CSS_STYLE}
        <h1 style="color: #2ecc71;">🎉 ТӨЛЕМ СӘТТІ ӨТТІ!</h1>
        <p>Сіздің электронды билетіңіз дайын:</p>
        
        <div class="ticket">
            <h2 style="text-align: center; margin-top: 0; letter-spacing: 2px;">CINEMA TICKET</h2>
            <div style="text-align: center; font-size: 35px; margin-bottom: 20px;">🍿🎟️</div>
            <p>🆔 Билет нөмірі: <b style="color: #ffcc00;">#${ticketId}</b></p>
            <p>🎬 Фильм: <b>${selectedMovie.title}</b></p>
            <p>🏢 Кинотеатр: <b>${selectedCinema}</b></p>
            <p>🪑 Орын / Схема: <b style="background:#fff; color:#000; padding:2px 6px; border-radius:3px;">${selectedSeat}</b></p>
            <hr style="border: 1px dashed #444; margin: 15px 0;">
            <p style="text-align: center; font-size: 12px; color: #aaa;">📋 Кинотеатрға кіре берісте осы кодты көрсетіңіз.</p>
        </div>
        <br><br>
        <a href="/" class="btn-secondary">🔙 Басты бетке қайту</a>
    `);
});

/* =======================
   START SERVER
======================= */
app.listen(3000, () => {
    console.log("🚀 Сервер мына сілтемеде сәтті қосылды: http://localhost:3000");
});
