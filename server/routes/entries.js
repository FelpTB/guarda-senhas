const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function mapEntry(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    visibility: row.visibility,
    service: row.service,
    username: row.username,
    password: row.password,
    key: row.key,
    connectionString: row.connection_string,
    title: row.title,
    content: row.content,
    date: new Date(row.created_at).toLocaleDateString('pt-PT'),
    createdAt: row.created_at,
    ownerUsername: row.owner_username,
    ownerDisplayName: row.owner_display_name,
    isOwner: row.is_owner,
    canEdit: row.is_owner,
  };
}

async function canAccessEntry(entryId, userId) {
  const result = await pool.query(
    `SELECT e.*,
            (e.user_id = $2) AS is_owner,
            u.username AS owner_username,
            u.display_name AS owner_display_name
     FROM entries e
     JOIN users u ON u.id = e.user_id
     WHERE e.id = $1
       AND (
         e.user_id = $2
         OR e.visibility = 'public'
         OR EXISTS (
           SELECT 1 FROM entry_permissions ep
           WHERE ep.entry_id = e.id AND ep.user_id = $2
         )
       )`,
    [entryId, userId]
  );
  return result.rows[0] || null;
}

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { filter } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT e.*,
             (e.user_id = $1) AS is_owner,
             u.username AS owner_username,
             u.display_name AS owner_display_name
      FROM entries e
      JOIN users u ON u.id = e.user_id
      WHERE (
        e.user_id = $1
        OR e.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM entry_permissions ep
          WHERE ep.entry_id = e.id AND ep.user_id = $1
        )
      )
    `;

    if (filter === 'mine') {
      query = `
        SELECT e.*,
               true AS is_owner,
               u.username AS owner_username,
               u.display_name AS owner_display_name
        FROM entries e
        JOIN users u ON u.id = e.user_id
        WHERE e.user_id = $1
      `;
    } else if (filter === 'public') {
      query = `
        SELECT e.*,
               (e.user_id = $1) AS is_owner,
               u.username AS owner_username,
               u.display_name AS owner_display_name
        FROM entries e
        JOIN users u ON u.id = e.user_id
        WHERE e.visibility = 'public'
      `;
    } else if (filter === 'shared') {
      query = `
        SELECT e.*,
               false AS is_owner,
               u.username AS owner_username,
               u.display_name AS owner_display_name
        FROM entries e
        JOIN users u ON u.id = e.user_id
        JOIN entry_permissions ep ON ep.entry_id = e.id
        WHERE ep.user_id = $1 AND e.user_id != $1
      `;
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, [userId]);
    res.json(result.rows.map(mapEntry));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar registos.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, visibility, service, username, password, key, connectionString, title, content } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Tipo de registo obrigatório.' });
    }
    if (!['public', 'personal'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibilidade inválida.' });
    }

    const result = await pool.query(
      `INSERT INTO entries (user_id, type, visibility, service, username, password, key, connection_string, title, content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.user.id, type, visibility, service || null, username || null, password || null, key || null, connectionString || null, title || null, content || null]
    );

    const row = result.rows[0];
    const userResult = await pool.query('SELECT username, display_name FROM users WHERE id = $1', [req.user.id]);
    const owner = userResult.rows[0];

    res.status(201).json(mapEntry({
      ...row,
      is_owner: true,
      owner_username: owner.username,
      owner_display_name: owner.display_name,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar registo.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const entry = await canAccessEntry(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ error: 'Registo não encontrado.' });
    }
    if (!entry.is_owner) {
      return res.status(403).json({ error: 'Apenas o proprietário pode editar.' });
    }

    const { type, visibility, service, username, password, key, connectionString, title, content } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Tipo de registo obrigatório.' });
    }
    if (!['public', 'personal'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibilidade inválida.' });
    }

    const result = await pool.query(
      `UPDATE entries
       SET type = $1, visibility = $2, service = $3, username = $4, password = $5,
           key = $6, connection_string = $7, title = $8, content = $9, updated_at = NOW()
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [type, visibility, service || null, username || null, password || null, key || null, connectionString || null, title || null, content || null, req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Registo não encontrado.' });
    }

    const userResult = await pool.query('SELECT username, display_name FROM users WHERE id = $1', [req.user.id]);
    const owner = userResult.rows[0];

    res.json(mapEntry({
      ...result.rows[0],
      is_owner: true,
      owner_username: owner.username,
      owner_display_name: owner.display_name,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar registo.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entry = await canAccessEntry(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ error: 'Registo não encontrado.' });
    }
    if (!entry.is_owner) {
      return res.status(403).json({ error: 'Apenas o proprietário pode eliminar.' });
    }

    await pool.query('DELETE FROM entries WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao eliminar registo.' });
  }
});

router.get('/:id/permissions', async (req, res) => {
  try {
    const entry = await canAccessEntry(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ error: 'Registo não encontrado.' });
    }
    if (!entry.is_owner) {
      return res.status(403).json({ error: 'Apenas o proprietário gere permissões.' });
    }

    const result = await pool.query(
      `SELECT ep.id, ep.user_id, ep.created_at,
              u.username, u.display_name, u.email
       FROM entry_permissions ep
       JOIN users u ON u.id = ep.user_id
       WHERE ep.entry_id = $1
       ORDER BY ep.created_at DESC`,
      [req.params.id]
    );

    res.json(result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      displayName: r.display_name,
      email: r.email,
      grantedAt: r.created_at,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar permissões.' });
  }
});

router.post('/:id/permissions', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username?.trim()) {
      return res.status(400).json({ error: 'Indique o utilizador.' });
    }

    const entry = await canAccessEntry(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ error: 'Registo não encontrado.' });
    }
    if (!entry.is_owner) {
      return res.status(403).json({ error: 'Apenas o proprietário concede permissões.' });
    }
    if (entry.visibility === 'public') {
      return res.status(400).json({ error: 'Registos públicos já são visíveis a todos.' });
    }

    const userResult = await pool.query(
      'SELECT id, username, display_name, email FROM users WHERE username = $1',
      [username.trim().toLowerCase()]
    );
    const targetUser = userResult.rows[0];
    if (!targetUser) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }
    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'Não pode conceder permissão a si mesmo.' });
    }

    await pool.query(
      `INSERT INTO entry_permissions (entry_id, user_id, granted_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (entry_id, user_id) DO NOTHING`,
      [req.params.id, targetUser.id, req.user.id]
    );

    res.status(201).json({
      userId: targetUser.id,
      username: targetUser.username,
      displayName: targetUser.display_name,
      email: targetUser.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao conceder permissão.' });
  }
});

router.delete('/:id/permissions/:userId', async (req, res) => {
  try {
    const entry = await canAccessEntry(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ error: 'Registo não encontrado.' });
    }
    if (!entry.is_owner) {
      return res.status(403).json({ error: 'Apenas o proprietário revoga permissões.' });
    }

    await pool.query(
      'DELETE FROM entry_permissions WHERE entry_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao revogar permissão.' });
  }
});

module.exports = router;
