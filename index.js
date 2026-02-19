const express = require("express");
const cors = require("cors");
const webpush = require("web-push");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

webpush.setVapidDetails(
  "mailto:ala282016@gmail.com",
  "BK3n7dfdiswYMFMVkn_5dryRWFpAwtKoa-f-UCwSgMoMv3DfC-_2aOzD3XKr5K3Vav1glAslwABG3BO5LDySWj8",
  "0FIltAZbsB4C3m3MFkbFcYiBY9b-6QSWq4ejk6f_PyI"
);

const SUBS_FILE = "/tmp/subscriptions.json";

const loadSubscriptions = () => {
  try {
    if (fs.existsSync(SUBS_FILE)) {
      return JSON.parse(fs.readFileSync(SUBS_FILE, "utf8"));
    }
  } catch (e) {}
  return [];
};

const saveSubscriptions = (subs) => {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs));
};

let offers = [];
let subscriptions = loadSubscriptions();

app.post("/api/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  saveSubscriptions(subscriptions);
  console.log("Total suscripciones:", subscriptions.length);
  res.status(201).json({ message: "Suscripción guardada" });
});

app.post("/api/offers", async (req, res) => {
  const { title, price } = req.body;

  if (!title || !price) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  const newOffer = {
    id: Date.now(),
    title,
    price,
    createdAt: new Date(),
  };

  offers.push(newOffer);

  const payload = JSON.stringify({
    title: "Nueva oferta 🔥",
    body: `${title} - $${price}`,
    url: "https://notifica-front.vercel.app/offers", // 👈 URL incluida
  });

  subscriptions = loadSubscriptions(); // recargar por si el server reinició
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err) {
      console.error("Error enviando push:", err.message);
    }
  }

  res.status(201).json(newOffer);
});

app.get("/api/offers", (req, res) => {
  res.json(offers);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
