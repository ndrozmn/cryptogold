const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { startCronJobs } = require('./scripts/cronJobs');

dotenv.config();

const app = express();

// MongoDB bağlantısı
connectDB();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session ayarları
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 gün
  })
);

// View engine olarak EJS ayarlanması
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Route dosyalarının eklenmesi
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const aboutRoutes = require('./routes/aboutRoutes');

const investmentRoutes = require('./routes/investmentRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/admin');

// Kullanıcı oturum bilgisini view'lara aktarma middleware'i
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.user = { _id: req.session.userId };
  } else {
    res.locals.user = null;
  }
  next();
});

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', aboutRoutes);
app.use('/investment', investmentRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);




// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
  
  // Cron işlerini başlat
  startCronJobs();
  console.log('Otomatik yatırım kontrol sistemi başlatıldı');
});
