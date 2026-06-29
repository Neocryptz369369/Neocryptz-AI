module.exports = async (req, res) => {
  const path = req.url.split('?')[0];
  if (path === '/api/admin/tiktok' && req.method === 'POST') {
    return require('./tiktok-admin.js')(req, res);
  }
  return res.status(404).json({ error: "Not Found" });
};
