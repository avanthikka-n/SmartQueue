import jwt from 'jsonwebtoken';

export const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'smartqueue_super_secret_jwt_key_2026_change_in_prod',
    { expiresIn: '30d' }
  );
};
