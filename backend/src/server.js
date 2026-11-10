// Runs the API on its own (Render: rootDir backend, `npm start`).
const app = require('./app');

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tahrio API listening on http://0.0.0.0:${PORT}/api`);
});
