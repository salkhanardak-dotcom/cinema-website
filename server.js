const express = require("express");
const session = require("express-session");
const fs = require("fs"); 
const path = require("path");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'cinema-secret-key',
  resave: false,
  saveUninitialized: true
}));

let movies = [
  { id: 1, title: "Мстители: Финал", rating: 9.2, price: 2500, sessions: ["18:00", "20:00", "22:00"] },
  { id: 10, title: "Пассажир", rating: 7.8, price: 2100, sessions: ["18:00", "21:00"] },
  { id: 11, title: "Грязные деньги", rating: 8.0, price: 2300, sessions: ["17:00", "20:00"] },
  { id: 3, title: "Бэтмен", rating: 8.7, price: 2400, sessions: ["16:00", "19:00", "22:00"] },
  { id: 4, title: "Астрал: Последний ключ", rating: 7.0, price: 2200, sessions: ["18:00", "20:00", "22:00"] },
  { id: 5, title: "Аватар: Путь воды", rating: 8.8, price: 3200, sessions: ["15:00", "18:00", "21:00"] },
  { id: 6, title: "Клинок рассекающий демонов", rating: 9.1, price: 3000, sessions: ["14:00", "17:00", "20:00"] },
  { id: 12, title: "Следствие ведут овечки", rating: 7.5, price: 1800, sessions: ["16:00", "19:00"] },
  { id: 7, title: "Дьявол носит Prada 2", rating: 8.4, price: 2600, sessions: ["18:00", "20:00", "22:00"] },
  { id: 13, title: "Майкл", rating: 8.3, price: 2500, sessions: ["18:30", "21:30"] },
  { id: 8, title: "Osh 2 (Ош 2)", rating: 8.1, price: 2300, sessions: ["17:00", "20:00", "22:00"] },
  { id: 9, title: "Маңғыстау Экспресі", rating: 8.6, price: 2500, sessions: ["16:00", "19:00", "21:00"] }
];

const cinemas = {
  Mega: "Mega Park, Алматы",
  City: "City Cinema, Алматы",
  Almaty: "Lumiera Cinema, ЦУМ, Алматы"
};

const seats = [
  ["A1","A2","A3","A4","A5","A6"],
  ["B1","B2","B3","B4","B5","B6"],
  ["C1","C2","C3","C4","C5","C6"],
  ["VIP1","VIP2","VIP3","VIP4","VIP5","VIP6"]
];

const pageStyle = `
<style>
body { 
  background: linear-gradient(135deg, #1c0505 0%, #2b110c 50%, #170404 100%); 
  color: #f5f0eb; 
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
  text-align: center; 
  padding: 40px 20px; 
}
.card { 
  background: rgba(46, 17, 13, 0.7); 
  padding: 25px; 
  margin: 25px auto; 
  border-radius: 18px; 
  width: 420px; 
  border: 1px solid #542218; 
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
h1 { font-size: 2.4rem; font-weight: 800; color: #ff5252; text-shadow: 0 2px 10px rgba(255,82,82,0.3); margin-bottom: 20px; }
h2 { font-size: 1.8rem; font-weight: 700; color: #fff; margin-bottom: 15px; }
h3 { font-size: 1.4rem; color: #d1b8a5; }
p { font-size: 1.2rem; margin: 12px 0; color: #e3d5ca; }
button { 
  background: #a82316; 
  color: #fff; 
  border: none; 
  padding: 12px 28px; 
  border-radius: 10px; 
  cursor: pointer; 
  font-weight: bold; 
  font-size: 1.1rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(168,35,22,0.3);
}
button:hover { background: #d93829; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(217,56,41,0.4); }
a { color: #ff5252; text-decoration: none; font-weight: bold; font-size: 1.2rem; display: inline-block; margin-top: 20px; transition: color 0.2s; }
a:hover { color: #ff7979; }
input { 
  padding: 12px; 
  background: #1f0a07; 
  color: white; 
  border: 1px solid #542218; 
  border-radius: 8px; 
  width: 300px; 
  font-size: 1.1rem;
  outline: none;
}
input:focus { border-color: #ff5252; box-shadow: 0 0 8px rgba(255,82,82,0.5); }
.cinema-btn-group { display: flex; justify-content: center; flex-direction: column; gap: 15px; max-width: 350px; margin: 30px auto; }
</style>
`;

app.get("/", (req, res) => {
  let sorted = [...movies].sort((a,b)=>b.rating-a.rating);
  res.send(`
  ${pageStyle}
  <h1>🎬 CINEMA PRO MAX — Главная / Басты бет</h1>
  <h3>Выберите фильм / Фильм таңдаңыз:</h3>
  ${sorted.map(m=>`
    <div class="card">
      <h2>${m.title}</h2>
      <p>⭐ Рейтинг: ${m.rating}</p>
      <p>💰 Цена / Бағасы: ${m.price} ₸</p>
      <form method="POST" action="/movie">
        <input type="hidden" name="id" value="${m.id}">
        <button>Выбрать / Таңдау</button>
      </form>
    </div>
  `).join("")}
  `);
});

app.post("/movie",(req,res)=>{
  req.session.selectedMovie = movies.find(m=>m.id==req.body.id);
  res.redirect("/cinema");
});

app.get("/cinema",(req,res)=>{
  res.send(`
  ${pageStyle}
  <h1>🏢 Выберите кинотеатр / Кинотеатр таңдаңыз</h1>
  <form method="POST" action="/cinema" class="cinema-btn-group">
    <button name="cinema" value="Mega">Mega Cinema</button>
    <button name="cinema" value="City">City Cinema</button>
    <button name="cinema" value="Almaty">Lumiera Cinema</button>
  </form>
  <a href="/">⬅ Назад / Артқа</a>
  `);
});

