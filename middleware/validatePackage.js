export const validatePackage = (req, res, next) => {
    const { name, version } = req.body;
    
    if (!name || !version) {
        return res.status(400).json({ error: 'Name, version, and author are required' });
    }

    next();
};
