const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q?.trim().toLowerCase();
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT id, username, display_name, email
       FROM users
       WHERE id != $1
         AND (username ILIKE $2 OR display_name ILIKE $2 OR email ILIKE $2)
       ORDER BY username
       LIMIT 10`,
      [req.user.id, `%${q}%`]
    );

    res.json(result.rows.map(r => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name,
      email: r.email,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro na pesquisa.' });
  }
});

module.exports = router;
