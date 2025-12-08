/*
Proxy Server setup to handle CORS issues with ElPrisen API

 Why this server exists:
 - The API (https://www.elprisenligenu.dk) does not allow direct client-side requests 
   due to CORS (Cross-Origin Resource Sharing) restrictions.
 - Without this server, the frontend gets CORS errors when attempting to fetch data.

 How it works:
 - This Express server acts as a proxy, allowing the frontend to make safe requests to this server,
   which then forwards the request to the external API.
 - The server handles the request, fetches the data, and returns it to the frontend while 
   CORS policies are respected.

 Server runs at: `http://localhost:5000`
 Example API call: `http://localhost:5000/api/prices/2024-03-10`

`cors()` ensures that the proxy server accepts requests from the frontend, avoiding CORS errors on the client side.
*/

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import NodeCache from "node-cache";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import dotenv from "dotenv";
//dotenv.config({ path: '../../.env' });
//dotenv.config();

const app = express();
app.use(cors());
//const API_KEY = process.env.ELECTRICITY_MAPS_API_KEY;
const API_KEY = "kas53ujNsfgVctRtuYUv"
// To get an API key, visit https://www.electricitymaps.com/ and add it to your .env file

// Cache data for 5 minutes (300 seconds)
const apiCache = new NodeCache({ stdTTL: 300 }); 

// Check if the API key is loaded correctly
if (!API_KEY) {
  console.error("API Key is missing! Please check your .env file.");
  process.exit(1);
}

app.get("/api/prices/:date", async (req, res) => {
  const { date } = req.params;

  const cacheKey = `prices-${date}`;
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log("CACHE HIT for:", cacheKey);
    return res.json(cachedData);
  }

  console.log("CACHE MISS for:", cacheKey);

  // Extract year and day-month correctly
  const year = date.split("-")[0];
  const dayMonth = date.split("-").slice(1).join("-");

  // Correct API format
  const url = `https://www.elprisenligenu.dk/api/v1/prices/${year}/${dayMonth}_DK1.json`;

  console.log("Fetching URL:", url); 

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error("API returned error:", response.status, response.statusText);
      return res.status(response.status).json({ error: `API returned ${response.status}: ${response.statusText}` });
    }

    const data = await response.json();
    console.log("API Response:", data);
    apiCache.set(cacheKey, data, 3600); // Cache for 1 hour
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch energy prices" });
  }
});

// Proxy for Consumption Data (Electricity Maps API) (Latest)
app.get("/api/power-breakdown", async (req, res) => {
  const cacheKey = "power-breakdown-latest";

  // Check if we have data in the cache
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log("CACHE HIT for:", cacheKey);
    return res.json(cachedData);
  }
  console.log("CACHE MISS for:", cacheKey);

  try {
    const url = `https://api.electricitymap.org/v3/power-breakdown/latest?zone=DK-DK1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "auth-token": API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Power Breakdown API returned ${response.status}: ${errorText}`);
      return res.status(response.status).json({ error: `Power Breakdown API error: ${errorText}` });
    }

    const data = await response.json();
    apiCache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching power breakdown data:", error.message);
    res.status(500).json({ error: "Failed to fetch power breakdown data" });
  }
});

// Power Breakdown (History)
app.get("/api/power-breakdown/history", async (req, res) => {
  const cacheKey = "power-breakdown-history";

  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log("CACHE HIT for:", cacheKey);
    return res.json(cachedData);
  }
  
  console.log("CACHE MISS for:", cacheKey);

  try {
    const url = `https://api.electricitymap.org/v3/power-breakdown/history?zone=DK-DK1`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "auth-token": API_KEY },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`History API returned ${response.status}: ${errorText}`);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    apiCache.set(cacheKey, data, 3600);
    res.json(data);
  } catch (error) {
    console.error("Error fetching historical data:", error.message);
    res.status(500).json({ error: "Failed to fetch historical data" });
  }
});



console.log("Serving frontend from:", path.join(__dirname, "dist"));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

//const PORT = 5000;
//app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Proxy server running on http://${HOST}:${PORT}`);
});
