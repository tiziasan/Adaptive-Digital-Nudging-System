# EnergyWebExpression
## Installation
```bash
npm install
```
## How to run
### Frontend
```bash
npm run dev
```
- Frontend runs on http://localhost:5173/
### Backend
to run backend api go to `\ReactDRL\api` then run:
```bash
python -m uvicorn main:app --reload
```
- Uvicorn runs on http://127.0.0.1:8000

### Energy Price API Proxy Server
- Go to the `/src/utils` directory, and run the proxy server:
```bash
node server.js
```
- Proxy server runs on http://localhost:5000

#### Why Use server.js?
- Direct requests to the [Energy Price API](https://www.elprisenligenu.dk) would result in CORS errors.
- The server.js file acts as a proxy to fetch the data server-side, bypassing CORS restrictions.