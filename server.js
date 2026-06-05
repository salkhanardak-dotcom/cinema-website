const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "cinema-secret",
  resave: false,
  saveUninitialized: true
}));

const DB_FILE = path.join(__dirname, "database.json");


function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}


let movies = [
  {
    id: 1,
    title: "Мстители: Финал",
    rating: 9.2,
    price: 2500,
    studentDiscount: 25,
    schoolDiscount: 40,
    sessions: ["2026-06-10 15:00", "2026-06-10 18:00", "2026-06-10 20:00"]
  },
  {
    id: 2,
    title: "Аватар",
    rating: 8.8,
    price: 3200,
    studentDiscount: 25,
    schoolDiscount: 40,
    sessions: ["2026-06-10 16:00", "2026-06-10 19:00", "2026-06-10 21:00"]
  }
];

const cinemas = {
  Mega: "Mega Park, Алматы",
  City: "Dostyk Cinema, Алматы",
  Almaty: "Lumiera Cinema, Алматы"
};

const style = `
<style>
body{background:#1b0b0b;color:white;font-family:sans-serif;text-align:center;padding:30px}
.card{background:#2a1111;padding:20px;margin:15px auto;width:420px;border-radius:12px}
button{padding:10px 20px;background:#c0392b;color:white;border:none;border-radius:8px;cursor:pointer}
input,select{padding:10px;width:250px;margin:5px}
a{color:#ff6b6b}
</style>
`;


app.get("/", (req,res)=>{
  const sorted = [...movies].sort((a,b)=>b.rating-a.rating);

  res.send(`
    ${style}
    <h1>🎬 CINEMA SYSTEM</h1>

    ${sorted.map(m=>`
      <div class="card">
        <h2>${m.title}</h2>
        <p>⭐ ${m.rating}</p>
        <p>💰 ${m.price} ₸</p>

        <form method="POST" action="/movie">
          <input type="hidden" name="id" value="${m.id}">
          <button>Таңдау</button>
        </form>
      </div>
    `).join("")}
  `);
});


app.post("/movie",(req,res)=>{
  req.session.movie = movies.find(m=>m.id == req.body.id);
  res.redirect("/cinema");
});

// ===================== CINEMA =====================
app.get("/cinema",(req,res)=>{
  res.send(`
    ${style}
    <h2>🏢 Кинотеатр таңда</h2>

    <form method="POST" action="/cinema">
      <button name="cinema" value="Mega">Mega</button>
      <button name="cinema" value="City">City</button>
      <button name="cinema" value="Almaty">Almaty</button>
    </form>
  `);
});

app.post("/cinema",(req,res)=>{
  req.session.cinema = req.body.cinema;
  res.redirect("/session");
});


app.get("/session",(req,res)=>{
  const movie = req.session.movie;
  if(!movie) return res.redirect("/");

  res.send(`
    ${style}
    <h2>${movie.title}</h2>

    ${movie.sessions.map(t=>`
      <form method="POST" action="/session">
        <button name="time" value="${t}">${t}</button>
      </form>
    `).join("")}
  `);
});

app.post("/session",(req,res)=>{
  req.session.sessionTime = req.body.time;
  res.redirect("/seats");
});

const seats = ["A1","A2","A3","A4","B1","B2","B3","B4","VIP1","VIP2"];

app.get("/seats",(req,res)=>{
  const db = loadDB();

  const movie = req.session.movie;
  const sessionTime = req.session.sessionTime;

  const takenSeats = db
    .filter(t=>t.session === sessionTime && t.status==="active")
    .map(t=>t.seat);

  res.send(`
    ${style}
    <h2>🪑 Орын таңда</h2>

    ${seats.map(s=>`
      <form method="POST" action="/seat" style="display:inline">
        <input type="hidden" name="seat" value="${s}">
        <button ${takenSeats.includes(s) ? "disabled" : ""}>
          ${s}
        </button>
      </form>
    `).join("")}
  `);
});

app.post("/seat",(req,res)=>{
  req.session.seat = req.body.seat;
  res.redirect("/payment");
});


app.get("/payment",(req,res)=>{
  const movie = req.session.movie;

  res.send(`
    ${style}
    <h2>💳 Төлем</h2>

    <form method="POST" action="/pay">
      <input name="fullname" placeholder="Аты-жөні" required><br>

      <input name="email" placeholder="Email" required><br>

      <select name="type">
        <option value="adult">Ересек</option>
        <option value="student">Студент (-25%)</option>
        <option value="school">Оқушы (-40%)</option>
      </select><br>

      <button>Төлеу</button>
    </form>
  `);
});

app.post("/pay",(req,res)=>{
  const db = loadDB();

  const movie = req.session.movie;
  const cinema = req.session.cinema;
  const sessionTime = req.session.sessionTime;
  const seat = req.session.seat;

  const {email, fullname, type} = req.body;


  if(db.find(t=>t.email===email && t.movieId===movie.id && t.status==="active")){
    return res.send("❌ Сіз бұл фильмге билет алып қойғансыз");
  }

  if(db.find(t=>t.seat===seat && t.session===sessionTime && t.status==="active")){
    return res.send("❌ Бұл орын сатылған");
  }

  let price = movie.price;

  if(type==="student") price *= 0.75;
  if(type==="school") price *= 0.60;

  const ticket = {
    id: Date.now(),
    email,
    fullname,
    movieId: movie.id,
    movieTitle: movie.title,
    cinema,
    session: sessionTime,
    seat,
    type,
    price,
    status: "active",
    createdAt: new Date().toISOString()
  };

  db.push(ticket);
  saveDB(db);

  res.send(`
    ${style}
    <h2>✅ Билет сатып алынды</h2>
    <p>${movie.title}</p>
    <p>Орын: ${seat}</p>
    <p>Баға: ${price} ₸</p>

    <a href="/">Басты бет</a>
  `);
});

app.get("/delete",(req,res)=>{
  res.send(`
    ${style}
    <h2>❌ Билетті қайтару</h2>

    <form method="POST" action="/delete">
      <input name="email" placeholder="Email" required><br>
      <input name="movieTitle" placeholder="Фильм" required><br>
      <button>Өшіру</button>
    </form>
  `);
});

app.post("/delete",(req,res)=>{
  const db = loadDB();

  const {email, movieTitle} = req.body;

  const ticket = db.find(t=>
    t.email===email &&
    t.movieTitle===movieTitle &&
    t.status==="active"
  );

  if(!ticket){
    return res.send("❌ Билет табылмады");
  }

  const now = new Date();
  const sessionTime = new Date(ticket.session.replace(" ", "T"));
  const diffHours = (sessionTime - now) / (1000*60*60);

  let refund = 0;

  if(diffHours > 2){
    refund = ticket.price * 0.5;
  }

  ticket.status = "cancelled";

  saveDB(db);

  res.send(`
    ${style}
    <h2>❌ Билет өшірілді</h2>
    <p>Қайтарым: ${refund} ₸</p>
    <a href="/">Басты бет</a>
  `);
});

app.listen(3000, ()=>{
  console.log("Server running on port 3000");
});