module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') { return res.status(200).json({ links: [] }); }
  if (req.method === 'POST') { return res.status(200).json({ success: true, message: 'Saved' }); }
  return res.status(405).json({ error: 'Method not allowed' });
};