app.post("/cinema",(req,res)=>{
  req.session.selectedCinema = req.body.cinema;
  res.redirect("/session");
});

app.get("/session",(req,res)=>{
  const movie = req.session.selectedMovie;
  if (!movie) return res.redirect("/");
  res.send(`
  ${pageStyle}
  <h1>⏰ Выберите сеанс / Сеанс таңдаңыз</h1>
  <div class="card">
    <h2>${movie.title}</h2>
  </div>
  <div style="margin-top: 20px;">
    ${movie.sessions.map(time=>`
      <form method="POST" action="/session" style="display:inline-block; margin:8px;">
        <button name="time" value="${time}">${time}</button>
      </form>
    `).join("")}
  </div>
  <br>
  <a href="/cinema">⬅ Назад / Артқа</a>
  `);
});

app.post("/session",(req,res)=>{
  req.session.selectedSession = req.body.time;
  res.redirect("/seats");
});

app.get("/seats",(req,res)=>{
  const movie = req.session.selectedMovie;
  const cinema = req.session.selectedCinema;
  const sessionTime = req.session.selectedSession;
  if (!movie || !cinema || !sessionTime) return res.redirect("/");
  res.send(`
  ${pageStyle}
  <h1>🪑 Выбор места / Орын таңдау</h1>
  <div class="card" style="width:500px;">
    <p>🎬 <b>Фильм:</b> ${movie.title}</p>
    <p>🏢 <b>Кинотеатр:</b> ${cinema}</p>
    <p>📍 <b>Адрес / Мекенжай:</b> ${cinemas[cinema]}</p>
    <p>⏰ <b>Время / Уақыты:</b> ${sessionTime}</p>
  </div>
  
  <h3 style="background: rgba(168,35,22,0.4); width:350px; margin:30px auto; padding:8px; border-radius:8px; border: 1px solid #a82316; letter-spacing: 4px;">ЭКРАН</h3>

  <div style="margin:20px auto; max-width:600px; padding:10px;">
    ${seats.map(row=>`
      <div style="margin:12px 0">
        ${row.map(s=>`
        <form style="display:inline-block" method="POST" action="/seat">
          <input type="hidden" name="seat" value="${s}">
          <button style="background:${s.includes("VIP") ? "#ffcc00" : "#2a7b4c"}; color:white; width:75px; padding:10px 0; margin:4px; font-size:1rem; box-shadow:none;">
            ${s}
          </button>
        </form>
        `).join("")}
      </div>
    `).join("")}
  </div>
  <a href="/session">⬅ Назад / Артқа</a>
  `);
});

app.post("/seat",(req,res)=>{
  req.session.selectedSeat = req.body.seat;
  res.redirect("/payment");
});

app.get("/payment",(req,res)=>{
  const movie = req.session.selectedMovie;
  const cinema = req.session.selectedCinema;
  const sessionTime = req.session.selectedSession;
  const seat = req.session.selectedSeat;
  if (!movie || !cinema || !sessionTime || !seat) return res.redirect("/");
  res.send(`
  ${pageStyle}
  <h1>💳 Оплата / Төлем жасау</h1>
  <div class="card">
    <p>🎬 Фильм: ${movie.title}</p>
    <p>🏢 Кинотеатр: ${cinema}</p>
    <p>⏰ Сеанс: ${sessionTime}</p>
    <p>🪑 Место / Орын: ${seat}</p>
    <p>💰 К оплате / Төленетін сома: <b style="color:#ff5252; font-size:1.4rem;">${movie.price} ₸</b></p>
  </div>

  <form method="POST" action="/pay" style="margin-top:20px;">
    <input name="card" placeholder="Номер карты / Карта нөмірі" required> <br><br>
    <input name="cvv" placeholder="CVV" type="password" maxlength="3" required> <br><br>
    <input name="email" placeholder="Email / Пошта" type="email" required> <br><br>
    <button>Оплатить / Төлеу</button>
  </form>
  <br>
  <a href="/seats">⬅ Назад / Артқа</a>
  `);
});

app.post("/pay",(req,res)=>{
  const movie = req.session.selectedMovie;
  const cinema = req.session.selectedCinema;
  const sessionTime = req.session.selectedSession;
  const seat = req.session.selectedSeat;
  const email = req.body.email;
  if (!movie || !cinema || !sessionTime || !seat) return res.redirect("/");

  const ticketText = `\n- user: ${email}\n- movie: ${movie.title}\n- cinema: ${cinemas[cinema]}\n- seat: ${seat}\n- session: ${sessionTime}\n`;
  const filePath = path.join(__dirname, "database.txt");
  
  fs.appendFile(filePath, ticketText, (err) => {
    if (err) console.error("Қате кетті:", err);
  });

  res.send(`
  ${pageStyle}
  <h1>✅ Оплата прошла успешно! / Төлем сәтті өтті!</h1>
  <div class="card" style="border: 2px solid #2a7b4c; background: rgba(42,123,76,0.15);">
    <h2 style="color:#42ba75;">🎟 БИЛЕТ ЗАРЕГИСТРИРОВАН</h2>
    <p>📧 Email: ${email}</p>
    <p>🎬 Фильм: ${movie.title}</p>
    <p>🏢 Кинотеатр: ${cinema} (${cinemas[cinema]})</p>
    <p>⏰ Сеанс: ${sessionTime}</p>
    <p>🪑 Место / Орын: ${seat}</p>
    <p>💰 Цена / Бағасы: ${movie.price} ₸</p>
  </div>
  <a href="/">На главную / Басты бетке қайту</a>
  `);
  req.session.destroy();
});

module.exports = app;
